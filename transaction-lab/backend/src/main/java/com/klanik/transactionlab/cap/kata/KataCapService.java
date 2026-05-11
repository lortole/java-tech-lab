package com.klanik.transactionlab.cap.kata;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                    KATA CAP — À COMPLÉTER                    ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Solution : kata/solution/SolutionCapService.java            ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * <h2>🟡 Niveau Confirmé — Réconciliation AP</h2>
 * <p>La méthode {@link #reconcile} est vide. Sans elle, quand la partition
 * est résolue, B garde sa vieille valeur indéfiniment.</p>
 *
 * <h2>🔴 Niveau Senior — Vector Clock</h2>
 * <p>Implémentez {@link #resolveConflict} pour choisir entre deux valeurs
 * divergentes avec un vector clock simplifié.</p>
 */
@Slf4j
@Service
public class KataCapService {

    private final Map<String, String> nodeA = new HashMap<>(Map.of("valeur", "v0"));
    private final Map<String, String> nodeB = new HashMap<>(Map.of("valeur", "v0"));
    private long versionA = 0;
    private long versionB = 0;

    // ══════════════════════════════════════════════════════
    // 🟡 CONFIRMÉ — TODO : Réconciliation eventual consistency
    // ══════════════════════════════════════════════════════

    /**
     * Réconcilie le nœud B avec le nœud A après résolution d'une partition.
     *
     * <p><b>TODO :</b> Implémentez la stratégie "Last Write Wins" :</p>
     * <ol>
     *   <li>Comparez {@code versionA} et {@code versionB}</li>
     *   <li>Si versionA > versionB : copiez nodeA dans nodeB et mettez à jour versionB</li>
     *   <li>Si versionB > versionA : décidez vous-même (conflict !) — pour simplifier,
     *       B l'emporte (mais en prod vous utiliseriez un CRDT ou une règle métier)</li>
     *   <li>Logger le résultat</li>
     * </ol>
     *
     * <p><b>Pour tester :</b>
     * <ol>
     *   <li>Via l'UI : activez la partition</li>
     *   <li>Écrivez sur A : "valeur1"</li>
     *   <li>Observez que B garde "v0"</li>
     *   <li>Désactivez la partition → cette méthode doit être appelée</li>
     *   <li>B doit maintenant afficher "valeur1"</li>
     * </ol>
     */
    public void reconcile() {
        // TODO : implémenter la réconciliation Last Write Wins
        log.warn("[KATA-CAP] TODO : réconciliation non implémentée — B garde sa vieille valeur !");
    }

    // ══════════════════════════════════════════════════════
    // 🔴 SENIOR — TODO : Vector Clock simplifié
    // ══════════════════════════════════════════════════════

    /**
     * Résout un conflit entre deux valeurs divergentes.
     *
     * <p><b>TODO :</b> Implémentez un vector clock à deux nœuds :</p>
     * <pre>
     * VectorClock = { nodeA: vA, nodeB: vB }
     *
     * Règles :
     * - Si vA > vB et vB == vB_initial : la valeur de A est plus récente → retourner valueA
     * - Si vB > vA et vA == vA_initial : la valeur de B est plus récente → retourner valueB
     * - Si vA == vB : pas de conflit → retourner valueA (identiques)
     * - Sinon : conflit réel → lever une ConflictException avec les deux valeurs
     * </pre>
     *
     * @param valueA  valeur courante du nœud A
     * @param valueB  valeur courante du nœud B
     * @param vA      version du nœud A
     * @param vB      version du nœud B
     * @return la valeur gagnante
     */
    public String resolveConflict(String valueA, String valueB, long vA, long vB) {
        // TODO : implémenter le vector clock
        throw new UnsupportedOperationException("À implémenter — voir TODO Senior");
    }

    // ── Helpers (déjà implémentés) ─────────────────────────

    public Map<String, Object> getState() {
        return Map.of(
                "nodeA", Map.copyOf(nodeA), "versionA", versionA,
                "nodeB", Map.copyOf(nodeB), "versionB", versionB
        );
    }
}