package com.klanik.transactionlab.saga.events;
import java.util.UUID;
public record ArticlesLiberesEvent(UUID sagaId, Long orderId, String reason) {
    public String eventId() { return "ART-LIB-" + sagaId; }
}