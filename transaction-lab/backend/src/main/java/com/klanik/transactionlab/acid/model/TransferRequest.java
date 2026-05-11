package com.klanik.transactionlab.acid.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * Requête de virement.
 * @param fromAccountId  compte source
 * @param toAccountId    compte cible
 * @param amount         montant (> 0)
 * @param forceFailAfterDebit  si true : simule une panne après le débit pour démontrer le rollback
 */
public record TransferRequest(
        @NotNull Long fromAccountId,
        @NotNull Long toAccountId,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        boolean forceFailAfterDebit
) {}