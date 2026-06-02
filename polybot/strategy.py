"""Decide si apostar, a qué lado y con qué tamaño.

Regla:
  1. Calcular edge = p_modelo − precio_ejecucion (tras fees) por cada lado.
  2. Si max(edge_yes, edge_no) < min_edge → NO apostar.
  3. Tamaño = fraction · Kelly óptimo, cap a max_position_pct del bankroll.
  4. Ignorar si la orden resultante < min_size_usdc.

Kelly para apuesta binaria a precio p_buy con prob real p:
    b = (1 - p_buy) / p_buy          (odds netas)
    f* = (p · b − (1 − p)) / b = (p − p_buy) / (1 − p_buy)
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .polymarket_feed import MarketSnapshot


@dataclass
class Decision:
    should_bet: bool
    side: Optional[str]               # "YES" | "NO" | None
    token_id: Optional[str]
    limit_price: Optional[float]      # precio al que vamos a comprar (0-1)
    size_usdc: float                  # tamaño en USDC
    edge: float                       # edge esperado tras fees
    reason: str


class Strategy:
    def __init__(
        self,
        bankroll_usdc: float,
        min_edge: float,
        kelly_fraction: float,
        max_position_pct: float,
        taker_fee: float,
        min_size_usdc: float,
    ) -> None:
        self.bankroll = bankroll_usdc
        self.min_edge = min_edge
        self.kelly_fraction = kelly_fraction
        self.max_position_pct = max_position_pct
        self.taker_fee = taker_fee
        self.min_size_usdc = min_size_usdc

    @staticmethod
    def _kelly_fraction(p: float, price: float) -> float:
        """Fracción óptima de Kelly comprando a 'price' con prob real p."""
        if price <= 0 or price >= 1:
            return 0.0
        # f* = (p - price) / (1 - price)   (forma simplificada para binary)
        f = (p - price) / (1.0 - price)
        return max(0.0, f)

    def decide(self, p_up: float, snap: MarketSnapshot) -> Decision:
        # precios efectivos al cruzar el spread (tomar el ask)
        yes_ask = snap.yes_best_ask
        no_ask = snap.no_best_ask

        candidates = []
        if yes_ask is not None and 0 < yes_ask < 1:
            # comprar YES = apostar a sube; prob real = p_up; precio efectivo = ask·(1+fee)
            eff_yes = yes_ask * (1.0 + self.taker_fee)
            edge_yes = p_up - eff_yes
            candidates.append(("YES", snap.yes_token_id, yes_ask, eff_yes, p_up, edge_yes))
        if no_ask is not None and 0 < no_ask < 1:
            eff_no = no_ask * (1.0 + self.taker_fee)
            p_down = 1.0 - p_up
            edge_no = p_down - eff_no
            candidates.append(("NO", snap.no_token_id, no_ask, eff_no, p_down, edge_no))

        if not candidates:
            return Decision(False, None, None, None, 0.0, 0.0, "sin libros (no hay ask)")

        # mejor edge
        candidates.sort(key=lambda c: c[5], reverse=True)
        side, tok, raw_price, eff_price, p_real, edge = candidates[0]

        if edge < self.min_edge:
            return Decision(False, None, None, None, 0.0, edge,
                            f"edge {edge:.4f} < min {self.min_edge}")

        # Kelly contra el precio efectivo (que ya incluye fees)
        f_star = self._kelly_fraction(p_real, eff_price)
        f = f_star * self.kelly_fraction
        f = min(f, self.max_position_pct)
        size = round(f * self.bankroll, 2)

        if size < self.min_size_usdc:
            return Decision(False, side, tok, raw_price, 0.0, edge,
                            f"size {size} < mínimo {self.min_size_usdc}")

        return Decision(
            should_bet=True,
            side=side,
            token_id=tok,
            limit_price=raw_price,
            size_usdc=size,
            edge=edge,
            reason=f"edge={edge:.4f}, f*={f_star:.3f}, f={f:.3f}",
        )
