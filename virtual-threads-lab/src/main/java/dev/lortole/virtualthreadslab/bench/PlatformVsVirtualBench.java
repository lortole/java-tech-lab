package dev.lortole.virtualthreadslab.bench;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;

/**
 * Benchmark : Platform Threads vs Virtual Threads sur workload I/O-bound.
 *
 * Ce qu'on prouve :
 * - Platform Threads : limités par l'OS (~quelques milliers max)
 * - Virtual Threads  : gérés par la JVM, millions possibles
 * - Sur I/O-bound    : Virtual Threads ~10x plus rapide à même charge
 *
 * La tâche simulée = Thread.sleep(50ms) → représente un appel BDD/HTTP
 */
public class PlatformVsVirtualBench {

    private static final Logger log = LoggerFactory.getLogger(PlatformVsVirtualBench.class);

    private static final int TASK_COUNT   = 1_000;
    private static final int IO_DELAY_MS  = 50;

    /**
     * Simule une tâche I/O-bound (ex : requête SQL, appel HTTP)
     */
    private static void ioTask(int taskId) {
        try {
            // Simule latence réseau / BDD
            Thread.sleep(IO_DELAY_MS);
            log.debug("Task {} done on thread: {}", taskId, Thread.currentThread());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Exécute N tâches avec un pool de Platform Threads.
     * Limité par le nombre de threads OS disponibles.
     */
    public static BenchResult runWithPlatformThreads(int taskCount) throws InterruptedException {
        log.info("=== Platform Threads — {} tâches ===", taskCount);

        var latch = new CountDownLatch(taskCount);
        var start = Instant.now();

        // Pool fixe de 200 threads OS — au-delà ça sature
        try (var executor = Executors.newFixedThreadPool(200)) {
            for (int i = 0; i < taskCount; i++) {
                final int taskId = i;
                executor.submit(() -> {
                    ioTask(taskId);
                    latch.countDown();
                });
            }
            latch.await();
        }

        var duration = Duration.between(start, Instant.now());
        log.info("Platform Threads : {} tâches en {}ms", taskCount, duration.toMillis());
        return new BenchResult("Platform Threads", taskCount, duration);
    }

    /**
     * Exécute N tâches avec des Virtual Threads.
     * Chaque tâche a son propre Virtual Thread — la JVM gère le scheduling.
     * Le carrier thread est libéré pendant le sleep (I/O).
     */
    public static BenchResult runWithVirtualThreads(int taskCount) throws InterruptedException {
        log.info("=== Virtual Threads — {} tâches ===", taskCount);

        var latch = new CountDownLatch(taskCount);
        var start = Instant.now();

        // newVirtualThreadPerTaskExecutor() — un VT par tâche, sans limite
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < taskCount; i++) {
                final int taskId = i;
                executor.submit(() -> {
                    ioTask(taskId);
                    latch.countDown();
                });
            }
            latch.await();
        }

        var duration = Duration.between(start, Instant.now());
        log.info("Virtual Threads  : {} tâches en {}ms", taskCount, duration.toMillis());
        return new BenchResult("Virtual Threads", taskCount, duration);
    }

    public static void main(String[] args) throws InterruptedException {
        log.info("Démarrage du benchmark — {} tâches I/O simulées ({}ms chacune)",
                TASK_COUNT, IO_DELAY_MS);

        var platform = runWithPlatformThreads(TASK_COUNT);
        var virtual  = runWithVirtualThreads(TASK_COUNT);

        log.info("");
        log.info("══════════════════════════════════════");
        log.info("  RÉSULTATS");
        log.info("══════════════════════════════════════");
        log.info("  Platform Threads : {}ms", platform.durationMs());
        log.info("  Virtual Threads  : {}ms", virtual.durationMs());
        log.info("  Speedup          : {}x", platform.durationMs() / Math.max(virtual.durationMs(), 1));
        log.info("══════════════════════════════════════");
        log.info("");
        log.info("Pourquoi ? Avec Platform Threads (pool=200), les 1000 tâches");
        log.info("passent par batches de 200. Chaque batch = {}ms.", IO_DELAY_MS);
        log.info("Avec Virtual Threads, toutes les tâches démarrent quasi simultanément.");
        log.info("Le carrier thread est libéré pendant le sleep — zéro blocage.");
    }

    public record BenchResult(String label, int taskCount, Duration duration) {
        public long durationMs() {
            return duration.toMillis();
        }
    }
}
