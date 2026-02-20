"""Agent configuration and status models."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class AgentStatus(str, Enum):
    ALIVE = "alive"
    DEGRADED = "degraded"
    DEAD = "dead"


class AgentHeartbeat(BaseModel):
    agent_name: str
    status: AgentStatus = AgentStatus.ALIVE
    last_heartbeat: datetime | None = None
    cpu_usage: float | None = None
    memory_mb: int | None = None
    active_tasks: int = 0
    version: str = "0.1.0"
    uptime_seconds: int = 0


class AgentInfo(BaseModel):
    name: str
    role: str
    status: AgentStatus
    last_heartbeat: datetime | None = None
    scan_interval: int = 60
    signals_generated: int = 0


class SwarmStatus(BaseModel):
    agents: list[AgentInfo]
    total_signals_today: int = 0
    active_positions: int = 0
    kill_switch_active: bool = False
    last_scan: datetime | None = None
