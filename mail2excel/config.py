"""Carga y validación de la configuración (config.yaml)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml

DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config.yaml"


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
