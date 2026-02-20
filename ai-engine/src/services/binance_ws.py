"""Binance WebSocket client for real-time price data."""

import asyncio
import json
import logging
from collections import defaultdict

import httpx

from src.config import settings

logger = logging.getLogger(__name__)

# In-memory candle cache
_candle_cache: dict[str, list[dict]] = defaultdict(list)
_MAX_CANDLES = 500


async def get_recent_candles(symbol: str, interval: str = "1h", limit: int = 100) -> list[dict]:
    """Fetch recent candles from Binance REST API.

    Falls back to cache if available.
    """
    cached = _candle_cache.get(f"{symbol}_{interval}", [])
    if cached and len(cached) >= limit:
        return cached[-limit:]

    try:
        url = "https://api.binance.com/api/v3/klines"
        params = {"symbol": symbol, "interval": interval, "limit": limit}

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        candles = []
        for k in data:
            candles.append({
                "open_time": k[0],
                "open": float(k[1]),
                "high": float(k[2]),
                "low": float(k[3]),
                "close": float(k[4]),
                "volume": float(k[5]),
                "close_time": k[6],
            })

        # Update cache
        cache_key = f"{symbol}_{interval}"
        _candle_cache[cache_key] = candles[-_MAX_CANDLES:]

        return candles

    except Exception as e:
        logger.error(f"Failed to fetch candles for {symbol}: {e}")
        return cached[-limit:] if cached else []


async def get_current_price(symbol: str) -> float | None:
    """Get current price from Binance."""
    try:
        url = f"https://api.binance.com/api/v3/ticker/price?symbol={symbol}"
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return float(resp.json()["price"])
    except Exception as e:
        logger.error(f"Failed to get price for {symbol}: {e}")
        return None
