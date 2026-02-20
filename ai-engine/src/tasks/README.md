# Tasks

Background task scheduling and scan loops.

## Key Files

| File | Purpose |
|------|---------|
| `scheduler.py` | APScheduler configuration — 4 periodic jobs (scan: 60s, risk: 5s, heartbeat: 30s, nightly: 00:00 UTC) |
| `scan_loop.py` | Manual full scan trigger — scans all configured symbols |

## Scheduled Jobs

| Job | Interval | Description |
|-----|----------|-------------|
| Scan Cycle | 60 seconds | Full orchestration for all symbols |
| Risk Check | 5 seconds | Risk Sentinel portfolio monitoring |
| Heartbeat | 30 seconds | All agents report health status |
| Optimization | Daily 00:00 UTC | Quant Lab nightly analysis |
