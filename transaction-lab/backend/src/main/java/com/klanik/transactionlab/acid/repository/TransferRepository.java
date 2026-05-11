package com.klanik.transactionlab.acid.repository;

import com.klanik.transactionlab.acid.model.Transfer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransferRepository extends JpaRepository<Transfer, Long> {
    List<Transfer> findTop20ByOrderByCreatedAtDesc();
}