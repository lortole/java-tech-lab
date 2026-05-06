#!/usr/bin/env bash
# start_frontend.sh - Lance le frontend React/Vite de netflix-java-2026
# Usage : ./start_frontend.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "ERREUR : Dossier frontend/ introuvable dans $SCRIPT_DIR"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "node_modules absent - installation des dependances..."
  cd "$FRONTEND_DIR"
  npm install
fi

cd "$FRONTEND_DIR"

echo ""
echo "Netflix Java 2026 - Frontend"
echo "================================"
echo "URL    : http://localhost:5173"
echo "================================"
echo ""

npm run dev
