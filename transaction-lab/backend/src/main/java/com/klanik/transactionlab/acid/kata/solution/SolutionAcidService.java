package com.klanik.transactionlab.acid.kata.solution;

import com.klanik.transactionlab.acid.model.Account;
import com.klanik.transactionlab.acid.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              SOLUTION KATA ACID — NE PAS LIRE             ║
 * ║           avant d'avoir tenté le kata vous-même !         ║
 * ╚══════════════════════════════════════════════════════════╝
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SolutionAcidService {

    private final AccountRepository accountRepository;

    // ── Solution TODO 1 & 2 — Rollback ──────────────────────
    @Transactional(isolation = Isolation.READ_COMMITTED)  // ← TODO 1 : cette annotation
    public void transferWithRollback(Long fromId, Long toId, BigDecimal amount, boolean failAfterDebit) {

        // TODO 2a : charger avec verrou pessimiste
        Account from = accountRepository.findByIdWithLock(fromId)
                .orElseThrow(() -> new IllegalArgumentException("Compte source introuvable : " + fromId));
        Account to = accountRepository.findByIdWithLock(toId)
                .orElseThrow(() -> new IllegalArgumentException("Compte cible introuvable : " + toId));

        // TODO 2c : vérifier solde
        if (from.getBalance().compareTo(amount) < 0) {
            throw new IllegalStateException("Solde insuffisant : " + from.getBalance() + "€ disponibles");
        }

        // TODO 2d : débit
        from.setBalance(from.getBalance().subtract(amount));
        accountRepository.save(from);
        log.debug("[ACID-SOLUTION] Débit {} : {}€", from.getOwner(), from.getBalance());

        // TODO 2e : panne simulée → Spring voit la RuntimeException, déclenche le ROLLBACK
        // Le @Transactional attrape toute RuntimeException non checked par défaut.
        if (failAfterDebit) {
            throw new RuntimeException("Panne simulée après le débit — rollback automatique");
        }

        // TODO 2f : crédit
        to.setBalance(to.getBalance().add(amount));
        accountRepository.save(to);
        log.debug("[ACID-SOLUTION] Crédit {} : {}€", to.getOwner(), to.getBalance());
    }

    // ── Solution TODO 3 — Dirty read ────────────────────────
    // PostgreSQL ne supporte pas vraiment READ_UNCOMMITTED (traité comme READ_COMMITTED).
    // Pour observer la différence entre READ_COMMITTED et SERIALIZABLE, lancez le test
    // AcidKataConfirmeTest qui crée des transactions concurrentes.
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public BigDecimal demonstrateDirtyRead(Long accountId) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Compte introuvable"));
        // Avec REPEATABLE_READ : si vous relisez dans la même transaction,
        // vous obtiendrez la même valeur même si une autre transaction a modifié entre-temps.
        return account.getBalance();
    }

    // ── Solution TODO 4 — Concurrent + retry ────────────────
    // Avec SERIALIZABLE, PostgreSQL peut lever : PSQLException: could not serialize access
    // On implémente un retry automatique avec back-off exponentiel.
    @Transactional(isolation = Isolation.SERIALIZABLE)
    @Retryable(
            retryFor = { org.springframework.dao.CannotAcquireLockException.class,
                         OptimisticLockingFailureException.class },
            maxAttempts = 3,
            backoff = @Backoff(delay = 100, multiplier = 2)
    )
    public void transferConcurrent(Long fromId, Long toId, BigDecimal amount) {
        Account from = accountRepository.findByIdWithLock(fromId)
                .orElseThrow(() -> new IllegalArgumentException("Compte introuvable"));
        Account to = accountRepository.findByIdWithLock(toId)
                .orElseThrow(() -> new IllegalArgumentException("Compte introuvable"));

        if (from.getBalance().compareTo(amount) < 0) {
            throw new IllegalStateException("Solde insuffisant");
        }

        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));
        accountRepository.save(from);
        accountRepository.save(to);

        // Avec SERIALIZABLE : si deux transactions concurrentes touchent les mêmes lignes,
        // PostgreSQL en annulera une avec le code d'erreur 40001 (serialization_failure).
        // Le @Retryable relance automatiquement jusqu'à 3 fois.
        log.debug("[ACID-SOLUTION] Virement concurrent OK : {}€ de {} vers {}", amount, from.getOwner(), to.getOwner());
    }
}