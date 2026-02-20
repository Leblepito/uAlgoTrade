"""Elliott Wave detection — simplified wave counting."""

import numpy as np


def detect_elliott_wave(closes: np.ndarray, min_wave_pct: float = 0.02) -> dict:
    """Detect Elliott Wave patterns using pivot-based wave counting.

    A simplified approach:
    1. Find local pivots (swing highs and lows)
    2. Count alternating waves
    3. Determine current wave position

    Returns:
        dict with 'wave_count', 'pivots', 'trend', 'current_wave_type'
    """
    if len(closes) < 20:
        return {"wave_count": 0, "pivots": [], "trend": "unknown", "current_wave_type": None}

    # Find pivots with a lookback window
    pivots = _find_pivots(closes, lookback=5)

    if len(pivots) < 3:
        return {"wave_count": 0, "pivots": pivots, "trend": "unknown", "current_wave_type": None}

    # Count waves: alternating higher/lower pivots
    waves = []
    for i in range(1, len(pivots)):
        prev = pivots[i - 1]
        curr = pivots[i]
        move_pct = abs(curr["price"] - prev["price"]) / prev["price"]

        if move_pct >= min_wave_pct:
            wave_type = "impulse" if curr["type"] != prev["type"] else "correction"
            waves.append({
                "from_price": prev["price"],
                "to_price": curr["price"],
                "type": wave_type,
                "move_pct": round(move_pct, 4),
            })

    # Current wave count (1-5 for impulse, A-B-C for correction)
    wave_count = len(waves) % 8  # Simplified: 5 impulse + 3 correction = 8
    if wave_count > 5:
        wave_count = wave_count - 5  # Correction phase (1=A, 2=B, 3=C)

    # Determine trend
    if len(pivots) >= 2:
        trend = "bullish" if pivots[-1]["price"] > pivots[-2]["price"] else "bearish"
    else:
        trend = "unknown"

    return {
        "wave_count": wave_count,
        "total_waves_detected": len(waves),
        "pivots": pivots[-10:],
        "trend": trend,
        "current_wave_type": "impulse" if wave_count <= 5 else "correction",
    }


def _find_pivots(closes: np.ndarray, lookback: int = 5) -> list[dict]:
    """Find swing highs and lows in the price series."""
    pivots = []

    for i in range(lookback, len(closes) - lookback):
        window = closes[i - lookback : i + lookback + 1]

        # Swing high
        if closes[i] == np.max(window):
            pivots.append({
                "index": i,
                "price": float(closes[i]),
                "type": "high",
            })
        # Swing low
        elif closes[i] == np.min(window):
            pivots.append({
                "index": i,
                "price": float(closes[i]),
                "type": "low",
            })

    return pivots
