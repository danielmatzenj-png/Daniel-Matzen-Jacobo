"""Extracción de campos de facturas/pedidos a partir del texto del correo.

Todo se controla desde config.yaml['fields']: cada campo declara una lista de
expresiones regulares y, opcionalmente, un tipo ('amount', 'date', 'text') y un
origen alternativo ('sender', 'sender_email', 'sender_domain', 'date').
"""

from __future__ import annotations

import re
from typing import Any

from .models import EmailMessage, ExtractedRow


def parse_amount(text: str) -> float | str:
    """Convierte '1.234,56 €' o '$1,234.56' en un float. Devuelve '' si no puede."""
    if text is None:
        return ""
    cleaned = re.sub(r"[^\d.,]", "", str(text)).strip()
    if not cleaned:
        return ""

    has_dot = "." in cleaned
    has_comma = "," in cleaned
    if has_dot and has_comma:
        # El separador decimal es el último signo que aparece.
        if cleaned.rfind(",") > cleaned.rfind("."):
            # Formato europeo: 1.234,56
            cleaned = cleaned.replace(".", "").replace(",", ".")
        else:
            # Formato anglosajón: 1,234.56
            cleaned = cleaned.replace(",", "")
    elif has_comma:
        # Solo coma: decide si es decimal (1234,56) o de miles (1,234)
        if re.search(r",\d{3}$", cleaned) and cleaned.count(",") == 1 and len(cleaned.split(",")[0]) <= 3:
            cleaned = cleaned.replace(",", ".")
        else:
            cleaned = cleaned.replace(",", ".")
    # Solo punto -> ya es válido como decimal.

    try:
        return round(float(cleaned), 2)
    except ValueError:
        return ""


def _source_value(email: EmailMessage, source: str) -> str:
    return {
        "sender": email.sender_name,
        "sender_email": email.sender_email,
        "sender_domain": email.sender_domain,
        "date": email.date,
        "subject": email.subject,
    }.get(source, "")


def _extract_field(email: EmailMessage, spec: dict[str, Any]) -> Any:
    text = email.searchable
    field_type = str(spec.get("type", "text")).lower()

    value: Any = ""
    for pattern in spec.get("patterns", []) or []:
        match = re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE)
        if match:
            value = match.group(1).strip() if match.groups() else match.group(0).strip()
            break

    # Origen alternativo cuando ninguna expresión coincide.
    if not value and spec.get("from"):
        value = _source_value(email, str(spec["from"]))

    if not value:
        return ""

    if field_type == "amount":
        return parse_amount(value)
    if field_type == "date":
        return str(value).strip()
    return str(value).strip()


def extract_row(email: EmailMessage, fields: dict[str, Any]) -> ExtractedRow:
    """Aplica todos los campos configurados a un correo."""
    extracted: dict[str, Any] = {}
    for name, spec in fields.items():
        spec = spec or {}
        extracted[name] = _extract_field(email, spec)
    return ExtractedRow(email=email, fields=extracted)


def passes_filters(email: EmailMessage, filters: dict[str, Any]) -> bool:
    """Filtra correos por remitente, asunto y rango de fechas (config['filters'])."""
    if not filters:
        return True

    sender_contains = filters.get("sender_contains")
    if sender_contains:
        if str(sender_contains).lower() not in email.sender.lower():
            return False

    subject_contains = filters.get("subject_contains")
    if subject_contains:
        needles = subject_contains if isinstance(subject_contains, list) else [subject_contains]
        haystack = email.subject.lower()
        if not any(str(n).lower() in haystack for n in needles):
            return False

    require_terms = filters.get("body_contains")
    if require_terms:
        needles = require_terms if isinstance(require_terms, list) else [require_terms]
        haystack = email.searchable.lower()
        if not any(str(n).lower() in haystack for n in needles):
            return False

    date_from = filters.get("date_from")
    date_to = filters.get("date_to")
    if (date_from or date_to) and email.date:
        day = email.date[:10]  # "YYYY-MM-DD"
        if date_from and day < str(date_from):
            return False
        if date_to and day > str(date_to):
            return False

    return True


def extract_all(
    emails: list[EmailMessage],
    fields: dict[str, Any],
    filters: dict[str, Any] | None = None,
) -> list[ExtractedRow]:
    """Filtra y extrae todos los correos que cumplan los filtros."""
    rows: list[ExtractedRow] = []
    for email in emails:
        if passes_filters(email, filters or {}):
            rows.append(extract_row(email, fields))
    return rows
