"""Agent status and management endpoints."""

from fastapi import APIRouter

from src.models.agent_config import AgentInfo, AgentStatus, SwarmStatus
from src.services.db import db_pool

router = APIRouter()

AGENT_ROLES = {
    "alpha_scout": "Sentiment Hunter — RSS feeds, news analysis",
    "technical_analyst": "Technical Analysis — SMC, Elliott Wave, S/R, indicators",
    "risk_sentinel": "Risk Guardian — Portfolio protection, kill switch",
    "orchestrator": "The Brain — Consensus voting, signal aggregation",
    "quant_lab": "Optimizer — Nightly performance analysis, parameter tuning",
}


@router.get("/status", response_model=SwarmStatus)
async def get_swarm_status():
    """Get status of all agents in the swarm."""
    heartbeats = await db_pool.fetch(
        "SELECT * FROM ualgo_agent_heartbeat ORDER BY agent_name"
    )

    agents = []
    heartbeat_map = {row["agent_name"]: row for row in heartbeats}

    for name, role in AGENT_ROLES.items():
        hb = heartbeat_map.get(name)
        agents.append(AgentInfo(
            name=name,
            role=role,
            status=AgentStatus(hb["status"]) if hb else AgentStatus.DEAD,
            last_heartbeat=hb["last_heartbeat"] if hb else None,
            active_tasks=hb["active_tasks"] if hb else 0,
        ))

    today_signals = await db_pool.fetchval(
        "SELECT COUNT(*) FROM ualgo_signal WHERE created_at >= CURRENT_DATE"
    )
    active_positions = await db_pool.fetchval(
        "SELECT COUNT(*) FROM ualgo_position WHERE status = 'open'"
    )

    return SwarmStatus(
        agents=agents,
        total_signals_today=today_signals or 0,
        active_positions=active_positions or 0,
    )


@router.get("/heartbeat/{agent_name}")
async def get_agent_heartbeat(agent_name: str):
    """Get a specific agent's heartbeat info."""
    row = await db_pool.fetchrow(
        "SELECT * FROM ualgo_agent_heartbeat WHERE agent_name = $1",
        agent_name,
    )
    if not row:
        return {"error": "Agent not found", "agent_name": agent_name}
    return dict(row)
