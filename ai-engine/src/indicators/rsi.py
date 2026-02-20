"""RSI (Relative Strength Index) indicator."""

import numpy as np


def compute_rsi(closes: np.ndarray, period: int = 14) -> dict:
    """Compute RSI for a price series.

    Returns:
        dict with 'values' (full RSI series), 'current' (last value),
        'overbought' (bool), 'oversold' (bool)
    """
    if len(closes) < period + 1:
        return {"values": [], "current": 50.0, "overbought": False, "oversold": False}

    deltas = np.diff(closes)
    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)

    # Initial averages
    avg_gain = np.mean(gains[:period])
    avg_loss = np.mean(losses[:period])

    rsi_values = []
    for i in range(period, len(deltas)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

        if avg_loss == 0:
            rsi_values.append(100.0)
        else:
            rs = avg_gain / avg_loss
            rsi_values.append(100.0 - (100.0 / (1.0 + rs)))

    current = rsi_values[-1] if rsi_values else 50.0

    return {
        "values": [round(v, 2) for v in rsi_values[-20:]],
        "current": round(current, 2),
        "overbought": current > 70,
        "oversold": current < 30,
    }
