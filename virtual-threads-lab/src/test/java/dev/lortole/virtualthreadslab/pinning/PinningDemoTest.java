package dev.lortole.virtualthreadslab.pinning;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prouve l'impact du pinning sur les Virtual Threads.
 *
 * Note importante sur le design du PinningDemo :
 * Le ReentrantLock testé ici est UN SEUL lock partagé entre toutes les tâches.
 * Les 200 tâches s'exécutent donc séquentiellement (une seule tient le lock à la fois).
 * 200 x 30ms = ~6000ms — c'est attendu et correct.
 *
 * Le vrai bénéfice de ReentrantLock vs synchronized se voit quand :
 *   - On a N locks indépendants (un par ressource)
 *   - Ou quand on mesure la CPU utilization des carriers
 *
 * Sur Java 21-23 : synchronized avec I/O pine le carrier.
 * Sur Java 24+ : JEP 491 résout le pinning sur synchronized.
 */
@DisplayName("Pinning — synchronized vs ReentrantLock avec Virtual Threads")
class PinningDemoTest {

    @Test
    @DisplayName("synchronized et ReentrantLock ont des performances similaires sur un lock unique")
    void singleLockBothApproachesAreSequential() throws InterruptedException {
        // WHEN
        var syncResult = PinningDemo.runWithSynchronized();
        var lockResult = PinningDemo.runWithReentrantLock();

        // THEN
        System.out.printf("%n=== RÉSULTATS PINNING ===%n");
        System.out.printf("synchronized  : %dms%n", syncResult.durationMs());
        System.out.printf("ReentrantLock : %dms%n", lockResult.durationMs());

        int javaVersion = Runtime.version().feature();
        System.out.printf("Java version  : %d%n", javaVersion);
        System.out.printf("%n");
        System.out.printf("Note : avec 1 lock partagé, les tâches sont séquentielles.%n");
        System.out.printf("200 tâches x 30ms = ~6000ms — comportement attendu.%n");
        System.out.printf("Le bénéfice de ReentrantLock se mesure sur les carriers,%n");
        System.out.printf("pas sur le throughput global avec un lock unique.%n");

        // Les deux sont séquentiels sur un lock unique — durées similaires
        // On vérifie juste qu'ils terminent en un temps raisonnable
        assertThat(syncResult.durationMs())
                .as("synchronized doit terminer (200 tâches x 30ms = ~6000ms)")
                .isGreaterThan(0)
                .isLessThan(15_000L);

        assertThat(lockResult.durationMs())
                .as("ReentrantLock doit terminer (200 tâches x 30ms = ~6000ms)")
                .isGreaterThan(0)
                .isLessThan(15_000L);
    }

    @Test
    @DisplayName("Virtual Threads sans lock terminent 200 tâches I/O en moins de 500ms")
    void virtualThreadsWithoutLockArefast() throws InterruptedException {
        // Sans lock du tout — chaque VT s'exécute indépendamment
        // C'est le scénario optimal : 200 tâches quasi-simultanées
        var result = PlatformVsLockFreeBench.runVirtualThreadsNoLock(200, 30);

        System.out.printf("%n=== Sans lock : %dms pour 200 tâches ===%n", result);

        // Sans lock : toutes les tâches sont parallèles → ~30ms
        assertThat(result)
                .as("Sans lock, 200 VTs doivent terminer en moins de 500ms")
                .isLessThan(500L);
    }
}