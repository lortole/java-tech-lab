# ☕ java-tech-lab

> TPs pratiques issus de mes articles tech — code qui accompagne mes publications sur LinkedIn et Viva Engage.

[![Java](https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=openjdk)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6db33f?style=flat-square&logo=spring)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-Vite-61dafb?style=flat-square&logo=react)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## 💡 Philosophie

J'ai regardé des conférences, lu des articles, pris des notes. Ce repo c'est l'étape d'après : **valider par le code**.

Chaque module correspond à un article publié. Chaque TP a un dashboard interactif pour comprendre sans avoir à lancer le backend — utile pour partager avec des collègues non-Java.

---

## 📦 Modules

### [netflix-java-2026](./netflix-java-2026/)

> *Comment Netflix utilise Java en 2026 — ce qu'on peut en apprendre pour nos missions*

**Source :** [How Netflix Uses Java — 2026 Edition](https://www.youtube.com/watch?v=ucJTPda_zx0) — Paul, Java Platform Team @ Netflix

| TP | Sujet | Ce qu'on apprend |
|---|---|---|
| `testslices/` | `@WebMvcTest` vs `@SpringBootTest` | Réduire le temps de build de 80% sans toucher au code métier |
| `virtualthreads/` | Bug ThreadLocal JDK 21 + fix `micrometer-context-propagation` | Pourquoi Netflix a annulé son déploiement Virtual Threads |
| `zgc/` | Generational ZGC vs G1GC | Éliminer les retry storms, pas juste accélérer le GC |

**🚀 Dashboard interactif :** [lortole-dev-lab.vercel.app](https://lortole-dev-lab.vercel.app)

```bash
cd netflix-java-2026/backend
mvn test
# 6 tests, 0 failures

cd ../frontend
npm install && npm run dev
# → http://localhost:5174
```

---

## 🗂️ Structure

```
java-tech-lab/
├── netflix-java-2026/
│   ├── backend/     ← Maven Spring Boot 3 / Java 21
│   ├── frontend/    ← React Vite + Recharts + Prism
│   ├── diagrams/    ← PNG générés depuis les blocs Mermaid
│   └── README.md    ← Article complet + diagrammes intégrés
└── README.md
```

---

## 🚀 Prérequis

```bash
java --version   # Java 21+
mvn --version    # Maven 3.9+
node --version   # Node 18+
```

---

## 🗺️ Roadmap

- [ ] `acid-vs-saga/` — ACID vs SAGA : transactions distribuées avec Kafka
- [ ] `spring-ai/` — GenAI en Java avec Spring AI

---

## 👤 Auteur

**Loïc ORTOLÉ** — Consultant Java Senior @ Klanik

- 🔗 [LinkedIn](https://www.linkedin.com/in/lortole/)
- 💼 6 ans Spring Boot · Quarkus/Kafka (Amadeus)

---

## 📄 Licence

MIT — libre de réutiliser, adapter, partager avec attribution.