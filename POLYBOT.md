# Polybot — Bot +EV para Polymarket BTC 5-min

Bot que detecta cuándo el precio implícito de Polymarket en los mercados
"Bitcoin Up or Down (5m)" se desvía de la probabilidad real estimada a partir
del precio de BTC en Binance, y solo apuesta cuando el `edge` esperado es
positivo después de fees. Es decir: **no apuesta siempre, apuesta selectivamente
para tener valor esperado positivo a largo plazo.**

> ⚠️ **Realismo**: no existe un bot que "gane siempre". Existen bots que ganan
> *en expectativa* tras muchas operaciones. Tu PnL en cualquier día concreto
> puede ser negativo. Si alguien te promete ganancia garantizada en
> mercados de predicción, es una estafa. Empieza siempre en `dry_run` y haz
> backtest antes de pasar a `live`.

## Arquitectura

```
Binance WS (BTC trades)
        │
        ▼
SignalModel  ── estima P(BTC sube en 5 min)
        │
        ▼
Strategy  ── decide si edge > umbral, calcula tamaño con Kelly fraccionado
        │
        ▼
Executor (Python)  ── POST http://localhost:8787/orders
        │
        ▼
Polybot-Executor (TypeScript + @polymarket/clob-client)
        │
        ▼
Polymarket CLOB  ── coloca la orden GTC desde tu wallet
```

## Instalación

### Python (señal + estrategia)

```bash
pip install -r requirements-polybot.txt
```

### TypeScript (ejecutor de órdenes)

```bash
cd polybot-executor
npm install
cp .env.example .env
# edita .env con tu PRIVATE_KEY y POLY_FUNDER
```

Tu wallet debe:
1. Tener USDC.e en Polygon (chain 137).
2. Estar registrada/aprobada en Polymarket (entra una vez a polymarket.com con
   esa wallet y deposita USDC para que se haga el setup automático).
3. La primera vez que arrancas el ejecutor sin `CLOB_API_KEY`, lo derivará
   onchain y lo imprimirá; cópialo al `.env`.

## Uso

### 1. Backtest (antes que nada)

```bash
python -m polybot.backtest --days 30
```

Mira `hit rate` y `PnL/trade`. Si el PnL no es claramente positivo,
**recalibra** los `beta_*` en `polybot.yaml` antes de pasar a vivo.

### 2. Dry run (sin enviar órdenes)

`polybot.yaml` → `polybot.mode: "dry_run"`

```bash
python -m polybot.main
```

Verás logs como:
```
mkt=Bitcoin Up or Down — Jun 2 15:35 | secs=180 | yes_ask=0.51 no_ask=0.50 | p_up=0.58
DECISIÓN: APOSTAR YES @0.5100 size=1.85 USDC (edge=0.0584, f*=0.142, f=0.035)
[DRY-RUN] orden: {...}
```

### 3. Live

Arranca el ejecutor TS en una terminal:
```bash
cd polybot-executor && npm run dev
```

En otra terminal pon el modo en `live` en `polybot.yaml` y:
```bash
python -m polybot.main
```

## Parámetros clave (`polybot.yaml`)

| Parámetro | Qué hace | Default conservador |
|-----------|----------|---------------------|
| `strategy.min_edge` | Edge mínimo (tras fees) para apostar | `0.05` (5 pp) |
| `strategy.kelly_fraction` | Fracción de Kelly óptimo | `0.25` |
| `strategy.max_position_pct` | Tope por trade vs bankroll | `0.02` (2%) |
| `strategy.taker_fee` | Fee asumida en CLOB | `0.02` |
| `signal.p_min/p_max` | Clamp de probabilidad estimada | `0.30 / 0.70` |
| `market.min/max_secs_to_close` | Ventana de entrada antes del cierre | `60–270 s` |

## Por qué este enfoque y no "predecir BTC"

En 5 minutos BTC es **casi un random walk**. La autocorrelación de retornos
de muy corto plazo es pequeña pero existe (momentum continuation), y la
volatilidad realizada predice la magnitud, no el signo. Por eso el modelo
ancla en `p = 0.5` y solo se aleja modestamente. La rentabilidad viene de:

1. **No operar siempre** — la mayor parte del tiempo el spread + fee comen
   cualquier edge.
2. **Apostar pequeño** — Kelly fraccionado evita ruina por drawdown.
3. **Cazar precios desalineados** — cuando Polymarket cotiza 0.45 pero el
   momentum apunta a 0.55 de probabilidad real, esos son los trades.

## Recalibración

Los coeficientes en `signal.*` son un punto de partida heurístico. Para
producción real, entrena una regresión logística sobre histórico:

```python
# pseudocódigo:
# y = 1 si close[t+5m] > close[t] sino 0
# X = [r_30s, r_120s, vol_5m]   (estandarizados)
# logreg.fit(X, y)  →  reemplaza los beta_*
```

Recomendado: re-entrenar semanalmente con los últimos 30 días.

## Seguridad

- El ejecutor TS escucha **solo en 127.0.0.1**. Nunca expongas ese puerto.
- Usa una wallet dedicada con solo el capital que estés dispuesto a perder.
- `.env` está en `.gitignore` — no lo subas nunca.
- Si vives en EE.UU., Polymarket está geo-bloqueado; cumple las leyes de tu
  jurisdicción.
