package com.klanik.transactionlab.acid.repository;

import com.klanik.transactionlab.acid.model.Account;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    /**
     * Lecture avec verrou pessimiste (SELECT ... FOR UPDATE).
     * Utilisé dans les virements pour éviter les lectures concurrentes
     * pendant la modification du solde.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    Optional<Account> findByIdWithLock(Long id);
}