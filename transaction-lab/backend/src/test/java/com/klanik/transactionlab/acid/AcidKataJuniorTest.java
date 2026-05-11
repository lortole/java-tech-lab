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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("🟢 Kata ACID — Niveau Junior")
class AcidKataJuniorTest {

    @Autowired KataAcidService kataService;
    @Autowired AccountRepository accountRepository;

    private Account alice;
    private Account bob;

    @BeforeEach
    void setup() {
        alice = new Account(); alice.setOwner("Test Alice"); alice.setBalance(new BigDecimal("1000.00"));
        bob   = new Account(); bob.setOwner("Test Bob");   bob.setBalance(new BigDecimal("500.00"));
        alice = accountRepository.save(alice);
        bob   = accountRepository.save(bob);
    }

    @Test
    @DisplayName("TODO 1+2 : virement réussi — les soldes changent correctement")
    void transfer_success_updates_balances() {
        kataService.transferWithRollback(alice.getId(), bob.getId(), new BigDecimal("200"), false);

        Account updatedAlice = accountRepository.findById(alice.getId()).orElseThrow();
        Account updatedBob   = accountRepository.findById(bob.getId()).orElseThrow();

        assertThat(updatedAlice.getBalance()).isEqualByComparingTo("800.00");
        assertThat(updatedBob.getBalance()).isEqualByComparingTo("700.00");
    }

    @Test
    @DisplayName("TODO 1+2 : rollback — panne à mi-transaction, soldes INCHANGÉS")
    void transfer_with_failure_rollbacks_both_accounts() {
        assertThatThrownBy(() ->
                kataService.transferWithRollback(alice.getId(), bob.getId(), new BigDecimal("200"), true)
        ).isInstanceOf(RuntimeException.class);

        // ⭐ C'est ici que l'Atomicité se prouve :
        Account updatedAlice = accountRepository.findById(alice.getId()).orElseThrow();
        Account updatedBob   = accountRepository.findById(bob.getId()).orElseThrow();

        assertThat(updatedAlice.getBalance())
                .as("Le débit doit être annulé — Alice doit garder 1000€")
                .isEqualByComparingTo("1000.00");
        assertThat(updatedBob.getBalance())
                .as("Bob ne doit pas avoir reçu l'argent — il garde 500€")
                .isEqualByComparingTo("500.00");
    }

    @Test
    @DisplayName("TODO 2c : solde insuffisant → exception métier, pas de débit")
    void transfer_insufficient_balance_throws() {
        assertThatThrownBy(() ->
                kataService.transferWithRollback(alice.getId(), bob.getId(), new BigDecimal("5000"), false)
        ).isInstanceOf(IllegalStateException.class)
         .hasMessageContaining("insuffisant");

        Account updatedAlice = accountRepository.findById(alice.getId()).orElseThrow();
        assertThat(updatedAlice.getBalance()).isEqualByComparingTo("1000.00");
    }
}