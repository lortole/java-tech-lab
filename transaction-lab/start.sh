#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Transaction Lab — Démarrage tout-en-un
# Usage : ./start.sh [--no-frontend]
# ─────────────────────────────────────────────────────────────
set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "${BLUE}[txlab]${NC} $1"; }
ok()    { echo -e "${GREEN}[txlab]${NC} ✅ $1"; }
warn()  { echo -e "${YELLOW}[txlab]${NC} ⚠️  $1"; }
error() { echo -e "${RED}[txlab]${NC} ❌ $1"; exit 1; }

# ── Vérifications ─────────────────────────────────────────────
command -v java    &>/dev/null || error "Java 21 requis (java -version)"
command -v docker  &>/dev/null || error "Docker requis"
command -v node    &>/dev/null || warn  "Node.js non trouvé — frontend non démarré"

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | grep -o '"[0-9]*' | head -1 | tr -d '"')
[[ $JAVA_VERSION -ge 21 ]] || error "Java 21 minimum requis (trouvé : Java $JAVA_VERSION)"

# ── Infrastructure ─────────────────────────────────────────────
log "Démarrage de l'infrastructure Docker..."
docker compose up -d

log "Attente que Kafka soit prêt..."
RETRIES=30
while ! docker compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list &>/dev/null; do
    RETRIES=$((RETRIES - 1))
    [[ $RETRIES -eq 0 ]] && error "Kafka n'a pas démarré dans les temps"
    sleep 2
done
ok "Kafka prêt"

log "Attente que PostgreSQL soit prêt..."
RETRIES=20
while ! docker compose exec postgresql pg_isready -U txlab &>/dev/null; do
    RETRIES=$((RETRIES - 1))
    [[ $RETRIES -eq 0 ]] && error "PostgreSQL n'a pas démarré dans les temps"
    sleep 2
done
ok "PostgreSQL prêt"

# ── Backend ────────────────────────────────────────────────────
log "Démarrage du backend Spring Boot..."
cd backend
./mvnw spring-boot:run -q &
BACKEND_PID=$!
cd ..

log "Attente que le backend soit prêt..."
RETRIES=30
while ! curl -sf http://localhost:8081/actuator/health &>/dev/null; do
    RETRIES=$((RETRIES - 1))
    [[ $RETRIES -eq 0 ]] && error "Le backend n'a pas démarré"
    sleep 3
done
ok "Backend prêt — http://localhost:8081"
ok "Swagger UI — http://localhost:8081/swagger-ui.html"

# ── Frontend ───────────────────────────────────────────────────
if [[ "${1:-}" != "--no-frontend" ]] && command -v node &>/dev/null; then
    log "Démarrage du frontend Angular..."
    cd frontend
    [[ -d node_modules ]] || npm install -q
    npx ng serve &>/dev/null &
    cd ..
    ok "Frontend — http://localhost:4200"
fi

# ── Résumé ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Transaction Lab — Prêt ! 🚀           ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  App       : http://localhost:4200            ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  API       : http://localhost:8081            ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Swagger   : http://localhost:8081/swagger-ui ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Kafka UI  : http://localhost:8090            ${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
log "Ctrl+C pour arrêter"

# Attendre et propager le signal
trap "docker compose down; kill $BACKEND_PID 2>/dev/null; exit 0" INT TERM
wait
