"""DecisionEngine — Consensus voting and final signal approval."""

import json
import logging

from src.models.signal import ConsensusResult, ConsensusVote, Signal, VoteType
from src.services.db import db_pool

logger = logging.getLogger(__name__)


class DecisionEngine:
    """Manages consensus voting among agents for signal approval."""

    # Weight each agent's vote
    AGENT_WEIGHTS = {
        "alpha_scout": 0.20,
        "technical_analyst": 0.35,
        "risk_sentinel": 0.30,
        "orchestrator": 0.15,
    }

    def __init__(self, min_confidence: float = 0.7):
        self.min_confidence = min_confidence

    async def collect_votes(self, signal: Signal, votes: list[ConsensusVote]) -> ConsensusResult:
        """Process votes and determine if a signal is approved."""
        approve_count = sum(1 for v in votes if v.vote == VoteType.APPROVE)
        reject_count = sum(1 for v in votes if v.vote == VoteType.REJECT)
        abstain_count = sum(1 for v in votes if v.vote == VoteType.ABSTAIN)

        # Weighted confidence calculation
        weighted_sum = 0.0
        weight_total = 0.0
        for vote in votes:
            if vote.vote == VoteType.ABSTAIN:
                continue
            w = self.AGENT_WEIGHTS.get(vote.agent_name, 0.1)
            score = vote.confidence if vote.vote == VoteType.APPROVE else (1 - vote.confidence)
            weighted_sum += score * w
            weight_total += w

        weighted_confidence = weighted_sum / weight_total if weight_total > 0 else 0.0

        # Risk sentinel has veto power
        risk_vote = next((v for v in votes if v.agent_name == "risk_sentinel"), None)
        risk_veto = risk_vote and risk_vote.vote == VoteType.REJECT and risk_vote.confidence > 0.8

        approved = (
            weighted_confidence >= self.min_confidence
            and approve_count > reject_count
            and not risk_veto
        )

        result = ConsensusResult(
            signal_id=signal.id or 0,
            approved=approved,
            total_votes=len(votes),
            approve_count=approve_count,
            reject_count=reject_count,
            abstain_count=abstain_count,
            weighted_confidence=round(weighted_confidence, 4),
            votes=votes,
        )

        # Persist votes to database
        if signal.id:
            await self._persist_votes(signal.id, votes)

        logger.info(
            f"Consensus for {signal.symbol}: "
            f"{'APPROVED' if approved else 'REJECTED'} "
            f"(confidence={weighted_confidence:.2%}, veto={risk_veto})"
        )

        return result

    async def _persist_votes(self, signal_id: int, votes: list[ConsensusVote]):
        """Store individual votes in the database."""
        for vote in votes:
            await db_pool.execute(
                """INSERT INTO ualgo_consensus_vote
                   (signal_id, agent_name, vote, confidence, reasoning)
                   VALUES ($1, $2, $3, $4, $5::jsonb)""",
                signal_id,
                vote.agent_name,
                vote.vote.value,
                vote.confidence,
                json.dumps(vote.reasoning),
            )


decision_engine = DecisionEngine()
