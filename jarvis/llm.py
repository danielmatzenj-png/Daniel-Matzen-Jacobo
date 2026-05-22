"""Clientes LLM: OllamaClient (servidor local) y LlamaCppClient (GGUF directo).

Ambos exponen la misma interfaz chat()/ensure_model() para que agent.py
funcione sin cambios independientemente del backend elegido.
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
            with requests.post(
                f"{self.host}/api/pull",
                json={"name": self.model},
                stream=True,
                timeout=None,
            ) as r:
                for _ in r.iter_lines():
                    pass


class LlamaCppClient:
    """Corre modelos GGUF directamente en Python — sin Ollama ni ningún servidor.

    Requiere: pip install llama-cpp-python
    Modelos:  descarga un .gguf con scripts/download_model.py
    """

    def __init__(
        self,
        model_path: str,
        temperature: float = 0.2,
        num_ctx: int = 4096,
        n_gpu_layers: int = 0,
        chat_format: str | None = None,
    ):
        import os
        from pathlib import Path

        path = Path(os.path.expanduser(model_path)).resolve()
        if not path.exists():
            raise FileNotFoundError(
                f"\nModelo GGUF no encontrado: {path}\n"
                "Descárgalo ejecutando:\n"
                "  python scripts/download_model.py\n"
            )

        from llama_cpp import Llama

        print(f"[llm] Cargando {path.name} (puede tardar unos segundos)...", flush=True)
        init_kwargs: dict[str, Any] = {
            "model_path": str(path),
            "n_ctx": num_ctx,
            "n_gpu_layers": n_gpu_layers,
            "verbose": False,
        }
        if chat_format:
            init_kwargs["chat_format"] = chat_format

        self._llm = Llama(**init_kwargs)
        self.temperature = temperature

    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        kwargs: dict[str, Any] = {
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": -1,
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = self._llm.create_chat_completion(**kwargs)
        choice = response["choices"][0]["message"]

        # Convierte formato OpenAI → Ollama para que agent.py funcione sin cambios
        result: dict[str, Any] = {
            "message": {
                "content": choice.get("content") or "",
                "tool_calls": [],
            }
        }
        for tc in (choice.get("tool_calls") or []):
            fn = tc.get("function", {})
            args = fn.get("arguments", {})
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except json.JSONDecodeError:
                    args = {}
            result["message"]["tool_calls"].append(
                {"function": {"name": fn.get("name", ""), "arguments": args}}
            )

        return result

    def ensure_model(self) -> None:
        pass  # El modelo ya fue cargado en __init__
