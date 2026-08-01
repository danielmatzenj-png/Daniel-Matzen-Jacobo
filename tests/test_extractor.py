"""Pruebas de la clasificación de correos en filas de la tabla BLs."""

from __future__ import annotations

from mail2excel.config import load_config
from mail2excel.dates import normalize_date
from mail2excel.extractor import classify_all, extract_bl, extract_reference
from mail2excel.mail_reader import read_from_json


def _records():
    cfg = load_config()
    emails = read_from_json("tests/sample_emails.json")
    return classify_all(emails, cfg), cfg


def test_normalize_date_formats():
    assert normalize_date("26.07.26") == "26.07.26"
    assert normalize_date("15/08/2026") == "15.08.26"
    assert normalize_date("2026-08-19") == "19.08.26"
    assert normalize_date("06 Aug 2026") == "06.08.26"
    assert normalize_date("sin fecha") == ""


def test_extract_bl_labeled_and_carrier():
    bl_cfg = load_config()["bl"]
    assert extract_bl("BL Nr: MEDUM8183896", bl_cfg) == "MEDUM8183896"
    assert extract_bl("carrier doc ONEYMNGG12345 attached", bl_cfg) == "ONEYMNGG12345"


def test_marketing_email_still_classified_but_flagged():
    records, _ = _records()
    # Sin filtro de asunto, el correo de marketing entra pero queda marcado.
    promo = next(r for r in records if "Ofertas" in r.email.subject)
    assert promo.get("bl_nr") == ""
    assert "no hay BL" in promo.get("notes")


def test_la_minita_full_row():
    records, _ = _records()
    rec = next(r for r in records if r.get("internal_reference") == "GF29723")
    assert rec.get("status") == "PEND"
    assert rec.get("customer") == "La Minita"
    assert rec.get("bl_nr") == "MEDUM8183896"
    assert rec.get("etd") == "26.07.26"
    assert rec.get("eta") == "22.08.26"
    assert rec.get("pcd") == ""
    assert rec.get("day") == "29.07.26"
    assert rec.get("notes") == ""


def test_tcs_reference_and_dates():
    records, _ = _records()
    rec = next(r for r in records if r.get("customer") == "TCS LLC")
    assert rec.get("internal_reference") == "P-8294"
    assert rec.get("bl_nr") == "MEDUE5324567"
    assert rec.get("etd") == "15.08.26"
    assert rec.get("eta") == "26.07.26"


def test_missing_bl_note():
    records, _ = _records()
    rec = next(r for r in records if r.get("internal_reference") == "GF29923")
    assert rec.get("bl_nr") == ""
    assert "no hay BL" in rec.get("notes")


def test_pct_reference():
    records, _ = _records()
    rec = next(r for r in records if r.get("customer") == "PCT LLC")
    assert rec.get("internal_reference") == "P51428"
    assert rec.get("bl_nr") == "ONEYMNGG12345"


def test_pdf_attachment_feeds_extraction():
    from mail2excel.extractor import classify
    from mail2excel.models import EmailMessage

    cfg = load_config()
    email = EmailMessage(
        date="2026-07-31 09:00:00",
        sender="La Minita <ops@laminita.com>",
        subject="Documentos",
        body="Ver el PDF adjunto.",
        attachment_text="BILL OF LADING\nBL Nr: HLCULI3260123\nInternal Ref GF29026\nETD 04.08.26  ETA 25.08.26",
    )
    rec = classify(email, cfg)
    assert rec.get("bl_nr") == "HLCULI3260123"
    assert rec.get("internal_reference") == "GF29026"
    assert rec.get("etd") == "04.08.26"
    assert rec.get("eta") == "25.08.26"
    assert rec.get("notes") == ""


def test_reference_prefix_selection():
    cfg = load_config()
    la_minita = next(c for c in cfg["customers"] if c["name"] == "La Minita")
    ref = extract_reference("Ref interna GF29871 gracias", la_minita, cfg["reference_fallback_patterns"])
    assert ref == "GF29871"
