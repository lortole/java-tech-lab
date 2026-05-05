package dev.lortole.netflixjava2026.virtualthreads;

import io.micrometer.context.ContextRegistry;
import io.micrometer.context.ContextSnapshot;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TP — Virtual Threads + ThreadLocal : le problème Netflix en JDK 21
 *
 * Netflix a annulé son déploiement Virtual Threads sur JDK 21 à cause de ce problème :
 * les ThreadLocal (utilisés par Spring Security, Micrometer, MDC) ne se propagent pas
 * automatiquement vers les virtual threads enfants.
 *
 * Ce TP illustre :
 * 1. Le problème : ThreadLocal perdu dans un virtual thread
 * 2. Le fix : micrometer-context-propagation pour propager explicitement le contexte
 *
 * En JDK 25 le thread pinning est résolu, mais la propagation de contexte
 * reste un sujet actif qui nécessite ce pattern.
 */
@DisplayName("TP Virtual Threads — ThreadLocal context propagation")
class VirtualThreadsContextPropagationTest {

    // Simule un ThreadLocal de contexte (comme SecurityContextHolder ou MDC)
    static final ThreadLocal<String> USER_CONTEXT = new ThreadLocal<>();

    @Test
    @DisplayName("PROBLÈME — ThreadLocal perdu dans un virtual thread enfant (comportement JDK 21)")
    void threadLocalIsLostInVirtualThread() throws ExecutionException, InterruptedException {

        // GIVEN : on pose un contexte dans le thread courant (simule Spring Security)
        USER_CONTEXT.set("loic");

        // WHEN : on fork un virtual thread — comme le ferait StructuredTaskScope
        Future<String> future;
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            future = executor.submit(() -> {
                // Le virtual thread enfant ne voit PAS le ThreadLocal du parent
                return USER_CONTEXT.get();
            });
        }

        String contextInChild = future.get();

        // THEN : null — le contexte est perdu
        // C'est ce qui causait les deadlocks chez Netflix :
        // Spring Security ne trouvait plus l'authentification dans le virtual thread
        assertThat(contextInChild)
                .as("ThreadLocal perdu dans le virtual thread enfant — comportement attendu sans fix")
                .isNull();

        // Nettoyage
        USER_CONTEXT.remove();
    }

    @Test
    @DisplayName("FIX — Propagation explicite du contexte via ContextSnapshot (pattern micrometer)")
    void threadLocalIsPropagatedWithContextSnapshot() throws ExecutionException, InterruptedException {

        // GIVEN : on enregistre notre ThreadLocal dans le ContextRegistry de Micrometer
        // En production c'est fait automatiquement par micrometer-context-propagation
        // pour MDC, SecurityContext, etc.
        ContextRegistry.getInstance()
                .registerThreadLocalAccessor(
                        "user-context",
                        USER_CONTEXT::get,
                        USER_CONTEXT::set,
                        USER_CONTEXT::remove
                );

        USER_CONTEXT.set("loic");

        // On capture le contexte du thread courant AVANT de forker
        ContextSnapshot snapshot = ContextSnapshot.captureAll();

        // WHEN : on fork un virtual thread avec propagation explicite
        Future<String> future;
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            future = executor.submit(() ->
                // Le snapshot restore le contexte dans le virtual thread enfant
                snapshot.wrap(() -> USER_CONTEXT.get()).call()
            );
        }

        String contextInChild = future.get();

        // THEN : le contexte est bien propagé
        assertThat(contextInChild)
                .as("Contexte propagé dans le virtual thread enfant grâce à ContextSnapshot")
                .isEqualTo("loic");

        // Nettoyage
        USER_CONTEXT.remove();
    }
}