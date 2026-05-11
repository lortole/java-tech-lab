package com.klanik.transactionlab.acid;

import com.klanik.transactionlab.acid.kata.KataAcidService;
import com.klanik.transactionlab.acid.model.Account;
import com.klanik.transactionlab.acid.repository.AccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("🟡 Kata ACID — Niveau Confirmé")
class AcidKataConfirmeTest {

    @Autowired KataAcidService kataService;
    @Autowired AccountRepository accountRepository;

    private Account shared;
    private Account target;

    @BeforeEach
    void setup() {
        shared = new Account(); shared.setOwner("Shared Source"); shared.setBalance(new BigDecimal("10000.00"));
        target = new Account(); target.setOwner("Target");        target.setBalance(BigDecimal.ZERO);
        shared = accountRepository.save(shared);
        target = accountRepository.save(target);
    }

    @Test
    @DisplayName("TODO 4 : 10 virements concurrents — le solde final doit être cohérent")
    void concurrent_transfers_maintain_consistency() throws InterruptedException {
        // 10 threads tentent chacun de virer 1000€ depuis le même compte (10 000€ total)
        // Seuls 10 doivent réussir. Le solde final doit être 0€ ou positif — jamais négatif.
        int threads = 10;
        BigDecimal amount = new BigDecimal("1000.00");
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger(0);
        AtomicInteger failures  = new AtomicInteger(0);
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            futures.add(executor.submit(() -> {
                try {
                    latch.await();
                    kataService.transferWithRollback(shared.getId(), target.getId(), amount, false);
                    successes.incrementAndGet();
                } catch (Exception e) {
                    failures.incrementAndGet();
                }
                return null;
            }));
        }

        latch.countDown(); // Démarrage simultané
        for (Future<?> f : futures) {
            try { f.get(10, TimeUnit.SECONDS); } catch (Exception ignored) {}
        }
        executor.shutdown();

        Account finalShared = accountRepository.findById(shared.getId()).orElseThrow();
        Account finalTarget = accountRepository.findById(target.getId()).orElseThrow();

        System.out.printf("[TEST] Succès: %d, Échecs: %d%n", successes.get(), failures.get());
        System.out.printf("[TEST] Solde source final: %s€%n", finalShared.getBalance());
        System.out.printf("[TEST] Solde cible final: %s€%n", finalTarget.getBalance());

        // ⭐ Le solde ne doit JAMAIS être négatif — c'est la cohérence ACID sous charge
        assertThat(finalShared.getBalance())
                .as("Le solde ne peut pas être négatif — ACID doit protéger contre ça")
                .isGreaterThanOrEqualTo(BigDecimal.ZERO);

        // Les deux soldes doivent totaliser 10 000€
        assertThat(finalShared.getBalance().add(finalTarget.getBalance()))
                .as("Somme des deux comptes = 10 000€ (conservation des fonds)")
                .isEqualByComparingTo("10000.00");
    }
}