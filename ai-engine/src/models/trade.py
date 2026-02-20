"""Trade and portfolio data models."""

from datetime import datetime

from pydantic import BaseModel


class Position(BaseModel):
    id: int | None = None
    symbol: str
    side: str  # LONG | SHORT
    entry_price: float
    current_price: float | None = None
    quantity: float
    leverage: float = 1.0
    unrealized_pnl: float = 0.0
    unrealized_pnl_pct: float = 0.0
    stop_loss: float | None = None
    take_profit: float | None = None
    strategy_id: str = "default"
    status: str = "open"
    opened_at: datetime | None = None


class PortfolioSnapshot(BaseModel):
    snapshot_date: str
    total_value: float
    total_pnl: float = 0.0
    total_pnl_pct: float = 0.0
    open_positions: int = 0
    exposure_pct: float = 0.0
    win_rate: float | None = None
    sharpe_ratio: float | None = None
    max_drawdown: float | None = None


class PerformanceSummary(BaseModel):
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    win_rate: float = 0.0
    total_pnl: float = 0.0
    total_pnl_pct: float = 0.0
    sharpe_ratio: float | None = None
    max_drawdown: float | None = None
    avg_risk_reward: float | None = None
    equity_curve: list[PortfolioSnapshot] = []
