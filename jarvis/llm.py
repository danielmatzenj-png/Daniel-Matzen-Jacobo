"""Cliente HTTP para un servidor Ollama local.

Usa el endpoint /api/chat con soporte de "tools" para function calling.
"""
from __future__ import annotations

import json
from typing import Any

import requests


class OllamaClient:
    def __init__(
        self,
        host: str = "http://localhost:11434",
        model: str = "llama3.1",
        temperature: float = 0.2,
        num_ctx: int = 8192,
    ):
        self.host = host.rstrip("/")
        self.model = model
        self.temperature = temperature
        self.num_ctx = num_ctx

    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": self.temperature,
                "num_ctx": self.num_ctx,
            },
        }
        if tools:
            payload["tools"] = tools

        response = requests.post(
            f"{self.host}/api/chat",
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"},
            timeout=300,
        )
        response.raise_for_status()
        return response.json()

    def ensure_model(self) -> None:
        """Comprueba que el modelo esté disponible; si no, lo descarga."""
        try:
            r = requests.get(f"{self.host}/api/tags", timeout=10)
            r.raise_for_status()
            tags = {m["name"] for m in r.json().get("models", [])}
        except Exception:
            return
        if not any(t.startswith(self.model) for t in tags):
            # Solicita pull en streaming para que Ollama lo descargue.
            with requests.post(
                f"{self.host}/api/pull",
                json={"name": self.model},
                stream=True,
                timeout=None,
            ) as r:
                for _ in r.iter_lines():
                    pass
