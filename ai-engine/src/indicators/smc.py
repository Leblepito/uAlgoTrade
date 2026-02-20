"""Smart Money Concepts — Order Blocks and Fair Value Gaps (FVG)."""


def detect_order_blocks(candles: list[dict], lookback: int = 50) -> dict:
    """Detect bullish and bearish order blocks.

    An order block is the last opposing candle before a strong move:
    - Bullish OB: last bearish candle before a strong bullish move
    - Bearish OB: last bullish candle before a strong bearish move

    Returns:
        dict with 'bullish' and 'bearish' lists of order block zones
    """
    if len(candles) < 3:
        return {"bullish": [], "bearish": []}

    bullish_obs = []
    bearish_obs = []
    recent = candles[-lookback:] if len(candles) > lookback else candles

    for i in range(1, len(recent) - 1):
        prev = recent[i - 1]
        curr = recent[i]
        nxt = recent[i + 1]

        prev_body = prev["close"] - prev["open"]
        curr_body = curr["close"] - curr["open"]
        nxt_body = nxt["close"] - nxt["open"]

        # Bullish OB: bearish candle followed by strong bullish move
        if curr_body < 0 and nxt_body > 0 and abs(nxt_body) > abs(curr_body) * 1.5:
            bullish_obs.append({
                "high": curr["high"],
                "low": curr["low"],
                "index": i,
                "strength": abs(nxt_body) / abs(curr_body) if abs(curr_body) > 0 else 0,
            })

        # Bearish OB: bullish candle followed by strong bearish move
        if curr_body > 0 and nxt_body < 0 and abs(nxt_body) > abs(curr_body) * 1.5:
            bearish_obs.append({
                "high": curr["high"],
                "low": curr["low"],
                "index": i,
                "strength": abs(nxt_body) / abs(curr_body) if abs(curr_body) > 0 else 0,
            })

    return {
        "bullish": bullish_obs[-5:],
        "bearish": bearish_obs[-5:],
    }


def detect_fvg(candles: list[dict], lookback: int = 50) -> dict:
    """Detect Fair Value Gaps (FVG).

    FVG occurs when there's a gap between candle 1's high/low and candle 3's low/high,
    meaning candle 2's body doesn't fill the range.

    Returns:
        dict with 'bullish' and 'bearish' FVG zones
    """
    if len(candles) < 3:
        return {"bullish": [], "bearish": []}

    bullish_fvgs = []
    bearish_fvgs = []
    recent = candles[-lookback:] if len(candles) > lookback else candles

    for i in range(2, len(recent)):
        c1 = recent[i - 2]
        c2 = recent[i - 1]
        c3 = recent[i]

        # Bullish FVG: gap up — candle 3 low > candle 1 high
        if c3["low"] > c1["high"]:
            bullish_fvgs.append({
                "top": c3["low"],
                "bottom": c1["high"],
                "gap_size": c3["low"] - c1["high"],
                "index": i,
            })

        # Bearish FVG: gap down — candle 3 high < candle 1 low
        if c3["high"] < c1["low"]:
            bearish_fvgs.append({
                "top": c1["low"],
                "bottom": c3["high"],
                "gap_size": c1["low"] - c3["high"],
                "index": i,
            })

    return {
        "bullish": bullish_fvgs[-5:],
        "bearish": bearish_fvgs[-5:],
    }
