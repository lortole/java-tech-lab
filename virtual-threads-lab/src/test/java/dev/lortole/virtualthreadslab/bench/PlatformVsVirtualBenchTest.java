package dev.lortole.virtualthreadslab.bench;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prouve que les Virtual Threads sont significativement plus rapides
 * que les Platform Threads sur un workload I/O-bound.
 */
@DisplayName("Benchmark — Platform Threads vs Virtual Threads (I/O-bound)")
class PlatformVsVirtualBenchTest {

    private static final int TASK_COUNT = 500;

    @Test
    @DisplayName("Virtual Threads doivent être au moins 3x plus rapides sur I/O-bound")
    void virtualThreadsShouldBeFasterThanPlatformThreadsOnIOBound() throws InterruptedException {
        // WHEN
        var platform = PlatformVsVirtualBench.runWithPlatformThreads(TASK_COUNT);
        var virtual  = PlatformVsVirtualBench.runWithVirtualThreads(TASK_COUNT);

        // THEN
        System.out.printf("%n=== RÉSULTATS ===%n");
        System.out.printf("Platform Threads : %dms%n", platform.durationMs());
        System.out.printf("Virtual Threads  : %dms%n", virtual.durationMs());
        System.out.printf("Speedup          : %.1fx%n",
                (double) platform.durationMs() / Math.max(virtual.durationMs(), 1));

        // Virtual Threads doivent être au moins 3x plus rapides
        // (en pratique ~5-10x sur 500 tâches avec pool=200 Platform Threads)
        assertThat(virtual.durationMs())
                .as("Virtual Threads doivent être au moins 3x plus rapides que Platform Threads")
                .isLessThan(platform.durationMs() / 3);
    }

    @Test
    @DisplayName("Virtual Threads terminent 1000 tâches I/O en moins de 500ms")
    void virtualThreadsShouldHandle1000IoTasksUnder500ms() throws InterruptedException {
        // WHEN
        var result = PlatformVsVirtualBench.runWithVirtualThreads(1_000);

        // THEN — 1000 tâches de 50ms devraient finir en ~50-100ms
        // (toutes quasi-simultanées, pas de queue d'attente)
        assertThat(result.durationMs())
                .as("1000 tâches I/O simulées devraient terminer en moins de 500ms")
                .isLessThan(500L);
    }
}
