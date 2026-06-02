"""Feed en tiempo real del precio de BTC desde Binance.

Mantiene una ventana deslizante en memoria (timestamp, price) y expone
features de momentum y volatilidad para el modelo de señal.

No requiere autenticación. Reconecta automáticamente.
"""
from __future__ import annotations

import asyncio
import json
import logging
import math
import time
from collections import deque
from typing import Deque, Optional, Tuple

import websockets

log = logging.getLogger(__name__)


class BinancePriceFeed:
    def __init__(
        self,
        symbol: str = "btcusdt",
        ws_url: str = "wss://stream.binance.com:9443/ws",
        window_sec: int = 600,
    ) -> None:
        self.symbol = symbol.lower()
        self.ws_url = ws_url
        self.window_sec = window_sec
        # (epoch_seconds, price)
        self._buf: Deque[Tuple[float, float]] = deque()
        self._running = False

    @property
    def last_price(self) -> Optional[float]:
        return self._buf[-1][1] if self._buf else None

    def _trim(self, now: float) -> None:
        cutoff = now - self.window_sec
        while self._buf and self._buf[0][0] < cutoff:
            self._buf.popleft()

    def price_at(self, seconds_ago: float) -> Optional[float]:
        """Devuelve el precio más cercano a 'seconds_ago' segundos atrás."""
        if not self._buf:
            return None
        target = self._buf[-1][0] - seconds_ago
        # búsqueda lineal desde el inicio (la ventana es pequeña)
        best: Optional[Tuple[float, float]] = None
        for ts, px in self._buf:
            if best is None or abs(ts - target) < abs(best[0] - target):
                best = (ts, px)
            if ts > target:
                break
        return best[1] if best else None

    def log_return(self, seconds_ago: float) -> Optional[float]:
        p_now = self.last_price
        p_then = self.price_at(seconds_ago)
        if not p_now or not p_then:
            return None
        return math.log(p_now / p_then)

    def realized_vol(self, window_sec: float) -> Optional[float]:
        """Stdev de log-returns 1s a 1s dentro de la ventana indicada."""
        if len(self._buf) < 4:
            return None
        now = self._buf[-1][0]
        start = now - window_sec
        prices = [(ts, px) for ts, px in self._buf if ts >= start]
        if len(prices) < 4:
            return None
        rets = []
        for i in range(1, len(prices)):
            dt = prices[i][0] - prices[i - 1][0]
            if dt <= 0:
                continue
            r = math.log(prices[i][1] / prices[i - 1][1]) / math.sqrt(max(dt, 1e-6))
            rets.append(r)
        if len(rets) < 4:
            return None
        mean = sum(rets) / len(rets)
        var = sum((r - mean) ** 2 for r in rets) / (len(rets) - 1)
        return math.sqrt(var)

    async def run(self) -> None:
        """Bucle infinito que mantiene el feed conectado."""
        self._running = True
        url = f"{self.ws_url}/{self.symbol}@trade"
        while self._running:
            try:
                async with websockets.connect(url, ping_interval=20) as ws:
                    log.info("Binance WS conectado: %s", url)
                    async for msg in ws:
                        data = json.loads(msg)
                        # evento de trade: campos 'T' (ms) y 'p' (precio str)
                        ts = data.get("T")
                        px = data.get("p")
                        if ts is None or px is None:
                            continue
                        self._buf.append((ts / 1000.0, float(px)))
                        self._trim(ts / 1000.0)
            except Exception as exc:  # reconexión simple con backoff
                log.warning("Binance WS desconectado: %s — reintentando en 3s", exc)
                await asyncio.sleep(3)

    def stop(self) -> None:
        self._running = False
