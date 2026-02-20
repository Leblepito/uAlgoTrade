"""PrimeOrchestrator — The Brain: signal aggregation, consensus voting, final decision.

Role: The Brain
Mission: Coordinate all swarm agents. Aggregate their signals. Run consensus voting.
         Apply risk veto. Persist approved signals. Make the final call.

Decision cycle (6 steps):
1. Fetch candle data for symbol
2. Run AlphaScout (sentiment) + TechnicalAnalyst (price action) in parallel
3. Build candidate signal from technical analysis (primary) + sentiment (confirmation)
4. Risk Sentinel evaluation — can veto with kill switch authority
5. Collect consensus votes from all agents
6. Persist result, update signal status, store decision memory

Consensus logic:
- Risk Sentinel reject → always reject (hard veto)
- Otherwise: weighted vote (technical 40%, alpha 30%, risk 30%)
- Approve if weighted_confidence >= min_confidence threshold
"""

import asyncio
import json
import logging
from collections import deque
from datetime import datetime, timezone

from src.agents.base_agent import BaseAgent
from src.core.decision_engine import decision_engine
from src.core.message_bus import message_bus
from src.models.signal import ConsensusVote, Signal, SignalDirection, SignalStatus, VoteType
from src.services.db import db_pool

logger = logging.getLogger(__name__)

# Minimum weighted confidence for signal approval
MIN_CONSENSUS_CONFIDENCE = 0.55


class PrimeOrchestrator(BaseAgent):
    """The Brain of the agent swarm — orchestrates the full signal generation cycle.

    Runs analysis cycles on demand or via the scan loop scheduler.
    Each cycle produces either an approved or rejected signal with full audit trail.
    """

    def __init__(self):
        super().__init__(
            name="orchestrator",
            role="The Brain — Consensus voting, signal aggregation, final decision",
            version="1.3.0",
        )
        self._cycles_run: int = 0
        self._signals_approved: int = 0
        self._signals_rejected: int = 0
        self._task_log: deque[dict] = deque(maxlen=50)

    async def analyze(self, symbol: str, **kwargs) -> dict:
        """Lightweight entry point for BaseAgent compatibility.

        Args:
            symbol: Trading pair e.g. 'BTCUSDT'
            **kwargs: strategy_id (str), timeframe (str)
        """
        return await self.run_scan_cycle(
            symbol=symbol,
            strategy_id=kwargs.get("strategy_id", "default"),
            timeframe=kwargs.get("timeframe", "1h"),
        )

    async def run_scan_cycle(
        self, symbol: str, strategy_id: str = "default", timeframe: str = "1h"
    ) -> dict:
        """Full orchestration cycle for one symbol.

        Returns a result dict describing the decision, or a skip reason.
        """
        self._cycles_run += 1
        cycle_start = datetime.now(timezone.utc)
        logger.info(
            f"[{self.name}] cycle #{self._cycles_run}: {symbol} "
            f"(strategy={strategy_id}, tf={timeframe})"
        )

        # Step 1: Fetch candle data
        candles = await self._get_candles(symbol, timeframe=timeframe)

        # Step 2: Run Alpha Scout + Technical Analyst in parallel
        from src.agents.alpha_scout import alpha_scout
        from src.agents.risk_sentinel import risk_sentinel
        from src.agents.technical_analyst import technical_analyst

        alpha_result, tech_result = await asyncio.gather(
            alpha_scout.run_with_tracking(symbol, include_macro=True),
            technical_analyst.run_with_tracking(symbol, candles=candles, timeframe=timeframe),
        )

        # Step 3: Evaluate technical result — it's the primary signal source
        if tech_result.get("error"):
            return {
                "symbol": symbol,
                "action": "skip",
                "reason": f"Technical analysis error: {tech_result['error']}",
                "cycle": self._cycles_run,
                "timestamp": cycle_start.isoformat(),
            }

        direction = tech_result.get("direction", "NEUTRAL")
        tech_confidence = tech_result.get("confidence", 0.5)

        # Skip neutral signals early — no point in consensus voting
        if direction == "NEUTRAL" and tech_confidence < 0.4:
            return {
                "symbol": symbol,
                "action": "skip",
                "reason": f"No clear direction (direction={direction}, confidence={tech_confidence:.2%})",
                "cycle": self._cycles_run,
                "timestamp": cycle_start.isoformat(),
            }

        # Sentiment confirmation: if alpha strongly disagrees with direction, reduce confidence
        alpha_direction = alpha_result.get("direction", "NEUTRAL")
        alpha_confidence = alpha_result.get("confidence", 0.3)
        sentiment_agreement = alpha_direction == direction

        # Confidence blend: 70% technical, 30% sentiment
        if sentiment_agreement or alpha_direction == "NEUTRAL":
            blended_confidence = tech_confidence * 0.70 + alpha_confidence * 0.30
        else:
            # Disagreement: penalize confidence
            blended_confidence = tech_confidence * 0.70 - alpha_confidence * 0.15

        blended_confidence = max(0.0, min(0.95, blended_confidence))

        # Step 4: Build candidate signal
        signal = Signal(
            symbol=symbol,
            direction=SignalDirection(direction),
            confidence=blended_confidence,
            source_agent="orchestrator",
            entry_price=tech_result.get("entry_price"),
            stop_loss=tech_result.get("stop_loss"),
            take_profit=tech_result.get("take_profit"),
            risk_reward=tech_result.get("risk_reward"),
            strategy_id=strategy_id,
            timeframe=timeframe,
            reasoning={
                "technical": tech_result.get("reasoning", [])[:5],
                "sentiment": {
                    "score": alpha_result.get("sentiment_score", 0),
                    "direction": alpha_direction,
                    "regime": alpha_result.get("market_regime", "UNKNOWN"),
                    "summary": alpha_result.get("summary", ""),
                },
                "confidence_blend": {
                    "technical": round(tech_confidence, 4),
                    "sentiment": round(alpha_confidence, 4),
                    "blended": round(blended_confidence, 4),
                    "sentiment_agreement": sentiment_agreement,
                },
            },
        )

        # Persist candidate signal to DB (status='pending')
        signal_id = await self._persist_signal(signal)
        signal.id = signal_id

        # Step 5: Risk Sentinel evaluation (hard veto authority)
        risk_result = await risk_sentinel.run_with_tracking(
            symbol,
            proposed_signal={
                "direction": direction,
                "entry_price": signal.entry_price,
                "stop_loss": signal.stop_loss,
                "quantity": self._compute_position_size(signal, risk_result_placeholder=None),
            },
        )

        # Kill switch: immediate reject without consensus
        if risk_result.get("kill_switch_active", False):
            await self._update_signal_status(signal_id, "rejected")
            self._signals_rejected += 1
            return {
                "symbol": symbol,
                "signal_id": signal_id,
                "action": "reject",
                "reason": "Kill switch active",
                "kill_switch": True,
                "risk_flags": risk_result.get("risk_flags", []),
                "cycle": self._cycles_run,
                "timestamp": cycle_start.isoformat(),
            }

        # Step 6: Collect consensus votes
        votes = [
            ConsensusVote(
                signal_id=signal_id,
                agent_name="alpha_scout",
                vote=VoteType.APPROVE if sentiment_agreement else VoteType.ABSTAIN,
                confidence=alpha_confidence,
                reasoning={
                    "sentiment_score": alpha_result.get("sentiment_score", 0),
                    "market_regime": alpha_result.get("market_regime", "UNKNOWN"),
                },
            ),
            ConsensusVote(
                signal_id=signal_id,
                agent_name="technical_analyst",
                vote=VoteType.APPROVE,
                confidence=tech_confidence,
                reasoning={
                    "indicators": tech_result.get("reasoning", [])[:3],
                    "atr": tech_result.get("atr"),
                    "signal_count": tech_result.get("signal_count", 0),
                },
            ),
            ConsensusVote(
                signal_id=signal_id,
                agent_name="risk_sentinel",
                vote=VoteType(risk_result.get("vote", "approve")),
                confidence=risk_result.get("confidence", 0.5),
                reasoning={
                    "risk_score": risk_result.get("risk_score", 0),
                    "flags": risk_result.get("risk_flags", []),
                },
            ),
        ]

        consensus = await decision_engine.collect_votes(signal, votes)

        # Override: require minimum confidence even if votes approve
        if consensus.approved and consensus.weighted_confidence < MIN_CONSENSUS_CONFIDENCE:
            consensus.approved = False
            logger.info(
                f"[{self.name}] signal {signal_id} overridden: "
                f"confidence {consensus.weighted_confidence:.2%} < {MIN_CONSENSUS_CONFIDENCE:.2%} threshold"
            )

        # Step 7: Update signal status
        new_status = "approved" if consensus.approved else "rejected"
        await self._update_signal_status(signal_id, new_status)

        if consensus.approved:
            self._signals_approved += 1
        else:
            self._signals_rejected += 1

        # Store decision in persistent memory
        await self.memory.store_decision(symbol, {
            "signal_id": signal_id,
            "direction": direction,
            "approved": consensus.approved,
            "weighted_confidence": consensus.weighted_confidence,
            "blended_confidence": blended_confidence,
            "risk_flags": risk_result.get("risk_flags", []),
            "sentiment_agreement": sentiment_agreement,
            "cycle": self._cycles_run,
        }, importance=0.8)

        cycle_duration_ms = int((datetime.now(timezone.utc) - cycle_start).total_seconds() * 1000)

        result = {
            "symbol": symbol,
            "signal_id": signal_id,
            "direction": direction,
            "action": "execute" if consensus.approved else "reject",
            "confidence": consensus.weighted_confidence,
            "blended_confidence": blended_confidence,
            "entry_price": signal.entry_price,
            "stop_loss": signal.stop_loss,
            "take_profit": signal.take_profit,
            "risk_reward": signal.risk_reward,
            "timeframe": timeframe,
            "consensus": {
                "approved": consensus.approved,
                "approve_count": consensus.approve_count,
                "reject_count": consensus.reject_count,
                "weighted_confidence": consensus.weighted_confidence,
                "min_required": MIN_CONSENSUS_CONFIDENCE,
            },
            "risk": {
                "score": risk_result.get("risk_score", 0),
                "flags": risk_result.get("risk_flags", []),
                "kill_switch": risk_result.get("kill_switch_active", False),
            },
            "sentiment": {
                "direction": alpha_direction,
                "score": alpha_result.get("sentiment_score", 0),
                "regime": alpha_result.get("market_regime", "UNKNOWN"),
                "agreement": sentiment_agreement,
            },
            "cycle": self._cycles_run,
            "duration_ms": cycle_duration_ms,
            "timestamp": cycle_start.isoformat(),
        }

        logger.info(
            f"[{self.name}] {symbol}: {result['action'].upper()} "
            f"(confidence={consensus.weighted_confidence:.2%}, "
            f"risk_score={risk_result.get('risk_score', 0):.2f}, "
            f"{cycle_duration_ms}ms)"
        )

        # Record in task log for audit trail
        self._task_log.append({
            "cycle": self._cycles_run,
            "symbol": symbol,
            "direction": direction,
            "action": result["action"],
            "confidence": consensus.weighted_confidence,
            "risk_score": risk_result.get("risk_score", 0),
            "duration_ms": cycle_duration_ms,
            "timestamp": cycle_start.isoformat(),
        })

        # Notify risk sentinel of trade execution for daily counter
        if consensus.approved:
            risk_sentinel.record_trade_executed()

        return result

    def _compute_position_size(self, signal: Signal, risk_result_placeholder) -> float:
        """Compute position quantity using fixed fractional sizing (placeholder).

        In production: use portfolio value from risk_sentinel + max_risk_per_trade.
        """
        # Default micro-size for safety — real implementation queries portfolio
        return 0.01

    async def _persist_signal(self, signal: Signal) -> int:
        """Insert a pending signal into the database and return its ID."""
        return await db_pool.fetchval(
            """INSERT INTO ualgo_signal
               (symbol, direction, confidence, source_agent, reasoning, status,
                strategy_id, timeframe, entry_price, stop_loss, take_profit, risk_reward)
               VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12)
               RETURNING id""",
            signal.symbol,
            signal.direction.value,
            signal.confidence,
            signal.source_agent,
            json.dumps(signal.reasoning),
            "pending",
            signal.strategy_id,
            signal.timeframe,
            signal.entry_price,
            signal.stop_loss,
            signal.take_profit,
            signal.risk_reward,
        )

    async def _update_signal_status(self, signal_id: int, status: str):
        """Update signal status in the database."""
        await db_pool.execute(
            "UPDATE ualgo_signal SET status = $1 WHERE id = $2",
            status,
            signal_id,
        )

    async def _get_candles(
        self, symbol: str, timeframe: str = "1h", limit: int = 100
    ) -> list[dict]:
        """Fetch OHLCV candle data from Binance via the binance_ws service."""
        try:
            from src.services.binance_ws import get_recent_candles
            return await get_recent_candles(symbol, timeframe=timeframe, limit=limit)
        except Exception as e:
            logger.warning(f"[{self.name}] candle fetch failed for {symbol}: {e}")
            return []

    def get_cycle_stats(self) -> dict:
        """Return orchestrator performance statistics."""
        total = self._signals_approved + self._signals_rejected
        return {
            "cycles_run": self._cycles_run,
            "signals_approved": self._signals_approved,
            "signals_rejected": self._signals_rejected,
            "approval_rate": round(self._signals_approved / total, 3) if total > 0 else 0,
            "min_consensus_confidence": MIN_CONSENSUS_CONFIDENCE,
        }

    def get_task_log(self, limit: int = 20) -> list[dict]:
        """Return recent cycle log entries for audit/debugging."""
        entries = list(self._task_log)
        return entries[-limit:]


# Global singleton
orchestrator = PrimeOrchestrator()
