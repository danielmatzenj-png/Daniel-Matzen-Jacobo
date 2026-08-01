"""Clasificación de un correo (+ su PDF) en una fila de la tabla BLs."""

from __future__ import annotations

import re
from typing import Any

from .dates import email_date_to, normalize_date
from .models import BLRecord, EmailMessage


def detect_customer(email: EmailMessage, customers: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Identifica al cliente según remitente/asunto/cuerpo."""
    haystack = f"{email.sender}\n{email.searchable}".lower()
    for cust in customers:
        for needle in cust.get("match", []):
            if str(needle).lower() in haystack:
                return cust
    return None


def extract_bl(text: str, bl_cfg: dict[str, Any]) -> str:
    """Extrae el número de BL: primero por etiqueta, luego por prefijo de naviera."""
    # 1) Etiqueta explícita: "BL Nr: HLCUSJ2260", "Bill of Lading HLCU..."
    for label in bl_cfg.get("labels", []):
        pattern = rf"{label}\s*[:#\-]?\s*([A-Z]{{2,4}}[A-Z0-9]{{5,14}}|\d{{6,14}})"
        m = re.search(pattern, text, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip().upper()

    # 2) Prefijo de naviera (SCAC) seguido de dígitos/alfanumérico.
    prefixes = bl_cfg.get("carrier_prefixes", [])
    if prefixes:
        min_len = int(bl_cfg.get("min_len", 6))
        max_len = int(bl_cfg.get("max_len", 14))
        alt = "|".join(re.escape(p) for p in prefixes)
        pattern = rf"\b((?:{alt})[A-Z0-9]{{{min_len},{max_len}}})\b"
        m = re.search(pattern, text, flags=re.IGNORECASE)
        if m:
            return m.group(1).strip().upper()

    return ""


def extract_reference(
    text: str,
    customer: dict[str, Any] | None,
    fallback_patterns: list[str],
) -> str:
    """Extrae el nº de referencia interno según el prefijo del cliente."""
    patterns: list[str] = []
    if customer and customer.get("reference_pattern"):
        patterns.append(customer["reference_pattern"])
    patterns.extend(fallback_patterns)

    for pattern in patterns:
        m = re.search(pattern, text, flags=re.IGNORECASE)
        if m:
            return re.sub(r"\s+", "", m.group(0).strip().upper())
    return ""


def _date_near_label(text: str, labels: list[str], fmt: str) -> str:
    """Busca una fecha en la misma línea/tramo que sigue a alguna etiqueta."""
    for label in labels:
        # Captura hasta ~40 caracteres tras la etiqueta y busca una fecha ahí.
        m = re.search(rf"{re.escape(label)}\s*[:#\-]?\s*(.{{0,40}})", text, flags=re.IGNORECASE)
        if m:
            found = normalize_date(m.group(1), fmt)
            if found:
                return found
    return ""


def classify(email: EmailMessage, cfg: dict[str, Any]) -> BLRecord:
    """Convierte un correo en una fila lista para la tabla BLs."""
    text = email.searchable
    fmt = cfg.get("output", {}).get("date_format", "%d.%m.%y")

    customers = cfg.get("customers", [])
    customer = detect_customer(email, customers)
    customer_name = customer["name"] if customer else email.sender_name

    bl_nr = extract_bl(text, cfg.get("bl", {}))
    reference = extract_reference(text, customer, cfg.get("reference_fallback_patterns", []))

    dates_cfg = cfg.get("dates", {})
    etd = _date_near_label(text, dates_cfg.get("etd_labels", []), fmt)
    eta = _date_near_label(text, dates_cfg.get("eta_labels", []), fmt)

    values = {
        "status": cfg.get("status_value", "PEND"),
        "day": email_date_to(fmt, email.date),
        "customer": customer_name,
        "bl_nr": bl_nr,
        "etd": etd,
        "eta": eta,
        "pcd": "",                       # siempre vacío por indicación
        "internal_reference": reference,
        "notes": "",
    }
    values["notes"] = compute_notes(values, cfg)
    return BLRecord(email=email, values=values)


def compute_notes(values: dict[str, Any], cfg: dict[str, Any], ai_used: bool = False) -> str:
    """Genera la columna Notes a partir de los valores finales de la fila."""
    notes: list[str] = []
    if not values.get("bl_nr"):
        notes.append("no hay BL")
    if not values.get("internal_reference"):
        notes.append("falta referencia interna")
    known = {c.get("name") for c in cfg.get("customers", [])}
    if values.get("customer") not in known:
        notes.append("cliente no reconocido")
    if ai_used:
        notes.append("completado con IA")
    return "; ".join(notes)


def passes_filters(email: EmailMessage, filters: dict[str, Any]) -> bool:
    """Filtro opcional por remitente, asunto, cuerpo y rango de fechas."""
    if not filters:
        return True

    sender_contains = filters.get("sender_contains")
    if sender_contains and str(sender_contains).lower() not in email.sender.lower():
        return False

    subject_contains = filters.get("subject_contains")
    if subject_contains:
        needles = subject_contains if isinstance(subject_contains, list) else [subject_contains]
        if not any(str(n).lower() in email.subject.lower() for n in needles):
            return False

    body_contains = filters.get("body_contains")
    if body_contains:
        needles = body_contains if isinstance(body_contains, list) else [body_contains]
        if not any(str(n).lower() in email.searchable.lower() for n in needles):
            return False

    date_from = filters.get("date_from")
    date_to = filters.get("date_to")
    if (date_from or date_to) and email.date:
        day = email.date[:10]
        if date_from and day < str(date_from):
            return False
        if date_to and day > str(date_to):
            return False

    return True


def classify_all(emails: list[EmailMessage], cfg: dict[str, Any]) -> list[BLRecord]:
    """Filtra y clasifica todos los correos."""
    filters = cfg.get("filters", {})
    return [classify(e, cfg) for e in emails if passes_filters(e, filters)]
