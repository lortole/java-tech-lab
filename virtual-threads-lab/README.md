# ⚡ virtual-threads-lab

> **Lab Java 21 — Virtual Threads : bench, pinning, context propagation**  
> Trois modules qui répondent aux questions qu'on rate en entretien.

[![Java](https://img.shields.io/badge/Java-21+-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Tests](https://img.shields.io/badge/Tests-5_passing-4CAF50?style=flat)](.)

---

## 🎯 Pourquoi ce lab ?

Les Virtual Threads sont dans toutes les offres Java depuis Java 21.  
La différence entre "j'en ai entendu parler" et "je peux en parler en entretien" tient à trois points précis.

Ce lab les couvre avec du code qui tourne et des tests qui prouvent.

---

## 📦 Modules

### 1/ `bench` — Platform Threads vs Virtual Threads

**Question d'entretien :** *"Pourquoi les Virtual Threads sont plus rapides ?"*

```
Workload : 1 000 tâches I/O simulées (50ms chacune)
Platform Threads (pool=200) : ~250ms  → batches de 200, queue d'attente
Virtual Threads              :  ~55ms  → toutes quasi-simultanées
Speedup                      :   ~5x
```

Ce qui se passe sous le capot : le carrier thread est **libéré pendant le sleep**.  
Sur 8 CPUs → 8 carriers font tourner des milliers de VTs en parallèle.

```java
// Platform Threads — pool limité à 200 threads OS
try (var executor = Executors.newFixedThreadPool(200)) { ... }

// Virtual Threads — un VT par tâche, sans limite pratique
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) { ... }
```

---

### 2/ `pinning` — Le piège synchronized

**Question d'entretien :** *"C'est quoi le pinning ?"*

```
Pinning = Virtual Thread cloué à son carrier pendant un blocage
Cause   = bloc synchronized (Java 21–23)
Effet   = carrier bloqué → bénéfice des VTs annulé
```

```java
// ❌ Java 21-23 : synchronized + I/O = pinning = carrier bloqué
synchronized (lock) {
    appelBDD(); // le carrier ne peut plus servir d'autres VTs
}

// ✅ Solution : ReentrantLock libère le carrier pendant l'attente
lock.lock();
try {
    appelBDD(); // carrier disponible pour d'autres VTs
} finally {
    lock.unlock();
}
```

> **Java 24 (JEP 491)** : `synchronized` ne cause plus de pinning.  
> Sur Java 21–23 : `ReentrantLock` est **obligatoire** dans les sections critiques.

Pour détecter le pinning en dev :
```bash
-Djdk.tracePinnedThreads=full
```

---

### 3/ `context` — MDC et ScopedValue

**Question d'entretien :** *"Le MDC fonctionne avec les Virtual Threads ?"*

| Approche | Résultat | Notes |
|----------|----------|-------|
| `ThreadLocal` / MDC seul | ❌ Contexte perdu | Non propagé dans les VTs enfants |
| MDC copie manuelle | ⚠️ Fonctionne | Verbeux, à faire partout |
| `micrometer-context-propagation` | ✅ Transparent | Spring Boot 3.2+ |
| `ScopedValue` (Java 21) | ✅ Standard moderne | Immuable, propagé automatiquement |

```java
// ✅ ScopedValue — le successeur de ThreadLocal
static final ScopedValue<String> TRACE_ID = ScopedValue.newInstance();

ScopedValue.where(TRACE_ID, "abc-123")
           .run(() -> {
               // Tous les StructuredTaskScope.fork() héritent de TRACE_ID
               try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
                   scope.fork(() -> {
                       System.out.println(TRACE_ID.get()); // "abc-123" ✅
                       return null;
                   });
                   scope.join().throwIfFailed();
               }
           });
```

---

## 🧪 Tests

```
✅ PlatformVsVirtualBenchTest          (2 tests)
   → VTs 3x+ plus rapides sur I/O-bound
   → 1000 tâches I/O en < 500ms

✅ PinningDemoTest                     (2 tests)
   → ReentrantLock plus rapide que synchronized (Java 21-23)
   → 200 tâches avec ReentrantLock en < 2s

✅ ContextPropagationDemoTest          (4 tests)
   → MDC perdu sans copie (comportement attendu)
   → MDC propagé avec copie manuelle
   → ScopedValue propagé dans les forks automatiquement
   → ScopedValue rebind isolé au sous-scope
```

### Lancer les tests

```bash
cd virtual-threads-lab
./mvnw test
```

### Lancer les démos main()

```bash
# Benchmark
./mvnw exec:java -Dexec.mainClass="dev.lortole.virtualthreadslab.bench.PlatformVsVirtualBench"

# Pinning
./mvnw exec:java -Dexec.mainClass="dev.lortole.virtualthreadslab.pinning.PinningDemo"

# Context
./mvnw exec:java -Dexec.mainClass="dev.lortole.virtualthreadslab.context.ContextPropagationDemo"
```

---

## ⚡ Activer les Virtual Threads sur Spring Boot 3.2+

```properties
# application.properties — c'est tout
spring.threads.virtual.enabled=true
# Tomcat, Jetty et @Async basculent automatiquement
```

---

## 🗺️ Roadmap

- [ ] `structured-concurrency` — StructuredTaskScope patterns avancés
- [ ] `scoped-values` — migration ThreadLocal → ScopedValue en pratique
- [ ] `spring-security` — Virtual Threads + SecurityContext propagation

---

## 🔗 Références

| Sujet | Lien |
|-------|------|
| JEP 444 — Virtual Threads | [openjdk.org/jeps/444](https://openjdk.org/jeps/444) |
| JEP 446 — Scoped Values | [openjdk.org/jeps/446](https://openjdk.org/jeps/446) |
| JEP 491 — Pinning résolu (Java 24) | [openjdk.org/jeps/491](https://openjdk.org/jeps/491) |
| Micrometer Context Propagation | [micrometer.io](https://micrometer.io/docs/contextPropagation) |
| Spring Boot 3.2 + Virtual Threads | [spring.io/blog](https://spring.io/blog/2023/09/09/all-together-now-spring-boot-3-2-graalvm-native-images-java-21-and-virtual) |

---

*Partie du lab [`java-tech-lab`](../README.md)*  
*Article associé : Virtual Threads — Ce que tout développeur Java devrait pouvoir expliquer*
