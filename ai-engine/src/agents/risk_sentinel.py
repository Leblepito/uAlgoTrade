"""Risk Sentinel Agent — Portfolio protection, kill switch, position sizing, volatility guard.

Role: Risk Guardian
Mission: Act as the last line of defense before any signal is approved for execution.
         Protect capital at all costs. Veto any trade that violates risk parameters.
         Activate kill switch on critical portfolio events.

Risk checks (in order of severity):
1. Kill switch already active → immediate reject
2. Daily loss limit breached → activate kill switch + reject
3. Max drawdown exceeded → activate kill switch + reject
4. Max open positions reached → reject
5. Extreme volatility spike → caution or reject
6. Per-trade risk exceeds limit → reject
7. Concentration risk (same symbol multiple open positions) → caution

Risk scoring: 0.0 (safe) → 1.0 (critical danger)
Vote: 'approve' when risk_score < 0.5, 'reject' when risk_score >= 0.5
"""

import logging
from datetime import datetime, timezone

import numpy as np

from src.agents.base_agent import BaseAgent
from src.config import settings
from src.core.message_bus import message_bus
from src.services.db import db_pool

logger = logging.getLogger(__name__)


class RiskSentinelAgent(BaseAgent):
    """Guardian agent — monitors portfolio risk and controls the kill switch.

    The Risk Sentinel has veto power over all trade signals. It evaluates:
    - Portfolio-level metrics (drawdown, daily PnL, position count)
    - Trade-level metrics (per-trade risk % of portfolio)
    - Market-level metrics (volatility regime from recent signal variance)

    Kill switch activation is logged to memory at max importance (1.0) and
    broadcast to all agents via message bus.
    """

    def __init__(self):
        super().__init__(
            name="risk_sentinel",
            role="Risk Guardian — Portfolio protection, kill switch, position sizing",
            version="1.2.0",
        )
        self.kill_switch_active: bool = False
        self.kill_switch_reason: str | None = None
        self.kill_switch_activated_at: datetime | None = None

        # Risk thresholds (sourced from settings, with safe defaults)
        self.max_drawdown_pct: float = getattr(settings, "kill_switch_drawdown", 0.10)
        self.max_risk_per_trade: float = getattr(settings, "max_risk_per_trade", 0.02)
        self.max_open_positions: int = 5
        self.max_daily_loss_pct: float = 0.03        # 3% daily loss limit
        self.max_concentration_pct: float = 0.40     # Max 40% of positions in one symbol
        self.volatility_threshold: float = 0.30      # Signal confidence std dev threshold

        # Extended risk controls (from AAnti Trading Agent spec)
        self.max_daily_trades: int = getattr(settings, "max_daily_trades", 10)
        self.cool_down_after_loss_seconds: int = getattr(settings, "cool_down_after_loss_seconds", 3600)
        self.max_single_asset_ratio: float = getattr(settings, "max_single_asset_ratio", 0.25)
        self._last_loss_at: datetime | None = None
        self._daily_trade_count: int = 0
        self._daily_trade_reset_date: str = ""

    async def analyze(self, symbol: str, **kwargs) -> dict:
        """Evaluate risk for a proposed signal or current portfolio state.

        Args:
            symbol: Trading pair e.g. 'BTCUSDT'
            **kwargs:
                proposed_signal: dict with 'direction', 'entry_price', 'stop_loss', 'quantity'

        Returns:
            Risk evaluation dict including vote, risk_score, flags, and kill_switch status.
        """
        proposed: dict | None = kwargs.get("proposed_signal")

        portfolio = await self._get_portfolio_state()
        volatility = await self._check_volatility(symbol)
        concentration = await self._check_concentration(symbol) if proposed else None

        risk_flags: list[str] = []
        risk_score: float = 0.0

        # --- SEVERITY 1: Kill switch already active ---
        if self.kill_switch_active:
            risk_flags.append(f"KILL_SWITCH_ACTIVE (reason: {self.kill_switch_reason})")
            risk_score = 1.0

        # --- SEVERITY 2: Daily loss limit ---
        daily_loss = portfolio.get("daily_pnl_pct", 0.0)
        if daily_loss < -self.max_daily_loss_pct:
            flag = f"DAILY_LOSS_EXCEEDED ({daily_loss:.2%} < -{self.max_daily_loss_pct:.2%} limit)"
            risk_flags.append(flag)
            risk_score = max(risk_score, 0.90)
            await self._activate_kill_switch(f"Daily loss limit exceeded: {daily_loss:.2%}")

        # --- SEVERITY 3: Max drawdown ---
        max_dd = portfolio.get("max_drawdown_pct", 0.0)
        if max_dd < -self.max_drawdown_pct:
            flag = f"MAX_DRAWDOWN_EXCEEDED ({max_dd:.2%} < -{self.max_drawdown_pct:.2%} limit)"
            risk_flags.append(flag)
            risk_score = max(risk_score, 0.95)
            await self._activate_kill_switch(f"Max drawdown exceeded: {max_dd:.2%}")

        # --- SEVERITY 4: Position count ---
        open_positions = portfolio.get("open_positions", 0)
        if open_positions >= self.max_open_positions:
            risk_flags.append(f"MAX_POSITIONS_REACHED ({open_positions}/{self.max_open_positions})")
            risk_score = max(risk_score, 0.75)

        # --- SEVERITY 4a: Daily trade limit ---
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if self._daily_trade_reset_date != today:
            self._daily_trade_count = 0
            self._daily_trade_reset_date = today
        if self._daily_trade_count >= self.max_daily_trades:
            risk_flags.append(f"DAILY_TRADE_LIMIT ({self._daily_trade_count}/{self.max_daily_trades})")
            risk_score = max(risk_score, 0.70)

        # --- SEVERITY 4b: Cool-down after loss ---
        if self._last_loss_at:
            elapsed = (datetime.now(timezone.utc) - self._last_loss_at).total_seconds()
            if elapsed < self.cool_down_after_loss_seconds:
                remaining = int(self.cool_down_after_loss_seconds - elapsed)
                risk_flags.append(f"COOL_DOWN_ACTIVE ({remaining}s remaining after last loss)")
                risk_score = max(risk_score, 0.65)

        # --- SEVERITY 4c: Single asset concentration by value ---
        if proposed and portfolio.get("total_value", 0) > 0:
            entry = proposed.get("entry_price", 0) or 0
            qty = proposed.get("quantity", 0) or 0
            position_value = entry * qty
            asset_ratio = position_value / portfolio["total_value"]
            if asset_ratio > self.max_single_asset_ratio:
                risk_flags.append(
                    f"SINGLE_ASSET_OVERWEIGHT ({asset_ratio:.0%} > {self.max_single_asset_ratio:.0%} max)"
                )
                risk_score = max(risk_score, 0.70)

        # --- SEVERITY 5: Volatility regime ---
        if volatility.get("is_extreme", False):
            vol_value = volatility.get("value", 0)
            risk_flags.append(f"EXTREME_VOLATILITY (signal_std={vol_value:.3f} > {self.volatility_threshold:.2f})")
            risk_score = max(risk_score, 0.55)

        # --- SEVERITY 6: Per-trade risk ---
        if proposed:
            trade_risk = self._compute_trade_risk(proposed, portfolio)
            if trade_risk > self.max_risk_per_trade:
                risk_flags.append(
                    f"TRADE_RISK_EXCEEDED ({trade_risk:.2%} > {self.max_risk_per_trade:.2%} max per trade)"
                )
                risk_score = max(risk_score, 0.80)

        # --- SEVERITY 7: Symbol concentration ---
        if concentration and concentration.get("ratio", 0) > self.max_concentration_pct:
            risk_flags.append(
                f"CONCENTRATION_RISK ({symbol}: {concentration['ratio']:.0%} of open positions)"
            )
            risk_score = max(risk_score, 0.60)

        # Vote decision: approve if risk_score < 0.50
        vote = "reject" if risk_score >= 0.50 else "approve"
        direction = (proposed or {}).get("direction", "NEUTRAL") if vote == "approve" else "NEUTRAL"

        # Confidence inversion: high risk_score → low approval confidence
        confidence = round(1.0 - risk_score, 4) if vote == "approve" else round(risk_score, 4)

        result = {
            "agent": self.name,
            "symbol": symbol,
            "direction": direction,
            "confidence": confidence,
            "vote": vote,
            "risk_score": round(risk_score, 4),
            "risk_flags": risk_flags,
            "risk_flags_count": len(risk_flags),
            "kill_switch_active": self.kill_switch_active,
            "kill_switch_reason": self.kill_switch_reason,
            "portfolio": portfolio,
            "volatility": volatility,
            "thresholds": {
                "max_daily_loss_pct": self.max_daily_loss_pct,
                "max_drawdown_pct": self.max_drawdown_pct,
                "max_open_positions": self.max_open_positions,
                "max_risk_per_trade": self.max_risk_per_trade,
            },
        }

        await self.memory.store_decision(symbol, {
            "vote": vote,
            "risk_score": risk_score,
            "flags": risk_flags,
            "kill_switch": self.kill_switch_active,
        })

        if risk_flags:
            logger.warning(f"[{self.name}] {symbol}: {vote.upper()} — {', '.join(risk_flags)}")
        else:
            logger.info(f"[{self.name}] {symbol}: {vote.upper()} — no risk flags")

        return result

    async def _get_portfolio_state(self) -> dict:
        """Query current portfolio metrics from the database."""
        try:
            open_count = await db_pool.fetchval(
                "SELECT COUNT(*) FROM ualgo_position WHERE status = 'open'"
            ) or 0

            total_unrealized = await db_pool.fetchval(
                "SELECT COALESCE(SUM(unrealized_pnl), 0) FROM ualgo_position WHERE status = 'open'"
            ) or 0

            latest_snapshot = await db_pool.fetchrow(
                "SELECT * FROM ualgo_portfolio_snapshot ORDER BY snapshot_date DESC LIMIT 1"
            )

            total_value = float(latest_snapshot["total_value"]) if latest_snapshot else 10_000.0
            daily_pnl_pct = float(total_unrealized) / total_value if total_value > 0 else 0.0
            max_dd = (
                float(latest_snapshot["max_drawdown"])
                if latest_snapshot and latest_snapshot["max_drawdown"]
                else 0.0
            )

            return {
                "open_positions": int(open_count),
                "total_value": total_value,
                "unrealized_pnl": float(total_unrealized),
                "daily_pnl_pct": daily_pnl_pct,
                "max_drawdown_pct": max_dd,
            }
        except Exception as e:
            logger.error(f"[{self.name}] portfolio query failed: {e}")
            # Return safe defaults — don't block on DB error
            return {
                "open_positions": 0,
                "total_value": 10_000.0,
                "unrealized_pnl": 0.0,
                "daily_pnl_pct": 0.0,
                "max_drawdown_pct": 0.0,
            }

    async def _check_volatility(self, symbol: str) -> dict:
        """Assess recent signal confidence variance as a volatility proxy."""
        try:
            rows = await db_pool.fetch(
                """SELECT confidence FROM ualgo_signal
                   WHERE symbol = $1 AND created_at >= NOW() - INTERVAL '24 hours'
                   ORDER BY created_at DESC LIMIT 30""",
                symbol,
            )

            if not rows or len(rows) < 3:
                return {"value": 0.0, "is_extreme": False, "sample_size": len(rows) if rows else 0}

            confidences = [float(r["confidence"]) for r in rows if r["confidence"] is not None]
            volatility = float(np.std(confidences)) if len(confidences) >= 2 else 0.0

            return {
                "value": round(volatility, 4),
                "is_extreme": volatility > self.volatility_threshold,
                "sample_size": len(confidences),
            }
        except Exception as e:
            logger.error(f"[{self.name}] volatility check failed: {e}")
            return {"value": 0.0, "is_extreme": False, "sample_size": 0}

    async def _check_concentration(self, symbol: str) -> dict:
        """Check if symbol would create excessive position concentration."""
        try:
            total_open = await db_pool.fetchval(
                "SELECT COUNT(*) FROM ualgo_position WHERE status = 'open'"
            ) or 0

            symbol_open = await db_pool.fetchval(
                "SELECT COUNT(*) FROM ualgo_position WHERE status = 'open' AND symbol = $1",
                symbol,
            ) or 0

            ratio = (symbol_open + 1) / max(total_open + 1, 1)  # +1 for the proposed trade
            return {"symbol": symbol, "current": int(symbol_open), "ratio": ratio}
        except Exception as e:
            logger.error(f"[{self.name}] concentration check failed: {e}")
            return {"symbol": symbol, "current": 0, "ratio": 0.0}

    def _compute_trade_risk(self, proposed: dict, portfolio: dict) -> float:
        """Calculate risk as a percentage of portfolio for a proposed trade.

        Risk = |entry - stop_loss| * quantity / total_portfolio_value
        """
        entry = proposed.get("entry_price", 0) or 0
        stop = proposed.get("stop_loss", 0) or 0
        quantity = proposed.get("quantity", 0) or 0
        total_value = portfolio.get("total_value", 10_000.0) or 10_000.0

        if not entry or not stop or not quantity or not total_value:
            return 0.0

        risk_amount = abs(entry - stop) * quantity
        return risk_amount / total_value

    async def _activate_kill_switch(self, reason: str):
        """Activate the kill switch — halt all new trade approvals."""
        if self.kill_switch_active:
            return  # Already active, don't duplicate

        self.kill_switch_active = True
        self.kill_switch_reason = reason
        self.kill_switch_activated_at = datetime.now(timezone.utc)

        logger.critical(f"🛑 KILL SWITCH ACTIVATED: {reason}")

        await message_bus.broadcast(
            sender=self.name,
            topic="risk.kill_switch",
            payload={
                "active": True,
                "reason": reason,
                "activated_at": self.kill_switch_activated_at.isoformat(),
            },
        )

        # Store at maximum importance — this must never be forgotten
        await self.memory.store("pattern", {
            "event": "kill_switch_activated",
            "reason": reason,
            "activated_at": self.kill_switch_activated_at.isoformat(),
        }, importance=1.0)

    async def deactivate_kill_switch(self, operator: str = "manual"):
        """Manually deactivate the kill switch (requires human authorization)."""
        prev_reason = self.kill_switch_reason
        self.kill_switch_active = False
        self.kill_switch_reason = None
        self.kill_switch_activated_at = None

        logger.info(f"✅ Kill switch deactivated by {operator} (was: {prev_reason})")

        await message_bus.broadcast(
            sender=self.name,
            topic="risk.kill_switch",
            payload={
                "active": False,
                "operator": operator,
                "previous_reason": prev_reason,
                "deactivated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    def record_trade_executed(self):
        """Increment daily trade counter after a signal is approved and executed."""
        self._daily_trade_count += 1

    def record_loss(self):
        """Record a losing trade to activate cool-down period."""
        self._last_loss_at = datetime.now(timezone.utc)

    def get_risk_summary(self) -> dict:
        """Return current risk configuration and kill switch status."""
        return {
            "kill_switch_active": self.kill_switch_active,
            "kill_switch_reason": self.kill_switch_reason,
            "kill_switch_activated_at": (
                self.kill_switch_activated_at.isoformat()
                if self.kill_switch_activated_at else None
            ),
            "daily_trade_count": self._daily_trade_count,
            "cool_down_active": (
                self._last_loss_at is not None
                and (datetime.now(timezone.utc) - self._last_loss_at).total_seconds()
                < self.cool_down_after_loss_seconds
            ),
            "thresholds": {
                "max_daily_loss_pct": self.max_daily_loss_pct,
                "max_drawdown_pct": self.max_drawdown_pct,
                "max_open_positions": self.max_open_positions,
                "max_risk_per_trade": self.max_risk_per_trade,
                "max_concentration_pct": self.max_concentration_pct,
                "volatility_threshold": self.volatility_threshold,
                "max_daily_trades": self.max_daily_trades,
                "cool_down_after_loss_seconds": self.cool_down_after_loss_seconds,
                "max_single_asset_ratio": self.max_single_asset_ratio,
            },
        }


# Global singleton
risk_sentinel = RiskSentinelAgent()
