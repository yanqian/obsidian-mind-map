#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "== Harness verification =="
"$ROOT_DIR/.agent-harness/scripts/init.sh" "$@"

echo "== Node dependency recovery =="
if [[ -d node_modules ]]; then
  npm install --prefer-offline --no-audit --no-fund
else
  npm ci --no-audit --no-fund
fi

echo "== Plugin typecheck, tests, and production build =="
npm run verify

echo "== Plugin recovery passed =="
