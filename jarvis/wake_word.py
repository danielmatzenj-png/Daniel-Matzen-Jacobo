"""Detección de palabra clave ("Jarvis") usando openwakeword.

openwakeword es totalmente local y de código abierto. Incluye el modelo
preentrenado "hey_jarvis" que se activa con "Hey Jarvis" o solo "Jarvis".
"""
from __future__ import annotations

from collections.abc import Iterator

import numpy as np

from .audio import MicStream


class WakeWordDetector:
    def __init__(
        self,
        model: str = "hey_jarvis",
        threshold: float = 0.5,
        sample_rate: int = 16000,
        frame_length: int = 1280,
    ):
        # Importación perezosa: openwakeword descarga modelos en el primer uso.
        from openwakeword.model import Model

        self.threshold = threshold
        self.sample_rate = sample_rate
        self.frame_length = frame_length
        self._model_name = model
        self._model = Model(wakeword_models=[model], inference_framework="onnx")

    def listen(self) -> Iterator[float]:
        """Genera la puntuación cada vez que se supera el umbral."""
        with MicStream(self.sample_rate, self.frame_length) as mic:
            for frame in mic.frames():
                preds = self._model.predict(frame)
                score = float(preds.get(self._model_name, 0.0))
                if score >= self.threshold:
                    # Reinicia el buffer interno para no re-disparar inmediatamente.
                    self._model.reset()
                    yield score

    def wait_for_wake(self) -> float:
        """Bloquea hasta detectar la palabra clave y devuelve la puntuación."""
        for score in self.listen():
            return score
        return 0.0
