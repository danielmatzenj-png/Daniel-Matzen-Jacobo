"""Pruebas de escritura a la tabla BLs, deduplicación y resumen."""

from __future__ import annotations

from openpyxl import Workbook, load_workbook

from mail2excel.config import load_config
from mail2excel.excel_writer import write_records
from mail2excel.extractor import classify_all
from mail2excel.mail_reader import read_from_json
from mail2excel.summary import build_summary, read_rows


def _records_and_cfg():
    cfg = load_config()
    emails = read_from_json("tests/sample_emails.json")
    return classify_all(emails, cfg), cfg


def test_write_creates_file_with_exact_headers(tmp_path):
    records, cfg = _records_and_cfg()
    out = tmp_path / "Tabla BLs.xlsx"
    headers = cfg["output"]["headers"]

    summary = write_records(records, out, headers, sheet_name="Sheet1")
    assert out.exists()
    assert summary["nuevas"] == len(records)

    wb = load_workbook(out)
    ws = wb["Sheet1"]
    assert [c.value for c in ws[1]] == headers


def test_rerun_deduplicates(tmp_path):
    records, cfg = _records_and_cfg()
    out = tmp_path / "Tabla BLs.xlsx"
    headers = cfg["output"]["headers"]

    write_records(records, out, headers, sheet_name="Sheet1")
    second = write_records(records, out, headers, sheet_name="Sheet1")
    assert second["nuevas"] == 0
    assert second["omitidas"] == len(records)


def test_appends_to_existing_user_table(tmp_path):
    # Simula el archivo real del usuario con encabezados y una fila previa.
    records, cfg = _records_and_cfg()
    headers = cfg["output"]["headers"]
    out = tmp_path / "Tabla BLs.xlsx"

    wb = Workbook()
    ws = wb.active
    ws.title = "Sheet1"
    ws.append(headers)
    ws.append(["PEND", "28.07.26", "Cafe Capris", "HLCUSJ2260", "14.07.26", "", "", "S21054", ""])
    wb.save(out)

    summary = write_records(records, out, headers, sheet_name="Sheet1")
    # La fila previa se conserva y las nuevas se añaden debajo.
    assert summary["total"] == 1 + len(records)
    wb2 = load_workbook(out)
    ws2 = wb2["Sheet1"]
    assert ws2.cell(row=2, column=3).value == "Cafe Capris"


def test_daily_summary(tmp_path):
    records, cfg = _records_and_cfg()
    out = tmp_path / "Tabla BLs.xlsx"
    headers = cfg["output"]["headers"]
    write_records(records, out, headers, sheet_name="Sheet1")

    rows = read_rows(out, "Sheet1")
    _, body = build_summary(rows, "29.07.26")
    assert "La Minita" in body
    assert "MEDUM8183896" in body
    # El día 29 hay una fila de TCS con ETA rara pero sin anomalía de BL.
    assert "Total de correos registrados hoy: 2" in body
