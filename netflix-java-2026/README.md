# 🎬 netflix-java-2026

> **Exploration Java 21+ en conditions réelles — inspirée des patterns Netflix**  
> Trois modules, trois sujets qui font la différence en production.

[![Java](https://img.shields.io/badge/Java-21+-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Tests](https://img.shields.io/badge/Tests-Passing-4CAF50?style=flat&logo=junit5&logoColor=white)]()
[![Demo](https://img.shields.io/badge/Demo-Live-000000?style=flat&logo=vercel&logoColor=white)](https://lortole-dev-lab.vercel.app/)

---

## 🎯 Pourquoi ce projet ?

En 2026, Java 21 est LTS et largement adopté en entreprise — mais Virtual Threads, ZGC et les Test Slices restent souvent mal maîtrisés ou utilisés par défaut sans en comprendre les implications.

Ce projet répond à trois questions concrètes :

1. **Test Slices** → Comment tester un controller Spring sans charger tout le contexte applicatif ?
2. **Virtual Threads** → Est-ce que le context propagation fonctionne correctement avec Project Loom ?
3. **ZGC** → Comment configurer ZGC et qu'est-ce que ça change vraiment sous charge ?

---

## 📦 Modules

### 🧩 `testslices` — Spring Boot Test Slices

Tests rapides et isolés avec les slices Spring Boot.

**Ce qu'on explore :**
- `@WebMvcTest` — tester un controller HTTP sans démarrer le serveur complet
- Mocking ciblé avec `@MockBean` / `@MockitoBean` (Spring Boot 3.4+)
- Isolation du contexte Spring pour des tests en millisecondes

**Classes clés :**
```
TrackController.java     → REST controller exposant /tracks
TrackService.java        → Service métier (mocké dans les tests)
TrackDto.java            → DTO de réponse (Java Record)
TrackControllerWebMvcTest.java  → Test slice @WebMvcTest
```

**Ce que prouve le test :**
```java
@WebMvcTest(TrackController.class)
class TrackControllerWebMvcTest {
    // Seul le layer Web est chargé
    // TrackService est mocké — pas de base de données, pas de Kafka
    // Temps d'exécution : < 500ms
}
```

---

### ⚡ `virtualthreads` — Project Loom

Virtual Threads en action sur des workloads I/O-bound.

**Ce qu'on explore :**
- Activation des Virtual Threads avec Spring Boot 3.2+ (`spring.threads.virtual.enabled=true`)
- **Context Propagation** — MDC, SecurityContext, et variables de contexte traversent correctement les Virtual Threads
- Comportement sous charge concurrente élevée

**Test clé :**
```
VirtualThreadsContextPropagationTest.java
→ Vérifie que le MDC (trace ID, user ID) est bien propagé
  dans les Virtual Threads sur des appels I/O simulés
```

**Résultats observés :**
- ✅ MDC propagé correctement avec `io.micrometer:context-propagation`
- ✅ Scalabilité massive sur I/O-bound (milliers de threads légers)
- ⚠️ Pinning à surveiller avec `synchronized` blocks et certains drivers JDBC

---

### 🗑️ `zgc` — Z Garbage Collector

Configuration et comportement de ZGC sur des workloads à faible tolérance à la latence.

**Ce qu'on explore :**
- Activation et tuning de ZGC (`-XX:+UseZGC`)
- Comportement en situation de **retry storm** — quand les GC pauses impactent les timeouts
- Comparaison avec G1GC sur les pauses max

**Configuration testée :**
```bash
-XX:+UseZGC
-XX:ZCollectionInterval=1
-Xmx512m
```

**Test clé :**
```
ZgcConfigTest.java
→ Vérifie que la configuration ZGC est active
  et que les pauses restent < seuil acceptable sous charge
```

**Diagramme associé :**  
![ZGC Retry Storm](../diagrams/03_zgc_retry_storm.png)

---

## 🏗️ Architecture

```
netflix-java-2026/
├── backend/
│   ├── src/main/java/.../
│   │   ├── testslices/         # TrackController, TrackService, TrackDto
│   │   ├── virtualthreads/     # Config + démos Virtual Threads
│   │   ├── zgc/                # Config ZGC + helpers
│   │   └── NetflixJava2026Application.java
│   ├── src/test/java/.../
│   │   ├── testslices/         # TrackControllerWebMvcTest
│   │   ├── virtualthreads/     # VirtualThreadsContextPropagationTest
│   │   └── zgc/                # ZgcConfigTest
│   └── pom.xml
├── frontend/                   # React 18 + Vite — démo interactive
└── diagrams/                   # 6 schémas PNG
```

---

## ▶️ Lancer le projet

### Prérequis

- Java 21+
- Maven 3.9+
- Node.js 20+ (pour le frontend)

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

### Tests

```bash
# Tous les tests
./mvnw test

# Un module spécifique
./mvnw test -Dtest="TrackControllerWebMvcTest"
./mvnw test -Dtest="VirtualThreadsContextPropagationTest"
./mvnw test -Dtest="ZgcConfigTest"
```

### Frontend (démo interactive)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

🌐 **Démo déployée :** [lortole-dev-lab.vercel.app](https://lortole-dev-lab.vercel.app/)

---

## 📊 Résultats des tests

```
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0

✅ TrackControllerWebMvcTest          — Test Slice WebMvc
✅ VirtualThreadsContextPropagationTest — Context propagation Loom
✅ ZgcConfigTest                      — Configuration ZGC
```

---

## 🔗 Ressources

| Sujet | Lien |
|-------|------|
| Virtual Threads — JEP 444 | [openjdk.org/jeps/444](https://openjdk.org/jeps/444) |
| Spring Boot 3.2 Virtual Threads | [spring.io/blog](https://spring.io/blog/2023/09/09/all-together-now-spring-boot-3-2-graalvm-native-images-java-21-and-virtual) |
| ZGC Documentation | [wiki.openjdk.org/display/zgc](https://wiki.openjdk.org/display/zgc) |
| Spring Boot Test Slices | [docs.spring.io](https://docs.spring.io/spring-boot/docs/current/reference/html/test-auto-configuration.html) |
| Micrometer Context Propagation | [micrometer.io](https://micrometer.io/docs/contextPropagation) |

---

## 📁 Diagrams

| Fichier | Description |
|---------|-------------|
| `01_jvm_workloads.png` | Platform Threads vs Virtual Threads — comparaison workloads |
| `02_graphql_dgs_architecture.png` | Architecture GraphQL DGS (Netflix pattern) |
| `03_zgc_retry_storm.png` | Impact ZGC sur les retry storms |
| `04_virtual_threads_timeline.png` | Timeline d'exécution Virtual Threads vs Reactive |
| `05_springboot_migration_llm.png` | Migration Spring Boot 2→3 assistée par LLM |
| `06_genai_startup_optimizer.png` | Optimizer GenAI pour réduire le startup time |

---

*Projet issu du lab de veille technologique [`java-tech-lab`](../README.md)*