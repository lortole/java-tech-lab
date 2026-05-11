package com.klanik.transactionlab.saga.events;

import java.math.BigDecimal;
import java.util.UUID;

public record CommandeCreeeEvent(
        UUID sagaId,
        Long orderId,
        String productId,
        int quantity,
        BigDecimal amount
) {
    public String eventId() { return "CMD-CREE-" + sagaId; }
}