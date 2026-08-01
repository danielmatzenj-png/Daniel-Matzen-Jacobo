"""Normalización de fechas a un formato uniforme (por defecto DD.MM.YY)."""

from __future__ import annotations

import re
from datetime import datetime

# Meses en inglés y español (abreviados y completos) -> número.
_MONTHS = {
    "jan": 1, "january": 1, "ene": 1, "enero": 1,
    "feb": 2, "february": 2, "febrero": 2,
    "mar": 3, "march": 3, "marzo": 3,
    "apr": 4, "april": 4, "abr": 4, "abril": 4,
    "may": 5, "mayo": 5,
    "jun": 6, "june": 6, "junio": 6,
    "jul": 7, "july": 7, "julio": 7,
    "aug": 8, "august": 8, "ago": 8, "agosto": 8,
    "sep": 9, "sept": 9, "september": 9, "septiembre": 9, "setiembre": 9,
    "oct": 10, "october": 10, "octubre": 10,
    "nov": 11, "november": 11, "noviembre": 11,
    "dec": 12, "december": 12, "dic": 12, "diciembre": 12,
}

# Patrones de fecha reconocidos dentro de un texto.
_NUMERIC = re.compile(r"\b(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b")
_TEXT_DMY = re.compile(
    r"\b(\d{1,2})\s*(?:de\s*)?([A-Za-zÁÉÍÓÚáéíóú]{3,12})\.?\s*(?:de\s*)?[,\s]\s*(\d{2,4})\b"
)
_TEXT_MDY = re.compile(
    r"\b([A-Za-zÁÉÍÓÚáéíóú]{3,12})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})\b"
)


def _norm_year(y: int) -> int:
    return 2000 + y if y < 100 else y


def _make(day: int, month: int, year: int, fmt: str) -> str | None:
    try:
        return datetime(_norm_year(year), month, day).strftime(fmt)
    except ValueError:
        return None


def normalize_date(text: str, fmt: str = "%d.%m.%y") -> str:
    """Encuentra la primera fecha en `text` y la devuelve en `fmt`. '' si no hay."""
    if not text:
        return ""

    # 1) Formato numérico dd/mm/yyyy, yyyy-mm-dd, dd.mm.yy…
    m = _NUMERIC.search(text)
    if m:
        a, b, c = (int(g) for g in m.groups())
        if a > 31:  # yyyy-mm-dd
            out = _make(c, b, a, fmt)
        else:       # dd-mm-yyyy (europeo/latam por defecto)
            out = _make(a, b, c, fmt)
        if out:
            return out

    # 2) "14 Aug 2026" / "14 de agosto de 2026"
    m = _TEXT_DMY.search(text)
    if m:
        day = int(m.group(1))
        month = _MONTHS.get(m.group(2).lower())
        year = int(m.group(3))
        if month:
            out = _make(day, month, year, fmt)
            if out:
                return out

    # 3) "August 14, 2026"
    m = _TEXT_MDY.search(text)
    if m:
        month = _MONTHS.get(m.group(1).lower())
        day = int(m.group(2))
        year = int(m.group(3))
        if month:
            out = _make(day, month, year, fmt)
            if out:
                return out

    return ""


def email_date_to(fmt: str, iso: str) -> str:
    """Convierte la fecha del correo ('YYYY-MM-DD HH:MM:SS') al formato `fmt`."""
    iso = (iso or "").strip()
    if not iso:
        return ""
    for pattern in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(iso[: len(pattern) + 2].strip(), pattern).strftime(fmt)
        except ValueError:
            continue
    # Último recurso: buscar una fecha dentro del texto.
    return normalize_date(iso, fmt)
