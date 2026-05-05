package dev.lowx.netflixjava2026.zgc;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TP — Generational ZGC
 *
 * Netflix est passé de G1GC à Generational ZGC pour éliminer les pauses
 * stop-the-world (~1.5s avec G1) qui déclenchaient des retry storms en cascade.
 *
 * Ce TP montre :
 * 1. Comment activer ZGC (flags JVM)
 * 2. Comment vérifier que ZGC est actif en runtime
 * 3. La config Spring Boot recommandée
 *
 * Pour activer ZGC sur ce TP, lancer avec :
 *   mvn test -Dtest="ZgcConfigTest" -DargLine="-XX:+UseZGC -XX:+ZGenerational"
 *
 * Sans ces flags, le test tourne avec le GC par défaut (G1 sur JDK 21)
 * et le test "zgcIsActive" sera skippé proprement.
 */
@DisplayName("TP Generational ZGC — config et vérification runtime")
class ZgcConfigTest {

    @Test
    @DisplayName("Détecte le GC actif en runtime — G1 par défaut, ZGC si flags activés")
    void detectActiveGarbageCollector() {
        List<GarbageCollectorMXBean> gcBeans = ManagementFactory.getGarbageCollectorMXBeans();

        List<String> gcNames = gcBeans.stream()
                .map(GarbageCollectorMXBean::getName)
                .toList();

        System.out.println("=== GC actif sur cette JVM ===");
        gcNames.forEach(name -> System.out.println("  → " + name));
        System.out.println();

        boolean isZgc = gcNames.stream().anyMatch(name -> name.contains("ZGC"));
        boolean isG1  = gcNames.stream().anyMatch(name -> name.contains("G1"));

        if (isZgc) {
            System.out.println("✅ ZGC actif — pauses stop-the-world : ~0ms");
            System.out.println("   Flags utilisés : -XX:+UseZGC -XX:+ZGenerational");
        } else if (isG1) {
            System.out.println("⚠️  G1GC actif — pauses stop-the-world possibles (~1.5s sous charge)");
            System.out.println("   Pour activer ZGC : -XX:+UseZGC -XX:+ZGenerational");
            System.out.println("   Dans Spring Boot : JAVA_OPTS=\"-XX:+UseZGC -XX:+ZGenerational\"");
        }

        // Le test passe dans les deux cas — on documente, on ne force pas
        assertThat(gcNames).isNotEmpty();
    }

    @Test
    @DisplayName("Config JVM recommandée par Netflix pour la prod — documentation")
    void printRecommendedJvmConfig() {
        // Ce test ne fait que documenter la config Netflix recommandée
        // Utile comme référence pour les revues d'architecture en mission

        String config = """
                ===================================================
                CONFIG JVM NETFLIX — Generational ZGC
                ===================================================
                
                Activation :
                  -XX:+UseZGC
                  -XX:+ZGenerational          (Generational mode — JDK 21+)
                
                Tuning recommandé :
                  -XX:MaxGCPauseMillis=1      (objectif : < 1ms, ZGC l'honore)
                  -Xms512m -Xmx2g            (heap fixe en prod pour éviter le resize)
                  -XX:+AlwaysPreTouch         (alloue la mémoire au démarrage)
                
                Monitoring :
                  -Xlog:gc*:file=/var/log/gc.log:time,uptime,level,tags
                  -XX:+PrintGCDetails
                
                Dans Spring Boot (application.properties) :
                  spring.jmx.enabled=true
                  management.endpoints.web.exposure.include=health,metrics
                
                Dans Docker Compose / Dockerfile :
                  JAVA_OPTS="-XX:+UseZGC -XX:+ZGenerational -Xms512m -Xmx2g"
                
                Pourquoi ça change tout à grande échelle :
                  G1GC pause ~1.5s → timeout IPC → retry storm → surcharge cluster
                  ZGC pause ~0ms  → pas de timeout → pas de retry storm
                  Résultat Netflix : charge cluster globale RÉDUITE malgré +CPU ZGC
                ===================================================
                """;

        System.out.println(config);

        // Assertion symbolique — ce test sert de documentation exécutable
        assertThat(config).contains("ZGenerational");
    }
}