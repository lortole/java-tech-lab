package dev.lortole.virtualthreadslab.context;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prouve les comportements de propagation de contexte avec Virtual Threads.
 *
 * 3 scénarios testés :
 *   1. ThreadLocal (MDC) → perdu dans les VTs sans configuration
 *   2. MDC copie manuelle → fonctionne mais verbeux
 *   3. ScopedValue → propagé automatiquement dans les forks
 */
@DisplayName("Context Propagation — MDC et ScopedValue avec Virtual Threads")
class ContextPropagationDemoTest {

    @AfterEach
    void cleanMdc() {
        MDC.clear();
    }

    @Test
    @DisplayName("MDC ThreadLocal est perdu dans un Virtual Thread enfant sans copie")
    void mdcShouldBeLostInChildVirtualThreadWithoutCopy() throws Exception {
        // GIVEN — trace ID dans le thread courant
        MDC.put("traceId", "test-trace-123");
        assertThat(MDC.get("traceId")).isEqualTo("test-trace-123");

        // WHEN — Virtual Thread enfant lancé sans copie du MDC
        var capturedTraceId = new AtomicReference<String>();

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            executor.submit(() -> {
                // Dans le VT : MDC est vide — ThreadLocal non propagé
                capturedTraceId.set(MDC.get("traceId"));
            }).get();
        }

        // THEN — le trace ID est perdu dans le VT
        assertThat(capturedTraceId.get())
                .as("MDC doit être null dans le Virtual Thread sans copie explicite")
                .isNull();
    }

    @Test
    @DisplayName("MDC est correctement propagé avec copie manuelle dans le Virtual Thread")
    void mdcShouldBePropagatedWithManualCopy() throws Exception {
        // GIVEN
        MDC.put("traceId", "test-trace-456");
        MDC.put("userId", "user-99");

        // Capturer le contexte avant de lancer le VT
        var capturedMdc = MDC.getCopyOfContextMap();
        var capturedTraceId = new AtomicReference<String>();
        var capturedUserId  = new AtomicReference<String>();

        // WHEN
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            executor.submit(() -> {
                // Restaurer le MDC dans le VT
                MDC.setContextMap(capturedMdc);
                capturedTraceId.set(MDC.get("traceId"));
                capturedUserId.set(MDC.get("userId"));
                MDC.clear();
            }).get();
        }

        // THEN
        assertThat(capturedTraceId.get())
                .as("traceId doit être propagé avec copie manuelle")
                .isEqualTo("test-trace-456");
        assertThat(capturedUserId.get())
                .as("userId doit être propagé avec copie manuelle")
                .isEqualTo("user-99");
    }

    @Test
    @DisplayName("ScopedValue est automatiquement disponible dans les forks StructuredTaskScope")
    void scopedValueShouldBePropagatedInStructuredTaskScopeForks() throws Exception {
        // GIVEN
        var capturedTraceInFork1 = new AtomicReference<String>();
        var capturedTraceInFork2 = new AtomicReference<String>();

        // WHEN — ScopedValue.where(...).run(...) définit le contexte du scope
        ScopedValue.where(ContextPropagationDemo.TRACE_ID, "scoped-trace-789")
                   .where(ContextPropagationDemo.USER_ID, "scoped-user-42")
                   .run(() -> {
                       try (var scope = new java.util.concurrent.StructuredTaskScope.ShutdownOnFailure()) {

                           // Les forks héritent automatiquement des ScopedValues
                           scope.fork(() -> {
                               capturedTraceInFork1.set(ContextPropagationDemo.TRACE_ID.get());
                               return null;
                           });

                           scope.fork(() -> {
                               capturedTraceInFork2.set(ContextPropagationDemo.TRACE_ID.get());
                               return null;
                           });

                           scope.join().throwIfFailed();

                       } catch (Exception e) {
                           Thread.currentThread().interrupt();
                       }
                   });

        // THEN — les deux forks ont le trace ID sans copie manuelle
        assertThat(capturedTraceInFork1.get())
                .as("Fork 1 doit avoir le TRACE_ID propagé automatiquement")
                .isEqualTo("scoped-trace-789");

        assertThat(capturedTraceInFork2.get())
                .as("Fork 2 doit avoir le TRACE_ID propagé automatiquement")
                .isEqualTo("scoped-trace-789");
    }

    @Test
    @DisplayName("ScopedValue peut être rebindé dans un sous-scope sans affecter le scope parent")
    void scopedValueRebindShouldBeIsolatedToNestedScope() throws Exception {
        // GIVEN
        var outerValue = new AtomicReference<String>();
        var innerValue = new AtomicReference<String>();

        // WHEN
        ScopedValue.where(ContextPropagationDemo.TRACE_ID, "outer-trace")
                   .run(() -> {
                       outerValue.set(ContextPropagationDemo.TRACE_ID.get());

                       // Rebind dans un sous-scope — n'affecte PAS le scope parent
                       ScopedValue.where(ContextPropagationDemo.TRACE_ID, "inner-trace")
                                  .run(() -> innerValue.set(
                                          ContextPropagationDemo.TRACE_ID.get()));

                       // Après le sous-scope : valeur d'origine restaurée
                       assertThat(ContextPropagationDemo.TRACE_ID.get())
                               .isEqualTo("outer-trace");
                   });

        // THEN
        assertThat(outerValue.get()).isEqualTo("outer-trace");
        assertThat(innerValue.get()).isEqualTo("inner-trace");
    }
}
