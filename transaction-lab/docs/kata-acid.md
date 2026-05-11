# 🔵 Kata ACID — Guide complet

> **Scénario** : virement bancaire entre comptes.
> Vous allez casser des transactions — et les réparer.

---

## Avant de commencer

### Lancer l'environnement

```bash
# Depuis la racine du projet
docker compose up -d
cd backend && ./mvnw spring-boot:run
```

### Vérifier l'état initial

Ouvrez `http://localhost:4200` → onglet **ACID**.

Vous devriez voir trois comptes :
| Compte | Solde |
|--------|-------|
| Alice Martin | 1 000,00 € |
| Bob Dupont | 500,00 € |
| Chloé Bernard | 2 500,00 € |

---

## 🟢 Niveau Junior — Rollback en action (15 min)

### Objectif

Compléter `KataAcidService.transferWithRollback()` et observer qu'une exception
à mi-transaction annule **toutes** les opérations.

### Étape 1 — Ouvrir le kata

```
backend/src/main/java/com/klanik/transactionlab/acid/kata/KataAcidService.java
```

### Étape 2 — Compléter les TODO

Lisez les commentaires `TODO 1` et `TODO 2` dans le fichier.

> 💡 **Indice** : `@Transactional` sans paramètres = `READ_COMMITTED` + rollback
> automatique sur toute `RuntimeException` ou `Error`.

### Étape 3 — Tester via l'UI

1. Effectuez un virement Alice → Bob de **200€** avec `failAfterDebit = false`
   - Résultat attendu : Alice = 800€, Bob = 700€ ✅

2. Effectuez un virement Alice → Bob de **200€** avec `failAfterDebit = true`
   - Résultat attendu : Alice = 800€, Bob = 700€ (inchangé !) ✅
   - L'UI doit afficher l'erreur et les soldes inchangés

### Étape 4 — Observer dans les logs

```bash
# Dans les logs du backend
[ACID] ✅ Débit effectué — solde Alice = 600€
[ACID] 💥 Erreur injectée après le débit — rollback automatique attendu
# Spring annule la transaction → le débit est annulé
```

### Ce que vous avez prouvé

> L'**Atomicité** garantit que le débit et le crédit sont **indivisibles**.
> Si l'une échoue, l'autre est annulée — impossible de débiter sans créditer.

### Vérification

```bash
cd backend && ./mvnw test -Dtest=AcidKataJuniorTest
```

---

## 🟡 Niveau Confirmé — Niveaux d'isolation (45 min)

### Contexte

Deux transactions s'exécutent en même temps sur le même compte.
Sans le bon niveau d'isolation, elles peuvent s'interférer.

### Problème à résoudre

**Scénario** : Alice a 1000€. Deux virements de 800€ partent simultanément.
Sans isolation correcte, les deux peuvent réussir — et le solde devient négatif.

### Étape 1 — Comprendre les niveaux

| Niveau | Dirty Read | Non-Repeatable Read | Phantom Read |
|--------|-----------|---------------------|--------------|
| `READ_UNCOMMITTED` | ✅ possible | ✅ possible | ✅ possible |
| `READ_COMMITTED` | ❌ protégé | ✅ possible | ✅ possible |
| `REPEATABLE_READ` | ❌ protégé | ❌ protégé | ✅ possible |
| `SERIALIZABLE` | ❌ protégé | ❌ protégé | ❌ protégé |

> Note : PostgreSQL traite `READ_UNCOMMITTED` comme `READ_COMMITTED`.

### Étape 2 — Compléter le TODO 3

Dans `KataAcidService.demonstrateDirtyRead()` :

```java
// Changez l'isolation pour observer les différences de comportement
@Transactional(isolation = Isolation.READ_COMMITTED)
// vs
@Transactional(isolation = Isolation.SERIALIZABLE)
```

### Étape 3 — Tester la race condition

Via l'UI, activez le mode "Test Concurrent" et lancez deux virements simultanés.
Observez avec `READ_COMMITTED` vs `SERIALIZABLE`.

Avec `SERIALIZABLE`, PostgreSQL retournera :
```
PSQLException: ERROR: could not serialize access due to concurrent update
```

C'est **voulu** — c'est le système qui protège la cohérence.

### Étape 4 — Comprendre la contrainte DB

Regardez `init.sql` :
```sql
CONSTRAINT balance_positive CHECK (balance >= 0)
```

Cette contrainte est le filet de sécurité côté base de données.
Même sans bonne isolation, la base refuse un solde négatif.
Mais elle lève une erreur tardive — mieux vaut prévenir avec l'isolation.

### Vérification

```bash
./mvnw test -Dtest=AcidKataConfirmeTest
```

---

## 🔴 Niveau Senior — Performance sous charge (1h30)

### Contexte

`SERIALIZABLE` protège parfaitement mais coûte cher en performance.
`READ_COMMITTED` est rapide mais peut nécessiter une logique applicative
supplémentaire (verrous pessimistes, optimistic locking).

### Étape 1 — Implémenter le TODO 4

`KataAcidService.transferConcurrent()` doit :
1. Utiliser `SERIALIZABLE`
2. Attraper `PSQLException` (code `40001` = serialization failure)
3. Retenter automatiquement (jusqu'à 3 fois avec back-off exponentiel)

### Étape 2 — Comparer avec l'Optimistic Locking

Observez l'entité `Account` :

```java
@Version
private Long version;   // champ dans la DB
```

Spring Data JPA utilise ce champ pour l'**optimistic locking** :
- À chaque `save()`, il vérifie que `version` n'a pas changé
- Si une autre transaction a modifié l'entité entre-temps → `OptimisticLockException`
- C'est plus léger que `SERIALIZABLE` pour les conflits rares

### Étape 3 — Benchmark

Utilisez l'endpoint de test de charge :

```bash
# Lancer 100 virements concurrents
curl -X POST http://localhost:8080/api/acid/benchmark \
  -H "Content-Type: application/json" \
  -d '{"threads": 10, "iterations": 10, "isolation": "SERIALIZABLE"}'
```

Comparez les métriques retournées :
- Temps total d'exécution
- Nombre d'erreurs de sérialisation
- Nombre de retries

### Ce que vous devez conclure

> Il n'y a pas de réponse universelle. Le bon niveau d'isolation dépend de :
> - La criticité de la donnée (solde bancaire vs compteur de vues)
> - La probabilité de conflit (comptes très actifs vs rarement accédés)
> - La tolérance aux erreurs et aux retries

### Vérification

```bash
./mvnw test -Dtest=AcidKataSeniorTest
```

---

## 🔍 Corrigé

La solution complète est dans :
```
backend/src/main/java/com/klanik/transactionlab/acid/kata/solution/SolutionAcidService.java
```

> ⚠️ Essayez d'abord ! Le corrigé a plus de valeur après avoir lutté.

---

## 📖 Pour aller plus loin

- [Spring Transaction Management — Reference Docs](https://docs.spring.io/spring-framework/reference/data-access/transaction.html)
- [PostgreSQL Isolation Levels](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Article ACID vs SAGA — Loïc ORTOLÉ](https://klanik.viva.biz/article/acid-vs-saga)
