"""Respaldo con IA (Claude) para los campos que las reglas no logran extraer.

Es un modelo HÍBRIDO: primero se aplican las expresiones regulares (gratis y
local); solo si quedan campos vacíos se consulta a Claude con el texto del
correo + PDF. Así el costo y el envío de datos a la nube son mínimos.

Requiere el SDK oficial de Anthropic (`pip install anthropic`) y una clave en
la variable de entorno ANTHROPIC_API_KEY.
"""

from __future__ import annotations

import json
import os
from typing import Any

from .dates import normalize_date
from .extractor import compute_notes
from .models import BLRecord

# Descripción de cada campo para orientar al modelo.
FIELD_HINTS = {
    "customer": "Nombre de la empresa cliente/remitente (p. ej. La Minita, PCT LLC, TCS LLC, Cafe Capris).",
    "bl_nr": "Número de BL (Bill of Lading), normalmente un código alfanumérico de naviera.",
    "etd": "Fecha estimada de embarque/salida (ETD).",
    "eta": "Fecha estimada de arribo/desembarque (ETA).",
    "internal_reference": "Número de pedido/referencia interna del cliente (prefijos como GF, P5, P-, S).",
}
DATE_FIELDS = {"etd", "eta"}


def ai_enabled(cfg: dict[str, Any]) -> bool:
    return bool(cfg.get("ai", {}).get("enabled", False))


def ai_available(cfg: dict[str, Any]) -> tuple[bool, str]:
    """Comprueba que el respaldo con IA se puede usar. Devuelve (ok, motivo)."""
    if not ai_enabled(cfg):
        return False, "ai.enabled = false en config.yaml"
    try:
        import anthropic  # noqa: F401
    except ImportError:
        return False, "falta el paquete 'anthropic' (pip install anthropic)"
    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        return False, "no hay ANTHROPIC_API_KEY en el entorno"
    return True, ""


def _missing_fields(record: BLRecord, fields: list[str]) -> list[str]:
    return [f for f in fields if not str(record.get(f) or "").strip()]


def _schema(fields: list[str]) -> dict[str, Any]:
    props = {f: {"type": "string"} for f in fields}
    return {
        "type": "object",
        "properties": props,
        "required": fields,
        "additionalProperties": False,
    }


def _ask_claude(client: Any, model: str, text: str, fields: list[str]) -> dict[str, Any]:
    field_lines = "\n".join(f"- {f}: {FIELD_HINTS.get(f, f)}" for f in fields)
    system = (
        "Eres un asistente que extrae datos de correos de logística (facturas, BLs, pedidos). "
        "Devuelve SOLO los campos pedidos. Si un dato no aparece, usa cadena vacía. "
        "Las fechas en formato DD.MM.YY."
    )
    prompt = (
        f"Extrae estos campos del correo:\n{field_lines}\n\n"
        f"--- CORREO ---\n{text}\n--- FIN ---"
    )
    resp = client.messages.create(
        model=model,
        max_tokens=1024,
        system=system,
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": _schema(fields)}},
        messages=[{"role": "user", "content": prompt}],
    )
    if getattr(resp, "stop_reason", None) == "refusal":
        return {}
    text_out = next((b.text for b in resp.content if getattr(b, "type", "") == "text"), "")
    try:
        return json.loads(text_out)
    except (json.JSONDecodeError, TypeError):
        return {}


def apply_ai_fallback(records: list[BLRecord], cfg: dict[str, Any]) -> dict[str, int]:
    """Rellena con Claude los campos vacíos de cada registro. Muta records.

    Devuelve {'consultados': n, 'campos_completados': m}.
    """
    ok, reason = ai_available(cfg)
    if not ok:
        return {"consultados": 0, "campos_completados": 0, "motivo": reason}

    import anthropic

    ai_cfg = cfg.get("ai", {})
    model = ai_cfg.get("model", "claude-opus-5")
    fields = ai_cfg.get("fallback_fields", ["customer", "bl_nr", "etd", "eta", "internal_reference"])
    max_chars = int(ai_cfg.get("max_chars", 6000))
    fmt = cfg.get("output", {}).get("date_format", "%d.%m.%y")

    client = anthropic.Anthropic()
    consulted = 0
    filled = 0

    for rec in records:
        missing = _missing_fields(rec, fields)
        if not missing:
            continue
        consulted += 1
        text = rec.email.searchable.strip()[:max_chars]
        try:
            data = _ask_claude(client, model, text, missing)
        except Exception:  # noqa: BLE001 - la IA es un respaldo; nunca debe romper el run
            continue

        changed = False
        for field in missing:
            value = str(data.get(field, "") or "").strip()
            if not value:
                continue
            if field in DATE_FIELDS:
                value = normalize_date(value, fmt) or value
            rec.values[field] = value
            filled += 1
            changed = True

        if changed:
            rec.values["notes"] = compute_notes(rec.values, cfg, ai_used=True)

    return {"consultados": consulted, "campos_completados": filled, "motivo": ""}
