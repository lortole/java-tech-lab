package dev.lortole.virtualthreadslab.api;

import dev.lortole.virtualthreadslab.bench.PlatformVsVirtualBench;
import dev.lortole.virtualthreadslab.pinning.PinningDemo;
import dev.lortole.virtualthreadslab.pinning.PlatformVsLockFreeBench;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class BenchController {

    /**
     * GET /api/bench?tasks=500
     * Lance le benchmark Platform vs Virtual Threads et retourne les résultats.
     */
    @GetMapping("/bench")
    public Map<String, Object> bench(
            @RequestParam(defaultValue = "500") int tasks) throws InterruptedException {

        var platform = PlatformVsVirtualBench.runWithPlatformThreads(tasks);
        var virtual  = PlatformVsVirtualBench.runWithVirtualThreads(tasks);

        double speedup = (double) platform.durationMs() / Math.max(virtual.durationMs(), 1);

        return Map.of(
                "taskCount",        tasks,
                "platformMs",       platform.durationMs(),
                "virtualMs",        virtual.durationMs(),
                "speedup",          Math.round(speedup * 10.0) / 10.0,
                "platformLabel",    "Platform Threads (pool=200)",
                "virtualLabel",     "Virtual Threads (illimités)"
        );
    }

    /**
     * GET /api/pinning
     * Lance la démo pinning synchronized vs ReentrantLock.
     */
    @GetMapping("/pinning")
    public Map<String, Object> pinning() throws InterruptedException {
        long noLockMs    = PlatformVsLockFreeBench.runVirtualThreadsNoLock(200, 30);
        var  syncResult  = PinningDemo.runWithSynchronized();
        var  lockResult  = PinningDemo.runWithReentrantLock();

        int javaVersion = Runtime.version().feature();

        return Map.of(
                "taskCount",      200,
                "delayMs",        30,
                "noLockMs",       noLockMs,
                "synchronizedMs", syncResult.durationMs(),
                "reentrantMs",    lockResult.durationMs(),
                "javaVersion",    javaVersion,
                "pinningFixed",   javaVersion >= 24,
                "note",           javaVersion >= 24
                        ? "Java 24+ : JEP 491 actif, pinning résolu sur synchronized"
                        : "Java 21-23 : synchronized pine les carriers, ReentrantLock recommandé"
        );
    }

    /**
     * GET /api/info
     * Infos JVM — version Java, Virtual Threads activés.
     */
    @GetMapping("/info")
    public Map<String, Object> info() {
        return Map.of(
                "javaVersion",         Runtime.version().feature(),
                "javaVersionFull",     Runtime.version().toString(),
                "availableProcessors", Runtime.getRuntime().availableProcessors(),
                "virtualThreads",      "enabled",
                "springBootVersion",   "3.3.0"
        );
    }
}
