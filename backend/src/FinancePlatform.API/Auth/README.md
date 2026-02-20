# Auth

JWT-based authentication system with subscription tiers.

## Key Files

| File | Purpose |
|------|---------|
| `AuthOptions.cs` | JWT configuration model (SigningKey, Issuer, Audience, ExpiryMinutes) |
| `JwtTokenService.cs` | JWT token generation and validation |
| `AuthService.cs` | Registration, login, password hashing logic |
| `PostgresAuthRepository.cs` | User CRUD operations against PostgreSQL |
| `AlertRepository.cs` | Price alert persistence |

## Subscription Tiers

- **Free** — Basic market data, limited indicators
- **Pro** — All indicators, backtesting, AI chat
- **Premium** — Agent swarm access, signals, portfolio tracking
