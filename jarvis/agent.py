"""Bucle del agente: conecta LLM + herramientas y mantiene el contexto."""
from __future__ import annotations

import json
import platform
from typing import Any, Callable

from .llm import OllamaClient
from .tools import ToolRegistry


SYSTEM_PROMPT_TEMPLATE = """Eres {name}, un asistente de IA local que se ejecuta en la computadora del usuario.
Respondes en {language}. Tienes acceso a herramientas para leer y escribir archivos,
ejecutar comandos de shell, abrir aplicaciones, consultar información del sistema,
navegar por la web y usar el portapapeles.

Reglas:
- Cuando el usuario pida una acción concreta, usa las herramientas en lugar de inventar resultados.
- Antes de ejecutar operaciones destructivas (borrar, sobrescribir, matar procesos) avisa al usuario.
- Cuando una herramienta devuelva un error, explícalo con claridad y propón una alternativa.
- Da respuestas breves y concretas, pensadas para ser leídas en voz alta.
- Sistema operativo: {os}. Usuario: {user}.
"""


class Agent:
    def __init__(
        self,
        llm: OllamaClient,
        tools: ToolRegistry,
        name: str = "Jarvis",
        language: str = "es",
        max_iterations: int = 8,
        confirm_dangerous: bool = True,
        confirm_cb: Callable[[str, dict[str, Any]], bool] | None = None,
    ):
        self.llm = llm
        self.tools = tools
        self.max_iterations = max_iterations
        self.confirm_dangerous = confirm_dangerous
        self.confirm_cb = confirm_cb or (lambda _n, _a: True)

        import getpass

        system = SYSTEM_PROMPT_TEMPLATE.format(
            name=name,
            language="español" if language == "es" else language,
            os=f"{platform.system()} {platform.release()}",
            user=getpass.getuser(),
        )
        self._messages: list[dict[str, Any]] = [{"role": "system", "content": system}]

    def reset(self) -> None:
        self._messages = self._messages[:1]

    def ask(self, user_input: str) -> str:
        self._messages.append({"role": "user", "content": user_input})
        schemas = self.tools.schemas()

        for _ in range(self.max_iterations):
            response = self.llm.chat(self._messages, tools=schemas)
            msg = response.get("message", {}) or {}
            content = msg.get("content", "") or ""
            tool_calls = msg.get("tool_calls") or []

            # Guarda el turno del asistente tal como lo devolvió el modelo.
            assistant_turn: dict[str, Any] = {"role": "assistant", "content": content}
            if tool_calls:
                assistant_turn["tool_calls"] = tool_calls
            self._messages.append(assistant_turn)

            if not tool_calls:
                return content.strip()

            for call in tool_calls:
                fn = (call.get("function") or {})
                name = fn.get("name", "")
                args = fn.get("arguments") or {}
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except json.JSONDecodeError:
                        args = {}

                if self.confirm_dangerous and self.tools.is_dangerous(name):
                    if not self.confirm_cb(name, args):
                        tool_result: dict[str, Any] = {
                            "ok": False,
                            "error": "El usuario canceló la operación.",
                        }
                    else:
                        tool_result = self.tools.call(name, args)
                else:
                    tool_result = self.tools.call(name, args)

                self._messages.append({
                    "role": "tool",
                    "name": name,
                    "content": json.dumps(tool_result, ensure_ascii=False, default=str)[:8000],
                })

        return "No pude completar la petición dentro del límite de pasos."
