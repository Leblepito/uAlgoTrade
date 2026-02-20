"""Quant Lab Agent — Nightly performance optimization, parameter tuning, and learning.

Role: Optimizer
Mission: Run nightly analysis on trading performance and agent behavior.
         Generate actionable recommendations to improve signal quality, risk management,
         and agent calibration. Store learnings for long-term system evolution.

Analysis pipeline:
1. Compute 30-day trading performance (win rate, Sharpe, drawdown, Calmar ratio)
2. Analyze per-agent voting accuracy vs realized outcomes
3. Detect regime changes and strategy drift
4. Generate parameter tuning recommendations
5. Create daily portfolio snapshot
6. Store structured learnings in persistent memory
"""

import logging
from datetime import datetime, timezone
from typing import Optional

import numpy as np

from src.agents.base_agent import BaseAgent
from src.services.db import db_pool

logger = logging.getLogger(__name__)


class QuantLabAgent(BaseAgent):
    """Optimizer agent — analyzes performance and generates tuning recommendations.

    Runs nightly (or on manual trigger) to evaluate:
    - Trading performance: win rate, PnL, Sharpe ratio, Calmar ratio, max drawdown
    - Agent accuracy: how well each agent's votes predicted signal outcomes
    - Strategy health: signal volume, direction balance, confidence calibration
    - System recommendations: actionable parameter changes with expected impact
    """

    def __init__(self):
        super().__init__(
            name="quant_lab",
            role="Optimizer — Performance analysis, Sharpe/Calmar metrics, agent calibration",
            version="1.2.0",
        )
        self._optimization_count: int = 0

    async def analyze(self, symbol: str, **kwargs) -> dict:
        """Run optimization analysis (lightweight entry point).

        Args:
            symbol: Ignored (optimization is portfolio-wide, not symbol-specific)
            **kwargs:
                strategy_id: str (default 'default')
                days: int (lookback window, default 30)
        """
        strategy_id = kwargs.get("strategy_id", "default")
        days = kwargs.get("days", 30)
        return await self.run_optimization(strategy_id=strategy_id, lookback_days=days)

    async def run_optimization(
        self, strategy_id: str = "default", lookback_days: int = 30
    ) -> dict:
        """Full optimization cycle — performance, accuracy, recommendations, snapshot."""
        self._optimization_count += 1
        start_ts = datetime.now(timezone.utc)
        logger.info(
            f"[{self.name}] optimization #{self._optimization_count} "
            f"(strategy={strategy_id}, lookback={lookback_days}d)"
        )

        # Run all analyses
        performance = await self._compute_performance(strategy_id, lookback_days)
        agent_accuracy = await self._analyze_agent_accuracy(lookback_days=7)
        signal_health = await self._analyze_signal_health(lookback_days)
        regime = self._classify_regime(performance)
        recommendations = self._generate_recommendations(performance, agent_accuracy, signal_health)
        await self._create_snapshot(performance)

        # Store structured learning in persistent memory
        learning_payload = {
            "strategy_id": strategy_id,
            "lookback_days": lookback_days,
            "optimization_number": self._optimization_count,
            "performance": performance,
            "agent_accuracy": agent_accuracy,
            "signal_health": signal_health,
            "regime": regime,
            "recommendations": recommendations,
        }
        await self.memory.store_learning(learning_payload)

        duration_ms = int((datetime.now(timezone.utc) - start_ts).total_seconds() * 1000)

        result = {
            "agent": self.name,
            "strategy_id": strategy_id,
            "lookback_days": lookback_days,
            "performance": performance,
            "agent_accuracy": agent_accuracy,
            "signal_health": signal_health,
            "regime": regime,
            "recommendations": recommendations,
            "snapshot_created": True,
            "optimization_number": self._optimization_count,
            "duration_ms": duration_ms,
            "timestamp": start_ts.isoformat(),
        }

        logger.info(
            f"[{self.name}] optimization complete: "
            f"win_rate={performance.get('win_rate', 0):.1%}, "
            f"sharpe={performance.get('sharpe_ratio') or 'N/A'}, "
            f"{len(recommendations)} recommendations"
        )
        return result

    async def _compute_performance(self, strategy_id: str, lookback_days: int) -> dict:
        """Compute comprehensive trading performance from closed positions."""
        try:
            rows = await db_pool.fetch(
                """SELECT entry_price, current_price, side, quantity, unrealized_pnl,
                          closed_at, opened_at
                   FROM ualgo_position
                   WHERE strategy_id = $1 AND status = 'closed'
                   AND closed_at >= NOW() - INTERVAL '1 day' * $2
                   ORDER BY closed_at""",
                strategy_id,
                lookback_days,
            )
        except Exception as e:
            logger.error(f"[{self.name}] performance query failed: {e}")
            rows = []

        if not rows:
            return {
                "total_trades": 0,
                "winning_trades": 0,
                "losing_trades": 0,
                "win_rate": 0.0,
                "total_pnl": 0.0,
                "avg_pnl": 0.0,
                "best_trade": None,
                "worst_trade": None,
                "sharpe_ratio": None,
                "calmar_ratio": None,
                "max_drawdown": None,
                "avg_holding_period_hours": None,
            }

        pnls = [float(r["unrealized_pnl"]) for r in rows]
        wins = [p for p in pnls if p > 0]
        losses = [p for p in pnls if p <= 0]
        total = len(pnls)

        pnl_array = np.array(pnls)
        total_pnl = float(np.sum(pnl_array))

        # Sharpe ratio (annualized, assuming daily trading)
        if len(pnl_array) >= 2 and np.std(pnl_array) > 0:
            sharpe = float(np.mean(pnl_array) / np.std(pnl_array)) * np.sqrt(252)
        else:
            sharpe = None

        # Max drawdown
        cumulative = np.cumsum(pnl_array)
        running_max = np.maximum.accumulate(cumulative)
        drawdowns = cumulative - running_max
        max_dd = float(np.min(drawdowns)) if len(drawdowns) > 0 else None

        # Calmar ratio = annualized return / max drawdown
        calmar = None
        if max_dd and max_dd < 0 and total_pnl != 0:
            annualized_return = total_pnl * (365 / lookback_days)
            calmar = round(annualized_return / abs(max_dd), 3)

        # Avg holding period
        avg_holding = None
        valid_holds = []
        for r in rows:
            if r.get("opened_at") and r.get("closed_at"):
                try:
                    delta = (r["closed_at"] - r["opened_at"]).total_seconds() / 3600
                    valid_holds.append(delta)
                except Exception:
                    pass
        if valid_holds:
            avg_holding = round(float(np.mean(valid_holds)), 1)

        return {
            "total_trades": total,
            "winning_trades": len(wins),
            "losing_trades": len(losses),
            "win_rate": round(len(wins) / total, 4) if total > 0 else 0.0,
            "total_pnl": round(total_pnl, 4),
            "avg_pnl": round(float(np.mean(pnl_array)), 4),
            "best_trade": round(max(pnls), 4) if pnls else None,
            "worst_trade": round(min(pnls), 4) if pnls else None,
            "avg_win": round(float(np.mean(wins)), 4) if wins else None,
            "avg_loss": round(float(np.mean(losses)), 4) if losses else None,
            "profit_factor": (
                round(abs(sum(wins)) / abs(sum(losses)), 2)
                if losses and sum(losses) != 0 else None
            ),
            "sharpe_ratio": round(sharpe, 4) if sharpe else None,
            "calmar_ratio": calmar,
            "max_drawdown": round(max_dd, 4) if max_dd is not None else None,
            "avg_holding_period_hours": avg_holding,
        }

    async def _analyze_agent_accuracy(self, lookback_days: int = 7) -> dict:
        """Analyze how well each agent's consensus votes predicted signal outcomes."""
        agents = ["alpha_scout", "technical_analyst", "risk_sentinel"]
        accuracy: dict = {}

        for agent_name in agents:
            try:
                rows = await db_pool.fetch(
                    """SELECT cv.vote, cv.confidence, s.status, s.direction
                       FROM ualgo_consensus_vote cv
                       JOIN ualgo_signal s ON s.id = cv.signal_id
                       WHERE cv.agent_name = $1
                       AND s.created_at >= NOW() - INTERVAL '1 day' * $2
                       ORDER BY s.created_at DESC""",
                    agent_name,
                    lookback_days,
                )
            except Exception as e:
                logger.error(f"[{self.name}] accuracy query failed for {agent_name}: {e}")
                rows = []

            if not rows:
                accuracy[agent_name] = {"total_votes": 0, "accuracy": None, "avg_confidence": None}
                continue

            total = len(rows)
            correct = sum(
                1 for r in rows
                if (r["vote"] == "approve" and r["status"] in ("approved", "executed"))
                or (r["vote"] == "reject" and r["status"] == "rejected")
            )
            confidences = [float(r["confidence"]) for r in rows if r["confidence"] is not None]

            accuracy[agent_name] = {
                "total_votes": total,
                "correct_votes": correct,
                "accuracy": round(correct / total, 4) if total > 0 else None,
                "avg_confidence": round(float(np.mean(confidences)), 4) if confidences else None,
                "overconfident": (
                    sum(1 for r in rows if float(r["confidence"] or 0) > 0.8) / total
                    if total > 0 else 0
                ),
            }

        return accuracy

    async def _analyze_signal_health(self, lookback_days: int) -> dict:
        """Analyze signal generation patterns for quality and balance."""
        try:
            rows = await db_pool.fetch(
                """SELECT direction, status, confidence, symbol
                   FROM ualgo_signal
                   WHERE created_at >= NOW() - INTERVAL '1 day' * $1""",
                lookback_days,
            )
        except Exception as e:
            logger.error(f"[{self.name}] signal health query failed: {e}")
            return {}

        if not rows:
            return {"total_signals": 0}

        total = len(rows)
        long_count = sum(1 for r in rows if r["direction"] == "LONG")
        short_count = sum(1 for r in rows if r["direction"] == "SHORT")
        approved = sum(1 for r in rows if r["status"] == "approved")
        executed = sum(1 for r in rows if r["status"] == "executed")
        confidences = [float(r["confidence"]) for r in rows if r["confidence"] is not None]
        symbols = [r["symbol"] for r in rows]

        # Direction balance (ideal: 45-55% each side)
        direction_balance = long_count / total if total > 0 else 0.5

        # Symbol concentration
        from collections import Counter
        symbol_counts = Counter(symbols)
        top_symbol = symbol_counts.most_common(1)[0] if symbol_counts else None

        return {
            "total_signals": total,
            "long_count": long_count,
            "short_count": short_count,
            "neutral_count": total - long_count - short_count,
            "direction_balance": round(direction_balance, 3),
            "approval_rate": round(approved / total, 3) if total > 0 else 0,
            "execution_rate": round(executed / total, 3) if total > 0 else 0,
            "avg_confidence": round(float(np.mean(confidences)), 4) if confidences else None,
            "confidence_std": round(float(np.std(confidences)), 4) if confidences else None,
            "top_symbol": {"symbol": top_symbol[0], "count": top_symbol[1]} if top_symbol else None,
            "unique_symbols": len(symbol_counts),
        }

    def _classify_regime(self, performance: dict) -> str:
        """Classify current market regime based on performance metrics."""
        win_rate = performance.get("win_rate", 0)
        sharpe = performance.get("sharpe_ratio")
        max_dd = performance.get("max_drawdown") or 0
        total = performance.get("total_trades", 0)

        if total == 0:
            return "UNKNOWN"
        if win_rate >= 0.6 and (sharpe is None or sharpe >= 1.0):
            return "TRENDING_FAVORABLE"
        if win_rate >= 0.5 and max_dd > -0.05:
            return "STABLE"
        if win_rate < 0.4 or max_dd < -0.10:
            return "UNFAVORABLE"
        if abs(max_dd) < 0.03 and win_rate < 0.55:
            return "RANGING"
        return "MIXED"

    def _generate_recommendations(
        self,
        performance: dict,
        agent_accuracy: dict,
        signal_health: dict,
    ) -> list[str]:
        """Generate prioritized, actionable parameter tuning recommendations."""
        recs: list[str] = []

        win_rate = performance.get("win_rate", 0)
        total_trades = performance.get("total_trades", 0)
        max_dd = performance.get("max_drawdown") or 0
        sharpe = performance.get("sharpe_ratio")
        profit_factor = performance.get("profit_factor")
        avg_hold = performance.get("avg_holding_period_hours")
        direction_balance = signal_health.get("direction_balance", 0.5)
        approval_rate = signal_health.get("approval_rate", 0.5)
        avg_confidence = signal_health.get("avg_confidence")

        # Win rate guidance
        if total_trades == 0:
            recs.append("🔴 No closed trades in lookback window — verify database connectivity and position status updates")
        elif win_rate < 0.35:
            recs.append(f"🔴 Win rate critically low ({win_rate:.1%}) — increase min_consensus_confidence to ≥0.65 and review indicator weights")
        elif win_rate < 0.45:
            recs.append(f"🟡 Win rate below target ({win_rate:.1%}) — tighten consensus threshold by +5% and review RSI/Bollinger weights")
        elif win_rate > 0.72:
            recs.append(f"🟢 Win rate strong ({win_rate:.1%}) — consider lowering consensus threshold by 3-5% to capture more opportunities")

        # Drawdown guidance
        if max_dd < -0.10:
            recs.append(f"🔴 Max drawdown severe ({max_dd:.1%}) — reduce position sizes by 30% and tighten stop-loss multiplier from 1.5 to 1.2 ATR")
        elif max_dd < -0.05:
            recs.append(f"🟡 Drawdown elevated ({max_dd:.1%}) — tighten stop-loss and reduce leverage for next 5 trades")

        # Sharpe ratio
        if sharpe is not None:
            if sharpe < 0.3:
                recs.append(f"🔴 Sharpe ratio very low ({sharpe:.2f}) — strategy is not generating risk-adjusted returns; consider pausing and reviewing")
            elif sharpe < 0.8:
                recs.append(f"🟡 Sharpe ratio below target ({sharpe:.2f}) — improve entry timing or reduce position size variance")
            elif sharpe > 2.0:
                recs.append(f"🟢 Excellent Sharpe ({sharpe:.2f}) — current parameters well-calibrated")

        # Profit factor
        if profit_factor is not None:
            if profit_factor < 1.0:
                recs.append(f"🔴 Profit factor < 1.0 ({profit_factor:.2f}) — losing strategy; halt live trading until resolved")
            elif profit_factor < 1.3:
                recs.append(f"🟡 Profit factor marginal ({profit_factor:.2f}) — target ≥1.5 by improving TP/SL ratio")

        # Direction balance
        if direction_balance < 0.30:
            recs.append(f"🟡 SHORT bias detected ({direction_balance:.0%} LONG) — check if sentiment agent is over-calibrated bearish")
        elif direction_balance > 0.70:
            recs.append(f"🟡 LONG bias detected ({direction_balance:.0%} LONG) — alpha_scout bias_correction may need negative adjustment")

        # Approval rate
        if approval_rate < 0.20:
            recs.append(f"🟡 Low approval rate ({approval_rate:.0%}) — risk_sentinel may be too conservative; review volatility_threshold")
        elif approval_rate > 0.80:
            recs.append(f"🟡 High approval rate ({approval_rate:.0%}) — risk_sentinel may be too permissive; tighten risk_score threshold")

        # Agent accuracy
        for agent, acc in agent_accuracy.items():
            agent_accuracy_val = acc.get("accuracy")
            if agent_accuracy_val is not None:
                if agent_accuracy_val < 0.45:
                    recs.append(
                        f"🟡 Agent '{agent}' vote accuracy low ({agent_accuracy_val:.1%}) — "
                        f"reduce its consensus weight or review its signal logic"
                    )
                elif agent_accuracy_val > 0.70:
                    recs.append(
                        f"🟢 Agent '{agent}' performing well ({agent_accuracy_val:.1%}) — "
                        f"consider increasing its consensus vote weight"
                    )

        # Holding period
        if avg_hold is not None:
            if avg_hold < 1.0:
                recs.append(f"🟡 Very short avg hold ({avg_hold:.1f}h) — signals may be closing too early; widen TP by 20%")
            elif avg_hold > 72:
                recs.append(f"🟡 Long avg hold ({avg_hold:.1f}h) — consider time-based exits for stale positions")

        if not recs:
            recs.append("🟢 All metrics within target ranges — no parameter changes recommended")

        return recs

    async def _create_snapshot(self, performance: dict):
        """Create or update the daily portfolio snapshot."""
        try:
            total_value = await db_pool.fetchval(
                """SELECT COALESCE(SUM(quantity * COALESCE(current_price, entry_price)), 10000)
                   FROM ualgo_position WHERE status = 'open'"""
            ) or 10_000

            open_count = await db_pool.fetchval(
                "SELECT COUNT(*) FROM ualgo_position WHERE status = 'open'"
            ) or 0

            total_pnl = performance.get("total_pnl", 0)
            total_pnl_pct = (total_pnl / float(total_value) * 100) if float(total_value) > 0 else 0

            await db_pool.execute(
                """INSERT INTO ualgo_portfolio_snapshot
                   (snapshot_date, total_value, total_pnl, total_pnl_pct,
                    open_positions, win_rate, sharpe_ratio, max_drawdown)
                   VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6, $7)
                   ON CONFLICT (snapshot_date) DO UPDATE SET
                    total_value = $1, total_pnl = $2, total_pnl_pct = $3,
                    open_positions = $4, win_rate = $5, sharpe_ratio = $6, max_drawdown = $7""",
                float(total_value),
                total_pnl,
                total_pnl_pct,
                int(open_count),
                performance.get("win_rate"),
                performance.get("sharpe_ratio"),
                performance.get("max_drawdown"),
            )
        except Exception as e:
            logger.error(f"[{self.name}] snapshot creation failed: {e}")


# Global singleton
quant_lab = QuantLabAgent()
