package com.klanik.transactionlab.saga.repository;

import com.klanik.transactionlab.saga.model.ProcessedEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, String> {}