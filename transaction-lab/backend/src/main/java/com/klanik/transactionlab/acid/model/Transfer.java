package com.klanik.transactionlab.acid.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transfers")
@Getter @Setter @NoArgsConstructor
public class Transfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_account_id", nullable = false)
    private Account fromAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_account_id", nullable = false)
    private Account toAccount;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public static Transfer completed(Account from, Account to, BigDecimal amount) {
        Transfer t = new Transfer();
        t.fromAccount = from;
        t.toAccount = to;
        t.amount = amount;
        t.status = "COMPLETED";
        return t;
    }

    public static Transfer rolledBack(Account from, Account to, BigDecimal amount, String reason) {
        Transfer t = new Transfer();
        t.fromAccount = from;
        t.toAccount = to;
        t.amount = amount;
        t.status = "ROLLED_BACK";
        t.errorMessage = reason;
        return t;
    }
}