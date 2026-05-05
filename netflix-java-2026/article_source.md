---
titre: "How Netflix Uses Java — Ce que la 2026 Edition nous apprend sur nos missions"
auteur: Loïc ORTOLÉ
assisté_par: AI Claude
date: 2026-04-20
version: "1.2"
tags: [java, spring-boot, jvm, microservices, graphql, virtual-threads, genai, netflix, viva-engage]
statut: prêt à publier
destination: Viva Engage — Software Community
---

# ☕ How Netflix Uses Java en 2026 — Résumé de mes notes

J'ai regardé la conférence **"How Netflix Uses Java — 2026 Edition"** présentée par Paul, membre de la Java Platform Team chez Netflix et créateur du framework DGS. Je l'ai trouvée assez intéressante — donc pour ceux qui n'ont pas le temps ou qui se demandent de quoi ça parle, voici un petit résumé issu de mes notes perso.

🎥 *[How Netflix Uses Java — 2026 Edition](https://www.youtube.com/watch?v=ucJTPda_zx0)*

> 📎 Les schémas sont disponibles en annexe (6 diagrammes PNG joints).

---

## 1️⃣ Une seule stack pour tout

Netflix fait tourner entre 3 000 et 4 000 microservices Java en prod. Streaming temps réel multi-région ET applications internes "boring" de Netflix Studio → même JVM Spring Boot.

Ce n'est pas de la flemme de migrer. C'est un choix assumé : ça réduit la fragmentation des compétences, simplifie les recrutements, et évite de maintenir deux cultures techniques en parallèle.

La JVM n'est pas un héritage qu'on subit. C'est un choix qu'on assume.

> 📎 *Annexe 01 — Deux workloads Netflix, une seule stack JVM*

---

## 2️⃣ REST est (quasiment) mort chez Netflix

GraphQL fédéré pour les échanges front ↔ backend. gRPC pour les communications server-to-server. REST ne survit plus que pour les cas vraiment triviaux.

Les services s'appellent **DGS (Domain Graph Services)** — un framework open-source Netflix construit par-dessus Spring Boot. Un Gateway GraphQL fait le fan-out et agrège les réponses de tous les services.

Ce qui m'a aussi frappé sur les tests : Netflix a abandonné `@SpringBootTest` au profit des **Test Slices** (`@WebMvcTest`, `@DataJpaTest`, `@EnableDgsTest`). Tests plus rapides, plus ciblés. On peut faire pareil sur nos missions sans attendre d'être Netflix.

> 📎 *Annexe 02 — Architecture GraphQL fédéré / DGS / gRPC*

---

## 3️⃣ Generational ZGC — le GC qui a changé leur infra

Avec G1GC, les pauses stop-the-world atteignaient **~1,5 seconde**. Ça paraît peu. Mais à l'échelle Netflix, avec des timeouts IPC agressifs, chaque pause déclenchait une **retry storm** — une cascade de retries qui surchargeait tout le cluster.

Migration vers **Generational ZGC** → pauses à 0. Ça consomme plus de CPU, mais la disparition des retry storms a paradoxalement réduit la charge globale.

Ce que ça change pour nous : sur Spring Boot 3+ avec Java 21, `-XX:+UseZGC -XX:+ZGenerational` est disponible. Pas forcément utile sur une appli CRUD légère — mais à avoir en tête pour les discussions d'architecture sur des services à fort trafic.

> 📎 *Annexe 03 — G1GC stop-the-world → retry storm en cascade*

---

## 4️⃣ Virtual Threads — attention, c'est pas magique

Netflix a tenté d'activer les Virtual Threads sur JDK 21. **Résultat : deadlocks en production, déploiement annulé.**

La cause : Spring Security et Micrometer utilisent des `ThreadLocal`. Lors d'un `StructuredTaskScope.fork()`, le contexte du thread parent n'est pas copié vers les virtual threads enfants. Couplé au thread pinning sur les blocs `synchronized` → deadlocks intermittents.

En JDK 25, le pinning est résolu. Mais la propagation de contexte reste à gérer manuellement via `micrometer-context-propagation`.

Morale : `spring.threads.virtual.enabled=true` ne s'active pas à l'aveugle si Spring Security est dans la boucle. Netflix l'a appris en prod — autant ne pas répéter l'expérience.

> 📎 *Annexe 04 — Virtual Threads : faux départ JDK 21 → résolution JDK 25*

---

## 5️⃣ Migrer 4 000 microservices avec des agents LLM

Maintenir 4 000 apps à jour sur les dernières versions de Spring Boot, c'est un défi d'ingénierie à part entière.

**SB2 → SB3** (migration Jakarta EE) : outillage classique — OpenRewrite + transformations Gradle sur le bytecode.

**SB3 → SB4** : Netflix a automatisé avec des **agents LLM headless orchestrés en Java**. L'orchestrateur déploie des agents qui analysent le code, appliquent les changements et valident — avec checkpointing pour reprendre sur erreur.

Ce n'est pas du vibe coding. C'est de l'industrialisation sérieuse.

> 📎 *Annexe 05 — Migration Spring Boot 2→3→4 : OpenRewrite + agents LLM*

---

## 6️⃣ GenAI en Java — plus besoin de Python

> *"L'époque où l'IA était l'apanage exclusif de Python est révolue."* — Paul, Netflix

Netflix a construit un **Startup Performance Optimizer** : un orchestrateur Java envoie des prompts structurés à un LLM qui analyse les sources des libs impliquées et génère des recommandations actionnables pour le dev.

Leur philosophie : le code Java orchestre le flux. Le LLM ne fait que le routing des décisions complexes. Pas de boîte noire sur des systèmes critiques à 300M d'abonnés.

Outils disponibles dès aujourd'hui : **Spring AI** et **LangChain4j**.

> 📎 *Annexe 06 — Startup Performance Optimizer : workflow agentique Java + LLM*

---

## Ce qu'on peut en retenir pour nos missions

**Generational ZGC** — Java 21+, disponible maintenant. Argument clé en revue d'archi : réduction des retry storms, pas seulement des pauses GC.

**Virtual Threads** — JDK 25 règle le pinning. Mais `micrometer-context-propagation` reste nécessaire. À tester, pas à activer à l'aveugle.

**Test Slices** — Arrêter de tout passer par `@SpringBootTest`. `@WebMvcTest`, `@DataJpaTest`, c'est plus rapide et plus ciblé.

**GraphQL / DGS** — Fort couplage front-back sur votre mission ? Le framework DGS mérite d'être connu. Open-source, Spring Boot natif.

**OpenRewrite** — Pour les migrations de dépendances à grande échelle. L'outil de référence à avoir dans sa boîte à outils de consultant.

---

## 🔗 Ressources

📹 [How Netflix Uses Java — 2026 Edition](https://www.youtube.com/watch?v=ucJTPda_zx0)
📦 [Framework DGS — Netflix OSS](https://netflix.github.io/dgs/)
🔧 [OpenRewrite](https://docs.openrewrite.org/)
🌱 [Spring AI](https://spring.io/projects/spring-ai)
☕ [LangChain4j](https://github.com/langchain4j/langchain4j)

---

Merci pour la lecture — si vous êtes arrivés jusqu'ici, n'hésitez pas à donner votre avis ou à partager votre expérience sur ces sujets. Vous avez déjà eu des retry storms liés au GC en prod ? Vous utilisez Virtual Threads sur du Spring Security ? Curieux d'avoir vos retours. 👇

*#Java #SpringBoot #JVM #Netflix #VirtualThreads #GraphQL #GenAI #SoftwareCommunity*

---
*Loïc ORTOLÉ — assisté par Claude (IA Anthropic) — 2026-04-20*