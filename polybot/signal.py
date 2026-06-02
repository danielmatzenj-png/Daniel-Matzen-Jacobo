"""Estimador de P(BTC sube en los próximos 5 min).

Modelo lineal en log-odds:
    logit(p) = bias + β_short · z(r_short) + β_long · z(r_long) + β_vol · z(vol)

Donde:
    r_short = log-return de los últimos 30s
    r_long  = log-return de los últimos 120s
    vol     = vol realizada (1s) normalizada

z(x) = x / σ_ref usando σ_ref derivada de la vol realizada de la ventana larga.

Por qué tiene sentido: en horizonte 5 min la mejor predicción base es 0.5,
pero el momentum de muy corto plazo en BTC tiene una autocorrelación positiva
débil pero medible (continuación) sobre 30s-2min. El término de volatilidad
penaliza la confianza cuando el mercado está agitado.

Los coeficientes vienen del config y deberían recalibrarse con backtest.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Optional

from .binance_feed import BinancePriceFeed


@dataclass
class SignalOutput:
    p_up: float                    # P(BTC > precio_actual en 5 min)
    features: dict
    is_valid: bool                 # False si no había suficiente histórico


class SignalModel:
    def __init__(
        self,
        beta_short: float,
        beta_long: float,
        beta_vol: float,
        bias: float,
        p_min: float,
        p_max: float,
        momentum_short_sec: int,
        momentum_long_sec: int,
        vol_window_sec: int,
    ) -> None:
        self.beta_short = beta_short
        self.beta_long = beta_long
        self.beta_vol = beta_vol
        self.bias = bias
        self.p_min = p_min
        self.p_max = p_max
        self.t_short = momentum_short_sec
        self.t_long = momentum_long_sec
        self.t_vol = vol_window_sec

    @staticmethod
    def _sigmoid(x: float) -> float:
        if x >= 0:
            z = math.exp(-x)
            return 1.0 / (1.0 + z)
        z = math.exp(x)
        return z / (1.0 + z)

    def predict(self, feed: BinancePriceFeed) -> SignalOutput:
        r_short = feed.log_return(self.t_short)
        r_long = feed.log_return(self.t_long)
        vol = feed.realized_vol(self.t_vol)

        features = {"r_short": r_short, "r_long": r_long, "vol": vol}
        if r_short is None or r_long is None or vol is None or vol <= 0:
            return SignalOutput(p_up=0.5, features=features, is_valid=False)

        # estandarización simple: r_short / (vol * sqrt(t_short))
        # (la vol está expresada en unidades de 1/sqrt(s))
        z_short = r_short / (vol * math.sqrt(self.t_short))
        z_long = r_long / (vol * math.sqrt(self.t_long))
        # vol-adjust: penaliza cuando vol > mediana típica (~5e-5 por sqrt(s))
        ref_vol = 5e-5
        z_vol = (vol - ref_vol) / ref_vol

        logit = (
            self.bias
            + self.beta_short * z_short
            + self.beta_long * z_long
            + self.beta_vol * z_vol
        )
        p = self._sigmoid(logit)
        # clamp para evitar over-confidence en producción
        p = max(self.p_min, min(self.p_max, p))

        return SignalOutput(
            p_up=p,
            features={**features, "z_short": z_short, "z_long": z_long, "z_vol": z_vol},
            is_valid=True,
        )
