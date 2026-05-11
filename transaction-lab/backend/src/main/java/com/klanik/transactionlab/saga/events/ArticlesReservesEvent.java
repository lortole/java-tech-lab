package com.klanik.transactionlab.saga.events;

import java.math.BigDecimal;
import java.util.UUID;

public record ArticlesReservesEvent(
        UUID sagaId, Long orderId, String productId, int quantity, BigDecimal amount
) { public String eventId() { return "ART-RES-" + sagaId; } }