# uAlgoTrade (uAlgoTrade) — AI-Powered Trading Platform

A polyglot monorepo combining a .NET trading backend, Next.js frontend, and Python AI agent swarm for algorithmic cryptocurrency trading.

## Architecture

```
Browser → Next.js Frontend (ualgotrade.com)
              ↓
         .NET Backend (api.ualgotrade.com)
           ↓              ↓
    PostgreSQL     Python AI Engine (internal)
   (shared)          ↓         ↓         ↓
                 Alpha     Technical   Risk
                 Scout     Analyst    Sentinel
                    ↘        ↓        ↙
                   PrimeOrchestrator
                        ↓
                    Quant Lab (nightly optimization)
```

## Services

| Service | Tech | Port | Description |
|---------|------|------|-------------|
| **backend** | .NET 9.0 (C#) | 8080 | Trading API, auth, indicators, backtesting |
| **frontend** | Next.js 16 | 3000 | Trading dashboard, charts, AI chat |
| **ai-engine** | Python 3.12 (FastAPI) | 8000 | AI agent swarm, signals, orchestration |
| **school** | Next.js 15 | 3001 | Trading education platform |
| **PostgreSQL** | PostgreSQL 15+ | 5432 | Shared database |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Leblepito/uAlgoTrade.git
cd uAlgoTrade

# 2. Environment
cp .env.example .env
# Edit .env with your values

# 3. Run with Docker
docker compose up

# 4. Run migrations
./scripts/run-migrations.sh
```

## Project Structure

```
uAlgoTrade/
├── backend/          → .NET 9.0 Clean Architecture API
├── frontend/         → Next.js 16 Trading Dashboard
├── ai-engine/        → Python AI Agent Swarm (FastAPI)
├── school/           → Next.js Education Platform
├── games/            → Next.js Games (placeholder)
├── database/         → PostgreSQL migration files
├── docs/             → Architecture & deployment docs
└── scripts/          → Setup and utility scripts
```

## AI Agent Swarm

The platform uses a hierarchical multi-agent system:

- **Alpha Scout** — Sentiment analysis via RSS feeds and NLP
- **Technical Analyst** — SMC (Order Blocks, FVG), Elliott Wave, S/R, RSI, Bollinger
- **Risk Sentinel** — Portfolio protection, kill switch, volatility monitoring
- **PrimeOrchestrator** — Consensus voting, signal aggregation, final decision
- **Quant Lab** — Nightly performance optimization (AutoML)

## Key Features

- Real-time crypto charting with TradingView-style indicators
- Backtesting engine with strategy simulation
- JWT authentication with subscription tiers (Free/Pro/Premium)
- Telegram alert integration
- Claude AI-powered trading education
- Multi-agent signal generation and risk management

## Deployment

Deployed on Railway with subdomain routing:
- `ualgotrade.com` — Main trading app
- `api.ualgotrade.com` — Backend API
- `school.ualgotrade.com` — Education platform
- AI Engine runs on internal networking only

## License

Proprietary — AntiGravity Ventures
