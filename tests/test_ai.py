"""Pruebas del respaldo con IA (sin llamadas reales a la red)."""

from __future__ import annotations

import copy

from mail2excel.ai_extractor import ai_available, apply_ai_fallback
from mail2excel.config import load_config
from mail2excel.extractor import classify_all
from mail2excel.mail_reader import read_from_json


def test_ai_disabled_is_noop():
    cfg = load_config()
    cfg["ai"]["enabled"] = False
    records = classify_all(read_from_json("tests/sample_emails.json"), cfg)
    before = copy.deepcopy([r.values for r in records])

    result = apply_ai_fallback(records, cfg)
    assert result["consultados"] == 0
    assert result["campos_completados"] == 0
    assert result["motivo"]  # explica por qué no se usó
    assert [r.values for r in records] == before  # no se modificó nada


def test_ai_unavailable_without_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_AUTH_TOKEN", raising=False)
    cfg = load_config()
    cfg["ai"]["enabled"] = True

    ok, reason = ai_available(cfg)
    assert ok is False
    assert reason  # motivo no vacío (falta paquete o clave)


def test_ai_merges_missing_fields(monkeypatch):
    """Simula la respuesta de Claude y verifica el merge + notas."""
    cfg = load_config()
    cfg["ai"]["enabled"] = True
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")

    # Un correo de La Minita sin BL en el texto.
    from mail2excel.extractor import classify
    from mail2excel.models import EmailMessage

    email = EmailMessage(
        date="2026-07-31 09:00:00",
        sender="La Minita <ops@laminita.com>",
        subject="Carga",
        body="Referencia interna GF29026. Sin más datos en el cuerpo.",
    )
    rec = classify(email, cfg)
    assert rec.get("bl_nr") == ""
    assert "no hay BL" in rec.get("notes")

    # Falsea el cliente Anthropic y la extracción de la IA.
    import mail2excel.ai_extractor as aix

    def fake_ask(client, model, text, fields):
        return {"bl_nr": "HLCULI3260999", "etd": "04.08.26", "eta": "25.08.26"}

    monkeypatch.setattr(aix, "_ask_claude", fake_ask)
    monkeypatch.setattr(aix.anthropic if hasattr(aix, "anthropic") else aix, "Anthropic", lambda: object(), raising=False)

    # Fuerza el import interno usando un stub de módulo anthropic.
    import sys
    import types

    stub = types.ModuleType("anthropic")
    stub.Anthropic = lambda: object()
    monkeypatch.setitem(sys.modules, "anthropic", stub)

    result = apply_ai_fallback([rec], cfg)
    assert result["campos_completados"] == 3
    assert rec.get("bl_nr") == "HLCULI3260999"
    assert rec.get("etd") == "04.08.26"
    assert "completado con IA" in rec.get("notes")
    assert "no hay BL" not in rec.get("notes")
