# Environment Variables Reference

## Database
| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `DB_NAME` | docker-compose | `ukeytr` | PostgreSQL database name |
| `DB_USER` | docker-compose | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | docker-compose | `postgres` | PostgreSQL password |

## Authentication
| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `AUTH_SIGNING_KEY` | Backend | - | JWT signing key (min 32 chars) |
| `AUTH_ISSUER` | Backend | `ukeytr` | JWT issuer claim |
| `AUTH_AUDIENCE` | Backend | `ukeytr-users` | JWT audience claim |

## AI Services
| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `ANTHROPIC_API_KEY` | Backend | - | Anthropic API key for Claude |
| `U2ALGO_DATABASE_URL` | AI Engine | `postgresql://...` | PostgreSQL connection string |
| `U2ALGO_BINANCE_API_KEY` | AI Engine | - | Binance API key |
| `U2ALGO_BINANCE_API_SECRET` | AI Engine | - | Binance API secret |
| `U2ALGO_DEBUG` | AI Engine | `false` | Enable debug mode |

## Notifications
| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | Both | - | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Both | - | Telegram chat/channel ID |

## Service URLs
| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | `http://localhost:8080` | Backend API URL |
| `AiEngine__BaseUrl` | Backend | `http://localhost:8000` | AI Engine URL |

## AI Engine Agent Config
| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `U2ALGO_DEFAULT_SYMBOLS` | AI Engine | `BTCUSDT,ETHUSDT` | Default trading symbols |
| `U2ALGO_SCAN_INTERVAL_SECONDS` | AI Engine | `60` | Scan cycle interval |
| `U2ALGO_RISK_CHECK_INTERVAL_SECONDS` | AI Engine | `5` | Risk check interval |
| `U2ALGO_MIN_CONSENSUS_CONFIDENCE` | AI Engine | `0.7` | Minimum confidence for signal approval |
| `U2ALGO_MAX_RISK_PER_TRADE` | AI Engine | `0.02` | Maximum risk per trade (2%) |
| `U2ALGO_KILL_SWITCH_DRAWDOWN` | AI Engine | `0.05` | Kill switch drawdown threshold (5%) |
