"""Pruebas de la extracción de campos."""

from __future__ import annotations

from mail2excel.config import field_order, load_config
from mail2excel.extractor import extract_all, parse_amount
from mail2excel.mail_reader import read_from_json
from mail2excel.models import EmailMessage


def test_parse_amount_european():
    assert parse_amount("1.200,00") == 1200.00
    assert parse_amount("1.452,00 EUR") == 1452.00
    assert parse_amount("252,00") == 252.00


def test_parse_amount_us():
    assert parse_amount("$89.99") == 89.99
    assert parse_amount("1,234.56") == 1234.56
    assert parse_amount("48.40") == 48.40


def test_parse_amount_invalid():
    assert parse_amount("") == ""
    assert parse_amount("sin importe") == ""


def test_sender_parsing():
    m = EmailMessage(sender="Proveedor Norte SA <facturacion@proveedornorte.com>")
    assert m.sender_name == "Proveedor Norte SA"
    assert m.sender_email == "facturacion@proveedornorte.com"
    assert m.sender_domain == "proveedornorte.com"


def test_extract_invoice_spanish():
    cfg = load_config()
    emails = read_from_json("tests/sample_emails.json")
    rows = extract_all(emails, fields=cfg["fields"], filters=cfg["filters"])

    # El correo de marketing debe quedar fuera por el filtro de asunto.
    subjects = [r.email.subject for r in rows]
    assert not any("Ofertas de verano" in s for s in subjects)
    assert len(rows) == 3

    invoice = next(r for r in rows if "F-2026-0481" in r.email.subject)
    fields = invoice.fields
    assert fields["numero_factura"] == "F-2026-0481"
    assert fields["proveedor"] == "Proveedor Norte SA"
    assert fields["base_imponible"] == 1200.00
    assert fields["iva"] == 252.00
    assert fields["total"] == 1452.00
    assert fields["moneda"] in ("EUR", "€")


def test_extract_invoice_english():
    cfg = load_config()
    emails = read_from_json("tests/sample_emails.json")
    rows = extract_all(emails, fields=cfg["fields"], filters=cfg["filters"])

    inv = next(r for r in rows if "INV-99812" in r.email.subject)
    assert inv.fields["numero_factura"] == "INV-99812"
    assert inv.fields["total"] == 48.40


def test_field_order_matches_config():
    cfg = load_config()
    order = field_order(cfg)
    assert order[0] == "proveedor"
    assert "total" in order
