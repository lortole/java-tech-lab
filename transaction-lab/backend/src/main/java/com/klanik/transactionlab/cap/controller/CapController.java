package com.klanik.transactionlab.cap.controller;

import com.klanik.transactionlab.cap.service.CapNodeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cap")
@RequiredArgsConstructor
@Tag(name = "CAP", description = "Simulation du théorème CAP — deux nœuds, partition réseau")
@CrossOrigin(origins = {"http://localhost:4200", "https://transaction-lab.vercel.app"})
public class CapController {

    private final CapNodeService capNodeService;

    @GetMapping("/state")
    @Operation(summary = "État actuel du cluster (nœuds A et B, partition, mode)")
    public ResponseEntity<CapNodeService.ClusterState> getState() {
        return ResponseEntity.ok(capNodeService.getState());
    }

    @PostMapping("/write")
    @Operation(summary = "Écrit une valeur sur le nœud A — observez si B se synchronise")
    public ResponseEntity<CapNodeService.ClusterState> write(
            @RequestParam(defaultValue = "valeur") String key,
            @RequestParam String value) {
        return ResponseEntity.ok(capNodeService.write(key, value));
    }

    @GetMapping("/read-b")
    @Operation(summary = "Lit depuis le nœud B — CP = refus si partition, AP = valeur obsolète")
    public ResponseEntity<CapNodeService.NodeState> readFromB(
            @RequestParam(defaultValue = "valeur") String key) {
        return ResponseEntity.ok(capNodeService.readFromB(key));
    }

    @PostMapping("/partition")
    @Operation(summary = "Active ou désactive la partition réseau entre A et B")
    public ResponseEntity<CapNodeService.ClusterState> togglePartition(
            @RequestParam boolean active) {
        return ResponseEntity.ok(capNodeService.togglePartition(active));
    }

    @PostMapping("/mode")
    @Operation(summary = "Bascule entre mode CP (cohérence) et AP (disponibilité)")
    public ResponseEntity<CapNodeService.ClusterState> setMode(
            @RequestParam boolean cp) {
        return ResponseEntity.ok(capNodeService.setMode(cp));
    }

    @PostMapping("/reset")
    @Operation(summary = "Remet le cluster à l'état initial")
    public ResponseEntity<CapNodeService.ClusterState> reset() {
        return ResponseEntity.ok(capNodeService.reset());
    }
}