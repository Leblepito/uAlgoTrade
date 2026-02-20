# Indicators

Technical analysis indicator calculations used by the Technical Analyst agent.

## Key Files

| File | Purpose |
|------|---------|
| `rsi.py` | Relative Strength Index — Wilder's smoothing method |
| `bollinger.py` | Bollinger Bands — with bandwidth and %B calculations |
| `smc.py` | Smart Money Concepts — Order Block and Fair Value Gap detection |
| `elliott_wave.py` | Elliott Wave — simplified wave counting via pivot analysis |
| `support_resistance.py` | Support/Resistance — pivot-based level detection |

## Data Format

All indicators expect candle data as list of dicts with keys: `open`, `high`, `low`, `close`, `volume`.
