# 🌐 Guide de déploiement

> Déployez votre propre instance de Transaction Lab en production.

---

## Architecture de déploiement

```
GitHub (main)
  │
  ├── push → GitHub Actions CI
  │             ├── Tests backend (Maven)
  │             ├── Build frontend (ng build)
  │             └── Si OK →
  │
  ├── Frontend → Vercel (CDN mondial, HTTPS automatique)
  └── Backend  → Railway (conteneur Docker, autoscaling)
                   ├── PostgreSQL (Railway addon)
                   └── Kafka (Upstash — serverless Kafka)
```

---

## 1. Prérequis

- Compte [GitHub](https://github.com) avec le fork du repo
- Compte [Vercel](https://vercel.com) (gratuit)
- Compte [Railway](https://railway.app) (gratuit — 5$/mois après trial)
- Compte [Upstash](https://upstash.com) (gratuit — Kafka serverless)

---

## 2. Backend — Railway

### 2.1 Créer le projet Railway

1. Connectez-vous sur [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Sélectionnez `java-tech-lab`
4. Railway détecte automatiquement le `Dockerfile` dans `transaction-lab/backend/`

### 2.2 Ajouter PostgreSQL

Dans votre projet Railway :
1. **+ New** → **Database** → **Add PostgreSQL**
2. Railway génère automatiquement `DATABASE_URL`

### 2.3 Configurer Upstash Kafka

1. Créez un compte sur [console.upstash.com](https://console.upstash.com)
2. **Create Kafka Cluster** → région la plus proche
3. Créez les topics manuellement (ou laissez `auto.create.topics.enable=true`) :
   - `commande-creee`
   - `articles-reserves`
   - `paiement-effectue`
   - `articles-indisponibles`
   - `paiement-echoue`
   - `articles-liberes`
4. Récupérez les credentials dans **Details** → **REST API**

### 2.4 Variables d'environnement Railway

Dans Railway → votre service → **Variables** :

| Variable | Valeur | Source |
|----------|--------|--------|
| `SPRING_PROFILES_ACTIVE` | `prod` | Manuel |
| `DATABASE_URL` | `jdbc:postgresql://...` | Railway PostgreSQL addon |
| `DATABASE_USER` | `...` | Railway PostgreSQL addon |
| `DATABASE_PASSWORD` | `...` | Railway PostgreSQL addon |
| `KAFKA_URL` | `...upstash.io:9092` | Upstash |
| `KAFKA_USERNAME` | `...` | Upstash |
| `KAFKA_PASSWORD` | `...` | Upstash |

> 💡 Railway injecte automatiquement les variables du PostgreSQL addon.
> Copiez leur valeur dans les variables correspondantes de votre service.

### 2.5 Dockerfile backend

Créez `transaction-lab/backend/Dockerfile` :

```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/transaction-lab-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", \
  "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:prod}", \
  "-jar", "app.jar"]
```

### 2.6 Vérifier le déploiement

Railway fournit une URL publique : `https://transaction-lab-xxx.railway.app`

Testez : `https://transaction-lab-xxx.railway.app/actuator/health`

---

## 3. Frontend — Vercel

### 3.1 Déployer

```bash
npm install -g vercel
cd transaction-lab/frontend
vercel --prod
```

Ou via l'interface Vercel :
1. **Import Project** → GitHub repo
2. Root directory : `transaction-lab/frontend`
3. Build command : `ng build --configuration production`
4. Output directory : `dist/frontend/browser`

### 3.2 Variable d'environnement Frontend

Dans Vercel → votre projet → **Settings** → **Environment Variables** :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://transaction-lab-xxx.railway.app` |

Et dans `src/environments/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://transaction-lab-xxx.railway.app'
};
```

### 3.3 vercel.json (SPA routing)

Créez `transaction-lab/frontend/vercel.json` :

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 4. CI/CD — GitHub Actions

Le fichier `.github/workflows/ci.yml` dans le repo gère :
- Tests backend à chaque push
- Build frontend à chaque push
- Déploiement auto sur `main` uniquement

### Variables GitHub Secrets à configurer

Dans GitHub → votre repo → **Settings** → **Secrets** :

| Secret | Valeur |
|--------|--------|
| `RAILWAY_TOKEN` | Votre token Railway API |
| `VERCEL_TOKEN` | Votre token Vercel |
| `VERCEL_ORG_ID` | Visible dans Vercel settings |
| `VERCEL_PROJECT_ID` | Visible dans Vercel settings |

---

## 5. Limites en mode démo publique

La démo publique désactive certaines fonctionnalités destructrices :

| Fonctionnalité | Local | Demo publique |
|----------------|-------|---------------|
| Rollback ACID | ✅ | ✅ |
| Simulation partition CAP | ✅ | ✅ (état en mémoire, reset à chaque démarrage) |
| SAGA flux nominal | ✅ | ✅ |
| SAGA flux compensation | ✅ | ✅ |
| Kafka UI | ✅ localhost:8090 | ❌ (non exposé publiquement) |
| Benchmark concurrent | ✅ | ⚠️ limité à 5 threads |
| Reset données | ✅ | ✅ (endpoint `/api/demo/reset`) |

---

## 6. Commandes utiles

```bash
# Rebuild le backend
cd backend && ./mvnw clean package -DskipTests

# Build le frontend pour prod
cd frontend && ng build --configuration production

# Vérifier la santé de l'API Railway
curl https://transaction-lab-xxx.railway.app/actuator/health

# Reset les données de démo (recharge init.sql)
curl -X POST https://transaction-lab-xxx.railway.app/api/demo/reset
```
