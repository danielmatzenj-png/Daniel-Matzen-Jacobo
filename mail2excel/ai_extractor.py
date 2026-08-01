"""Extracción con IA usando Groq (modelos Llama, API compatible con OpenAI).

Modos (config.yaml → ai.mode):
  - "always"   : la IA se consulta en CADA correo y sus valores mandan; las
                 reglas quedan como red de seguridad para lo que la IA deje vacío.
  - "fallback" : las reglas mandan y la IA solo rellena los campos que falten.

Requiere el SDK de Groq (`pip install groq`) y una clave en la variable de
entorno GROQ_API_KEY (gratis en https://console.groq.com).
"""

from __future__ import annotations

import json
import os
from typing import Any

from .dates import normalize_date
from .extractor import compute_notes
from .models import BLRecord

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
    """Comprueba que la IA (Groq) se puede usar. Devuelve (ok, motivo)."""
    if not ai_enabled(cfg):
        return False, "ai.enabled = false en config.yaml"
    try:
        import groq  # noqa: F401
    except ImportError:
        return False, "falta el paquete 'groq' (pip install groq)"
    if not os.environ.get("GROQ_API_KEY"):
        return False, "no hay GROQ_API_KEY en el entorno"
    return True, ""


def _empty(record: BLRecord, field: str) -> bool:
    return not str(record.get(field) or "").strip()


def _ask_model(client: Any, model: str, text: str, fields: list[str]) -> dict[str, Any]:
    field_lines = "\n".join(f'- "{f}": {FIELD_HINTS.get(f, f)}' for f in fields)
    system = (
        "Eres un asistente que extrae datos de correos de logística (facturas, BLs, pedidos). "
        "Respondes SOLO con un objeto JSON con las claves pedidas. "
        "Si un dato no aparece, usa cadena vacía. Las fechas en formato DD.MM.YY."
    )
    prompt = (
        f"Extrae estos campos y devuélvelos como JSON:\n{field_lines}\n\n"
        f"--- CORREO ---\n{text}\n--- FIN ---"
    )
    messages = [{"role": "system", "content": system}, {"role": "user", "content": prompt}]
    kwargs = dict(model=model, messages=messages, temperature=0, max_tokens=1024)
    try:
        resp = client.chat.completions.create(response_format={"type": "json_object"}, **kwargs)
    except Exception:  # noqa: BLE001 - algunos modelos no soportan response_format
        resp = client.chat.completions.create(**kwargs)
    content = resp.choices[0].message.content or ""
    try:
        return json.loads(content)
    except (json.JSONDecodeError, TypeError):
        # Rescata el primer bloque {...} si el modelo añadió texto alrededor.
        start, end = content.find("{"), content.rfind("}")
        if 0 <= start < end:
            try:
                return json.loads(content[start : end + 1])
            except json.JSONDecodeError:
                return {}
        return {}


def apply_ai_fallback(records: list[BLRecord], cfg: dict[str, Any]) -> dict[str, int]:
    """Aplica la IA (Groq) a los registros. Muta records.

    Devuelve {'consultados': n, 'campos_completados': m, 'motivo': str}.
    """
    ok, reason = ai_available(cfg)
    if not ok:
        return {"consultados": 0, "campos_completados": 0, "motivo": reason}

    import groq

    ai_cfg = cfg.get("ai", {})
    model = ai_cfg.get("model", "llama-3.3-70b-versatile")
    mode = ai_cfg.get("mode", "always")
    fields = ai_cfg.get("fallback_fields", ["customer", "bl_nr", "etd", "eta", "internal_reference"])
    max_chars = int(ai_cfg.get("max_chars", 6000))
    fmt = cfg.get("output", {}).get("date_format", "%d.%m.%y")

    client = groq.Groq()
    consulted = 0
    filled = 0

    for rec in records:
        if mode == "fallback":
            ask = [f for f in fields if _empty(rec, f)]
        else:  # "always": la IA revisa todos los campos configurados
            ask = list(fields)
        if not ask:
            continue

        consulted += 1
        text = rec.email.searchable.strip()[:max_chars]
        try:
            data = _ask_model(client, model, text, ask)
        except Exception:  # noqa: BLE001 - la IA nunca debe romper el run
            continue

        changed = False
        for field in ask:
            value = str(data.get(field, "") or "").strip()
            if not value:
                continue
            if field in DATE_FIELDS:
                value = normalize_date(value, fmt) or value
            # En "fallback" solo rellena vacíos; en "always" la IA manda.
            if mode == "fallback" and not _empty(rec, field):
                continue
            if str(rec.get(field) or "") != value:
                rec.values[field] = value
                filled += 1
                changed = True

        if changed:
            rec.values["notes"] = compute_notes(rec.values, cfg, ai_used=True)

    return {"consultados": consulted, "campos_completados": filled, "motivo": ""}
