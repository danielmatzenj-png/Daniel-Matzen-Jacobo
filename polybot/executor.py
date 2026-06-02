"""Puente al ejecutor de órdenes (TypeScript) que habla con el CLOB.

En modo `dry_run` solo loguea. En `live` envía un POST al endpoint HTTP local
del ejecutor TS, que firma con la wallet y coloca la orden.
"""
from __future__ import annotations

import logging
from typing import Optional

import requests

from .strategy import Decision

log = logging.getLogger(__name__)


class Executor:
    def __init__(self, mode: str, url: str, timeout_sec: float = 5.0) -> None:
        self.mode = mode
        self.url = url.rstrip("/")
        self.timeout = timeout_sec

    def submit(self, decision: Decision) -> Optional[dict]:
        if not decision.should_bet:
            return None

        payload = {
            "side": "BUY",                     # siempre compramos outcome tokens
            "outcome": decision.side,           # YES o NO (info auxiliar)
            "token_id": decision.token_id,
            "price": decision.limit_price,
            "size_usdc": decision.size_usdc,
        }

        if self.mode == "dry_run":
            log.info("[DRY-RUN] orden: %s", payload)
            return {"status": "dry_run", "payload": payload}

        try:
            r = requests.post(
                f"{self.url}/orders",
                json=payload,
                timeout=self.timeout,
            )
            r.raise_for_status()
            data = r.json()
            log.info("Orden enviada: %s", data)
            return data
        except Exception as exc:
            log.error("Fallo ejecutor: %s", exc)
            return {"status": "error", "error": str(exc)}
