package com.klanik.transactionlab.saga.model;

public enum OrderStatus {
    PENDING,
    INVENTORY_RESERVED,
    PAYMENT_PROCESSING,
    CONFIRMED,
    CANCELLED,
    COMPENSATION_IN_PROGRESS
}