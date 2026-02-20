# API

FastAPI route definitions. The router aggregates all endpoint modules.

## Key Files

| File | Purpose |
|------|---------|
| `router.py` | Main router — aggregates all endpoint modules |
| `endpoints/health.py` | `/health`, `/ping`, `/readiness` endpoints |
| `endpoints/signals.py` | `/signals/scan`, `/signals/recent` |
| `endpoints/agents.py` | `/agents/status`, `/agents/heartbeat/{name}` |
| `endpoints/orchestrator.py` | `/orchestrate/run`, `/orchestrate/consensus/{id}` |
| `endpoints/optimization.py` | `/optimize/run`, `/optimize/performance` |
