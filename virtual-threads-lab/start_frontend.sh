#!/usr/bin/env bash
# start_frontend.sh — Lance le frontend Angular du virtual-threads-lab
# Usage : ./start_frontend.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "❌ Dossier frontend/ introuvable dans $SCRIPT_DIR"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "📦 node_modules absent — installation des dépendances..."
  cd "$FRONTEND_DIR"
  npm install
fi

cd "$FRONTEND_DIR"

echo ""
echo "🥷 Virtual Threads Lab — Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 URL    : http://localhost:4200"
echo "🔗 API    : http://localhost:8080 (backend requis)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ng serve --open
