#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/backend"

echo ""
echo "Netflix Java 2026 - Backend"
echo "================================"
echo "Java : $(java -version 2>&1 | head -1)"
echo "URL  : http://localhost:8083"
echo "================================"
echo ""

./mvnw spring-boot:run
