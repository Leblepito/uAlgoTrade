"""Technical Analyst Agent — Multi-indicator analysis with Smart Money Concepts.

Role: Technical Analyst
Mission: Synthesize price action, momentum, structure, and volume signals into
         a single directional conviction with precise entry, stop-loss, and take-profit levels.

Indicator stack:
- RSI (momentum oscillator)
- Bollinger Bands (volatility envelope)
- Smart Money Concepts: Order Blocks + Fair Value Gaps (institutional footprint)
- Elliott Wave (wave structure context)
- Support / Resistance (key price levels)
- ATR (volatility-based position sizing)

Signal synthesis: Weighted voting across all indicators with confidence normalization.
"""

import logging

import numpy as np

from src.agents.base_agent import BaseAgent
from src.indicators.bollinger import compute_bollinger
from src.indicators.elliott_wave import detect_elliott_wave
from src.indicators.rsi import compute_rsi
from src.indicators.smc import detect_order_blocks, detect_fvg
from src.indicators.support_resistance import detect_support_resistance

logger = logging.getLogger(__name__)

# Minimum candles required for reliable analysis
MIN_CANDLES = 50

# Indicator weights in consensus — must sum to 1.0
INDICATOR_WEIGHTS = {
    "rsi": 0.20,
    "bollinger": 0.18,
    "order_block": 0.22,  # SMC — institutional bias, highest weight
    "fvg": 0.15,          # Fair Value Gaps — structural imbalances
    "support_resistance": 0.15,
    "elliott_wave": 0.10,
}


class TechnicalAnalystAgent(BaseAgent):
    """Multi-indicator technical analysis with Smart Money Concepts.

    Runs all indicators in sequence, weights their signals, and outputs:
    - Direction: LONG / SHORT / NEUTRAL
    - Confidence: 0.0–1.0 (weighted indicator agreement)
    - Entry, Stop-Loss, Take-Profit: ATR-based levels
    - Risk/Reward: TP distance / SL distance
    - Full indicator breakdown for transparency
    """

    def __init__(self):
        super().__init__(
            name="technical_analyst",
            role="Technical Analysis — SMC, RSI, Bollinger, Elliott, S/R",
            version="1.3.0",
        )

    async def analyze(self, symbol: str, **kwargs) -> dict:
        """Run full technical analysis for a symbol.

        Args:
            symbol: Trading pair e.g. 'BTCUSDT'
            **kwargs:
                candles: list of dicts with 'open', 'high', 'low', 'close', 'volume'
                timeframe: str, e.g. '1h', '4h', '1d' (default '1h')

        Returns:
            Full analysis dict with direction, confidence, levels, and indicator breakdown.
        """
        candles: list[dict] = kwargs.get("candles", [])
        timeframe: str = kwargs.get("timeframe", "1h")

        if not candles or len(candles) < MIN_CANDLES:
            return {
                "agent": self.name,
                "symbol": symbol,
                "timeframe": timeframe,
                "direction": "NEUTRAL",
                "confidence": 0.0,
                "entry_price": None,
                "stop_loss": None,
                "take_profit": None,
                "risk_reward": None,
                "error": f"Insufficient candle data: {len(candles)} < {MIN_CANDLES} required",
            }

        closes = np.array([c["close"] for c in candles], dtype=float)
        highs = np.array([c["high"] for c in candles], dtype=float)
        lows = np.array([c["low"] for c in candles], dtype=float)
        volumes = np.array([c.get("volume", 0) for c in candles], dtype=float)

        current_price = float(closes[-1])

        # Run all indicators
        rsi_data = compute_rsi(closes)
        bb_data = compute_bollinger(closes)
        sr_levels = detect_support_resistance(highs, lows, closes)
        order_blocks = detect_order_blocks(candles)
        fvg_zones = detect_fvg(candles)
        elliott = detect_elliott_wave(closes)
        atr = self._compute_atr(highs, lows, closes)

        # Collect weighted sub-signals: (direction, raw_confidence, weight, label)
        sub_signals: list[tuple[str, float, float, str]] = []

        # --- RSI (14-period momentum) ---
        current_rsi = rsi_data.get("current", 50.0)
        if current_rsi < 30:
            sub_signals.append(("LONG", 0.80, INDICATOR_WEIGHTS["rsi"], f"RSI oversold ({current_rsi:.1f})"))
        elif current_rsi < 40:
            sub_signals.append(("LONG", 0.50, INDICATOR_WEIGHTS["rsi"], f"RSI approaching oversold ({current_rsi:.1f})"))
        elif current_rsi > 70:
            sub_signals.append(("SHORT", 0.80, INDICATOR_WEIGHTS["rsi"], f"RSI overbought ({current_rsi:.1f})"))
        elif current_rsi > 60:
            sub_signals.append(("SHORT", 0.50, INDICATOR_WEIGHTS["rsi"], f"RSI approaching overbought ({current_rsi:.1f})"))
        else:
            sub_signals.append(("NEUTRAL", 0.30, INDICATOR_WEIGHTS["rsi"], f"RSI neutral ({current_rsi:.1f})"))

        # --- Bollinger Bands ---
        bb_lower = bb_data.get("lower", 0)
        bb_upper = bb_data.get("upper", float("inf"))
        bb_middle = bb_data.get("middle", current_price)
        bb_bandwidth = (bb_upper - bb_lower) / bb_middle if bb_middle > 0 else 0

        if current_price <= bb_lower:
            sub_signals.append(("LONG", 0.75, INDICATOR_WEIGHTS["bollinger"], "Price at/below lower Bollinger — mean reversion likely"))
        elif current_price >= bb_upper:
            sub_signals.append(("SHORT", 0.75, INDICATOR_WEIGHTS["bollinger"], "Price at/above upper Bollinger — mean reversion likely"))
        elif current_price > bb_middle and bb_bandwidth < 0.02:
            sub_signals.append(("LONG", 0.35, INDICATOR_WEIGHTS["bollinger"], "Bollinger squeeze — breakout pending"))
        else:
            sub_signals.append(("NEUTRAL", 0.20, INDICATOR_WEIGHTS["bollinger"], "Price within Bollinger bands"))

        # --- Support / Resistance ---
        nearest_support = sr_levels.get("nearest_support")
        nearest_resistance = sr_levels.get("nearest_resistance")

        if nearest_support and current_price <= nearest_support * 1.008:
            proximity_pct = abs(current_price - nearest_support) / current_price
            confidence = max(0.70 - proximity_pct * 10, 0.40)
            sub_signals.append(("LONG", confidence, INDICATOR_WEIGHTS["support_resistance"],
                                f"Near support {nearest_support:.4f} ({proximity_pct:.2%} away)"))
        elif nearest_resistance and current_price >= nearest_resistance * 0.992:
            proximity_pct = abs(current_price - nearest_resistance) / current_price
            confidence = max(0.70 - proximity_pct * 10, 0.40)
            sub_signals.append(("SHORT", confidence, INDICATOR_WEIGHTS["support_resistance"],
                                f"Near resistance {nearest_resistance:.4f} ({proximity_pct:.2%} away)"))

        # --- Order Blocks (Smart Money Concepts) ---
        bullish_obs = order_blocks.get("bullish", [])
        bearish_obs = order_blocks.get("bearish", [])

        if bullish_obs:
            last_bull_ob = bullish_obs[-1]
            ob_high = last_bull_ob.get("high", 0)
            if current_price <= ob_high * 1.005:
                sub_signals.append(("LONG", 0.75, INDICATOR_WEIGHTS["order_block"],
                                    f"Bullish OB at {last_bull_ob.get('low', 0):.4f}–{ob_high:.4f}"))

        if bearish_obs:
            last_bear_ob = bearish_obs[-1]
            ob_low = last_bear_ob.get("low", float("inf"))
            if current_price >= ob_low * 0.995:
                sub_signals.append(("SHORT", 0.75, INDICATOR_WEIGHTS["order_block"],
                                    f"Bearish OB at {ob_low:.4f}–{last_bear_ob.get('high', 0):.4f}"))

        # --- Fair Value Gaps ---
        bullish_fvgs = fvg_zones.get("bullish", [])
        bearish_fvgs = fvg_zones.get("bearish", [])

        if bullish_fvgs:
            sub_signals.append(("LONG", 0.60, INDICATOR_WEIGHTS["fvg"],
                                f"{len(bullish_fvgs)} bullish FVG(s) — price likely to fill gap upward"))
        if bearish_fvgs:
            sub_signals.append(("SHORT", 0.60, INDICATOR_WEIGHTS["fvg"],
                                f"{len(bearish_fvgs)} bearish FVG(s) — price likely to fill gap downward"))

        # --- Elliott Wave ---
        wave_count = elliott.get("wave_count")
        if wave_count:
            if wave_count in (2, 4):  # Corrective waves — expect impulse continuation
                sub_signals.append(("LONG", 0.55, INDICATOR_WEIGHTS["elliott_wave"],
                                    f"Elliott wave {wave_count} (corrective end — impulse expected)"))
            elif wave_count == 3:  # Strongest impulse wave — could be topping
                sub_signals.append(("SHORT", 0.45, INDICATOR_WEIGHTS["elliott_wave"],
                                    f"Elliott wave {wave_count} (impulse peak region)"))
            elif wave_count == 5:  # Terminal impulse — reversal setup
                sub_signals.append(("SHORT", 0.60, INDICATOR_WEIGHTS["elliott_wave"],
                                    f"Elliott wave 5 (terminal impulse — reversal likely)"))

        # Synthesize all sub-signals into final direction + confidence
        direction, confidence, reasoning = self._synthesize_weighted(sub_signals)

        # Compute levels using ATR (1.5x ATR stop, 2.5x ATR target = 1.67 R/R minimum)
        atr_multiplier_sl = 1.5
        atr_multiplier_tp = 2.5

        if direction == "LONG":
            stop_loss = current_price - atr_multiplier_sl * atr
            take_profit = current_price + atr_multiplier_tp * atr
        elif direction == "SHORT":
            stop_loss = current_price + atr_multiplier_sl * atr
            take_profit = current_price - atr_multiplier_tp * atr
        else:
            stop_loss = None
            take_profit = None

        sl_dist = abs(stop_loss - current_price) if stop_loss else 0
        tp_dist = abs(take_profit - current_price) if take_profit else 0
        risk_reward = round(tp_dist / sl_dist, 2) if sl_dist > 0 else None

        result = {
            "agent": self.name,
            "symbol": symbol,
            "timeframe": timeframe,
            "direction": direction,
            "confidence": round(confidence, 4),
            "entry_price": round(current_price, 8),
            "stop_loss": round(stop_loss, 8) if stop_loss else None,
            "take_profit": round(take_profit, 8) if take_profit else None,
            "risk_reward": risk_reward,
            "atr": round(atr, 8),
            "indicators": {
                "rsi": rsi_data,
                "bollinger": {k: round(v, 8) if isinstance(v, float) else v for k, v in bb_data.items()},
                "support_resistance": sr_levels,
                "order_blocks": {
                    "bullish_count": len(bullish_obs),
                    "bearish_count": len(bearish_obs),
                },
                "fvg": {
                    "bullish_count": len(bullish_fvgs),
                    "bearish_count": len(bearish_fvgs),
                },
                "elliott_wave": elliott,
            },
            "reasoning": reasoning,
            "signal_count": len(sub_signals),
        }

        await self.memory.store_decision(symbol, {
            "direction": direction,
            "confidence": confidence,
            "entry_price": current_price,
            "timeframe": timeframe,
        })

        return result

    def _synthesize_weighted(
        self, signals: list[tuple[str, float, float, str]]
    ) -> tuple[str, float, list[str]]:
        """Synthesize weighted sub-signals into a single conviction.

        Args:
            signals: List of (direction, raw_confidence, weight, label) tuples

        Returns:
            (direction, confidence, list_of_reasoning_labels)
        """
        if not signals:
            return "NEUTRAL", 0.0, []

        long_score = sum(c * w for d, c, w, _ in signals if d == "LONG")
        short_score = sum(c * w for d, c, w, _ in signals if d == "SHORT")
        total = long_score + short_score

        reasoning = [label for _, _, _, label in signals]

        if total == 0:
            return "NEUTRAL", 0.25, reasoning

        if long_score > short_score:
            # Require meaningful lead (avoid noise trades)
            lead = (long_score - short_score) / total
            if lead < 0.15:
                return "NEUTRAL", 0.35, reasoning
            return "LONG", round(min(long_score / total, 0.95), 4), reasoning
        elif short_score > long_score:
            lead = (short_score - long_score) / total
            if lead < 0.15:
                return "NEUTRAL", 0.35, reasoning
            return "SHORT", round(min(short_score / total, 0.95), 4), reasoning
        else:
            return "NEUTRAL", 0.50, reasoning

    def _compute_atr(
        self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray, period: int = 14
    ) -> float:
        """Compute Average True Range for volatility-based level sizing."""
        if len(highs) < period + 1:
            return float(np.mean(highs - lows))

        tr = np.maximum(
            highs[1:] - lows[1:],
            np.maximum(
                np.abs(highs[1:] - closes[:-1]),
                np.abs(lows[1:] - closes[:-1]),
            ),
        )
        return float(np.mean(tr[-period:]))


# Global singleton
technical_analyst = TechnicalAnalystAgent()
