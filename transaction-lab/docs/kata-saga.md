# 🔴 Kata SAGA — Guide complet

> **Scénario** : commande e-commerce en 4 étapes.
> Vous allez observer un flux distribué, implémenter une compensation manquante,
> et rendre le système résilient aux doublons.

---

## Avant de commencer

### Prérequis spécifiques SAGA

Kafka doit être en route :

```bash
docker compose up -d
docker compose ps   # kafka doit être "healthy"
```

Ouvrez **Kafka UI** dans un autre onglet : `http://localhost:8090`

> Kafka UI est votre tableau de bord tout au long de ce kata.
> Gardez-le ouvert — vous verrez les messages transiter en temps réel.

### Lancer le backend

```bash
cd backend && ./mvnw spring-boot:run
```

---

## Rappel de l'architecture

```
Client
  │
  ▼
POST /api/saga/orders          ← point d'entrée
  │
  ▼
[OrderService] → topic: commande-creee
                        │
                        ▼
              [InventoryHandler] → topic: articles-reserves
                                          │
                                          ▼
                                [PaymentHandler] → topic: paiement-effectue
                                                          │
                                                          ▼
                                                [NotificationHandler] ✅
```

**En cas d'échec paiement :**
```
[PaymentHandler] → topic: paiement-echoue
                          │
                          ▼
              [InventoryHandler] ← COMPENSATION — libère le stock
                          │
                          ▼
                  topic: articles-liberes
                          │
                          ▼
              [OrderHandler] ← COMPENSATION — annule la commande
```

---

## 🟢 Niveau Junior — Suivre le flux (20 min)

### Objectif

Comprendre la SAGA chorégraphiée en observant les événements dans Kafka UI.

### Étape 1 — Flux nominal (tout se passe bien)

Via l'UI → onglet **SAGA** → **Nouvelle commande** :
- Produit : `PROD-001` (Laptop Pro 16")
- Quantité : 1
- Montant : **500€**

Observez dans **Kafka UI** (`http://localhost:8090`) :

| Topic | Message attendu |
|-------|----------------|
| `commande-creee` | `{"sagaId": "...", "productId": "PROD-001", ...}` |
| `articles-reserves` | Le stock a été réservé |
| `paiement-effectue` | Le paiement a été accepté |

Résultat dans l'UI : commande **CONFIRMÉE** ✅

### Étape 2 — Flux de compensation (paiement échoue)

Nouvelle commande avec montant **10 000€** (> 9999€ → paiement refusé automatiquement).

Observez dans Kafka UI :

| Topic | Message attendu |
|-------|----------------|
| `commande-creee` | ✅ publié |
| `articles-reserves` | ✅ publié (stock réservé) |
| `paiement-echoue` | ✅ publié |
| `articles-liberes` | ❌ **manquant !** — c'est le bug du kata confirmé |

Résultat : la commande reste en `COMPENSATION_IN_PROGRESS` indéfiniment.
Le stock est bloqué. C'est exactement ce que vous allez corriger au niveau suivant.

### Ce que vous avez observé

> Sans compensation implémentée, une SAGA incomplète **fuit des ressources**.
> Le stock est réservé mais jamais libéré — et personne ne s'en aperçoit.

---

## 🟡 Niveau Confirmé — Implémenter la compensation (1h)

### Le bug

Ouvrez `KataSagaHandler.java` → méthode `onPaiementEchoue`.
Elle est vide. Sans elle, le stock reste réservé indéfiniment.

### TODO 1 — Implémenter la compensation inventaire

```java
@KafkaListener(topics = SagaTopics.PAIEMENT_ECHOUE, groupId = "kata-inventory-compensation")
@Transactional
public void onPaiementEchoue(PaiementEchoueEvent event, Acknowledgment ack) {
    // 1. Charger l'inventaire avec un verrou pessimiste
    var inventory = inventoryRepository.findByIdWithLock(event.productId()).orElseThrow();

    // 2. Libérer le stock réservé
    inventory.release(event.quantity());
    inventoryRepository.save(inventory);

    // 3. Publier l'événement de compensation
    kafka.send(SagaTopics.ARTICLES_LIBERES,
               event.sagaId().toString(),
               new ArticlesLiberesEvent(event.sagaId(), event.orderId(), event.reason()));

    // 4. Acquitter le message
    ack.acknowledge();
}
```

### Tester votre implémentation

1. Relancez le backend
2. Refaites une commande avec montant > 9999€
3. Vérifiez dans Kafka UI que `articles-liberes` est maintenant publié
4. Vérifiez dans l'UI que la commande passe en `CANCELLED`
5. Vérifiez que le stock est revenu à sa valeur initiale

### Question de réflexion

> **Et si la compensation elle-même échoue ?**
> Que se passe-t-il si `inventoryRepository.save(inventory)` lève une exception ?
> Le message `paiement-echoue` n'est pas acquitté → Kafka le rejoue dans 10 secondes.
> Mais si l'exception est permanente (DB down), le message ira en **DLQ** après N retries.
> C'est exactement ce que vous allez configurer au niveau senior.

### Vérification

```bash
./mvnw test -Dtest=SagaKataConfirmeTest
```

---

## 🔴 Niveau Senior — Idempotence + DLQ + Bonus Outbox (2h)

### Contexte

En production, Kafka peut rejouer des messages dans plusieurs situations :
- Redémarrage d'un consumer avant le commit
- Rebalancing de partitions
- Timeout réseau

Sans idempotence, ces rejeux produisent des **doublons** : stock libéré deux fois,
email envoyé deux fois, etc.

### TODO 2 — Implémenter l'idempotence

Dans `KataSagaHandler.isAlreadyProcessed()` :

```java
private boolean isAlreadyProcessed(String eventId, String topic) {
    if (processedEventRepository.existsById(eventId)) {
        log.debug("[SAGA] ⏭️  Événement {} déjà traité sur {} — skip", eventId, topic);
        return true;
    }
    return false;
}
```

Et appelez-la en début de chaque handler :

```java
public void onPaiementEchoue(PaiementEchoueEvent event, Acknowledgment ack) {
    if (isAlreadyProcessed(event.eventId(), SagaTopics.PAIEMENT_ECHOUE)) {
        ack.acknowledge();
        return;
    }
    // ... suite du handler
    processedEventRepository.save(new ProcessedEvent(event.eventId(), SagaTopics.PAIEMENT_ECHOUE));
    ack.acknowledge();
}
```

### Tester l'idempotence

Via Kafka UI → sélectionnez un message déjà traité → **Republish** (ou produce manuellement).
Le handler doit logger "déjà traité" et ne rien faire.

### TODO 3 — Configurer la DLQ

Ajoutez dans `application.yml` :

```yaml
spring:
  kafka:
    listener:
      ack-mode: MANUAL_IMMEDIATE
```

Créez `KafkaConfig.java` :

```java
@Configuration
public class KafkaConfig {

    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<?, ?> template) {
        // Dead Letter Publishing : après 3 échecs, envoyer dans <topic>.DLT
        var recoverer = new DeadLetterPublishingRecoverer(template);

        // Back-off : 1 retry immédiat, puis 2 tentatives avec 5 secondes d'attente
        var backOff = new FixedBackOff(5000L, 2L);

        return new DefaultErrorHandler(recoverer, backOff);
    }
}
```

Testez : injectez une exception dans un handler, vérifiez le topic `*.DLT` dans Kafka UI.

### 🎁 Bonus — Outbox Pattern

**Le problème** : que se passe-t-il si le service plante entre le `save()` en base
et le `kafka.send()` ? La transaction DB est committée mais l'événement Kafka n'est
jamais publié → la SAGA est bloquée sans bruit.

**La solution** : l'Outbox Pattern.

```
[Handler]
  ├── save(order)          ─┐
  └── save(OutboxEvent)    ─┘  dans la même transaction DB

[OutboxPoller] (tâche schedulée)
  ├── SELECT * FROM outbox WHERE published = false
  ├── kafka.send(event)
  └── UPDATE outbox SET published = true
```

Implémentez une table `outbox` et un `@Scheduled` qui poll toutes les secondes.

---

## 🔍 Corrigé

```
backend/src/main/java/com/klanik/transactionlab/saga/kata/solution/
├── SolutionSagaHandler.java      ← compensation + idempotence
└── SolutionKafkaConfig.java      ← DLQ configurée
```

---

## 📖 Pour aller plus loin

- [Pattern SAGA — Microsoft Architecture Center](https://learn.microsoft.com/fr-fr/azure/architecture/patterns/saga)
- [Outbox Pattern — Chris Richardson](https://microservices.io/patterns/data/transactional-outbox.html)
- [Kafka Consumer Idempotency — Confluent Docs](https://docs.confluent.io/kafka/design/delivery-semantics.html)
- [Article ACID vs SAGA — Loïc ORTOLÉ](https://klanik.viva.biz/article/acid-vs-saga)
