"""Orquestador principal del bot.

Lanza:
  - Feed de precio Binance (asyncio task).
  - Loop de decisión cada `loop_interval_sec`: lee mercado, calcula señal,
    decide y envía orden si procede.

Ejecuta con:
    python -m polybot.main
"""
from __future__ import annotations

import asyncio
import logging
import time

from .binance_feed import BinancePriceFeed
from .config import Config
from .executor import Executor
from .polymarket_feed import PolymarketFeed
from .signal import SignalModel
from .strategy import Strategy


def _setup_logging(cfg: Config) -> None:
    level = getattr(logging, cfg.get("logging", "level", default="INFO"))
    handlers = [logging.StreamHandler()]
    log_file = cfg.get("logging", "file")
    if log_file:
        handlers.append(logging.FileHandler(log_file))
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
        handlers=handlers,
    )


async def decision_loop(
    feed: BinancePriceFeed,
    market: PolymarketFeed,
    model: SignalModel,
    strategy: Strategy,
    executor: Executor,
    interval: float,
) -> None:
    log = logging.getLogger("polybot.loop")
    # cooldown entre apuestas del mismo mercado para no reentrar
    last_bet_market: str | None = None
    last_bet_ts = 0.0

    while True:
        try:
            snap = market.snapshot()
            if snap is None:
                log.info("Sin mercado activo en la ventana; esperando...")
                await asyncio.sleep(interval * 2)
                continue

            sig = model.predict(feed)
            if not sig.is_valid:
                log.info("Señal aún no válida (necesita más histórico de precio)")
                await asyncio.sleep(interval)
                continue

            log.info(
                "mkt=%s | secs=%0.0f | yes_ask=%s no_ask=%s | p_up=%.3f",
                snap.question[:50], snap.seconds_to_close(),
                snap.yes_best_ask, snap.no_best_ask, sig.p_up,
            )

            # evitar doble apuesta sobre el mismo market
            if snap.market_id == last_bet_market and (time.time() - last_bet_ts) < 30:
                await asyncio.sleep(interval)
                continue

            decision = strategy.decide(sig.p_up, snap)
            if decision.should_bet:
                log.info("DECISIÓN: APOSTAR %s @%.4f size=%.2f USDC (%s)",
                         decision.side, decision.limit_price,
                         decision.size_usdc, decision.reason)
                executor.submit(decision)
                last_bet_market = snap.market_id
                last_bet_ts = time.time()
            else:
                log.info("DECISIÓN: NO apostar — %s", decision.reason)

        except Exception:
            logging.getLogger("polybot.loop").exception("error en loop")

        await asyncio.sleep(interval)


async def amain() -> None:
    cfg = Config.load()
    _setup_logging(cfg)
    log = logging.getLogger("polybot.main")
    log.info("Modo: %s | Bankroll: %s USDC",
             cfg.get("polybot", "mode"), cfg.get("polybot", "bankroll_usdc"))

    feed = BinancePriceFeed(
        symbol=cfg.get("binance", "symbol", default="btcusdt"),
        ws_url=cfg.get("binance", "ws_url"),
        window_sec=600,
    )
    market = PolymarketFeed(
        search_query=cfg.get("market", "search_query"),
        min_secs_to_close=cfg.get("market", "min_secs_to_close"),
        max_secs_to_close=cfg.get("market", "max_secs_to_close"),
    )
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
    executor = Executor(
        mode=cfg.get("polybot", "mode"),
        url=cfg.get("executor", "url"),
        timeout_sec=cfg.get("executor", "timeout_sec"),
    )

    await asyncio.gather(
        feed.run(),
        decision_loop(
            feed, market, model, strategy, executor,
            interval=cfg.get("polybot", "loop_interval_sec", default=2.0),
        ),
    )


def main() -> None:
    try:
        asyncio.run(amain())
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
