package com.klanik.transactionlab.acid.service;

import com.klanik.transactionlab.acid.model.Account;
import com.klanik.transactionlab.acid.model.Transfer;
import com.klanik.transactionlab.acid.model.TransferResult;
import com.klanik.transactionlab.acid.model.TransferRequest;
import com.klanik.transactionlab.acid.repository.AccountRepository;
import com.klanik.transactionlab.acid.repository.TransferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service de démonstration des propriétés ACID.
 *
 * <p>Ce service illustre trois concepts fondamentaux :</p>
 * <ol>
 *   <li><b>Atomicité</b> — si {@code forceFailAfterDebit=true}, la deuxième
 *       opération lève une exception. Spring annule automatiquement le débit
 *       déjà effectué. Aucune donnée n'est corrompue.</li>
 *   <li><b>Isolation</b> — le niveau {@code READ_COMMITTED} (défaut PostgreSQL)
 *       protège contre les dirty reads. {@code SERIALIZABLE} va plus loin et
 *       protège aussi contre les phantom reads.</li>
 *   <li><b>Durabilité</b> — après un {@code COMMIT}, PostgreSQL écrit dans le WAL
 *       (Write-Ahead Log) avant de répondre. La donnée survit aux redémarrages.</li>
 * </ol>
 *
 * @see <a href="https://klanik.viva.biz/article/acid-vs-saga">Article ACID vs SAGA</a>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AcidTransferService {

    private final AccountRepository accountRepository;
    private final TransferRepository transferRepository;

    /**
     * Liste tous les comptes avec leur solde courant.
     */
    @Transactional(readOnly = true)
    public List<Account> findAllAccounts() {
        return accountRepository.findAll();
    }

    /**
     * Effectue un virement entre deux comptes.
     *
     * <p><b>Démonstration de l'Atomicité :</b><br>
     * Si {@code request.forceFailAfterDebit()} est {@code true}, une exception
     * est levée après le débit du compte source mais avant le crédit du compte
     * cible. Spring détecte l'exception, annule la transaction, et restaure
     * les deux soldes à leur état initial.</p>
     *
     * @param request les paramètres du virement
     * @return le résultat avec le statut et les soldes finaux
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransferResult transfer(TransferRequest request) {
        log.info("[ACID] Début virement {} → {} : {}€ (forceFailAfterDebit={})",
                request.fromAccountId(), request.toAccountId(),
                request.amount(), request.forceFailAfterDebit());

        Account from = accountRepository.findByIdWithLock(request.fromAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Compte source introuvable"));

        Account to = accountRepository.findByIdWithLock(request.toAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Compte cible introuvable"));

        // ── Atomicité step 1 : débit ─────────────────────────────
        if (from.getBalance().compareTo(request.amount()) < 0) {
            throw new IllegalStateException("Solde insuffisant : " + from.getBalance() + "€");
        }
        from.setBalance(from.getBalance().subtract(request.amount()));
        accountRepository.save(from);
        log.debug("[ACID] ✅ Débit effectué — solde {} = {}€", from.getOwner(), from.getBalance());

        // ── Simulation d'échec à mi-transaction ──────────────────
        if (request.forceFailAfterDebit()) {
            log.warn("[ACID] 💥 Erreur injectée après le débit — rollback automatique attendu");
            throw new RuntimeException("Erreur simulée : service de notification indisponible");
        }

        // ── Atomicité step 2 : crédit ────────────────────────────
        to.setBalance(to.getBalance().add(request.amount()));
        accountRepository.save(to);
        log.debug("[ACID] ✅ Crédit effectué — solde {} = {}€", to.getOwner(), to.getBalance());

        // ── Enregistrement de la trace ───────────────────────────
        Transfer transfer = transferRepository.save(Transfer.completed(from, to, request.amount()));

        return TransferResult.success(transfer.getId(), from, to);
    }

    /**
     * Démontre les niveaux d'isolation en lisant le solde d'un compte.
     *
     * <p>Avec {@code SERIALIZABLE}, si le solde a changé entre le début
     * de votre transaction et cette lecture, PostgreSQL lève une exception
     * {@code PSQLException: could not serialize access}. C'est la protection
     * maximale contre les anomalies de concurrence.</p>
     *
     * @param accountId l'identifiant du compte
     * @param isolation le niveau d'isolation souhaité
     * @return le solde lu dans le contexte de cette isolation
     */
    @Transactional(readOnly = true)
    public BigDecimal readBalanceWithIsolation(Long accountId, String isolation) {
        // L'isolation réelle dépend de la configuration de la transaction appelante.
        // Cette méthode est utilisée dans les tests de concurrence (kata confirmé).
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new IllegalArgumentException("Compte introuvable"));
        log.debug("[ACID] Lecture solde {} avec isolation {} → {}€",
                account.getOwner(), isolation, account.getBalance());
        return account.getBalance();
    }
}