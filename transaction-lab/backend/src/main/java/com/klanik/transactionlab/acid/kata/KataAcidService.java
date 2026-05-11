package com.klanik.transactionlab.acid.kata;

import com.klanik.transactionlab.acid.model.Account;
import com.klanik.transactionlab.acid.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                   KATA ACID — À COMPLÉTER                    ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Complétez les TODO ci-dessous pour faire passer les tests.  ║
 * ║  La solution est dans kata/solution/SolutionAcidService.java ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * <h2>🟢 Niveau Junior — Objectif</h2>
 * <p>Compléter la méthode {@link #transferWithRollback} pour qu'elle :</p>
 * <ol>
 *   <li>Débite le compte source</li>
 *   <li>Simule une erreur si {@code failAfterDebit=true}</li>
 *   <li>Crédite le compte cible</li>
 *   <li>Prouve que Spring annule TOUT si l'erreur est levée</li>
 * </ol>
 *
 * <h2>🟡 Niveau Confirmé — Objectif</h2>
 * <p>Modifier le niveau d'isolation pour produire un <i>dirty read</i>,
 * puis le corriger. Compléter {@link #demonstrateDirtyRead}.</p>
 *
 * <h2>🔴 Niveau Senior — Objectif</h2>
 * <p>Comparer les performances de {@code READ_COMMITTED} vs {@code SERIALIZABLE}
 * sous charge concurrente. Implémenter {@link #transferConcurrent}.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KataAcidService {

    private final AccountRepository accountRepository;

    // ══════════════════════════════════════════════════════
    // 🟢 JUNIOR — TODO 1
    // ══════════════════════════════════════════════════════

    /**
     * Effectue un virement avec démonstration du rollback.
     *
     * <p><b>TODO 1 :</b> Ajoutez l'annotation {@code @Transactional} sur cette méthode.
     * Sans elle, les deux opérations sont indépendantes — pas de rollback possible.</p>
     *
     * <p><b>TODO 2 :</b> Complétez les étapes manquantes :</p>
     * <ol>
     *   <li>Chargez les deux comptes depuis le repository</li>
     *   <li>Vérifiez que le solde est suffisant (lever {@code IllegalStateException} sinon)</li>
     *   <li>Débitez {@code from} du montant</li>
     *   <li><b>Si {@code failAfterDebit=true} → lever une RuntimeException</b>
     *       (simule une panne à mi-transaction)</li>
     *   <li>Créditez {@code to} du montant</li>
     * </ol>
     *
     * <p><b>Ce que vous devez observer :</b><br>
     * Avec {@code failAfterDebit=true}, rechargez les comptes après l'appel —
     * les soldes doivent être <em>identiques à l'état initial</em>. C'est l'Atomicité.</p>
     *
     * @param fromId       id du compte source
     * @param toId         id du compte cible
     * @param amount       montant du virement
     * @param failAfterDebit si {@code true}, simule une panne après le débit
     */
    // TODO 1 : ajoutez @Transactional ici
    public void transferWithRollback(Long fromId, Long toId, BigDecimal amount, boolean failAfterDebit) {

        // TODO 2a : charger Account from = accountRepository.findById(fromId)...
        Account from = null; // REMPLACEZ CETTE LIGNE

        // TODO 2b : charger Account to = accountRepository.findById(toId)...
        Account to = null;   // REMPLACEZ CETTE LIGNE

        // TODO 2c : vérifier solde suffisant
        // if (...) throw new IllegalStateException("Solde insuffisant");

        // TODO 2d : débiter from et sauvegarder
        // from.setBalance(...);
        // accountRepository.save(from);

        // TODO 2e : simuler une panne après le débit
        // if (failAfterDebit) { throw new RuntimeException("Panne simulée"); }

        // TODO 2f : créditer to et sauvegarder
        // to.setBalance(...);
        // accountRepository.save(to);

        log.info("Virement de {}€ : {} → {} (failAfterDebit={})", amount, fromId, toId, failAfterDebit);
    }

    // ══════════════════════════════════════════════════════
    // 🟡 CONFIRMÉ — TODO 3
    // ══════════════════════════════════════════════════════

    /**
     * Démontre la différence entre READ_UNCOMMITTED et READ_COMMITTED.
     *
     * <p><b>TODO 3 :</b> Cette méthode est censée lire un solde en cours de modification
     * par une autre transaction concurrente. Configurez le niveau d'isolation pour
     * produire un dirty read, observez le problème, puis corrigez-le.</p>
     *
     * <p>Indice : {@code @Transactional(isolation = Isolation.???)} </p>
     *
     * <p>Note : PostgreSQL ne supporte pas vraiment READ_UNCOMMITTED (il se comporte
     * comme READ_COMMITTED). Pour observer un dirty read, utilisez MySQL ou simulez-le
     * avec deux connexions manuelles via psql.</p>
     *
     * @param accountId l'id du compte à lire
     * @return le solde lu (potentiellement incohérent sans la bonne isolation)
     */
    @Transactional // TODO 3 : changez le niveau d'isolation
    public BigDecimal demonstrateDirtyRead(Long accountId) {
        // TODO : implémenter la lecture avec le niveau d'isolation configuré
        throw new UnsupportedOperationException("À implémenter — voir TODO 3");
    }

    // ══════════════════════════════════════════════════════
    // 🔴 SENIOR — TODO 4
    // ══════════════════════════════════════════════════════

    /**
     * Virement concurrent avec protection SERIALIZABLE.
     *
     * <p><b>TODO 4 :</b> Deux threads tentent de transférer de l'argent depuis
     * le même compte simultanément. Avec READ_COMMITTED, une des transactions
     * peut lire un solde obsolète et autoriser un débit qui devrait être refusé.</p>
     *
     * <p>Implémentez ce méthode avec SERIALIZABLE et mesurez le taux d'erreur
     * {@code PSQLException: could not serialize access} vs READ_COMMITTED.</p>
     *
     * <p>Bonus : comparez les temps d'exécution entre les deux niveaux sous charge.</p>
     *
     * @param fromId le compte source partagé
     * @param toId   le compte cible
     * @param amount le montant
     */
    @Transactional // TODO 4 : utilisez Isolation.SERIALIZABLE
    public void transferConcurrent(Long fromId, Long toId, BigDecimal amount) {
        // TODO : même logique que transferWithRollback mais
        // avec SERIALIZABLE et gestion des SerializationFailureException
        throw new UnsupportedOperationException("À implémenter — voir TODO 4");
    }
}