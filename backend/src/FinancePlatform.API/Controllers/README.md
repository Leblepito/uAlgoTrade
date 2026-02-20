# Controllers

ASP.NET Core API controllers — each maps to a REST endpoint group.

## Key Files

| File | Endpoints | Purpose |
|------|-----------|---------|
| `AuthController.cs` | `/api/auth/*` | JWT registration and login |
| `MarketDataController.cs` | `/api/market-data/*` | Real-time crypto price data |
| `IndicatorsController.cs` | `/api/indicators/*` | Technical indicator computation |
| `BacktestController.cs` | `/api/backtest/*` | Strategy backtesting engine |
| `AIAgentController.cs` | `/api/ai/*` | Claude AI chat (Grandmaster Owl) |
| `AgentSwarmController.cs` | `/api/swarm/*` | AI swarm proxy to Python engine |
| `PerformanceController.cs` | `/api/performance/*` | Portfolio performance data |
| `AlertsController.cs` | `/api/alerts/*` | Price alert CRUD |
