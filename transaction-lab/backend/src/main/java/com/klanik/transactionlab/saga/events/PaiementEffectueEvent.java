package com.klanik.transactionlab.saga.events;
import java.math.BigDecimal;
import java.util.UUID;
public record PaiementEffectueEvent(UUID sagaId, Long orderId, BigDecimal amount) {
    public String eventId() { return "PAY-OK-" + sagaId; }
}