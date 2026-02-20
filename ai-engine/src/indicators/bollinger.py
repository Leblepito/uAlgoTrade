"""Bollinger Bands indicator."""

import numpy as np


def compute_bollinger(closes: np.ndarray, period: int = 20, std_dev: float = 2.0) -> dict:
    """Compute Bollinger Bands.

    Returns:
        dict with 'upper', 'middle' (SMA), 'lower', 'bandwidth', 'percent_b'
    """
    if len(closes) < period:
        price = float(closes[-1]) if len(closes) > 0 else 0.0
        return {
            "upper": price,
            "middle": price,
            "lower": price,
            "bandwidth": 0.0,
            "percent_b": 0.5,
        }

    sma = float(np.mean(closes[-period:]))
    std = float(np.std(closes[-period:]))

    upper = sma + std_dev * std
    lower = sma - std_dev * std
    current_price = float(closes[-1])

    bandwidth = (upper - lower) / sma if sma > 0 else 0.0
    percent_b = (current_price - lower) / (upper - lower) if (upper - lower) > 0 else 0.5

    return {
        "upper": round(upper, 8),
        "middle": round(sma, 8),
        "lower": round(lower, 8),
        "bandwidth": round(bandwidth, 4),
        "percent_b": round(percent_b, 4),
    }
