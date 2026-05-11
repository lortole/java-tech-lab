package com.klanik.transactionlab.saga.kata.solution;

import com.klanik.transactionlab.saga.events.*;
import com.klanik.transactionlab.saga.model.OrderStatus;
import com.klanik.transactionlab.saga.model.ProcessedEvent;
import com.klanik.transactionlab.saga.repository.InventoryRepository;
import com.klanik.transactionlab.saga.repository.OrderRepository;
import com.klanik.transactionlab.saga.repository.ProcessedEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║             SOLUTION KATA SAGA — NE PAS LIRE              ║
 * ╚══════════════════════════════════════════════════════════╝
 */
@Slf4j
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = false)
@Service
@RequiredArgsConstructor
public class SolutionSagaHandler {

    private final com.klanik.transactionlab.saga.publisher.EventPublisher kafka;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final ProcessedEventRepository processedEventRepository;

    // ── Solution TODO 1 — Compensation inventaire ───────────
    @KafkaListener(topics = SagaTopics.PAIEMENT_ECHOUE, groupId = "solution-inventory-compensation")
    @Transactional
    public void onPaiementEchoue(PaiementEchoueEvent event, Acknowledgment ack) {
        // Solution TODO 2 — vérification idempotence en premier
        if (isAlreadyProcessed(event.eventId(), SagaTopics.PAIEMENT_ECHOUE)) {
            ack.acknowledge();
            return;
        }

        log.warn("[SAGA-SOLUTION] 🔄 COMPENSATION — libération stock {} x {}",
                event.quantity(), event.productId());
        orderRepository.updateStatus(event.orderId(), OrderStatus.COMPENSATION_IN_PROGRESS);

        // Étape 1 : charger avec verrou pessimiste pour éviter les conflits
        var inventory = inventoryRepository.findByIdWithLock(event.productId())
                .orElseThrow(() -> new IllegalStateException("Produit introuvable : " + event.productId()));

        // Étape 2 : libérer le stock réservé
        inventory.release(event.quantity());
        inventoryRepository.save(inventory);
        log.info("[SAGA-SOLUTION] Stock libéré — {} désormais disponibles", inventory.getAvailableStock());

        // Étape 3 : publier l'événement de compensation
        kafka.publish(SagaTopics.ARTICLES_LIBERES,
                event.sagaId().toString(),
                new ArticlesLiberesEvent(event.sagaId(), event.orderId(), event.reason()));

        // Étape 4 : marquer comme traité AVANT d'acquitter
        // (dans la même transaction → atomique avec la libération du stock)
        markAsProcessed(event.eventId(), SagaTopics.PAIEMENT_ECHOUE);

        log.info("[SAGA-SOLUTION] ✅ Compensation stock OK — sagaId={}", event.sagaId());
        ack.acknowledge();
    }

    // ── Solution TODO 2 — Idempotence ───────────────────────
    private boolean isAlreadyProcessed(String eventId, String topic) {
        if (processedEventRepository.existsById(eventId)) {
            log.debug("[SAGA-SOLUTION] ⏭️  Événement {} déjà traité sur {} — skip idempotent", eventId, topic);
            return true;
        }
        return false;
    }

    private void markAsProcessed(String eventId, String topic) {
        processedEventRepository.save(new ProcessedEvent(eventId, topic));
    }

    // ── Solution TODO 3 — DLQ (dans KafkaConfig.java) ───────
    //
    // À ajouter dans une classe @Configuration :
    //
    // @Bean
    // public DefaultErrorHandler errorHandler(KafkaTemplate<?, ?> template) {
    //     var recoverer = new DeadLetterPublishingRecoverer(template,
    //         (record, ex) -> new TopicPartition(record.topic() + ".DLT", record.partition()));
    //
    //     var backOff = new FixedBackOff(5_000L, 2L); // 2 retries, 5s entre chaque
    //
    //     var handler = new DefaultErrorHandler(recoverer, backOff);
    //     handler.addNotRetryableExceptions(IllegalArgumentException.class);
    //     return handler;
    // }
    //
    // Après 3 tentatives (1 initiale + 2 retries), le message atterrit dans <topic>.DLT.
    // Vérifiez dans Kafka UI : topics commande-creee.DLT, articles-reserves.DLT, etc.
}