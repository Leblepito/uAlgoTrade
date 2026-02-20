# Database — PostgreSQL Migrations

PostgreSQL schema migrations for the uKeyTr platform. All services (backend + AI engine) share a single PostgreSQL instance.

## Key Files

| File | Purpose |
|------|---------|
| `postgres/001_initial_schema.sql` | Users, market data base tables |
| `postgres/002_indicators.sql` | Technical indicator storage |
| `postgres/003_alerts.sql` | Price alert system |
| `postgres/004_backtests.sql` | Backtest results |
| `postgres/005_signals.sql` | Trading signals |
| `postgres/006_subscriptions.sql` | Subscription tiers |
| `postgres/007_api_keys.sql` | API key management |
| `postgres/008_agent_swarm_enhanced.sql` | Agent heartbeat, consensus voting tables |
| `postgres/009_portfolio_tracking.sql` | Position tracking, portfolio snapshots |
| `postgres/010_multi_tenant_strategies.sql` | Strategy definitions, API key vault |
| `postgres/011_agent_memory.sql` | Agent persistent memory with TTL |
| `migrate.sh` | Script to run all migrations in order |

## Running Migrations

```bash
# Via script
bash scripts/run-migrations.sh

# Manual (from project root)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ukeytr"
for f in database/postgres/*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```

## Schema Overview

### Core Tables (001-007)
- `ualgo_user` — User accounts, subscriptions
- `ualgo_market_data` — OHLCV candle data
- `ualgo_indicator_result` — Computed indicators
- `ualgo_alert` — Price alerts
- `ualgo_backtest_*` — Backtest runs and results
- `ualgo_signal` — Trading signals

### AI Agent Tables (008-011)
- `ualgo_agent_heartbeat` — Agent health status
- `ualgo_consensus_vote` — Consensus voting records
- `ualgo_position` — Open/closed trading positions
- `ualgo_portfolio_snapshot` — Daily portfolio snapshots
- `ualgo_strategy` — Strategy definitions
- `ualgo_api_key` — Encrypted API key vault
- `ualgo_agent_memory` — Agent decision memory with auto-expiry
