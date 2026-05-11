# 🧪 Transaction Lab

> **Comprendre ACID, CAP et SAGA par la pratique.**
> Trois modules, trois niveaux, une démo qui tourne — du junior au senior.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://transaction-lab.vercel.app)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk)](https://openjdk.org/projects/jdk/21/)
[![Angular](https://img.shields.io/badge/Angular-18-DD0031?style=flat-square&logo=angular)](https://angular.dev)
[![Kafka](https://img.shields.io/badge/Kafka-3.7-231F20?style=flat-square&logo=apachekafka)](https://kafka.apache.org)

---

## 🎯 Pourquoi ce TP ?

Ce lab fait suite à deux articles publiés sur la Software Community de Klanik :

- 📖 **[ACID vs SAGA : Le duel des transactions dans un monde distribué](https://klanik.viva.biz/article/acid-vs-saga)**
- 📖 **[CAP Theorem : Le triangle impossible des systèmes distribués](https://klanik.viva.biz/article/cap-theorem)**

L'objectif n'est pas de lire — c'est de **casser des choses** et de **les réparer**.

---

## 🗺️ Vue d'ensemble

```
transaction-lab/
├── backend/          ← Spring Boot 3.3 · Java 21 · port 8080
│   └── src/main/java/com/klanik/transactionlab/
│       ├── acid/     ← @Transactional · rollback · isolation levels
│       ├── cap/      ← CP vs AP · cohérence éventuelle · simulation nœuds
│       └── saga/     ← Kafka · compensation · idempotence · DLQ
│
├── frontend/         ← Angular 18 · port 4200
│   └── src/app/tabs/
│       ├── acid/     ← Demo virement + kata rollback
│       ├── cap/      ← Simulateur CP vs AP en temps réel
│       └── saga/     ← Commande e-commerce step by step
│
├── docs/             ← Guides kata par niveau
├── docker-compose.yml
└── README.md         ← vous êtes ici
```

---

## 🚀 Démarrage rapide

### Prérequis

| Outil | Version minimale | Vérification |
|-------|-----------------|--------------|
| Java | 21 | `java -version` |
| Maven | 3.9 | `mvn -version` |
| Node.js | 20 | `node -v` |
| Docker + Compose | 24 | `docker compose version` |

### 1 · Infra (PostgreSQL + Kafka)

```bash
docker compose up -d
```

> ⏱️ Première fois : ~2 min le temps que Kafka soit prêt.
> Vérifier : `docker compose ps` — tous les services doivent être `healthy`.

### 2 · Backend

```bash
cd backend
./mvnw spring-boot:run
```

API disponible sur `http://localhost:8080`
Swagger UI : `http://localhost:8080/swagger-ui.html`

### 3 · Frontend

```bash
cd frontend
npm install
ng serve
```

App disponible sur `http://localhost:4200`

### Script tout-en-un

```bash
# Depuis la racine du projet
./start.sh
```

---

## 📚 Les trois modules

### 🔵 Module ACID — Transactions relationnelles

**Scénario** : virement bancaire entre deux comptes.

**Ce que vous allez observer :**
- Un virement réussit → les deux soldes changent atomiquement
- On injecte une erreur à mi-chemin → rollback automatique, aucune donnée corrompue
- Deux virements simultanés → isolation, pas d'interférence

**Les niveaux :**

| Niveau | Objectif | Durée estimée |
|--------|----------|---------------|
| 🟢 Junior | Déclencher et observer un rollback dans l'UI | 15 min |
| 🟡 Confirmé | Comprendre `READ_COMMITTED` vs `SERIALIZABLE`, produire un dirty read | 45 min |
| 🔴 Senior | Mesurer l'impact des niveaux d'isolation sur les performances, optimiser | 1h30 |

📖 [Guide kata ACID →](docs/kata-acid.md)

---

### 🟡 Module CAP — Le triangle impossible

**Scénario** : deux nœuds H2 in-memory qui simulent une partition réseau.

**Ce que vous allez observer :**
- Système CP : une partition → le nœud B refuse les requêtes plutôt que de mentir
- Système AP : une partition → le nœud B répond avec des données potentiellement obsolètes
- Réconciliation : comment les nœuds se resynchronisent après rétablissement

**Les niveaux :**

| Niveau | Objectif | Durée estimée |
|--------|----------|---------------|
| 🟢 Junior | Activer la partition réseau et observer CP vs AP dans l'UI | 20 min |
| 🟡 Confirmé | Implémenter la stratégie AP avec réconciliation éventuelle | 1h |
| 🔴 Senior | Concevoir et implémenter un mécanisme de vector clock simplifié | 2h |

📖 [Guide kata CAP →](docs/kata-cap.md)

---

### 🔴 Module SAGA — Transactions distribuées avec Kafka

**Scénario** : commande e-commerce en 4 services (Inventaire → Commande → Paiement → Notification).

**Ce que vous allez observer :**
- Flux nominal : commande qui réussit, chaque topic Kafka s'allume dans l'ordre
- Flux de compensation : paiement refusé → compensation Inventaire → commande annulée
- Idempotence : rejouer un événement sans effet de bord

**Les niveaux :**

| Niveau | Objectif | Durée estimée |
|--------|----------|---------------|
| 🟢 Junior | Suivre le flux nominal et déclencher un échec via l'UI | 20 min |
| 🟡 Confirmé | Coder la compensation manquante du service Inventaire | 1h |
| 🔴 Senior | Rendre le handler idempotent + configurer la DLQ + bonus Outbox Pattern | 2h |

📖 [Guide kata SAGA →](docs/kata-saga.md)

---

## 🏗️ Infrastructure Docker

```yaml
# docker-compose.yml — services disponibles
postgresql    → localhost:5432   (ACID, données persistantes)
kafka         → localhost:9092   (SAGA, événements)
zookeeper     → localhost:2181   (coordination Kafka)
kafka-ui      → localhost:8090   (visualiser les topics en temps réel)
```

> 💡 **Kafka UI** est votre meilleur ami pour le module SAGA. Ouvrez `http://localhost:8090` pour voir les messages transiter en temps réel entre les topics.

---

## 🌐 Déploiement — Demo publique

Le projet est déployé automatiquement à chaque push sur `main` :

| Composant | Plateforme | URL |
|-----------|-----------|-----|
| Frontend | Vercel | `https://transaction-lab.vercel.app` |
| Backend | Railway | `https://transaction-lab-api.railway.app` |
| Kafka (demo) | Upstash (serverless) | géré par Railway |

### Déployer votre propre instance

**Frontend (Vercel) :**
```bash
npm install -g vercel
cd frontend
vercel --prod
```

**Backend (Railway) :**
1. Créer un projet Railway
2. Connecter le repo GitHub
3. Configurer les variables d'environnement (voir `.env.example`)
4. Railway détecte automatiquement le `Dockerfile` du backend

📖 [Guide déploiement complet →](docs/deployment.md)

---

## 🧱 Stack technique

### Backend
- **Spring Boot 3.3** — framework principal
- **Java 21** — Virtual Threads activés (`spring.threads.virtual.enabled=true`)
- **Spring Data JPA** — accès données (module ACID)
- **Spring Kafka** — producer/consumer (module SAGA)
- **H2 in-memory** — simulation nœuds CAP (module CAP)
- **PostgreSQL** — persistance principale (module ACID)
- **SpringDoc OpenAPI** — documentation Swagger auto-générée

### Frontend
- **Angular 18** — framework principal (Standalone Components)
- **RxJS** — flux réactifs pour SSE et polling
- **SCSS** — styles globaux (architecture identique à `virtual-threads-lab`)

### Infra
- **Docker Compose** — orchestration locale
- **Kafka 3.7 + Zookeeper** — event streaming (SAGA)
- **Kafka UI (Provectus)** — visualisation des topics
- **GitHub Actions** — CI/CD automatique

---

## 📁 Structure des kata

Chaque module dispose d'un répertoire `kata/` dans le backend :

```
kata/
├── KataAcidService.java       ← code à compléter (TODO Javadoc)
├── KataCapService.java
├── KataSagaHandler.java
└── solution/
    ├── SolutionAcidService.java   ← corrigé commenté
    ├── SolutionCapService.java
    └── SolutionSagaHandler.java
```

> ⚠️ **Ne regardez pas le corrigé avant d'avoir essayé !**
> Les `TODO` dans le code kata sont suffisamment guidés pour avancer.

---

## 🤝 Contribution

Ce lab évolue. Si vous avez des idées d'exercices, de scénarios ou si vous trouvez un bug :

1. Ouvrez une **Issue** sur GitHub
2. Ou proposez directement une **Pull Request**

Les sujets suivants sont dans le backlog :
- [ ] Module SAGA Orchestrée (Axon Framework)
- [ ] Outbox Pattern (SAGA Senior bonus)
- [ ] Chaos Engineering — tests de partition automatisés
- [ ] Module BASE — Cassandra vs PostgreSQL en comparaison directe

---

## 📜 Licence

MIT — libre d'utilisation, de modification et de partage.

---

*Loïc ORTOLÉ — Klanik Software Community · 2026*
*Repo : [github.com/lortole/java-tech-lab](https://github.com/lortole/java-tech-lab)*