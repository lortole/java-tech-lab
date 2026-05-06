package dev.lortole.virtualthreadslab.pinning;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;

/**
 * Helper de benchmark : Virtual Threads sans aucun lock.
 * Illustre le cas optimal — chaque VT s'exécute indépendamment.
 */
public class PlatformVsLockFreeBench {

    public static long runVirtualThreadsNoLock(int taskCount, int delayMs)
            throws InterruptedException {

        var latch = new CountDownLatch(taskCount);
        var start = Instant.now();

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < taskCount; i++) {
                executor.submit(() -> {
                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    } finally {
                        latch.countDown();
                    }
                });
            }
            latch.await();
        }

        return Duration.between(start, Instant.now()).toMillis();
    }
}