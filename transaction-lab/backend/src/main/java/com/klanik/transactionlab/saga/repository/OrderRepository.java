package com.klanik.transactionlab.saga.repository;

import com.klanik.transactionlab.saga.model.Order;
import com.klanik.transactionlab.saga.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findBySagaId(UUID sagaId);
    List<Order> findTop20ByOrderByCreatedAtDesc();

    @Modifying
    @Query("UPDATE Order o SET o.status = :status, o.updatedAt = CURRENT_TIMESTAMP WHERE o.id = :id")
    void updateStatus(Long id, OrderStatus status);
}