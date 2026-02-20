# Services

External service integrations and data sources.

## Key Files

| File | Purpose |
|------|---------|
| `db.py` | AsyncPG connection pool singleton — shared PostgreSQL access |
| `binance_ws.py` | Binance REST API candle fetching with in-memory 5-minute cache |
| `sentiment.py` | RSS feed parser + TextBlob NLP sentiment scoring engine |
| `telegram_notifier.py` | Telegram bot API — signal alerts with formatted messages |
