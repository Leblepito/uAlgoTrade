# Core

Core infrastructure modules used by all agents.

## Key Files

| File | Purpose |
|------|---------|
| `memory.py` | MemoryCore — persistent agent decision memory in PostgreSQL with TTL-based expiry |
| `message_bus.py` | MessageBus — async pub/sub for inter-agent communication |
| `decision_engine.py` | ConsensusEngine — weighted voting with Risk Sentinel veto power |

## Consensus Weights

```
technical_analyst: 0.35
risk_sentinel:     0.30
alpha_scout:       0.20
orchestrator:      0.15
```

A signal is approved when: weighted confidence >= 0.70, approve > reject votes, and Risk Sentinel has NOT vetoed.
