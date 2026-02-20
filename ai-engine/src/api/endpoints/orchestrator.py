"""Orchestration endpoints — trigger consensus cycles."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/run")
async def run_orchestration(
    symbol: str = "BTCUSDT",
    strategy_id: str = "default",
):
    """Manually trigger an orchestration cycle for a symbol."""
    from src.agents.orchestrator import orchestrator

    result = await orchestrator.run_scan_cycle(symbol, strategy_id)
    return result


@router.get("/consensus/{signal_id}")
async def get_consensus(signal_id: int):
    """Get consensus voting details for a specific signal."""
    from src.services.db import db_pool

    votes = await db_pool.fetch(
        "SELECT * FROM ualgo_consensus_vote WHERE signal_id = $1 ORDER BY created_at",
        signal_id,
    )

    return {
        "signal_id": signal_id,
        "votes": [
            {
                "agent_name": v["agent_name"],
                "vote": v["vote"],
                "confidence": float(v["confidence"]) if v["confidence"] else None,
                "reasoning": v["reasoning"],
                "created_at": v["created_at"].isoformat(),
            }
            for v in votes
        ],
        "total": len(votes),
    }
