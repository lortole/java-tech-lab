# 🧪 java-tech-lab

> **Lab de veille technologique Java 21+ en 2026**  
> Expérimentations concrètes autour des features modernes de la JVM, Spring Boot 3 et de l'écosystème Java cloud-native.

[![Java](https://img.shields.io/badge/Java-21+-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vercel](https://img.shields.io/badge/Demo-Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://lortole-dev-lab.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-HighX97-181717?style=flat&logo=github&logoColor=white)](https://github.com/HighX97/java-tech-lab)
[![GitLab](https://img.shields.io/badge/GitLab-mirror-FC6D26?style=flat&logo=gitlab&logoColor=white)](https://gitlab.com)

---

## 🎯 Objectif

Ce lab est un espace d'**expérimentation et de veille active** autour des features Java 21+ en conditions réelles.  
Chaque module répond à une question concrète : *"Est-ce que ça tient en prod ?"*

Pas de tutoriels copiés-collés — du code qui tourne, des tests qui prouvent, des benchmarks qui mesurent.

---

## 📁 Structure

```
java-tech-lab/
└── netflix-java-2026/          # Premier projet — inspiré des patterns Netflix
    ├── backend/                # Spring Boot 3.3 + Java 21
    │   └── src/
    │       ├── testslices/     # @WebMvcTest, @DataJpaTest — tests rapides et ciblés
    │       ├── virtualthreads/ # Project Loom — Virtual Threads en I/O-bound
    │       └── zgc/            # ZGC — GC à faible latence pour les workloads critiques
    ├── frontend/               # React 18 + Vite — démo interactive
    └── diagrams/               # Schémas d'architecture (PNG)
```

---

## 🚀 Projets

### [`netflix-java-2026`](./netflix-java-2026/)

Trois sujets Java 21+ explorés sous l'angle **production-ready** :

| Module | Sujet | Ce qu'on prouve |
|--------|-------|-----------------|
| `testslices` | Spring Boot Test Slices | Tests rapides et isolés avec `@WebMvcTest` — sans charger tout le contexte Spring |
| `virtualthreads` | Project Loom — Virtual Threads | Context propagation, scalabilité I/O-bound, comparaison avec les platform threads |
| `zgc` | ZGC — Z Garbage Collector | Configuration, comportement sous charge, scénarios retry-storm |

🌐 **Démo live :** [lortole-dev-lab.vercel.app](https://lortole-dev-lab.vercel.app/)

---

## 🛠️ Stack technique

| Couche | Techno | Version |
|--------|--------|---------|
| Runtime | OpenJDK | 21+ |
| Framework | Spring Boot | 3.3.x |
| Build | Maven | 3.9+ |
| Frontend | React + Vite | 18 / 5.x |
| Deploy | Vercel | — |
| Versioning | GitHub + GitLab | mirror |

---

## ▶️ Lancer le projet

### Backend

```bash
cd netflix-java-2026/backend
./mvnw spring-boot:run
```

### Tests

```bash
./mvnw test
```

### Frontend

```bash
cd netflix-java-2026/frontend
npm install
npm run dev
```

---

## 📊 Diagrams

Les schémas d'architecture sont disponibles dans [`netflix-java-2026/diagrams/`](./netflix-java-2026/diagrams/) :

| Fichier | Sujet |
|---------|-------|
| `01_jvm_workloads.png` | Workloads JVM — Platform Threads vs Virtual Threads |
| `02_graphql_dgs_architecture.png` | Architecture GraphQL DGS (Netflix) |
| `03_zgc_retry_storm.png` | ZGC sous retry storm |
| `04_virtual_threads_timeline.png` | Timeline Virtual Threads vs Reactive |
| `05_springboot_migration_llm.png` | Migration Spring Boot assistée par LLM |
| `06_genai_startup_optimizer.png` | Startup optimizer GenAI |

---

## 📝 Articles associés

Les expérimentations de ce lab alimentent des publications techniques :

- 🔗 [ACID vs SAGA — Viva Engage Klanik](https://engage.microsoft.com) *(27 avr. 2026)*
- 🔜 Virtual Threads & Project Loom en prod — *à venir*
- 🔜 ZGC vs G1GC — benchmark sous charge — *à venir*

---

## 👤 Auteur

**Loïc ORTOLÉ** — Développeur Java/Angular Senior @ Klanik Montpellier  
Stack cible : Java 21+, Spring Boot 3, Quarkus, Angular 18, Kafka, Architecture Hexagonale

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Loïc_ORTOLÉ-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/)

---

*Lab en évolution continue — nouveaux modules à venir.*