package com.klanik.transactionlab.saga.kata;

import com.klanik.transactionlab.saga.events.*;
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
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                   KATA SAGA — À COMPLÉTER                    ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Complétez les TODO ci-dessous pour faire passer les tests.  ║
 * ║  Solution : kata/solution/SolutionSagaHandler.java           ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * <h2>🟡 Niveau Confirmé — Objectif</h2>
 * <p>La compensation de l'inventaire est manquante. Implémentez
 * {@link #onPaiementEchoue} pour libérer le stock réservé et
 * publier l'événement {@code articles-liberes}.</p>
 *
 * <h2>🔴 Niveau Senior — Objectif</h2>
 * <ol>
 *   <li>Rendre TOUS les handlers idempotents via {@link #isAlreadyProcessed}</li>
 *   <li>Configurer la DLQ dans {@code application.yml} pour les messages en erreur</li>
 *   <li>Bonus : implémenter l'Outbox Pattern pour garantir l'atomicité
 *       entre la sauvegarde en base et la publication Kafka</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = false)
public class KataSagaHandler {

    private final com.klanik.transactionlab.saga.publisher.EventPublisher kafka;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final ProcessedEventRepository processedEventRepository;

    // ══════════════════════════════════════════════════════
    // 🟡 CONFIRMÉ — TODO 1 : Compensation inventaire
    // ══════════════════════════════════════════════════════

    /**
     * Handler de compensation déclenché quand le paiement échoue.
     *
     * <p>Cette méthode est <b>volontairement vide</b>. Sans elle,
     * le stock reste réservé indéfiniment quand le paiement échoue
     * — une fuite de ressources critique en production.</p>
     *
     * <p><b>TODO 1 :</b> Implémentez la compensation :</p>
     * <ol>
     *   <li>Récupérez l'inventaire depuis le repository (avec verrou)</li>
     *   <li>Appelez {@code inventory.release(event.quantity())} pour libérer le stock</li>
     *   <li>Sauvegardez l'inventaire</li>
     *   <li>Publiez un {@link ArticlesLiberesEvent} sur {@link SagaTopics#ARTICLES_LIBERES}</li>
     *   <li>Acquittez le message Kafka ({@code ack.acknowledge()})</li>
     * </ol>
     *
     * <p><b>Pour tester :</b> Via l'UI, créez une commande avec un montant > 9999€.
     * Le paiement sera refusé. Observez que sans cette compensation, le stock
     * reste bloqué dans Kafka UI (topic {@code paiement-echoue} non consommé).</p>
     *
     * @param event l'événement de paiement échoué
     * @param ack   l'accusé de réception Kafka (commit manuel)
     */
    @KafkaListener(topics = SagaTopics.PAIEMENT_ECHOUE, groupId = "kata-inventory-compensation")
    @Transactional
    public void onPaiementEchoue(PaiementEchoueEvent event, Acknowledgment ack) {
        log.warn("[KATA] 🔄 COMPENSATION déclenchée — paiement échoué pour sagaId={}",
                event.sagaId());

        // TODO 1 : implémentez la compensation ici
        // Étapes :
        // 1. var inventory = inventoryRepository.findByIdWithLock(event.productId()).orElseThrow();
        // 2. inventory.release(event.quantity());
        // 3. inventoryRepository.save(inventory);
        // 4. kafka.publish(SagaTopics.ARTICLES_LIBERES, ...)
        // 5. ack.acknowledge();

        log.warn("[KATA] ⚠️  TODO 1 non implémenté — le stock reste réservé !");
        // NE PAS acquitter → Kafka rejouera le message toutes les 10 secondes
        // tant que ce TODO n'est pas complété
    }

    // ══════════════════════════════════════════════════════
    // 🔴 SENIOR — TODO 2 : Idempotence
    // ══════════════════════════════════════════════════════

    /**
     * Vérifie si un événement a déjà été traité.
     *
     * <p><b>TODO 2 :</b> Implémentez cette méthode pour rendre les handlers idempotents.</p>
     *
     * <p>Actuellement, elle retourne toujours {@code false} — chaque message sera
     * traité même s'il est rejoué (retry Kafka, redémarrage du service).</p>
     *
     * <p><b>Implémentation attendue :</b></p>
     * <ol>
     *   <li>Vérifier si {@code processedEventRepository.existsById(eventId)} retourne {@code true}</li>
     *   <li>Si oui : logger et retourner {@code true}</li>
     *   <li>Si non : retourner {@code false}</li>
     * </ol>
     *
     * <p><b>Pour tester :</b> Utilisez Kafka UI pour republier manuellement un message
     * déjà traité sur le topic {@code commande-creee}. Avec l'idempotence correctement
     * implémentée, le handler loggera "déjà traité" et ne refera pas l'opération.</p>
     *
     * @param eventId identifiant unique de l'événement
     * @param topic   le topic Kafka source
     * @return {@code true} si l'événement a déjà été traité
     */
    private boolean isAlreadyProcessed(String eventId, String topic) {
        // TODO 2 : implémenter la vérification d'idempotence
        return false; // ← BUG : retourne toujours false !
    }

    // ══════════════════════════════════════════════════════
    // 🔴 SENIOR — TODO 3 : Configuration DLQ (application.yml)
    // ══════════════════════════════════════════════════════

    /**
     * Configuration DLQ à ajouter dans application.yml.
     *
     * <p><b>TODO 3 :</b> Ajoutez dans {@code application.yml} :</p>
     * <pre>{@code
     * spring:
     *   kafka:
     *     consumer:
     *       # Après 3 tentatives, envoyer dans la DLQ
     *       # Topic DLQ : commande-creee.DLT, articles-reserves.DLT, etc.
     *
     * # Créez un bean DeadLetterPublishingRecoverer dans KafkaConfig.java
     * # et un SeekToCurrentErrorHandler avec BackOff(1000, 3)
     * }</pre>
     *
     * <p><b>Pour tester :</b> Injectez une exception dans un handler et
     * vérifiez dans Kafka UI que le message atterrit dans le topic {@code *.DLT}
     * après 3 tentatives.</p>
     */
    @SuppressWarnings("unused")
    private void dlqDocumentation() {
        // Ce commentaire est la documentation — voir TODO 3 ci-dessus
    }
}