"""Pruebas del motor de IA con Groq (sin llamadas reales a la red)."""

from __future__ import annotations

import copy

from mail2excel.ai_extractor import ai_available, apply_ai_fallback
from mail2excel.config import load_config
from mail2excel.extractor import classify, classify_all
from mail2excel.mail_reader import read_from_json
from mail2excel.models import EmailMessage


def test_ai_disabled_is_noop():
    cfg = load_config()
    cfg["ai"]["enabled"] = False
    records = classify_all(read_from_json("tests/sample_emails.json"), cfg)
    before = copy.deepcopy([r.values for r in records])

    result = apply_ai_fallback(records, cfg)
    assert result["consultados"] == 0
    assert result["campos_completados"] == 0
    assert result["motivo"]
    assert [r.values for r in records] == before


def test_ai_unavailable_without_key(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    cfg = load_config()
    cfg["ai"]["enabled"] = True
    ok, reason = ai_available(cfg)
    assert ok is False
    assert reason


def _install_fake_groq(monkeypatch, extracted: dict):
    """Instala un módulo 'groq' falso cuyo cliente devuelve `extracted`."""
    import sys
    import types

    class _Msg:
        def __init__(self, content):
            self.message = types.SimpleNamespace(content=content)

    class _Completions:
        def create(self, **kwargs):
            import json as _json

            return types.SimpleNamespace(choices=[_Msg(_json.dumps(extracted))])

    class _Client:
        def __init__(self, *a, **k):
            self.chat = types.SimpleNamespace(completions=_Completions())

    stub = types.ModuleType("groq")
    stub.Groq = _Client
    monkeypatch.setitem(sys.modules, "groq", stub)
    monkeypatch.setenv("GROQ_API_KEY", "test-key")


def test_ai_fallback_fills_missing(monkeypatch):
    cfg = load_config()
    cfg["ai"].update({"enabled": True, "mode": "fallback"})
    _install_fake_groq(monkeypatch, {"bl_nr": "HLCULI3260999", "etd": "04.08.26", "eta": "25.08.26"})

    email = EmailMessage(
        date="2026-07-31 09:00:00",
        sender="La Minita <ops@laminita.com>",
        subject="Carga",
        body="Referencia interna GF29026. Sin BL en el cuerpo.",
    )
    rec = classify(email, cfg)
    assert rec.get("bl_nr") == ""

    result = apply_ai_fallback([rec], cfg)
    assert result["campos_completados"] == 3
    assert rec.get("bl_nr") == "HLCULI3260999"
    assert rec.get("etd") == "04.08.26"
    assert "completado con IA" in rec.get("notes")
    assert "no hay BL" not in rec.get("notes")


def test_ai_always_overrides(monkeypatch):
    cfg = load_config()
    cfg["ai"].update({"enabled": True, "mode": "always"})
    _install_fake_groq(monkeypatch, {"customer": "La Minita", "bl_nr": "NEWBL123456", "internal_reference": "GF29026"})

    email = EmailMessage(
        date="2026-07-31 09:00:00",
        sender="La Minita <ops@laminita.com>",
        subject="Carga",
        body="BL Nr: MEDUM0000001  Ref GF29026",
    )
    rec = classify(email, cfg)
    assert rec.get("bl_nr") == "MEDUM0000001"  # valor de la regla

    apply_ai_fallback([rec], cfg)
    # En modo 'always' la IA manda: el BL se reemplaza por el de la IA.
    assert rec.get("bl_nr") == "NEWBL123456"
