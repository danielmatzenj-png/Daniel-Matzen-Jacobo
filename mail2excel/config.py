"""Carga y validación de la configuración (config.yaml)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = PROJECT_ROOT / "config.yaml"


def load_env(path: str | os.PathLike[str] | None = None) -> None:
    """Carga variables de un archivo .env local (p. ej. GROQ_API_KEY).

    El archivo .env está en .gitignore: NUNCA se sube al repositorio. Las
    variables ya presentes en el entorno tienen prioridad.
    """
    env_path = Path(path) if path else PROJECT_ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def _expand(path: str) -> str:
    return os.path.expanduser(os.path.expandvars(path))


def load_config(path: str | os.PathLike[str] | None = None) -> dict[str, Any]:
    """Lee config.yaml y devuelve un dict. Expande '~' en las rutas."""
    cfg_path = Path(path) if path else DEFAULT_CONFIG_PATH
    if not cfg_path.exists():
        raise FileNotFoundError(f"No se encontró el archivo de configuración: {cfg_path}")

    with open(cfg_path, "r", encoding="utf-8") as fh:
        cfg = yaml.safe_load(fh) or {}

    # Normaliza rutas de salida.
    output = cfg.setdefault("output", {})
    if "path" in output:
        output["path"] = _expand(output["path"])

    cfg.setdefault("source", {})
    cfg.setdefault("filters", {})
    cfg.setdefault("fields", {})
    return cfg


def field_order(cfg: dict[str, Any]) -> list[str]:
    """Orden de los campos extraídos, según aparecen en config.yaml['fields']."""
    return list(cfg.get("fields", {}).keys())
