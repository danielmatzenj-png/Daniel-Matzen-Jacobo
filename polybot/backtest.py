"""Backtest mínimo del modelo de señal usando velas históricas de Binance.

Descarga klines 1m de los últimos N días y simula la decisión asumiendo
que el "precio justo" de Polymarket habría sido 0.5 en cada apertura
(approx peor caso: sin edge informacional del propio orderbook).

Reporta: nº de operaciones, hit rate, EV total, Sharpe diario.

Ejecuta:
    python -m polybot.backtest --days 30
"""
from __future__ import annotations

import argparse
import math
import statistics
import time
from typing import List

import requests

from .config import Config
from .signal import SignalModel
from .strategy import Strategy


def fetch_klines(symbol: str, minutes: int) -> List[dict]:
    """Descarga klines 1m. Binance limita a 1000 por request."""
    out = []
    end = int(time.time() * 1000)
    needed = minutes
    while needed > 0:
        limit = min(1000, needed)
        r = requests.get(
            "https://api.binance.com/api/v3/klines",
            params={"symbol": symbol.upper(), "interval": "1m",
                    "endTime": end, "limit": limit},
            timeout=10,
        )
        r.raise_for_status()
        chunk = r.json()
        if not chunk:
            break
        out = chunk + out
        end = chunk[0][0] - 1
        needed -= limit
    return out


def run(days: int) -> None:
    cfg = Config.load()
    klines = fetch_klines(cfg.get("binance", "symbol"), days * 24 * 60)
    closes = [float(k[4]) for k in klines]
    if len(closes) < 200:
        print("Datos insuficientes.")
        return

    model = SignalModel(
        beta_short=cfg.get("signal", "beta_momentum_short"),
        beta_long=cfg.get("signal", "beta_momentum_long"),
        beta_vol=cfg.get("signal", "beta_vol_adjust"),
        bias=cfg.get("signal", "bias"),
        p_min=cfg.get("signal", "p_min"),
        p_max=cfg.get("signal", "p_max"),
        momentum_short_sec=cfg.get("binance", "momentum_short_sec"),
        momentum_long_sec=cfg.get("binance", "momentum_long_sec"),
        vol_window_sec=cfg.get("binance", "vol_window_sec"),
    )
    strategy = Strategy(
        bankroll_usdc=cfg.get("polybot", "bankroll_usdc"),
        min_edge=cfg.get("strategy", "min_edge"),
        kelly_fraction=cfg.get("strategy", "kelly_fraction"),
        max_position_pct=cfg.get("strategy", "max_position_pct"),
        taker_fee=cfg.get("strategy", "taker_fee"),
        min_size_usdc=cfg.get("strategy", "min_size_usdc"),
    )

    # Simulamos directamente el cálculo de p_up sobre velas 1m
    # con r_short = 1m, r_long = 2m, vol = stdev de 5m.
    # Es una aproximación grosera del modelo en tick — usa el WS real para
    # estimaciones precisas. Pero sirve para chequear sanity y signo.
    trades = []
    for i in range(20, len(closes) - 5):
        r_short = math.log(closes[i] / closes[i - 1])
        r_long = math.log(closes[i] / closes[i - 2])
        window = closes[max(0, i - 5):i + 1]
        rets = [math.log(window[j] / window[j - 1]) for j in range(1, len(window))]
        if len(rets) < 2:
            continue
        vol = statistics.stdev(rets) / math.sqrt(60)
        if vol <= 0:
            continue
        ref_vol = 5e-5
        z_short = r_short / (vol * math.sqrt(30))
        z_long = r_long / (vol * math.sqrt(120))
        z_vol = (vol - ref_vol) / ref_vol
        logit = (cfg.get("signal", "bias")
                 + cfg.get("signal", "beta_momentum_short") * z_short
                 + cfg.get("signal", "beta_momentum_long") * z_long
                 + cfg.get("signal", "beta_vol_adjust") * z_vol)
        p = 1.0 / (1.0 + math.exp(-logit))
        p = max(cfg.get("signal", "p_min"), min(cfg.get("signal", "p_max"), p))

        # mercado ficticio a 0.5 con fee del config
        fee = cfg.get("strategy", "taker_fee")
        if p > 0.5:
            side = "UP"
            eff = 0.5 * (1 + fee)
            edge = p - eff
            wins = closes[i + 5] > closes[i]
        else:
            side = "DOWN"
            eff = 0.5 * (1 + fee)
            edge = (1 - p) - eff
            wins = closes[i + 5] < closes[i]

        if edge < cfg.get("strategy", "min_edge"):
            continue

        # tamaño Kelly fraccionado contra precio 0.5
        f_star = (max(p, 1 - p) - eff) / (1 - eff)
        f = max(0, f_star) * cfg.get("strategy", "kelly_fraction")
        f = min(f, cfg.get("strategy", "max_position_pct"))
        stake = f * cfg.get("polybot", "bankroll_usdc")
        if stake < cfg.get("strategy", "min_size_usdc"):
            continue

        payout = (stake / eff) if wins else 0.0
        pnl = payout - stake
        trades.append({"side": side, "p": p, "stake": stake, "pnl": pnl, "win": wins})

    if not trades:
        print("0 trades en el backtest. Edge mínimo demasiado alto o coeficientes bajos.")
        return
    wins = sum(1 for t in trades if t["win"])
    total_pnl = sum(t["pnl"] for t in trades)
    print(f"Trades: {len(trades)}")
    print(f"Hit rate: {wins}/{len(trades)} = {wins/len(trades):.1%}")
    print(f"PnL total: {total_pnl:.2f} USDC")
    print(f"PnL/trade promedio: {total_pnl/len(trades):.3f} USDC")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--days", type=int, default=14)
    args = p.parse_args()
    run(args.days)
