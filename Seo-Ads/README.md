# Seo-Ads: AI Social Media Content Engine

Culture-aware, platform-optimized content generation API for crypto trading platforms.

## Features

- **6 Region Profiles**: EN, TR, TH, AR, RU, ZH — each with unique tone, CTA styles, hashtag banks, trust signals, and cultural taboos
- **6 Platform Adapters**: Google Ads, Meta (Facebook), Instagram, X (Twitter), YouTube, SEO Blog — with character limits and format specs
- **4 Content Topics**: crypto_trading, market_update, product_promo, educational
- **Bulk Generation**: Generate content for all regions × platforms in one call

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/content/generate` | Generate single content piece |
| POST | `/content/bulk` | Generate for multiple regions × platforms |
| GET | `/content/regions` | List available regions with profiles |
| GET | `/content/platforms` | List platforms with specs |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI (auto-generated) |

## Quick Start

```bash
# Install dependencies
pip install -e .

# Run locally
uvicorn src.main:app --reload --port 8080

# Or with Docker
docker build -t seo-ads .
docker run -p 8080:8080 seo-ads
```

## Example Request

```bash
curl -X POST http://localhost:8080/content/generate \
  -H "Content-Type: application/json" \
  -d '{
    "region": "tr",
    "platform": "meta_ig",
    "topic": "crypto_trading",
    "symbol": "BTCUSDT"
  }'
```

## Deploy to Railway

```bash
railway up
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `LOG_LEVEL` | `info` | Logging level |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

## Project Structure

```
Seo-Ads/
├── src/
│   ├── main.py                      # FastAPI entry point
│   ├── models/
│   │   └── content.py               # Pydantic models & enums
│   ├── services/
│   │   └── content_generator.py     # Region profiles + content engine
│   └── api/
│       └── endpoints/
│           └── content.py           # REST endpoints
├── pyproject.toml                   # Dependencies
├── Dockerfile                       # Container build
├── railway.toml                     # Railway config
└── .env.example                     # Env vars template
```

## License

MIT
