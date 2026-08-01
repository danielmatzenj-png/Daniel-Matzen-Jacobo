#!/usr/bin/env bash
# Ejecuta la automatización mail2excel.
# Uso: ./scripts/run.sh [argumentos extra para 'python -m mail2excel run']
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -d ".venv" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

exec python -m mail2excel run "$@"
