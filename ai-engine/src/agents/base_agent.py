"""BaseAgent — Abstract base class for all AI agents."""

import logging
import time
from abc import ABC, abstractmethod
from datetime import datetime, timezone

from src.core.memory import MemoryCore
from src.core.message_bus import message_bus
from src.services.db import db_pool


class BaseAgent(ABC):
    """Abstract base for all agents in the swarm.

    Each agent has:
    - A name and role description
    - Persistent memory via MemoryCore
    - Access to the message bus for inter-agent communication
    - Heartbeat reporting for health monitoring
    """

    def __init__(self, name: str, role: str, version: str = "0.1.0"):
        self.name = name
        self.role = role
        self.version = version
        self.memory = MemoryCore(name)
        self.logger = logging.getLogger(f"agent.{name}")
        self._start_time = time.monotonic()
        self._active_tasks = 0

    @abstractmethod
    async def analyze(self, symbol: str, **kwargs) -> dict:
        """Run the agent's analysis for a given symbol. Must be implemented by subclasses."""

    async def heartbeat(self):
        """Report agent health to the database."""
        uptime = int(time.monotonic() - self._start_time)
        await db_pool.execute(
            """INSERT INTO ualgo_agent_heartbeat
               (agent_name, last_heartbeat, status, active_tasks, version, uptime_seconds)
               VALUES ($1, NOW(), 'alive', $2, $3, $4)
               ON CONFLICT (agent_name)
               DO UPDATE SET last_heartbeat = NOW(), status = 'alive',
                            active_tasks = $2, version = $3, uptime_seconds = $4""",
            self.name,
            self._active_tasks,
            self.version,
            uptime,
        )

    async def run_with_tracking(self, symbol: str, **kwargs) -> dict:
        """Wrapper that tracks task count and handles errors."""
        self._active_tasks += 1
        try:
            await self.heartbeat()
            result = await self.analyze(symbol, **kwargs)
            await message_bus.broadcast(
                sender=self.name,
                topic=f"analysis.{self.name}",
                payload={"symbol": symbol, "result": result},
            )
            return result
        except Exception as e:
            self.logger.error(f"Analysis error for {symbol}: {e}")
            await self.memory.store_error({
                "symbol": symbol,
                "error": str(e),
                "type": type(e).__name__,
            })
            return {"error": str(e), "agent": self.name, "symbol": symbol}
        finally:
            self._active_tasks -= 1
