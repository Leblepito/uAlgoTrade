"""Optimization and performance endpoints."""

from fastapi import APIRouter, Query

from src.services.db import db_pool

router = APIRouter()


@router.post("/run")
async def run_optimization(strategy_id: str = "default"):
    """Trigger a quant lab optimization cycle."""
    from src.agents.quant_lab import quant_lab

    result = await quant_lab.run_optimization(strategy_id)
    return result


@router.get("/performance")
async def get_performance(
    days: int = Query(30, ge=1, le=365),
    strategy_id: str = "default",
):
    """Get performance metrics and equity curve."""
    snapshots = await db_pool.fetch(
        """SELECT * FROM ualgo_portfolio_snapshot
           WHERE snapshot_date >= CURRENT_DATE - $1::INTEGER
           ORDER BY snapshot_date ASC""",
        days,
    )

    if not snapshots:
        return {"strategy_id": strategy_id, "days": days, "data": []}

    data = []
    for s in snapshots:
        data.append({
            "date": s["snapshot_date"].isoformat(),
            "total_value": float(s["total_value"]),
            "total_pnl": float(s["total_pnl"]) if s["total_pnl"] else 0,
            "total_pnl_pct": float(s["total_pnl_pct"]) if s["total_pnl_pct"] else 0,
            "win_rate": float(s["win_rate"]) if s["win_rate"] else None,
            "sharpe_ratio": float(s["sharpe_ratio"]) if s["sharpe_ratio"] else None,
            "max_drawdown": float(s["max_drawdown"]) if s["max_drawdown"] else None,
        })

    return {"strategy_id": strategy_id, "days": days, "data": data}
