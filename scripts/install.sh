#!/usr/bin/env bash
# Instalador para Linux y macOS.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[jarvis] Creando entorno virtual..."
python3 -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate

echo "[jarvis] Actualizando pip..."
pip install --upgrade pip wheel

echo "[jarvis] Instalando dependencias Python..."
pip install -r requirements.txt

# Dependencias del sistema sugeridas
OS="$(uname -s)"
if [[ "$OS" == "Linux" ]]; then
  echo "[jarvis] Verificando dependencias del sistema (Linux)..."
  for pkg in portaudio19-dev espeak ffmpeg xdg-utils xclip; do
    if ! dpkg -s "$pkg" >/dev/null 2>&1; then
      echo "  - Falta '$pkg'. Instálalo con: sudo apt install $pkg"
    fi
  done
fi
if [[ "$OS" == "Darwin" ]]; then
  echo "[jarvis] macOS: asegúrate de tener instalado 'portaudio' y 'ffmpeg' (brew install portaudio ffmpeg)."
fi

if ! command -v ollama >/dev/null 2>&1; then
  echo ""
  echo "[jarvis] AVISO: Ollama no está instalado."
  echo "         Instálalo desde https://ollama.com/download y luego ejecuta:"
  echo "           ollama pull llama3.1"
fi

echo ""
echo "[jarvis] Listo. Activa el entorno y ejecuta:"
echo "    source .venv/bin/activate"
echo "    python -m jarvis.main"
