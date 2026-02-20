# Backend — .NET 9.0 API

The backend is a C# .NET 9.0 Web API built with Clean Architecture. It serves as the API gateway for the frontend and proxies AI requests to the Python AI Engine.

## Key Files

| File | Purpose |
|------|---------|
| `src/FinancePlatform.API/Program.cs` | Application entry point, DI registration, middleware pipeline |
| `src/FinancePlatform.API/appsettings.json` | Configuration (DB, Auth, AI Engine URL, CORS) |
| `FinancePlatform.sln` | .NET solution file |
| `Dockerfile` | .NET 9.0 SDK build + ASP.NET runtime |
| `railway.toml` | Railway deployment config |

## Architecture (Clean Architecture)

```
FinancePlatform.API/          → Controllers, Services, Auth, Program.cs
FinancePlatform.Application/  → Interfaces (abstractions)
FinancePlatform.Domain/       → Domain models
FinancePlatform.Infrastructure/ → Data access, external services
```

## Controllers

| Controller | Path | Purpose |
|-----------|------|---------|
| AuthController | `/api/auth/*` | Register, login (JWT) |
| MarketDataController | `/api/market-data/*` | Real-time crypto prices |
| IndicatorsController | `/api/indicators/*` | Technical indicators |
| BacktestController | `/api/backtest/*` | Strategy backtesting |
| AIAgentController | `/api/ai/*` | Claude AI chat (Grandmaster Owl) |
| AgentSwarmController | `/api/swarm/*` | AI swarm proxy to Python engine |
| PerformanceController | `/api/performance/*` | Portfolio performance data |
| AlertsController | `/api/alerts/*` | Price alerts management |

## Services

| Service | File | Purpose |
|---------|------|---------|
| AiSidecarClient | `Services/AiSidecarClient.cs` | HTTP proxy to Python AI Engine |
| AnthropicService | `Services/AnthropicService.cs` | Claude AI chat integration |
| TelegramSignalService | `Services/TelegramSignalService.cs` | Telegram bot notifications |
| FundingRateService | `Services/FundingRateService.cs` | Funding rate data |

## Auth

JWT-based authentication with subscription tiers (Free, Pro, Premium). See `Auth/` folder for:
- `AuthOptions.cs` — JWT config (SigningKey, Issuer, Audience)
- `JwtTokenService.cs` — Token generation
- `AuthService.cs` — Registration, login logic
- `PostgresAuthRepository.cs` — User persistence

## Local Development

```bash
cd backend
dotnet restore
dotnet build
dotnet run --project src/FinancePlatform.API
# Runs on http://localhost:8080
# Swagger: http://localhost:8080/swagger
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default: 8080) |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `Auth__SigningKey` | JWT signing key (min 32 chars) |
| `Auth__Issuer` | JWT issuer claim |
| `Auth__Audience` | JWT audience claim |
| `AiEngine__BaseUrl` | Python AI Engine URL |
| `AI__AnthropicApiKey` | Anthropic API key for Claude |
| `Cors__AllowedOrigins__0` | Allowed CORS origin |
