package com.klanik.transactionlab.saga.service;

import com.klanik.transactionlab.saga.events.*;
import com.klanik.transactionlab.saga.model.Order;
import com.klanik.transactionlab.saga.model.OrderStatus;
import com.klanik.transactionlab.saga.repository.OrderRepository;
import com.klanik.transactionlab.saga.repository.InventoryRepository;
import com.klanik.transactionlab.saga.repository.ProcessedEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Implémentation du pattern SAGA Chorégraphiée.
 *
 * <h2>Flux nominal</h2>
 * <pre>
 *   commande-créée
 *     → [InventoryHandler] réserve le stock
 *     → articles-réservés
 *     → [PaymentHandler] débite le paiement
 *     → paiement-effectué
 *     → [NotificationHandler] envoie l'email ✅
 * </pre>
 *
 * <h2>Flux de compensation</h2>
 * <pre>
 *   paiement-échoué
 *     → [InventoryHandler] libère le stock 🔄
 *     → articles-libérés
 *     → [OrderHandler] annule la commande 🔄
 * </pre>
 *
 * <h2>Concepts démontrés</h2>
 * <ul>
 *   <li><b>Chorégraphie</b> — pas de coordinateur central, chaque service
 *       réagit aux événements Kafka</li>
 *   <li><b>Idempotence</b> — chaque handler vérifie si l'événement a déjà
 *       été traité via la table {@code processed_events}</li>
 *   <li><b>Compensation</b> — les actions de rollback métier sont explicites
 *       et traçables</li>
 * </ul>
 *
 * @see SagaTopics pour la liste des topics Kafka
 * @see <a href="https://klanik.viva.biz/article/acid-vs-saga">Article ACID vs SAGA</a>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SagaOrderService {

    private final com.klanik.transactionlab.saga.publisher.EventPublisher kafka;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final ProcessedEventRepository processedEventRepository;

    // ─────────────────────────────────────────────────────
    // ÉTAPE 1 — Créer la commande (point d'entrée)
    // ─────────────────────────────────────────────────────

    /**
     * Point d'entrée de la SAGA. Crée la commande en statut PENDING et
     * publie l'événement de démarrage.
     *
     * @param customerId l'identifiant client
     * @param productId  le produit commandé
     * @param quantity   la quantité
     * @param amount     le montant total
     * @return la commande créée
     */
    @Transactional
    public Order createOrder(String customerId, String productId, int quantity, java.math.BigDecimal amount) {
        UUID sagaId = UUID.randomUUID();
        Order order = orderRepository.save(Order.create(sagaId, customerId, productId, quantity, amount));

        log.info("[SAGA] 🚀 Démarrage SAGA — sagaId={} commande={}", sagaId, order.getId());

        kafka.publish(SagaTopics.COMMANDE_CREEE,
                sagaId.toString(),
                new CommandeCreeeEvent(sagaId, order.getId(), productId, quantity, amount));

        return order;
    }

    // ─────────────────────────────────────────────────────
    // ÉTAPE 2 — Inventaire : réserver le stock
    // ─────────────────────────────────────────────────────

    @Transactional
    public void onCommandeCreee(CommandeCreeeEvent event, Acknowledgment ack) {
        if (isAlreadyProcessed(event.eventId(), SagaTopics.COMMANDE_CREEE)) {
            ack.acknowledge();
            return;
        }

        log.info("[SAGA] 📦 Inventaire — réservation {} x {}", event.quantity(), event.productId());

        try {
            var inventory = inventoryRepository.findByIdWithLock(event.productId())
                    .orElseThrow(() -> new IllegalStateException("Produit introuvable : " + event.productId()));

            if (inventory.getAvailableStock() < event.quantity()) {
                log.warn("[SAGA] ❌ Stock insuffisant ({} disponibles)", inventory.getAvailableStock());
                kafka.publish(SagaTopics.ARTICLES_INDISPONIBLES, event.sagaId().toString(),
                        new ArticlesIndisponiblesEvent(event.sagaId(), event.orderId(),
                                "Stock insuffisant : " + inventory.getAvailableStock() + " disponibles"));
                markAsProcessed(event.eventId(), SagaTopics.COMMANDE_CREEE);
                ack.acknowledge();
                return;
            }

            inventory.reserve(event.quantity());
            inventoryRepository.save(inventory);
            orderRepository.updateStatus(event.orderId(), OrderStatus.INVENTORY_RESERVED);

            kafka.publish(SagaTopics.ARTICLES_RESERVES, event.sagaId().toString(),
                    new ArticlesReservesEvent(event.sagaId(), event.orderId(),
                            event.productId(), event.quantity(), event.amount()));

            markAsProcessed(event.eventId(), SagaTopics.COMMANDE_CREEE);
            log.info("[SAGA] ✅ Stock réservé — sagaId={}", event.sagaId());

        } catch (Exception e) {
            log.error("[SAGA] 💥 Erreur réservation stock", e);
            // L'Acknowledgment n'est pas appelé → Kafka rejouera le message (retry)
            throw e;
        }
        ack.acknowledge();
    }

    // ─────────────────────────────────────────────────────
    // ÉTAPE 3 — Paiement
    // ─────────────────────────────────────────────────────

    @Transactional
    public void onArticlesReserves(ArticlesReservesEvent event, Acknowledgment ack) {
        if (isAlreadyProcessed(event.eventId(), SagaTopics.ARTICLES_RESERVES)) {
            ack.acknowledge();
            return;
        }

        log.info("[SAGA] 💳 Paiement — {}€ pour sagaId={}", event.amount(), event.sagaId());
        orderRepository.updateStatus(event.orderId(), OrderStatus.PAYMENT_PROCESSING);

        boolean paymentSuccess = simulatePayment(event.amount());

        if (!paymentSuccess) {
            log.warn("[SAGA] ❌ Paiement refusé — déclenchement de la compensation");
            kafka.publish(SagaTopics.PAIEMENT_ECHOUE, event.sagaId().toString(),
                    new PaiementEchoueEvent(event.sagaId(), event.orderId(),
                            event.productId(), event.quantity(), "Solde insuffisant"));
        } else {
            log.info("[SAGA] ✅ Paiement accepté");
            kafka.publish(SagaTopics.PAIEMENT_EFFECTUE, event.sagaId().toString(),
                    new PaiementEffectueEvent(event.sagaId(), event.orderId(), event.amount()));
        }

        markAsProcessed(event.eventId(), SagaTopics.ARTICLES_RESERVES);
        ack.acknowledge();
    }

    // ─────────────────────────────────────────────────────
    // ÉTAPE 4A — Notification (flux nominal)
    // ─────────────────────────────────────────────────────

    @Transactional
    public void onPaiementEffectue(PaiementEffectueEvent event, Acknowledgment ack) {
        if (isAlreadyProcessed(event.eventId(), SagaTopics.PAIEMENT_EFFECTUE)) {
            ack.acknowledge();
            return;
        }

        log.info("[SAGA] 📧 Notification — email de confirmation pour sagaId={}", event.sagaId());
        orderRepository.updateStatus(event.orderId(), OrderStatus.CONFIRMED);

        // En production : appel au service email (SendGrid, SES...)
        log.info("[SAGA] ✅ Email envoyé — commande {} CONFIRMÉE 🎉", event.orderId());

        markAsProcessed(event.eventId(), SagaTopics.PAIEMENT_EFFECTUE);
        ack.acknowledge();
    }

    // ─────────────────────────────────────────────────────
    // COMPENSATION 1 — Libérer le stock (paiement échoué)
    // ─────────────────────────────────────────────────────

    @Transactional
    public void onPaiementEchoue(PaiementEchoueEvent event, Acknowledgment ack) {
        if (isAlreadyProcessed(event.eventId(), SagaTopics.PAIEMENT_ECHOUE)) {
            ack.acknowledge();
            return;
        }

        log.warn("[SAGA] 🔄 COMPENSATION — libération stock {} x {}",
                event.quantity(), event.productId());
        orderRepository.updateStatus(event.orderId(), OrderStatus.COMPENSATION_IN_PROGRESS);

        var inventory = inventoryRepository.findByIdWithLock(event.productId()).orElseThrow();
        inventory.release(event.quantity());
        inventoryRepository.save(inventory);

        kafka.publish(SagaTopics.ARTICLES_LIBERES, event.sagaId().toString(),
                new ArticlesLiberesEvent(event.sagaId(), event.orderId(), event.reason()));

        markAsProcessed(event.eventId(), SagaTopics.PAIEMENT_ECHOUE);
        log.info("[SAGA] ✅ Stock libéré — compensation OK");
        ack.acknowledge();
    }

    // ─────────────────────────────────────────────────────
    // COMPENSATION 2 — Annuler la commande
    // ─────────────────────────────────────────────────────

    @Transactional
    public void onArticlesLiberes(ArticlesLiberesEvent event, Acknowledgment ack) {
        if (isAlreadyProcessed(event.eventId(), SagaTopics.ARTICLES_LIBERES)) {
            ack.acknowledge();
            return;
        }

        log.warn("[SAGA] 🔄 COMPENSATION — annulation commande {}", event.orderId());
        orderRepository.updateStatus(event.orderId(), OrderStatus.CANCELLED);

        markAsProcessed(event.eventId(), SagaTopics.ARTICLES_LIBERES);
        log.info("[SAGA] ✅ Commande {} annulée — SAGA terminée avec compensation", event.orderId());
        ack.acknowledge();
    }

    // ─────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────

    /**
     * Idempotence : vérifie si l'événement a déjà été traité.
     *
     * <p>Pattern fondamental en event-driven : sans cette vérification,
     * un message rejoué (retry, redémarrage) serait traité deux fois.</p>
     */
    private boolean isAlreadyProcessed(String eventId, String topic) {
        if (processedEventRepository.existsById(eventId)) {
            log.debug("[SAGA] ⏭️  Événement {} déjà traité sur {} — skip", eventId, topic);
            return true;
        }
        return false;
    }

    private void markAsProcessed(String eventId, String topic) {
        processedEventRepository.save(new com.klanik.transactionlab.saga.model.ProcessedEvent(eventId, topic));
    }

    /**
     * Simulation du paiement.
     * En production : appel au PSP (Stripe, Adyen...).
     * Le paramètre {@code forceFailure} (injecté via API) permet de simuler
     * un refus de paiement pour déclencher la compensation.
     */
    private boolean simulatePayment(java.math.BigDecimal amount) {
        // Simuler un échec si montant > 9999€ (pour les tests)
        return amount.compareTo(new java.math.BigDecimal("9999")) <= 0;
    }
}