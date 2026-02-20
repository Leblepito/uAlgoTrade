# Trading Agent Spec — Quantum Trade AI

> Reference document sourced from AAnti/Antigravity Ventures agent system.
> Risk parameters and cross-learning patterns integrated into `ai-engine/src/agents/risk_sentinel.py`.

## Risk Parameters

```yaml
risk_limits:
  per_trade:
    max_risk: 2%        # of portfolio
    stop_loss: required
    take_profit: recommended

  portfolio:
    max_drawdown: 15%
    max_correlation: 0.7
    max_single_asset: 25%

  operational:
    max_daily_trades: 10
    cool_down_after_loss: 1h
    mandatory_review: weekly
```

## Planned Roles

| Role | Responsibility |
|------|---------------|
| Market Analyst | Technical analysis, fundamental research, sentiment tracking |
| Risk Manager | Position sizing, stop-loss management, portfolio exposure |
| Bot Developer | Strategy coding, backtesting, optimization |
| Portfolio Optimizer | Asset allocation, rebalancing, diversification |

## Cross-Learning Patterns

| Pattern | Trading Application | Cross-Sector Use |
|---------|-------------------|-----------------|
| Risk calculation | Position sizing, drawdown limits | Overbooking risk, treatment risk |
| Pattern recognition | Chart patterns, price action | Demand forecasting, trend analysis |
| Real-time monitoring | Price tracking, volatility | Vital signs, occupancy |
| Automation | Dynamic execution | Dynamic pricing, scheduling |

## Integration Requirements

```yaml
exchanges: [binance, coinbase, kraken]
data_sources: [tradingview, coingecko, glassnode]
notifications: [telegram, email, sms]
analytics: [custom_dashboard, performance_tracking, risk_monitoring]
```

## Implemented in ai-engine

The following features from this spec are already integrated:

- **Risk Sentinel** (`ai-engine/src/agents/risk_sentinel.py`):
  - `max_daily_trades` — daily trade counter with auto-reset
  - `cool_down_after_loss_seconds` — enforced pause after losing trade
  - `max_single_asset_ratio` — position value vs portfolio cap
  - Kill switch with hard veto authority

- **Config** (`ai-engine/src/config.py`):
  - `U2ALGO_MAX_DAILY_TRADES`
  - `U2ALGO_COOL_DOWN_AFTER_LOSS_SECONDS`
  - `U2ALGO_MAX_SINGLE_ASSET_RATIO`
  - `U2ALGO_MAX_POSITION_CORRELATION`
