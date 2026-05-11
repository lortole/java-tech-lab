package com.klanik.transactionlab.saga;

import com.klanik.transactionlab.saga.model.OrderStatus;
import com.klanik.transactionlab.saga.repository.InventoryRepository;
import com.klanik.transactionlab.saga.repository.OrderRepository;
import com.klanik.transactionlab.saga.service.SagaOrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.*;
import static org.awaitility.Awaitility.*;

@SpringBootTest
@ActiveProfiles("test")
@EmbeddedKafka(partitions = 1, topics = {
        "commande-creee", "articles-reserves", "paiement-effectue",
        "articles-indisponibles", "paiement-echoue", "articles-liberes"
})
@DisplayName("🟡 Kata SAGA — Niveau Confirmé")
class SagaKataConfirmeTest {

    @Autowired SagaOrderService sagaOrderService;
    @Autowired OrderRepository   orderRepository;
    @Autowired InventoryRepository inventoryRepository;

    @Test
    @DisplayName("Flux nominal : commande 500€ → statut CONFIRMED")
    void nominal_flow_confirms_order() throws Exception {
        var order = sagaOrderService.createOrder("test-user", "PROD-002", 1, new BigDecimal("89"));

        await().atMost(10, TimeUnit.SECONDS)
               .pollInterval(500, TimeUnit.MILLISECONDS)
               .until(() -> {
                   var o = orderRepository.findById(order.getId()).orElseThrow();
                   return o.getStatus() == OrderStatus.CONFIRMED;
               });

        assertThat(orderRepository.findById(order.getId()).orElseThrow().getStatus())
                .isEqualTo(OrderStatus.CONFIRMED);
    }

    @Test
    @DisplayName("TODO 1 — compensation : paiement échoué → stock libéré → commande CANCELLED")
    void compensation_flow_cancels_order_and_releases_stock() {
        var inventory = inventoryRepository.findById("PROD-002").orElseThrow();
        int stockBefore = inventory.getAvailableStock();

        // Montant > 9999€ → paiement forcé en échec
        var order = sagaOrderService.createOrder("test-user", "PROD-002", 1, new BigDecimal("10000"));

        // ⭐ Ce test passera SEULEMENT si la compensation est implémentée dans KataSagaHandler
        await().atMost(15, TimeUnit.SECONDS)
               .pollInterval(500, TimeUnit.MILLISECONDS)
               .until(() -> {
                   var o = orderRepository.findById(order.getId()).orElseThrow();
                   return o.getStatus() == OrderStatus.CANCELLED;
               });

        // Le stock doit être revenu à son niveau initial
        var inventoryAfter = inventoryRepository.findById("PROD-002").orElseThrow();
        assertThat(inventoryAfter.getAvailableStock())
                .as("Le stock doit être libéré après la compensation")
                .isEqualTo(stockBefore);
    }
}