"""Transcripción de voz local con faster-whisper.

Graba desde el micrófono hasta detectar silencio y devuelve el texto.
"""
from __future__ import annotations

import numpy as np
import sounddevice as sd


class SpeechToText:
    def __init__(
        self,
        model: str = "base",
        device: str = "auto",
        compute_type: str = "int8",
        language: str = "es",
        sample_rate: int = 16000,
        silence_duration: float = 1.2,
        silence_threshold: float = 0.01,
        max_record_seconds: float = 30.0,
    ):
        from faster_whisper import WhisperModel

        self.language = language
        self.sample_rate = sample_rate
        self.silence_duration = silence_duration
        self.silence_threshold = silence_threshold
        self.max_record_seconds = max_record_seconds
        self._model = WhisperModel(model, device=device, compute_type=compute_type)

    def record_until_silence(self) -> np.ndarray:
        """Graba PCM float32 hasta detectar silencio sostenido."""
        chunk = int(self.sample_rate * 0.1)  # 100 ms
        max_chunks = int(self.max_record_seconds / 0.1)
        silence_chunks_needed = int(self.silence_duration / 0.1)

        buffer: list[np.ndarray] = []
        silent = 0
        spoke = False

        with sd.InputStream(
            samplerate=self.sample_rate, channels=1, dtype="float32", blocksize=chunk
        ) as stream:
            for _ in range(max_chunks):
                data, _ = stream.read(chunk)
                mono = data[:, 0]
                buffer.append(mono.copy())
                rms = float(np.sqrt(np.mean(mono * mono) + 1e-12))
                if rms > self.silence_threshold:
                    spoke = True
                    silent = 0
                elif spoke:
                    silent += 1
                    if silent >= silence_chunks_needed:
                        break

        return np.concatenate(buffer) if buffer else np.zeros(0, dtype=np.float32)

    def transcribe(self, audio: np.ndarray) -> str:
        if audio.size == 0:
            return ""
        segments, _ = self._model.transcribe(
            audio,
            language=self.language,
            vad_filter=True,
            beam_size=1,
        )
        return " ".join(seg.text for seg in segments).strip()

    def listen(self) -> str:
        """Graba y transcribe una petición completa."""
        audio = self.record_until_silence()
        return self.transcribe(audio)
