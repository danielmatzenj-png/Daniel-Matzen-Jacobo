"""Utilidades de audio: captura desde el micrófono."""
from __future__ import annotations

import queue
from collections.abc import Iterator

import numpy as np
import sounddevice as sd


class MicStream:
    """Iterador bloqueante que entrega bloques de audio PCM int16 desde el micrófono."""

    def __init__(self, sample_rate: int = 16000, frame_length: int = 1280):
        self.sample_rate = sample_rate
        self.frame_length = frame_length
        self._q: queue.Queue[np.ndarray] = queue.Queue()
        self._stream: sd.RawInputStream | None = None

    def _callback(self, indata, frames, time_info, status):  # noqa: ARG002
        if status:
            # No abortamos, solo notificamos en stderr
            import sys

            print(f"[audio] status: {status}", file=sys.stderr)
        # Copiamos porque sounddevice reutiliza el buffer
        self._q.put(bytes(indata))

    def __enter__(self) -> "MicStream":
        self._stream = sd.RawInputStream(
            samplerate=self.sample_rate,
            blocksize=self.frame_length,
            dtype="int16",
            channels=1,
            callback=self._callback,
        )
        self._stream.start()
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        if self._stream is not None:
            self._stream.stop()
            self._stream.close()
            self._stream = None

    def frames(self) -> Iterator[np.ndarray]:
        while True:
            raw = self._q.get()
            yield np.frombuffer(raw, dtype=np.int16)
