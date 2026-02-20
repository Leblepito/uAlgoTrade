"""Signal and trade data models."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class SignalDirection(str, Enum):
    LONG = "LONG"
    SHORT = "SHORT"
    NEUTRAL = "NEUTRAL"


class SignalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTED = "executed"
    EXPIRED = "expired"


class VoteType(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    ABSTAIN = "abstain"


class Signal(BaseModel):
    id: int | None = None
    symbol: str
    direction: SignalDirection
    confidence: float = Field(ge=0.0, le=1.0)
    source_agent: str
    reasoning: dict = {}
    entry_price: float | None = None
    stop_loss: float | None = None
    take_profit: float | None = None
    risk_reward: float | None = None
    timeframe: str = "1h"
    strategy_id: str = "default"
    status: SignalStatus = SignalStatus.PENDING
    created_at: datetime | None = None


class ConsensusVote(BaseModel):
    signal_id: int
    agent_name: str
    vote: VoteType
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: dict = {}


class ConsensusResult(BaseModel):
    signal_id: int
    approved: bool
    total_votes: int
    approve_count: int
    reject_count: int
    abstain_count: int
    weighted_confidence: float
    votes: list[ConsensusVote] = []
