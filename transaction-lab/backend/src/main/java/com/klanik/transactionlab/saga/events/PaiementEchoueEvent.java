package com.klanik.transactionlab.saga.events;
import java.util.UUID;
public record PaiementEchoueEvent(UUID sagaId, Long orderId, String productId, int quantity, String reason) {
    public String eventId() { return "PAY-KO-" + sagaId; }
}