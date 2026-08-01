"""Escritura de las filas extraídas a un archivo Excel (.xlsx).

Si el archivo ya existe, añade solo las filas nuevas (deduplicación por número de
factura o, en su defecto, por fecha+remitente+asunto), de forma que la
automatización se pueda ejecutar repetidamente sin duplicar datos.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from .models import ExtractedRow

# Columnas de metadatos que siempre preceden a los campos extraídos.
META_COLUMNS = ["fecha_correo", "remitente", "correo_remitente", "asunto"]

# Clave técnica oculta que usamos para deduplicar entre ejecuciones.
KEY_COLUMN = "_clave"


def _headers(field_order: list[str]) -> list[str]:
    return META_COLUMNS + list(field_order) + [KEY_COLUMN]


def _existing_keys(ws: Any, headers: list[str]) -> set[str]:
    if KEY_COLUMN not in headers:
        return set()
    key_idx = headers.index(KEY_COLUMN) + 1
    keys: set[str] = set()
    for row in ws.iter_rows(min_row=2, min_col=key_idx, max_col=key_idx, values_only=True):
        if row and row[0]:
            keys.add(str(row[0]))
    return keys


def _style_header(ws: Any, ncols: int) -> None:
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="2F5496")
    for col in range(1, ncols + 1):
        cell = ws.cell(row=1, column=col)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(vertical="center")
    ws.freeze_panes = "A2"


def _autosize(ws: Any, headers: list[str]) -> None:
    for idx, name in enumerate(headers, start=1):
        if name == KEY_COLUMN:
            ws.column_dimensions[get_column_letter(idx)].hidden = True
            continue
        max_len = len(str(name))
        for row in ws.iter_rows(min_row=2, min_col=idx, max_col=idx, values_only=True):
            if row and row[0] is not None:
                max_len = max(max_len, len(str(row[0])))
        ws.column_dimensions[get_column_letter(idx)].width = min(max_len + 2, 60)


def write_rows(
    rows: list[ExtractedRow],
    output_path: str | Path,
    field_order: list[str],
    sheet_name: str = "Facturas",
) -> dict[str, int]:
    """Escribe/actualiza el Excel. Devuelve un resumen {'nuevas', 'omitidas', 'total'}."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    headers = _headers(field_order)

    if path.exists():
        wb = load_workbook(path)
        ws = wb[sheet_name] if sheet_name in wb.sheetnames else wb.active
        file_headers = [c.value for c in ws[1]] if ws.max_row >= 1 else []
        if file_headers != headers:
            # Estructura de columnas distinta: no arriesgamos, empezamos hoja nueva.
            wb = Workbook()
            ws = wb.active
            ws.title = sheet_name
            ws.append(headers)
            file_headers = headers
        existing = _existing_keys(ws, file_headers)
    else:
        wb = Workbook()
        ws = wb.active
        ws.title = sheet_name
        ws.append(headers)
        existing = set()

    added = 0
    skipped = 0
    for row in rows:
        key = row.dedupe_key()
        if key in existing:
            skipped += 1
            continue
        record = row.as_record(field_order)
        values = [record.get(col, "") for col in META_COLUMNS + field_order] + [key]
        ws.append(values)
        existing.add(key)
        added += 1

    _style_header(ws, len(headers))
    _autosize(ws, headers)
    wb.save(path)

    return {"nuevas": added, "omitidas": skipped, "total": ws.max_row - 1}
