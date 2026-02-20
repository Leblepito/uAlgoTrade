"""MemoryCore — Agent long-term decision memory with DB persistence."""

import json
from datetime import datetime, timezone

from src.services.db import db_pool


class MemoryCore:
    """Persistent agent memory backed by PostgreSQL.

    Stores decisions, learnings, patterns, and errors with optional TTL.
    """

    def __init__(self, agent_name: str):
        self.agent_name = agent_name

    async def store(
        self,
        memory_type: str,
        content: dict,
        symbol: str | None = None,
        importance: float = 0.5,
        ttl_hours: int | None = None,
    ) -> int:
        """Store a memory entry. Returns the memory ID."""
        row_id = await db_pool.fetchval(
            """INSERT INTO ualgo_agent_memory
               (agent_name, memory_type, symbol, content, importance, ttl_hours)
               VALUES ($1, $2, $3, $4::jsonb, $5, $6)
               RETURNING id""",
            self.agent_name,
            memory_type,
            symbol,
            json.dumps(content),
            importance,
            ttl_hours,
        )
        return row_id

    async def recall(
        self,
        memory_type: str | None = None,
        symbol: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Recall recent memories, optionally filtered by type and symbol."""
        query = """
            SELECT id, memory_type, symbol, content, importance, created_at
            FROM ualgo_agent_memory
            WHERE agent_name = $1
              AND (expires_at IS NULL OR expires_at > NOW())
        """
        params: list = [self.agent_name]
        idx = 2

        if memory_type:
            query += f" AND memory_type = ${idx}"
            params.append(memory_type)
            idx += 1

        if symbol:
            query += f" AND symbol = ${idx}"
            params.append(symbol)
            idx += 1

        query += f" ORDER BY importance DESC, created_at DESC LIMIT ${idx}"
        params.append(limit)

        rows = await db_pool.fetch(query, *params)
        return [
            {
                "id": r["id"],
                "type": r["memory_type"],
                "symbol": r["symbol"],
                "content": r["content"],
                "importance": float(r["importance"]),
                "created_at": r["created_at"].isoformat(),
            }
            for r in rows
        ]

    async def store_decision(self, symbol: str, decision: dict, importance: float = 0.7):
        """Shortcut to store a trading decision."""
        return await self.store("decision", decision, symbol=symbol, importance=importance)

    async def store_learning(self, content: dict, ttl_hours: int = 168):
        """Store a learning with 1-week default TTL."""
        return await self.store("learning", content, ttl_hours=ttl_hours)

    async def store_error(self, error: dict, ttl_hours: int = 72):
        """Store an error with 3-day default TTL."""
        return await self.store("error", error, importance=0.3, ttl_hours=ttl_hours)

    async def get_recent_decisions(self, symbol: str, limit: int = 5) -> list[dict]:
        """Get recent decisions for a specific symbol."""
        return await self.recall(memory_type="decision", symbol=symbol, limit=limit)

    async def summarize_decisions(self, symbol: str, limit: int = 20) -> dict:
        """Summarize recent decisions for a symbol — approval rate, avg confidence, patterns.

        Inspired by AAnti cross-learning pattern: distill N decisions into actionable summary.
        """
        decisions = await self.recall(memory_type="decision", symbol=symbol, limit=limit)
        if not decisions:
            return {"symbol": symbol, "count": 0, "summary": "No decision history"}

        approved = 0
        rejected = 0
        confidences = []
        risk_flags_all: list[str] = []

        for d in decisions:
            content = d.get("content", {})
            if isinstance(content, str):
                try:
                    content = json.loads(content)
                except (json.JSONDecodeError, TypeError):
                    continue
            if content.get("approved"):
                approved += 1
            else:
                rejected += 1
            if content.get("weighted_confidence"):
                confidences.append(float(content["weighted_confidence"]))
            for flag in content.get("risk_flags", []):
                risk_flags_all.append(flag.split("(")[0].strip())

        total = approved + rejected
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        # Find most common risk flags
        flag_counts: dict[str, int] = {}
        for f in risk_flags_all:
            flag_counts[f] = flag_counts.get(f, 0) + 1
        top_flags = sorted(flag_counts.items(), key=lambda x: x[1], reverse=True)[:3]

        return {
            "symbol": symbol,
            "count": total,
            "approved": approved,
            "rejected": rejected,
            "approval_rate": round(approved / total, 3) if total > 0 else 0,
            "avg_confidence": round(avg_confidence, 4),
            "top_risk_flags": [{"flag": f, "count": c} for f, c in top_flags],
            "period_start": decisions[-1].get("created_at") if decisions else None,
            "period_end": decisions[0].get("created_at") if decisions else None,
        }
