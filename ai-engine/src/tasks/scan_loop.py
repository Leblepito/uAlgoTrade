"""Scan loop — manual trigger for running full agent cycles."""

import logging

from src.agents.orchestrator import orchestrator
from src.config import settings

logger = logging.getLogger(__name__)


async def run_full_scan(symbols: list[str] | None = None, strategy_id: str = "default") -> list[dict]:
    """Run a full scan cycle for given symbols (or defaults)."""
    target_symbols = symbols or settings.default_symbols
    results = []

    for symbol in target_symbols:
        try:
            result = await orchestrator.run_scan_cycle(symbol, strategy_id)
            results.append(result)
        except Exception as e:
            logger.error(f"Scan failed for {symbol}: {e}")
            results.append({"symbol": symbol, "error": str(e)})

    return results
