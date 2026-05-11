package com.klanik.transactionlab.acid.model;

import java.math.BigDecimal;

public record TransferResult(
        boolean success,
        Long transferId,
        String fromOwner,
        BigDecimal fromBalance,
        String toOwner,
        BigDecimal toBalance,
        String message
) {
    public static TransferResult success(Long transferId, Account from, Account to) {
        return new TransferResult(true, transferId,
                from.getOwner(), from.getBalance(),
                to.getOwner(), to.getBalance(),
                "Virement effectué avec succès");
    }

    public static TransferResult failure(String reason) {
        return new TransferResult(false, null, null, null, null, null, reason);
    }
}