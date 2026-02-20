# uKeyTr Architecture

## System Overview

uKeyTr is a polyglot monorepo with three main services sharing a PostgreSQL database.

```
Browser --> Next.js Frontend (ualgotrade.com, port 3000)
                |
           .NET Backend (api.ualgotrade.com, port 8080)
             |              |
      PostgreSQL     Python AI Engine (internal, port 8000)
     (shared DB)       |         |         |
                   Alpha     Technical   Risk
                   Scout     Analyst    Sentinel
                      \        |        /
                    PrimeOrchestrator
                         |
                     Quant Lab (nightly)
```

## Services

### Backend (.NET 9.0)
- **Role**: API Gateway, authentication, indicator computation, backtesting
- **Framework**: ASP.NET Core with Clean Architecture (API/Application/Domain/Infrastructure)
- **Key features**: JWT auth with subscription tiers, Binance market data proxy, Telegram alerts
- **New additions**: `AgentSwarmController`, `PerformanceController`, `AiSidecarClient`

### Frontend (Next.js 16)
- **Role**: User-facing trading dashboard
- **Key pages**: Indicators, Backtest, Education, Pricing
- **New pages**: `/swarm` (AI dashboard), `/signals`, `/portfolio`, `/performance`
- **New components**: AgentStatusCard, SignalFeed, RiskGauge, SwarmTopology, EquityCurveLarge, PortfolioSummary

### AI Engine (Python 3.12 / FastAPI)
- **Role**: Multi-agent AI swarm for signal generation
- **Framework**: FastAPI + asyncpg + APScheduler
- **Agents**: Alpha Scout, Technical Analyst, Risk Sentinel, PrimeOrchestrator, Quant Lab
- **Not publicly accessible** — communicates with backend via Railway internal networking

## Communication Flow

1. **Frontend** calls **Backend** via REST API (`/api/swarm/*`, `/api/performance/*`)
2. **Backend** proxies AI requests to **AI Engine** via `AiSidecarClient`
3. **AI Engine** runs agent cycles and writes results to **PostgreSQL**
4. **Backend** reads results from PostgreSQL for direct queries
5. **APScheduler** triggers periodic scan cycles (60s, 5s risk checks, nightly optimization)

## Database Schema

11 migration files in `database/postgres/`:
- 001-007: Core tables (auth, payments, backtest, alerts, AI base tables)
- 008: Agent heartbeat, consensus voting, signal extensions
- 009: Portfolio positions, equity snapshots
- 010: Multi-tenant strategies, API key vault
- 011: Agent long-term memory with TTL expiry

## Deployment (Railway)

```
uKeyTr (Railway Project)
├── backend     --> api.ualgotrade.com     (public)
├── frontend    --> ualgotrade.com          (public)
├── ai-engine   --> internal only       (Railway internal networking)
├── school      --> school.ualgotrade.com   (public)
└── PostgreSQL  --> Railway Plugin      (shared)
```

AI Engine URL for backend: `http://ai-engine.railway.internal:8000`
