"""Síntesis de voz offline con pyttsx3 (usa SAPI5/NSSpeech/eSpeak según el SO)."""
from __future__ import annotations


class TextToSpeech:
    def __init__(self, rate: int = 180, volume: float = 1.0, voice: str = ""):
        import pyttsx3

        self._engine = pyttsx3.init()
        self._engine.setProperty("rate", rate)
        self._engine.setProperty("volume", volume)
        if voice:
            self._set_voice(voice)

    def _set_voice(self, hint: str) -> None:
        hint_lower = hint.lower()
        for v in self._engine.getProperty("voices"):
            blob = " ".join(
                str(getattr(v, attr, ""))
                for attr in ("id", "name", "languages")
            ).lower()
            if hint_lower in blob:
                self._engine.setProperty("voice", v.id)
                return

    def say(self, text: str) -> None:
        if not text:
            return
        self._engine.say(text)
        self._engine.runAndWait()

    def stop(self) -> None:
        self._engine.stop()
