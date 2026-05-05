#!/usr/bin/env bash
# deploy.sh — copie les 3 onglets dans le bon dossier
# Usage : ./deploy.sh depuis ~/java-tech-lab/netflix-java-2026/frontend

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TABS_DIR="$SCRIPT_DIR/src/tabs"

# Vérification
if [[ ! -d "$TABS_DIR" ]]; then
  echo "❌ Dossier src/tabs introuvable — lance ce script depuis le dossier frontend/"
  exit 1
fi

echo "📦 Déploiement des onglets..."

for f in TestSlicesTab.jsx VirtualThreadsTab.jsx ZgcTab.jsx; do
  if [[ -f "$SCRIPT_DIR/$f" ]]; then
    mv "$SCRIPT_DIR/$f" "$TABS_DIR/$f"
    echo "  ✓ $f → src/tabs/"
  else
    echo "  ⚠️  $f introuvable à la racine — skip"
  fi
done

# Nettoyage zip si présent
rm -f "$SCRIPT_DIR/files.zip" "$SCRIPT_DIR/files.zip:Zone.Identifier"

echo ""
echo "✅ Déploiement terminé"
tree "$SCRIPT_DIR/src" -L 2
