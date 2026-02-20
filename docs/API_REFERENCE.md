# uKeyTr API Reference

## Backend API (api.ualgotrade.com)

Base URL: `https://api.ualgotrade.com` (production) or `http://localhost:8080` (dev)

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Backend health check |

### Agent Swarm
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/swarm/health` | No | AI Engine health |
| GET | `/api/swarm/status` | Yes | All agents status |
| GET | `/api/swarm/agent/{name}` | Yes | Single agent heartbeat |
| POST | `/api/swarm/scan` | Yes | Trigger signal scan |
| GET | `/api/swarm/signals` | Yes | Recent signals |
| POST | `/api/swarm/orchestrate` | Yes | Manual orchestration |
| GET | `/api/swarm/consensus/{id}` | Yes | Consensus details |

### Performance
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/performance` | Yes | Equity curve + metrics |
| POST | `/api/performance/optimize` | Yes | Trigger optimization |

### Existing Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | User registration |
| POST | `/api/auth/login` | No | JWT login |
| GET | `/api/market-data/{symbol}` | No | Real-time price |
| GET | `/api/indicators/{symbol}` | Yes | Technical indicators |
| POST | `/api/backtest/run` | Yes | Run backtest |
| POST | `/api/ai/chat` | Yes | AI chat (Grandmaster Owl) |

## AI Engine API (Internal Only)

Base URL: `http://ai-engine.railway.internal:8000` or `http://localhost:8000`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Engine health + DB status |
| GET | `/ping` | Simple ping |
| GET | `/readiness` | DB connectivity check |
| POST | `/signals/scan` | Trigger full scan |
| GET | `/signals/recent` | Recent signals |
| GET | `/agents/status` | Swarm status |
| GET | `/agents/heartbeat/{name}` | Agent heartbeat |
| POST | `/orchestrate/run` | Manual orchestration |
| GET | `/orchestrate/consensus/{id}` | Vote details |
| GET | `/optimize/performance` | Performance data |
| POST | `/optimize/run` | Trigger optimization |

## Request/Response Examples

### POST /api/swarm/scan
```json
// Request
{ "symbols": ["BTCUSDT", "ETHUSDT"], "strategyId": "default" }

// Response
{ "scanned": 2, "results": [...] }
```

### GET /api/swarm/status
```json
{
  "agents": [
    { "name": "alpha_scout", "role": "...", "status": "alive", "last_heartbeat": "..." },
    { "name": "technical_analyst", "role": "...", "status": "alive" },
    { "name": "risk_sentinel", "role": "...", "status": "alive" },
    { "name": "orchestrator", "role": "...", "status": "alive" },
    { "name": "quant_lab", "role": "...", "status": "alive" }
  ],
  "total_signals_today": 12,
  "active_positions": 2,
  "kill_switch_active": false
}
```
