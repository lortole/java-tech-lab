package com.klanik.transactionlab.cap.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Simulation du théorème CAP avec deux nœuds en mémoire.
 *
 * <p>Quand la partition réseau est activée :</p>
 * <ul>
 *   <li><b>Mode CP</b> : le nœud B refuse toute lecture/écriture
 *       plutôt que de risquer une incohérence</li>
 *   <li><b>Mode AP</b> : le nœud B répond avec sa dernière valeur connue
 *       (potentiellement obsolète)</li>
 * </ul>
 */
@Slf4j
@Service
public class CapNodeService {

    // État des deux nœuds (simulation en mémoire)
    private final Map<String, String> nodeA = new HashMap<>(Map.of("valeur", "v0"));
    private final Map<String, String> nodeB = new HashMap<>(Map.of("valeur", "v0"));

    private final AtomicBoolean partitionActive = new AtomicBoolean(false);
    private final AtomicBoolean modeCp = new AtomicBoolean(true); // true = CP, false = AP
    private final AtomicLong versionA = new AtomicLong(0);
    private final AtomicLong versionB = new AtomicLong(0);

    public record NodeState(
            String nodeId,
            Map<String, String> data,
            long version,
            boolean available,
            String message
    ) {}

    public record ClusterState(
            NodeState nodeA,
            NodeState nodeB,
            boolean partitionActive,
            boolean modeCp,
            String explanation
    ) {}

    // ── Écriture sur Nœud A ────────────────────────────────────────
    public synchronized ClusterState write(String key, String value) {
        nodeA.put(key, value);
        long v = versionA.incrementAndGet();
        log.info("[CAP] Écriture sur A : {}={} (v{})", key, value, v);

        if (!partitionActive.get()) {
            // Pas de partition → réplication synchrone vers B
            nodeB.put(key, value);
            versionB.set(v);
            log.info("[CAP] Réplication vers B OK");
        } else {
            log.warn("[CAP] Partition active → B ne reçoit pas la mise à jour");
        }

        return getState();
    }

    // ── Lecture sur Nœud B ─────────────────────────────────────────
    public synchronized NodeState readFromB(String key) {
        if (partitionActive.get() && modeCp.get()) {
            // CP : refus de répondre si partition
            log.warn("[CAP] Mode CP + Partition → Nœud B refuse la requête");
            return new NodeState("B", Map.of(), versionB.get(), false,
                    "❌ Service unavailable — partition réseau détectée (mode CP)");
        }

        // AP ou pas de partition : répond avec la valeur locale
        String staleMark = partitionActive.get() ? " ⚠️ (valeur potentiellement obsolète)" : "";
        log.info("[CAP] Lecture sur B : {}={}{}", key, nodeB.get(key), staleMark);
        return new NodeState("B", Map.copyOf(nodeB), versionB.get(), true,
                partitionActive.get() ? "⚠️ Valeur potentiellement obsolète (mode AP)" : "✅ Valeur à jour");
    }

    // ── Contrôles de simulation ────────────────────────────────────
    public synchronized ClusterState togglePartition(boolean active) {
        partitionActive.set(active);
        log.info("[CAP] Partition réseau : {}", active ? "ACTIVÉE" : "DÉSACTIVÉE");

        if (!active) {
            // Réconciliation : B se resynchronise avec A
            nodeB.putAll(nodeA);
            versionB.set(versionA.get());
            log.info("[CAP] Réconciliation B ← A effectuée");
        }
        return getState();
    }

    public synchronized ClusterState setMode(boolean cp) {
        modeCp.set(cp);
        log.info("[CAP] Mode basculé en : {}", cp ? "CP" : "AP");
        return getState();
    }

    public synchronized ClusterState reset() {
        nodeA.clear(); nodeA.put("valeur", "v0");
        nodeB.clear(); nodeB.put("valeur", "v0");
        versionA.set(0); versionB.set(0);
        partitionActive.set(false);
        modeCp.set(true);
        return getState();
    }

    public synchronized ClusterState getState() {
        boolean bAvailable = !partitionActive.get() || !modeCp.get();
        String explanation = buildExplanation();

        return new ClusterState(
                new NodeState("A", Map.copyOf(nodeA), versionA.get(), true, "✅ Leader"),
                new NodeState("B", Map.copyOf(nodeB), versionB.get(), bAvailable,
                        bAvailable ? (versionB.get() < versionA.get() ? "⚠️ Données obsolètes" : "✅ Synchronisé")
                                   : "❌ Indisponible (mode CP)"),
                partitionActive.get(),
                modeCp.get(),
                explanation
        );
    }

    private String buildExplanation() {
        if (!partitionActive.get())
            return "✅ Pas de partition — cohérence forte garantie sur les deux nœuds.";
        if (modeCp.get())
            return "🔵 Mode CP + Partition active — Nœud B refuse les requêtes pour garantir la cohérence. Choix adapté pour les données financières critiques.";
        return "🟢 Mode AP + Partition active — Nœud B répond avec sa dernière valeur connue. Cohérence éventuelle : B convergera vers A quand la partition sera résolue.";
    }
}