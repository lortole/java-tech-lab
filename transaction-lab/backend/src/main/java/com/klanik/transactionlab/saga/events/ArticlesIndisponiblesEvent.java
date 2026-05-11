package com.klanik.transactionlab.saga.events;
import java.util.UUID;
public record ArticlesIndisponiblesEvent(UUID sagaId, Long orderId, String reason) {
    public String eventId() { return "ART-IND-" + sagaId; }
}