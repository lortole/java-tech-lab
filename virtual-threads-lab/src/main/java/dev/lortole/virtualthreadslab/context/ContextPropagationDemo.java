package dev.lortole.virtualthreadslab.context;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.StructuredTaskScope;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

/**
 * Démo Context Propagation : MDC et ScopedValue avec Virtual Threads.
 *
 * Deux problèmes distincts :
 *
 * 1. MDC (Mapped Diagnostic Context) - trace ID dans les logs
 *    - ThreadLocal classique : NON propagé dans les Virtual Threads enfants
 *    - Copie manuelle : fonctionne mais verbeux
 *
 * 2. ScopedValue (Java 21, JEP 446) - le successeur de ThreadLocal
 *    - Immuable, pas de risque de fuite entre threads
 *    - Propagé automatiquement dans les StructuredTaskScope.fork()
 */
public class ContextPropagationDemo {

    private static final Logger log = LoggerFactory.getLogger(ContextPropagationDemo.class);

    static final ScopedValue<String> TRACE_ID = ScopedValue.newInstance();
    static final ScopedValue<String> USER_ID  = ScopedValue.newInstance();

    /**
     * Problème : ThreadLocal NON propagé dans les Virtual Threads enfants.
     */
    public static void demoThreadLocalLoss() throws InterruptedException, ExecutionException {
        log.info("=== ThreadLocal - perte de contexte dans les VTs ===");

        MDC.put("traceId", "abc-123-threadlocal");
        MDC.put("userId", "user-42");

        log.info("Thread parent - MDC traceId : {}", MDC.get("traceId"));

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            executor.submit(() -> {
                log.info("Virtual Thread enfant - MDC traceId : {} <- PERDU !",
                        MDC.get("traceId") == null ? "null" : MDC.get("traceId"));
            }).get();
        }

        MDC.clear();
        log.info("");
    }

    /**
     * Solution 1 : Copie manuelle du MDC.
     */
    public static void demoMdcManualCopy() throws InterruptedException, ExecutionException {
        log.info("=== MDC copie manuelle - verbeux mais fonctionnel ===");

        MDC.put("traceId", "abc-123-manual");
        MDC.put("userId", "user-42");

        log.info("Thread parent - MDC traceId : {}", MDC.get("traceId"));

        var capturedMdc = MDC.getCopyOfContextMap();

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            executor.submit(() -> {
                if (capturedMdc != null) {
                    MDC.setContextMap(capturedMdc);
                }
                log.info("Virtual Thread enfant - MDC traceId : {} OK", MDC.get("traceId"));
                MDC.clear();
            }).get();
        }

        MDC.clear();
        log.info("");
    }

    /**
     * Solution 2 : ScopedValue - propagation automatique et immuable.
     */
    public static void demoScopedValue() {
        log.info("=== ScopedValue - propagation automatique ===");

        ScopedValue.where(TRACE_ID, "abc-123-scoped")
                   .where(USER_ID, "user-42")
                   .run(() -> {
                       log.info("Thread parent - TRACE_ID : {}", TRACE_ID.get());
                       log.info("Thread parent - USER_ID  : {}", USER_ID.get());

                       try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

                           scope.fork(() -> {
                               log.info("VT fork 1 - TRACE_ID : {} OK", TRACE_ID.get());
                               return null;
                           });

                           scope.fork(() -> {
                               log.info("VT fork 2 - TRACE_ID : {} OK", TRACE_ID.get());
                               ScopedValue.where(TRACE_ID, "abc-123-nested")
                                          .run(() -> log.info(
                                                  "VT fork 2 nested - TRACE_ID : {} (rebind)",
                                                  TRACE_ID.get()));
                               return null;
                           });

                           scope.join().throwIfFailed();

                       } catch (Exception e) {
                           Thread.currentThread().interrupt();
                       }
                   });

        log.info("");
    }

    public static void main(String[] args) throws InterruptedException, ExecutionException {
        log.info("Demo Context Propagation - Virtual Threads");
        log.info("");

        demoThreadLocalLoss();
        demoMdcManualCopy();
        demoScopedValue();

        log.info("==========================================================");
        log.info("  SYNTHESE");
        log.info("==========================================================");
        log.info("  ThreadLocal seul      -> contexte perdu dans les VTs");
        log.info("  MDC copie manuelle    -> fonctionne, mais verbeux");
        log.info("  ScopedValue (Java 21) -> nouveau standard, immuable");
        log.info("==========================================================");
    }
}