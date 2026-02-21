"""Base agent class — all agents inherit from this."""

from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from typing import Any

from .llm_provider import LLMProvider
from .models import AgentRole, AgentStepLog, SubTask, TaskStatus

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Every agent (orchestrator or subagent) extends this."""

    role: AgentRole
    name: str
    system_prompt: str

    def __init__(self, llm: LLMProvider):
        self.llm = llm
        self.logs: list[AgentStepLog] = []
        self.total_tokens: int = 0

    # ── Public interface ──────────────────────────────────

    async def run(self, task: SubTask) -> SubTask:
        """Execute the task and return the updated SubTask."""
        task.status = TaskStatus.running
        self._log("start", f"Starting: {task.instruction[:120]}")
        start = time.monotonic()

        try:
            result = await self.execute(task)
            task.result = result
            task.status = TaskStatus.completed
            self._log("done", f"Completed in {int((time.monotonic() - start) * 1000)}ms")
        except Exception as exc:
            task.status = TaskStatus.failed
            task.error = str(exc)
            self._log("error", f"Failed: {exc}")
            logger.exception("Agent %s failed on task %s", self.name, task.id)

        return task

    @abstractmethod
    async def execute(self, task: SubTask) -> Any:
        """Subclass implements actual logic here."""
        ...

    # ── LLM helpers ───────────────────────────────────────

    async def think(self, prompt: str) -> str:
        """Ask the LLM and get a text response."""
        resp = await self.llm.chat(
            system_prompt=self.system_prompt,
            user_message=prompt,
        )
        self.total_tokens += resp.tokens_used
        return resp.content

    async def think_json(self, prompt: str) -> dict:
        """Ask the LLM and get a parsed JSON response."""
        result = await self.llm.chat_json(
            system_prompt=self.system_prompt,
            user_message=prompt,
        )
        return result

    # ── Logging ───────────────────────────────────────────

    def _log(self, action: str, detail: str):
        entry = AgentStepLog(agent=self.name, role=self.role, action=action, detail=detail)
        self.logs.append(entry)
        logger.info("[%s] %s: %s", self.name, action, detail)
