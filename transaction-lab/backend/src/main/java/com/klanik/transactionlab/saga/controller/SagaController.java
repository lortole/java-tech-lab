package com.klanik.transactionlab.saga.controller;

import com.klanik.transactionlab.saga.model.Order;
import com.klanik.transactionlab.saga.repository.InventoryRepository;
import com.klanik.transactionlab.saga.repository.OrderRepository;
import com.klanik.transactionlab.saga.service.SagaOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/saga")
@RequiredArgsConstructor
@Tag(name = "SAGA", description = "Démonstration du pattern SAGA chorégraphiée avec Kafka")
@CrossOrigin(origins = {"http://localhost:4200", "https://transaction-lab.vercel.app"})
public class SagaController {

    private final SagaOrderService sagaOrderService;
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;

    public static final List<SseEmitter> SSE_EMITTERS = new CopyOnWriteArrayList<>();

    public record OrderRequest(
            @NotBlank String customerId,
            @NotBlank String productId,
            @Min(1) int quantity,
            @NotNull @DecimalMin("0.01") BigDecimal amount
    ) {}

    @PostMapping("/orders")
    @Operation(summary = "Démarre une nouvelle SAGA — montant > 9999€ force l'échec paiement")
    public ResponseEntity<Order> createOrder(@Valid @RequestBody OrderRequest req) {
        Order order = sagaOrderService.createOrder(
                req.customerId(), req.productId(), req.quantity(), req.amount());
        return ResponseEntity.ok(order);
    }

    @GetMapping("/orders")
    @Operation(summary = "Liste les 20 dernières commandes avec leur statut SAGA")
    public List<Map<String, Object>> getOrders() {
        return orderRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(o -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id",         o.getId());
                    m.put("sagaId",     o.getSagaId().toString());
                    m.put("customerId", o.getCustomerId());
                    m.put("productId",  o.getProductId());
                    m.put("quantity",   o.getQuantity());
                    m.put("amount",     o.getAmount());
                    m.put("status",     o.getStatus().name());
                    m.put("createdAt",  o.getCreatedAt().toString());
                    m.put("updatedAt",  o.getUpdatedAt().toString());
                    return m;
                }).toList();
    }

    @GetMapping("/inventory")
    @Operation(summary = "État du stock en temps réel")
    public ResponseEntity<List<Map<String, Object>>> getInventory() {
        List<Map<String, Object>> result = inventoryRepository.findAll().stream()
                .map(i -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("productId",   i.getProductId());
                    m.put("productName", i.getProductName());
                    m.put("stock",       i.getStock());
                    m.put("reserved",    i.getReserved());
                    m.put("available",   i.getAvailableStock());
                    return m;
                }).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Server-Sent Events — mises à jour SAGA en temps réel")
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(300_000L);
        SSE_EMITTERS.add(emitter);
        emitter.onCompletion(() -> SSE_EMITTERS.remove(emitter));
        emitter.onTimeout(()    -> SSE_EMITTERS.remove(emitter));
        return emitter;
    }
}
