"""Punto de entrada del asistente Jarvis.

Flujo:
  1. Espera la palabra clave "Jarvis" con openwakeword.
  2. Graba la petición hasta detectar silencio.
  3. Transcribe con Whisper local.
  4. Ejecuta el agente (LLM + herramientas) contra Ollama.
  5. Habla la respuesta con el TTS del sistema.
"""
from __future__ import annotations

import argparse
import signal
import sys
import threading

from .agent import Agent
from .config import load_config
from .llm import OllamaClient
from .stt import SpeechToText
from .tools import ToolRegistry
from .tts import TextToSpeech
from .wake_word import WakeWordDetector


def _install_sigint(stop: threading.Event) -> None:
    def _handler(_sig, _frame):
        stop.set()
        print("\n[jarvis] Apagando...", flush=True)
        sys.exit(0)

    signal.signal(signal.SIGINT, _handler)


def _confirm_cli(name: str, args: dict) -> bool:
    print(f"\n[jarvis] Operación potencialmente peligrosa: {name}({args})")
    answer = input("[jarvis] ¿Autorizar? [s/N]: ").strip().lower()
    return answer in {"s", "si", "sí", "y", "yes"}


def main() -> None:
    parser = argparse.ArgumentParser(description="Asistente de IA local Jarvis")
    parser.add_argument("--config", default=None, help="Ruta al archivo config.yaml")
    parser.add_argument(
        "--text", action="store_true",
        help="Modo texto: ignora el micrófono y usa stdin (útil para pruebas).",
    )
    parser.add_argument(
        "--once", action="store_true",
        help="Ejecuta un único turno y termina.",
    )
    args = parser.parse_args()

    cfg = load_config(args.config)

    print("[jarvis] Cargando modelos locales...", flush=True)

    llm = OllamaClient(
        host=cfg.get("llm.host", "http://localhost:11434"),
        model=cfg.get("llm.model", "llama3.1"),
        temperature=cfg.get("llm.temperature", 0.2),
        num_ctx=cfg.get("llm.num_ctx", 8192),
    )
    llm.ensure_model()

    tools = ToolRegistry(workspace_root=cfg.get("agent.workspace_root", "~"))
    agent = Agent(
        llm=llm,
        tools=tools,
        name=cfg.get("agent.name", "Jarvis"),
        language=cfg.get("agent.language", "es"),
        max_iterations=cfg.get("agent.max_iterations", 8),
        confirm_dangerous=cfg.get("agent.confirm_dangerous", True),
        confirm_cb=_confirm_cli,
    )

    stop = threading.Event()
    _install_sigint(stop)

    if args.text:
        _run_text_loop(agent, stop, once=args.once)
        return

    tts = TextToSpeech(
        rate=cfg.get("tts.rate", 180),
        volume=cfg.get("tts.volume", 1.0),
        voice=cfg.get("tts.voice", ""),
    )
    stt = SpeechToText(
        model=cfg.get("stt.model", "base"),
        device=cfg.get("stt.device", "auto"),
        compute_type=cfg.get("stt.compute_type", "int8"),
        language=cfg.get("stt.language", "es"),
        sample_rate=cfg.get("wake_word.sample_rate", 16000),
        silence_duration=cfg.get("stt.silence_duration", 1.2),
        silence_threshold=cfg.get("stt.silence_threshold", 0.01),
        max_record_seconds=cfg.get("stt.max_record_seconds", 30.0),
    )
    wake = WakeWordDetector(
        model=cfg.get("wake_word.model", "hey_jarvis"),
        threshold=cfg.get("wake_word.threshold", 0.5),
        sample_rate=cfg.get("wake_word.sample_rate", 16000),
        frame_length=cfg.get("wake_word.frame_length", 1280),
    )

    tts.say("Jarvis listo.")
    print("[jarvis] Di 'Jarvis' para activarme. Ctrl+C para salir.", flush=True)

    while not stop.is_set():
        print("[jarvis] Esperando palabra clave...", flush=True)
        score = wake.wait_for_wake()
        print(f"[jarvis] Activado (score={score:.2f}). Te escucho.", flush=True)
        tts.say("¿Sí?")

        user_text = stt.listen()
        if not user_text:
            tts.say("No te escuché bien. Vuelve a intentarlo.")
            continue

        print(f"[usuario] {user_text}", flush=True)
        try:
            reply = agent.ask(user_text)
        except Exception as e:  # noqa: BLE001
            reply = f"Ocurrió un error: {e}"

        print(f"[jarvis] {reply}", flush=True)
        tts.say(reply)

        if args.once:
            break


def _run_text_loop(agent: Agent, stop: threading.Event, once: bool = False) -> None:
    print("[jarvis] Modo texto. Escribe tu petición. Ctrl+C para salir.", flush=True)
    while not stop.is_set():
        try:
            line = input("tú> ").strip()
        except EOFError:
            return
        if not line:
            continue
        reply = agent.ask(line)
        print(f"jarvis> {reply}", flush=True)
        if once:
            return


if __name__ == "__main__":
    main()
