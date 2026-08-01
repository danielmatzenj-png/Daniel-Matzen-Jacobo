"""Escritura de las filas clasificadas a la tabla BLs (.xlsx).

Respeta las columnas EXACTAS del archivo existente y añade solo filas nuevas
(deduplicación por BL / referencia / día+cliente), para poder correr la
automatización varias veces al día sin duplicar datos ni tocar tu estructura.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter

from .models import BLRecord, record_key

# Cabecera de la tabla (texto en el Excel) -> clave interna.
HEADER_TO_KEY = {
    "status": "status",
    "day": "day",
    "customer": "customer",
    "bl nr": "bl_nr",
    "bl number": "bl_nr",
    "etd": "etd",
    "eta": "eta",
    "pcd": "pcd",
    "internal reference nr": "internal_reference",
    "internal reference": "internal_reference",
    "internal ref": "internal_reference",
    "notes": "notes",
}


def _header_map(headers: list[str]) -> dict[str, str]:
    """Mapa cabecera_del_excel -> clave interna."""
    return {h: HEADER_TO_KEY.get(str(h).strip().lower(), "") for h in headers}


def _existing_keys(ws: Any, headers: list[str], header_to_key: dict[str, str]) -> set[str]:
    """Reconstruye las claves de deduplicación de las filas ya presentes."""
    idx = {header_to_key.get(h, ""): i for i, h in enumerate(headers)}
    keys: set[str] = set()
    for row in ws.iter_rows(min_row=2, values_only=True):
        if row is None or all(c is None for c in row):
            continue

        def cell(key: str) -> Any:
            pos = idx.get(key)
            return row[pos] if pos is not None and pos < len(row) else None

        keys.add(record_key(cell("bl_nr"), cell("internal_reference"), cell("day"), cell("customer")))
    return keys


def _style(ws: Any, headers: list[str]) -> None:
    for col in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col)
        cell.font = Font(bold=True)
        cell.alignment = Alignment(vertical="center")
    ws.freeze_panes = "A2"
    for idx, name in enumerate(headers, start=1):
        width = len(str(name))
        for row in ws.iter_rows(min_row=2, min_col=idx, max_col=idx, values_only=True):
            if row and row[0] is not None:
                width = max(width, len(str(row[0])))
        ws.column_dimensions[get_column_letter(idx)].width = min(width + 2, 45)


def write_records(
    records: list[BLRecord],
    output_path: str | Path,
    headers: list[str],
    sheet_name: str = "Sheet1",
) -> dict[str, Any]:
    """Escribe/actualiza la tabla. Devuelve resumen y las filas realmente añadidas."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    header_to_key = _header_map(headers)

    if path.exists():
        wb = load_workbook(path)
        ws = wb[sheet_name] if sheet_name in wb.sheetnames else wb.active
        file_headers = [c.value for c in ws[1]] if ws.max_row >= 1 else []
        if not file_headers or all(h is None for h in file_headers):
            for c, h in enumerate(headers, start=1):
                ws.cell(row=1, column=c, value=h)
            file_headers = headers
        headers = [str(h) if h is not None else "" for h in file_headers]
        header_to_key = _header_map(headers)
        existing = _existing_keys(ws, headers, header_to_key)
    else:
        wb = Workbook()
        ws = wb.active
        ws.title = sheet_name
        ws.append(headers)
        existing = set()

    added_records: list[BLRecord] = []
    skipped = 0
    for rec in records:
        key = rec.dedupe_key()
        if key in existing:
            skipped += 1
            continue
        ws.append(rec.row(headers, header_to_key))
        existing.add(key)
        added_records.append(rec)

    _style(ws, headers)
    wb.save(path)

    return {
        "nuevas": len(added_records),
        "omitidas": skipped,
        "total": ws.max_row - 1,
        "added_records": added_records,
    }
