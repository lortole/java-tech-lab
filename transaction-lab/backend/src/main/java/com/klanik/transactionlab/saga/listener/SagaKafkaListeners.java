package com.klanik.transactionlab.saga.listener;

import com.klanik.transactionlab.saga.events.*;
import com.klanik.transactionlab.saga.service.SagaOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = false)
public class SagaKafkaListeners {

    private final SagaOrderService sagaOrderService;

    @KafkaListener(topics = SagaTopics.COMMANDE_CREEE, groupId = "saga-inventory")
    public void onCommandeCreee(CommandeCreeeEvent event, Acknowledgment ack) {
        sagaOrderService.onCommandeCreee(event, ack);
    }

    @KafkaListener(topics = SagaTopics.ARTICLES_RESERVES, groupId = "saga-payment")
    public void onArticlesReserves(ArticlesReservesEvent event, Acknowledgment ack) {
        sagaOrderService.onArticlesReserves(event, ack);
    }

    @KafkaListener(topics = SagaTopics.PAIEMENT_EFFECTUE, groupId = "saga-notification")
    public void onPaiementEffectue(PaiementEffectueEvent event, Acknowledgment ack) {
        sagaOrderService.onPaiementEffectue(event, ack);
    }

    @KafkaListener(topics = SagaTopics.PAIEMENT_ECHOUE, groupId = "saga-inventory-compensation")
    public void onPaiementEchoue(PaiementEchoueEvent event, Acknowledgment ack) {
        sagaOrderService.onPaiementEchoue(event, ack);
    }

    @KafkaListener(topics = SagaTopics.ARTICLES_LIBERES, groupId = "saga-order-compensation")
    public void onArticlesLiberes(ArticlesLiberesEvent event, Acknowledgment ack) {
        sagaOrderService.onArticlesLiberes(event, ack);
    }
}
