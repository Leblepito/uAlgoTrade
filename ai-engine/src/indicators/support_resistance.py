"""Support and Resistance level detection using pivot points."""

import numpy as np


def detect_support_resistance(
    highs: np.ndarray,
    lows: np.ndarray,
    closes: np.ndarray,
    lookback: int = 5,
) -> dict:
    """Detect support and resistance levels using local pivot highs/lows.

    Returns:
        dict with 'supports', 'resistances', 'nearest_support', 'nearest_resistance'
    """
    if len(highs) < lookback * 2 + 1:
        return {
            "supports": [],
            "resistances": [],
            "nearest_support": None,
            "nearest_resistance": None,
        }

    supports = []
    resistances = []

    for i in range(lookback, len(lows) - lookback):
        # Pivot low (support)
        if lows[i] == np.min(lows[i - lookback : i + lookback + 1]):
            supports.append(float(lows[i]))

        # Pivot high (resistance)
        if highs[i] == np.max(highs[i - lookback : i + lookback + 1]):
            resistances.append(float(highs[i]))

    current_price = float(closes[-1])

    # Find nearest levels
    supports_below = [s for s in supports if s < current_price]
    resistances_above = [r for r in resistances if r > current_price]

    nearest_support = max(supports_below) if supports_below else None
    nearest_resistance = min(resistances_above) if resistances_above else None

    return {
        "supports": sorted(set(round(s, 8) for s in supports[-10:]))[:5],
        "resistances": sorted(set(round(r, 8) for r in resistances[-10:]))[:5],
        "nearest_support": round(nearest_support, 8) if nearest_support else None,
        "nearest_resistance": round(nearest_resistance, 8) if nearest_resistance else None,
    }
