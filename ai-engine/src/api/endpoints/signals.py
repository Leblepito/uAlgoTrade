"""Signal scanning and retrieval endpoints."""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Query

from src.models.signal import Signal, SignalDirection, SignalStatus
from src.services.db import db_pool

router = APIRouter()


@router.post("/scan")
async def scan_signals(
    symbols: list[str] | None = None,
    strategy_id: str = "default",
):
    """Trigger a full agent scan cycle for given symbols."""
    from src.agents.orchestrator import orchestrator

    target_symbols = symbols or ["BTCUSDT", "ETHUSDT"]
    results = []

    for symbol in target_symbols:
        result = await orchestrator.run_scan_cycle(symbol, strategy_id)
        results.append(result)

    return {"scanned": len(results), "results": results}


@router.get("/recent")
async def get_recent_signals(
    limit: int = Query(20, ge=1, le=100),
    symbol: str | None = None,
    status: str | None = None,
):
    """Retrieve recent signals from the database."""
    query = "SELECT * FROM ualgo_signal WHERE 1=1"
    params = []
    idx = 1

    if symbol:
        query += f" AND symbol = ${idx}"
        params.append(symbol)
        idx += 1

    if status:
        query += f" AND status = ${idx}"
        params.append(status)
        idx += 1

    query += f" ORDER BY created_at DESC LIMIT ${idx}"
    params.append(limit)

    rows = await db_pool.fetch(query, *params)

    signals = []
    for row in rows:
        signals.append({
            "id": row["id"],
            "symbol": row["symbol"],
            "direction": row["direction"],
            "confidence": float(row["confidence"]) if row["confidence"] else None,
            "source_agent": row["source_agent"],
            "status": row["status"],
            "entry_price": float(row["entry_price"]) if row.get("entry_price") else None,
            "stop_loss": float(row["stop_loss"]) if row.get("stop_loss") else None,
            "take_profit": float(row["take_profit"]) if row.get("take_profit") else None,
            "timeframe": row.get("timeframe", "1h"),
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
        })

    return {"signals": signals, "count": len(signals)}
