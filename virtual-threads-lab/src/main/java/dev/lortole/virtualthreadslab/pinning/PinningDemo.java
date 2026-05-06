package dev.lortole.virtualthreadslab.pinning;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Démo Pinning : synchronized vs ReentrantLock avec Virtual Threads.
 *
 * Le pinning = un Virtual Thread reste cloué à son carrier pendant un blocage.
 * Le bénéfice des Virtual Threads est annulé : le carrier ne peut pas servir
 * d'autres Virtual Threads pendant ce temps.
 *
 * Causes du pinning :
 *   1. Bloc synchronized (Java 21–23) — résolu en Java 24 (JEP 491)
 *   2. Appels natifs JNI
 *
 * Pour voir les pinning events :
 *   Ajouter en JVM args : -Djdk.tracePinnedThreads=full
 *
 * Ce qu'on prouve ici :
 *   - Avec synchronized : les VTs se pinent, le throughput chute
 *   - Avec ReentrantLock : pas de pinning, throughput optimal
 */
public class PinningDemo {

    private static final Logger log = LoggerFactory.getLogger(PinningDemo.class);

    private static final int TASK_COUNT  = 200;
    private static final int IO_DELAY_MS = 30;

    // ── Ressource partagée protégée par synchronized ──────────────────
    private static final Object SYNC_LOCK = new Object();

    /**
     * ❌ MAUVAIS : synchronized + blocage I/O = pinning garanti en Java 21-23
     *
     * Le Virtual Thread entre dans le bloc synchronized,
     * appelle Thread.sleep() → devrait libérer le carrier,
     * MAIS synchronized empêche la libération → carrier bloqué.
     */
    private static void taskWithSynchronized(int taskId) {
        synchronized (SYNC_LOCK) {
            try {
                // Simule un appel BDD à l'intérieur d'un synchronized
                Thread.sleep(IO_DELAY_MS);
                log.debug("[synchronized] Task {} on {}", taskId, Thread.currentThread().getName());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    // ── Ressource partagée protégée par ReentrantLock ─────────────────
    private static final ReentrantLock REENTRANT_LOCK = new ReentrantLock();

    /**
     * ✅ CORRECT : ReentrantLock + blocage I/O = pas de pinning
     *
     * ReentrantLock est implémenté avec AbstractQueuedSynchronizer (AQS),
     * qui utilise park/unpark → la JVM peut libérer le carrier pendant l'attente.
     */
    private static void taskWithReentrantLock(int taskId) {
        REENTRANT_LOCK.lock();
        try {
            // Même appel BDD simulé — mais le carrier est libéré pendant le sleep
            Thread.sleep(IO_DELAY_MS);
            log.debug("[ReentrantLock] Task {} on {}", taskId, Thread.currentThread().getName());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            // TOUJOURS dans le finally — sinon deadlock si exception
            REENTRANT_LOCK.unlock();
        }
    }

    public static PinningResult runWithSynchronized() throws InterruptedException {
        log.info("=== ❌ synchronized — {} tâches ===", TASK_COUNT);
        log.info("  (Virtual Threads pinent sur le carrier → throughput dégradé)");

        var latch = new CountDownLatch(TASK_COUNT);
        var start = Instant.now();

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < TASK_COUNT; i++) {
                final int taskId = i;
                executor.submit(() -> {
                    taskWithSynchronized(taskId);
                    latch.countDown();
                });
            }
            latch.await();
        }

        var duration = Duration.between(start, Instant.now());
        log.info("  synchronized terminé en : {}ms", duration.toMillis());
        return new PinningResult("synchronized (❌ pinning)", duration);
    }

    public static PinningResult runWithReentrantLock() throws InterruptedException {
        log.info("=== ✅ ReentrantLock — {} tâches ===", TASK_COUNT);
        log.info("  (Pas de pinning → carrier libéré → throughput optimal)");

        var latch = new CountDownLatch(TASK_COUNT);
        var start = Instant.now();

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < TASK_COUNT; i++) {
                final int taskId = i;
                executor.submit(() -> {
                    taskWithReentrantLock(taskId);
                    latch.countDown();
                });
            }
            latch.await();
        }

        var duration = Duration.between(start, Instant.now());
        log.info("  ReentrantLock terminé en : {}ms", duration.toMillis());
        return new PinningResult("ReentrantLock (✅ no pinning)", duration);
    }

    public static void main(String[] args) throws InterruptedException {
        log.info("Démo Pinning — {} tâches, {}ms I/O simulé dans un lock",
                TASK_COUNT, IO_DELAY_MS);
        log.info("Tip : ajouter -Djdk.tracePinnedThreads=full pour voir les events");
        log.info("");

        var syncResult  = runWithSynchronized();
        var lockResult  = runWithReentrantLock();

        log.info("");
        log.info("══════════════════════════════════════════════════");
        log.info("  RÉSULTATS PINNING");
        log.info("══════════════════════════════════════════════════");
        log.info("  synchronized   : {}ms  ← carriers pinent, queue d'attente", syncResult.durationMs());
        log.info("  ReentrantLock  : {}ms  ← carriers libres, max parallélisme", lockResult.durationMs());
        log.info("  Ratio          : {}x", syncResult.durationMs() / Math.max(lockResult.durationMs(), 1));
        log.info("══════════════════════════════════════════════════");
        log.info("");
        log.info("Note Java 24 : JEP 491 résout le pinning sur synchronized.");
        log.info("Sur Java 21-23 : ReentrantLock est OBLIGATOIRE dans les sections critiques.");
    }

    public record PinningResult(String label, Duration duration) {
        public long durationMs() {
            return duration.toMillis();
        }
    }
}
