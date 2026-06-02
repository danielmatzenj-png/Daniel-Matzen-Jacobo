"""Lectura de mercados de Polymarket vía Gamma API + CLOB REST.

Localiza el mercado binario activo "Bitcoin Up or Down — 5 min" y expone:
  - el outcome YES (sube) y NO (baja) con sus token_ids
  - el mejor bid/ask de cada lado
  - el tiempo restante hasta el cierre

Solo lectura: no requiere claves API. Usa REST (no WebSocket) porque los
mercados de 5 min duran poco y polling cada 1-2 s es suficiente.
"""
from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

import requests

log = logging.getLogger(__name__)

GAMMA_BASE = "https://gamma-api.polymarket.com"
CLOB_BASE = "https://clob.polymarket.com"


@dataclass
class MarketSnapshot:
    market_id: str
    question: str
    end_ts: float                # epoch seconds (UTC)
    yes_token_id: str
    no_token_id: str
    yes_best_bid: Optional[float]
    yes_best_ask: Optional[float]
    no_best_bid: Optional[float]
    no_best_ask: Optional[float]

    def seconds_to_close(self) -> float:
        return self.end_ts - time.time()

    def yes_mid(self) -> Optional[float]:
        if self.yes_best_bid is None or self.yes_best_ask is None:
            return None
        return (self.yes_best_bid + self.yes_best_ask) / 2.0


class PolymarketFeed:
    def __init__(
        self,
        search_query: str = "Bitcoin Up or Down",
        min_secs_to_close: float = 60,
        max_secs_to_close: float = 270,
        session: Optional[requests.Session] = None,
    ) -> None:
        self.search_query = search_query
        self.min_secs = min_secs_to_close
        self.max_secs = max_secs_to_close
        self.s = session or requests.Session()
        self.s.headers.update({"User-Agent": "polybot/0.1"})

    # ---------- discovery ----------

    def find_active_market(self) -> Optional[dict]:
        """Busca mercados activos cuya pregunta contenga `search_query`."""
        # Gamma API: /markets?active=true&closed=false&limit=...
        # Filtramos en cliente por la cadena (la API no expone full-text robusto).
        try:
            r = self.s.get(
                f"{GAMMA_BASE}/markets",
                params={"active": "true", "closed": "false", "limit": 100},
                timeout=5,
            )
            r.raise_for_status()
            markets = r.json()
        except Exception as exc:
            log.warning("Gamma /markets falló: %s", exc)
            return None

        q = self.search_query.lower()
        candidates = []
        now = time.time()
        for m in markets:
            question = (m.get("question") or "").lower()
            if q not in question:
                continue
            end_iso = m.get("endDate") or m.get("end_date_iso")
            if not end_iso:
                continue
            try:
                end_dt = datetime.fromisoformat(end_iso.replace("Z", "+00:00"))
                end_ts = end_dt.astimezone(timezone.utc).timestamp()
            except Exception:
                continue
            secs_left = end_ts - now
            if not (self.min_secs <= secs_left <= self.max_secs):
                continue
            candidates.append((secs_left, m))

        if not candidates:
            return None
        # el que esté más cerca del centro de la ventana
        target = (self.min_secs + self.max_secs) / 2
        candidates.sort(key=lambda x: abs(x[0] - target))
        return candidates[0][1]

    # ---------- snapshot ----------

    def snapshot(self) -> Optional[MarketSnapshot]:
        m = self.find_active_market()
        if not m:
            return None

        # tokens (CLOB outcome token ids)
        try:
            tokens = m.get("clobTokenIds") or m.get("clob_token_ids")
            outcomes = m.get("outcomes")
            if isinstance(tokens, str):
                import json as _json
                tokens = _json.loads(tokens)
            if isinstance(outcomes, str):
                import json as _json
                outcomes = _json.loads(outcomes)
            if not tokens or not outcomes or len(tokens) != 2:
                return None
            # outcomes suele ser ["Up", "Down"] o ["Yes","No"]
            up_idx = 0
            for i, o in enumerate(outcomes):
                if str(o).lower() in ("up", "yes"):
                    up_idx = i
                    break
            yes_tok = str(tokens[up_idx])
            no_tok = str(tokens[1 - up_idx])
        except Exception as exc:
            log.warning("No pude parsear tokens del mercado: %s", exc)
            return None

        yes_bid, yes_ask = self._best_bid_ask(yes_tok)
        no_bid, no_ask = self._best_bid_ask(no_tok)

        end_iso = m.get("endDate") or m.get("end_date_iso")
        end_dt = datetime.fromisoformat(end_iso.replace("Z", "+00:00"))
        end_ts = end_dt.astimezone(timezone.utc).timestamp()

        return MarketSnapshot(
            market_id=str(m.get("id") or m.get("conditionId")),
            question=str(m.get("question")),
            end_ts=end_ts,
            yes_token_id=yes_tok,
            no_token_id=no_tok,
            yes_best_bid=yes_bid,
            yes_best_ask=yes_ask,
            no_best_bid=no_bid,
            no_best_ask=no_ask,
        )

    def _best_bid_ask(self, token_id: str) -> tuple[Optional[float], Optional[float]]:
        """CLOB /book → mejor bid y ask para un token."""
        try:
            r = self.s.get(
                f"{CLOB_BASE}/book",
                params={"token_id": token_id},
                timeout=5,
            )
            r.raise_for_status()
            book = r.json()
        except Exception as exc:
            log.debug("CLOB /book(%s) falló: %s", token_id[:10], exc)
            return None, None

        bids = book.get("bids") or []
        asks = book.get("asks") or []
        # Polymarket devuelve listas ordenadas; tomamos el primer nivel
        best_bid = float(bids[0]["price"]) if bids else None
        best_ask = float(asks[0]["price"]) if asks else None
        return best_bid, best_ask
