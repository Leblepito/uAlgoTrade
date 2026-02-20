# AI Engine — Python FastAPI Sidecar

The AI Engine is a Python 3.12 FastAPI service that runs the multi-agent trading swarm. It communicates only with the .NET backend via internal networking (not exposed publicly).

## Key Files

| File | Purpose |
|------|---------|
| `src/main.py` | FastAPI entry point, lifespan events, `/health` endpoint |
| `src/config.py` | Pydantic Settings — all `U2ALGO_*` env vars |
| `src/api/router.py` | API route aggregator |
| `Dockerfile` | Python 3.12-slim container build |
| `pyproject.toml` | Dependencies and project metadata |
| `railway.toml` | Railway deployment config |

## Agent System

| Agent | File | Role |
|-------|------|------|
| Alpha Scout | `src/agents/alpha_scout.py` | RSS sentiment analysis |
| Technical Analyst | `src/agents/technical_analyst.py` | Multi-indicator analysis (RSI, Bollinger, SMC, Elliott) |
| Risk Sentinel | `src/agents/risk_sentinel.py` | Kill switch, drawdown protection |
| Orchestrator | `src/agents/orchestrator.py` | Consensus voting, final decisions |
| Quant Lab | `src/agents/quant_lab.py` | Nightly optimization |

## Core Modules

| Module | File | Purpose |
|--------|------|---------|
| MemoryCore | `src/core/memory.py` | Agent persistent decision memory (PostgreSQL) |
| MessageBus | `src/core/message_bus.py` | In-process pub/sub for inter-agent communication |
| DecisionEngine | `src/core/decision_engine.py` | Weighted consensus voting with veto power |

## Indicators

Located in `src/indicators/`:
- `rsi.py` — Relative Strength Index
- `bollinger.py` — Bollinger Bands
- `smc.py` — Smart Money Concepts (Order Blocks, Fair Value Gaps)
- `elliott_wave.py` — Elliott Wave detection
- `support_resistance.py` — Pivot-based S/R levels

## Services

Located in `src/services/`:
- `binance_ws.py` — Binance REST candle data with caching
- `sentiment.py` — RSS feed + TextBlob NLP engine
- `telegram_notifier.py` — Signal alert notifications
- `db.py` — AsyncPG connection pool

## Local Development

```bash
cd ai-engine
pip install -e ".[dev]"
python -m src.main
# Runs on http://localhost:8000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check with DB status |
| POST | `/signals/scan` | Trigger full signal scan |
| GET | `/signals/recent` | Recent signals list |
| GET | `/agents/status` | All agents' status |
| GET | `/agents/heartbeat/{name}` | Single agent heartbeat |
| POST | `/orchestrate/run` | Manual orchestration cycle |
| GET | `/orchestrate/consensus/{id}` | Consensus vote details |
| POST | `/optimize/run` | Trigger optimization |
| GET | `/optimize/performance` | Performance metrics |
