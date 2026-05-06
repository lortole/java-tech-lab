#!/usr/bin/env bash
# start_backend.sh — Lance le backend Spring Boot du virtual-threads-lab
# Usage : ./start_backend.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "⚡ Virtual Threads Lab — Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Java   : $(java -version 2>&1 | head -1)"
echo "📍 Port   : http://localhost:8080"
echo "🔗 API    : http://localhost:8080/api/info"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./mvnw spring-boot:run \
  -Dspring-boot.run.jvmArguments="--enable-preview -Djdk.tracePinnedThreads=short"
