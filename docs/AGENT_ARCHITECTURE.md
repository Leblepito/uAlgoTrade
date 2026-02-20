# AI Agent Swarm Architecture

## Hierarchical Mixture of Agents (USIP)

The uKeyTr AI Engine implements a hierarchical multi-agent system where specialized agents collaborate through consensus voting to generate trading signals.

## Agent Hierarchy

```
        PrimeOrchestrator (The Brain)
        /        |        \
  Alpha Scout  Technical   Risk Sentinel
  (Hunter)     Analyst     (Guardian)
                 |
            Quant Lab (Optimizer, nightly)
```

## Agent Descriptions

### PrimeOrchestrator
- **Role**: CEO/Decision maker
- **Function**: Collects analysis from all agents, runs consensus voting, makes final signal decision
- **Cycle**: Signal -> Risk Check -> Vote -> Execute/Reject -> Memory

### Alpha Scout
- **Role**: Sentiment Hunter
- **Data sources**: RSS feeds (CoinTelegraph, CoinDesk, CryptoNews)
- **Method**: Keyword-based scoring + TextBlob NLP sentiment analysis
- **Output**: Sentiment score [-1, 1], direction, confidence
- **Adaptive**: Bias correction via reinforcement learning feedback loop

### Technical Analyst
- **Role**: Multi-indicator analysis
- **Indicators**:
  - RSI (Relative Strength Index)
  - Bollinger Bands
  - Smart Money Concepts (Order Blocks, Fair Value Gaps)
  - Elliott Wave detection
  - Support/Resistance levels
- **Output**: Direction, confidence, entry/stop/take-profit levels, R:R ratio

### Risk Sentinel
- **Role**: Portfolio Guardian
- **Checks**:
  - Daily loss limit (3%)
  - Maximum drawdown (5%)
  - Position count limit (5)
  - Per-trade risk limit (2%)
  - Extreme volatility detection
- **Kill Switch**: Can halt all trading if risk thresholds are breached
- **Veto Power**: Reject votes with >80% confidence override consensus

### Quant Lab
- **Role**: Nightly Optimizer
- **Function**: Analyzes past performance, computes win rate/Sharpe/drawdown, tunes parameters
- **Schedule**: Runs at 00:00 UTC daily
- **Output**: Performance metrics, parameter recommendations, portfolio snapshots

## Consensus Voting

```
Agent Weights:
  technical_analyst: 0.35
  risk_sentinel:     0.30
  alpha_scout:       0.20
  orchestrator:      0.15
```

A signal is **approved** when:
1. Weighted confidence >= 0.70 (configurable)
2. Approve votes > Reject votes
3. Risk Sentinel has NOT vetoed (reject with >80% confidence)

## Memory System (MemoryCore)

Each agent has persistent memory stored in PostgreSQL:
- **Decision memories**: Trading decisions with importance scoring
- **Learning memories**: Patterns and insights (1-week TTL)
- **Error memories**: Failures for debugging (3-day TTL)
- **Pattern memories**: Detected recurring patterns

## Inter-Agent Communication

`MessageBus` provides in-process pub/sub:
- Topics: `analysis.{agent_name}`, `risk.kill_switch`
- Messages include sender, payload, timestamp, priority
- Recent message log maintained for debugging

## Scheduling (APScheduler)

| Job | Interval | Description |
|-----|----------|-------------|
| Scan Cycle | 60s | Full orchestration for all symbols |
| Risk Check | 5s | Risk sentinel portfolio monitoring |
| Heartbeat | 30s | All agents report health |
| Optimization | Daily 00:00 UTC | Quant Lab nightly analysis |
