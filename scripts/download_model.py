"""Descarga un modelo GGUF desde HuggingFace para el backend llamacpp.

Uso:
    python scripts/download_model.py           # menú interactivo
    python scripts/download_model.py --model 1 # descarga sin preguntar
"""
from __future__ import annotations

import argparse
import sys
import urllib.request
from pathlib import Path

# Modelos recomendados (todos de licencia abierta, sin login en HuggingFace)
CATALOG: dict[str, dict] = {
    "1": {
        "name": "Qwen2.5-1.5B  — mínimo (~1.6 GB, funciona con 4 GB RAM)",
        "url": "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q8_0.gguf",
        "file": "qwen2.5-1.5b-instruct-q8_0.gguf",
        "config_hint": "model_path: \"models/qwen2.5-1.5b-instruct-q8_0.gguf\"",
    },
    "2": {
        "name": "Qwen2.5-3B    — equilibrado (~2 GB, recomendado)",
        "url": "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf",
        "file": "qwen2.5-3b-instruct-q4_k_m.gguf",
        "config_hint": "model_path: \"models/qwen2.5-3b-instruct-q4_k_m.gguf\"",
    },
    "3": {
        "name": "Phi-3.5-mini   — alta calidad (~2.2 GB, mejor razonamiento)",
        "url": "https://huggingface.co/microsoft/Phi-3.5-mini-instruct-gguf/resolve/main/Phi-3.5-mini-instruct-q4.gguf",
        "file": "Phi-3.5-mini-instruct-q4.gguf",
        "config_hint": "model_path: \"models/Phi-3.5-mini-instruct-q4.gguf\"",
    },
}

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


def _progress(count: int, block: int, total: int) -> None:
    if total <= 0:
        return
    pct = min(count * block / total * 100, 100)
    done = int(pct / 2)
    bar = "#" * done + "-" * (50 - done)
    mb_done = count * block / 1_000_000
    mb_total = total / 1_000_000
    print(f"\r  [{bar}] {pct:5.1f}%  {mb_done:.0f}/{mb_total:.0f} MB", end="", flush=True)


def download(entry: dict) -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    dest = MODELS_DIR / entry["file"]

    if dest.exists():
        print(f"\n[descarga] Ya existe: {dest}")
        print("  Borralo manualmente si quieres volver a descargarlo.")
        return

    print(f"\n[descarga] {entry['name']}")
    print(f"  Destino : {dest}")
    print(f"  URL     : {entry['url']}")
    print("  Descargando...")

    try:
        urllib.request.urlretrieve(entry["url"], dest, reporthook=_progress)
    except Exception as e:
        if dest.exists():
            dest.unlink()
        print(f"\n[error] Descarga fallida: {e}")
        sys.exit(1)

    print(f"\n\n[ok] Modelo guardado en: {dest}")
    print("\nPasos siguientes:")
    print("  1. Abre config.yaml y cambia:")
    print("       backend: \"llamacpp\"")
    print(f"       {entry['config_hint']}")
    print("  2. Ejecuta: .\\scripts\\run.ps1 --text")


def main() -> None:
    parser = argparse.ArgumentParser(description="Descarga un modelo GGUF")
    parser.add_argument("--model", choices=list(CATALOG), help="Número de modelo (1/2/3)")
    args = parser.parse_args()

    print("=" * 60)
    print("  Descargador de modelos GGUF para Jarvis (sin Ollama)")
    print("=" * 60)
    print("\nModelos disponibles:\n")
    for key, entry in CATALOG.items():
        print(f"  {key}) {entry['name']}")

    choice = args.model
    if not choice:
        print()
        choice = input("Elige un modelo [1/2/3]: ").strip()

    if choice not in CATALOG:
        print("[error] Opción no válida.")
        sys.exit(1)

    download(CATALOG[choice])


if __name__ == "__main__":
    main()
