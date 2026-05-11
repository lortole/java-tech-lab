package com.klanik.transactionlab.acid.controller;

import com.klanik.transactionlab.acid.model.Account;
import com.klanik.transactionlab.acid.model.TransferRequest;
import com.klanik.transactionlab.acid.model.TransferResult;
import com.klanik.transactionlab.acid.repository.AccountRepository;
import com.klanik.transactionlab.acid.repository.TransferRepository;
import com.klanik.transactionlab.acid.service.AcidTransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/acid")
@RequiredArgsConstructor
@Tag(name = "ACID", description = "Démonstration des propriétés ACID — virement bancaire")
@CrossOrigin(origins = {"http://localhost:4200", "https://transaction-lab.vercel.app"})
public class AcidController {

    private final AcidTransferService transferService;
    private final AccountRepository accountRepository;
    private final TransferRepository transferRepository;

    @GetMapping("/accounts")
    @Operation(summary = "Liste tous les comptes avec leur solde")
    public List<Account> getAccounts() {
        return transferService.findAllAccounts();
    }

    @PostMapping("/transfer")
    @Operation(summary = "Effectue un virement — forceFailAfterDebit=true pour démontrer le rollback")
    public ResponseEntity<TransferResult> transfer(@Valid @RequestBody TransferRequest request) {
        try {
            TransferResult result = transferService.transfer(request);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(TransferResult.failure(e.getMessage()));
        } catch (RuntimeException e) {
            // Rollback déclenché — on retourne les soldes actuels (inchangés)
            List<Account> accounts = accountRepository.findAll();
            return ResponseEntity.ok(new com.klanik.transactionlab.acid.model.TransferResult(
                    false, null,
                    accounts.stream().filter(a -> a.getId().equals(request.fromAccountId())).findFirst().map(Account::getOwner).orElse("?"),
                    accounts.stream().filter(a -> a.getId().equals(request.fromAccountId())).findFirst().map(Account::getBalance).orElse(null),
                    accounts.stream().filter(a -> a.getId().equals(request.toAccountId())).findFirst().map(Account::getOwner).orElse("?"),
                    accounts.stream().filter(a -> a.getId().equals(request.toAccountId())).findFirst().map(Account::getBalance).orElse(null),
                    "🔄 ROLLBACK — " + e.getMessage()
            ));
        }
    }

    @GetMapping("/transfers")
    @Operation(summary = "Historique des 20 derniers virements")
    public ResponseEntity<?> getTransfers() {
        return ResponseEntity.ok(transferRepository.findTop20ByOrderByCreatedAtDesc()
                .stream().map(t -> Map.of(
                        "id", t.getId(),
                        "from", t.getFromAccount().getOwner(),
                        "to", t.getToAccount().getOwner(),
                        "amount", t.getAmount(),
                        "status", t.getStatus(),
                        "createdAt", t.getCreatedAt()
                )).toList());
    }

    @PostMapping("/reset")
    @Operation(summary = "Remet les soldes à leur valeur initiale (démo)")
    public ResponseEntity<String> reset() {
        accountRepository.findAll().forEach(a -> {
            switch (a.getOwner()) {
                case "Alice Martin"   -> a.setBalance(new java.math.BigDecimal("1000.00"));
                case "Bob Dupont"     -> a.setBalance(new java.math.BigDecimal("500.00"));
                case "Chloé Bernard" -> a.setBalance(new java.math.BigDecimal("2500.00"));
            }
            accountRepository.save(a);
        });
        return ResponseEntity.ok("Soldes réinitialisés");
    }
}