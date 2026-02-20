"""MessageBus — Inter-agent communication via in-process pub/sub."""

import asyncio
import logging
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine

logger = logging.getLogger(__name__)


@dataclass
class AgentMessage:
    """Message passed between agents."""
    sender: str
    topic: str
    payload: dict[str, Any]
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    priority: int = 0  # higher = more important


class MessageBus:
    """Simple async pub/sub bus for agent communication."""

    def __init__(self):
        self._subscribers: dict[str, list[Callable]] = defaultdict(list)
        self._message_log: list[AgentMessage] = []
        self._max_log_size = 1000

    def subscribe(self, topic: str, handler: Callable[[AgentMessage], Coroutine]):
        """Subscribe a handler to a topic."""
        self._subscribers[topic].append(handler)

    def unsubscribe(self, topic: str, handler: Callable):
        """Remove a handler from a topic."""
        if handler in self._subscribers[topic]:
            self._subscribers[topic].remove(handler)

    async def publish(self, message: AgentMessage):
        """Publish a message to all subscribers of its topic."""
        self._message_log.append(message)
        if len(self._message_log) > self._max_log_size:
            self._message_log = self._message_log[-self._max_log_size:]

        handlers = self._subscribers.get(message.topic, [])
        for handler in handlers:
            try:
                await handler(message)
            except Exception as e:
                logger.error(f"Handler error on topic '{message.topic}': {e}")

    async def broadcast(self, sender: str, topic: str, payload: dict):
        """Convenience method to create and publish a message."""
        msg = AgentMessage(sender=sender, topic=topic, payload=payload)
        await self.publish(msg)

    def get_recent_messages(self, topic: str | None = None, limit: int = 20) -> list[dict]:
        """Get recent messages, optionally filtered by topic."""
        msgs = self._message_log
        if topic:
            msgs = [m for m in msgs if m.topic == topic]
        return [
            {
                "sender": m.sender,
                "topic": m.topic,
                "payload": m.payload,
                "timestamp": m.timestamp.isoformat(),
            }
            for m in msgs[-limit:]
        ]


# Global singleton
message_bus = MessageBus()
