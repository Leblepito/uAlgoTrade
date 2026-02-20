# Agents

The 5 AI trading agents that form the hierarchical multi-agent swarm.

## Key Files

| File | Purpose |
|------|---------|
| `base_agent.py` | Abstract base class — heartbeat, memory integration, error tracking |
| `alpha_scout.py` | Sentiment Hunter — RSS feeds (CoinTelegraph, CoinDesk) + TextBlob NLP |
| `technical_analyst.py` | Multi-indicator analysis — RSI, Bollinger, SMC, Elliott Wave, S/R |
| `risk_sentinel.py` | Portfolio Guardian — kill switch, drawdown limits, volatility detection |
| `orchestrator.py` | The Brain — signal collection, consensus voting, final decision |
| `quant_lab.py` | Nightly Optimizer — performance metrics, parameter tuning |

## Agent Hierarchy

```
        PrimeOrchestrator
        /        |        \
  Alpha Scout  Technical   Risk Sentinel
               Analyst
                 |
            Quant Lab (nightly)
```

## Adding a New Agent

1. Create `your_agent.py` extending `BaseAgent`
2. Implement `async def analyze(self, symbol, candles, **kwargs)` method
3. Register in `orchestrator.py` agent list
4. Add weight in `core/decision_engine.py`
