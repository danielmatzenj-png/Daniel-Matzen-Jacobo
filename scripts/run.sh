#!/usr/bin/env bash
# Punto de entrada de mail2excel.
#   ./scripts/run.sh run        -> clasifica los correos nuevos en la tabla BLs
#   ./scripts/run.sh summary    -> envía el resumen diario
# Cualquier argumento extra se pasa a 'python -m mail2excel'.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -d ".venv" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

exec python -m mail2excel "$@"
