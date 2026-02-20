# uKeyTr Deployment Guide

## Railway Deployment

### Prerequisites
- Railway account with team plan (for internal networking)
- GitHub repo connected: `github.com/Leblepito/uKeyTr`
- Custom domains configured: `ualgotrade.com`, `api.ualgotrade.com`, `school.ualgotrade.com`

### Service Configuration

#### PostgreSQL
- Railway managed PostgreSQL plugin
- Shared between all services
- Run migrations after first deployment: `bash scripts/run-migrations.sh`

#### Backend (.NET)
- Root directory: `backend/`
- Build: Dockerfile
- Public domain: `api.ualgotrade.com`
- Port: 8080
- Health check: `/health`

#### Frontend (Next.js)
- Root directory: `frontend/`
- Build: Dockerfile
- Public domain: `ualgotrade.com`
- Port: 3000

#### AI Engine (Python)
- Root directory: `ai-engine/`
- Build: Dockerfile
- **No public domain** — internal networking only
- Port: 8000
- Health check: `/health`
- Backend connects via: `http://ai-engine.railway.internal:8000`

### Environment Variables

Set these in Railway service settings:

**Backend:**
```
PORT=8080
ConnectionStrings__DefaultConnection=<railway-postgres-url>
AiEngine__BaseUrl=http://ai-engine.railway.internal:8000
Auth__SigningKey=<32+ char secret>
Auth__Issuer=ukeytr
Auth__Audience=ukeytr-users
AI__AnthropicApiKey=sk-ant-...
Cors__AllowedOrigins__0=https://ualgotrade.com
```

**AI Engine:**
```
U2ALGO_DATABASE_URL=<railway-postgres-url>
U2ALGO_BINANCE_API_KEY=<optional>
U2ALGO_BINANCE_API_SECRET=<optional>
U2ALGO_TELEGRAM_BOT_TOKEN=<optional>
U2ALGO_TELEGRAM_CHAT_ID=<optional>
```

**Frontend:**
```
NEXT_PUBLIC_API_BASE_URL=https://api.ualgotrade.com
```

## Local Development

```bash
# 1. Clone and setup
git clone https://github.com/Leblepito/uKeyTr.git
cd uKeyTr
cp .env.example .env

# 2. Start all services
docker compose up

# 3. Run migrations
bash scripts/run-migrations.sh

# 4. Access
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8080
# AI Engine: http://localhost:8000
# Swagger:   http://localhost:8080/swagger
```

## Health Checks

```bash
curl http://localhost:8080/health   # Backend
curl http://localhost:8000/health   # AI Engine
curl http://localhost:3000          # Frontend
```
