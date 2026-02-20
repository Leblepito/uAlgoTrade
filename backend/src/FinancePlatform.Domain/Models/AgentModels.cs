namespace FinancePlatform.Domain.Models
{
    public class AgentHeartbeat
    {
        public string AgentName { get; set; }
        public string Status { get; set; } // alive, degraded, dead
        public DateTime LastHeartbeat { get; set; }
        public double? CpuUsage { get; set; }
        public int? MemoryMb { get; set; }
        public int ActiveTasks { get; set; }
        public string Version { get; set; }
        public long UptimeSeconds { get; set; }
    }

    public class SwarmStatus
    {
        public List<AgentInfo> Agents { get; set; } = new();
        public int TotalSignalsToday { get; set; }
        public int ActivePositions { get; set; }
        public bool KillSwitchActive { get; set; }
        public DateTime? LastScan { get; set; }
    }

    public class AgentInfo
    {
        public string Name { get; set; }
        public string Role { get; set; }
        public string Status { get; set; }
        public DateTime? LastHeartbeat { get; set; }
        public int ScanInterval { get; set; }
        public int SignalsGenerated { get; set; }
    }

    public class SwarmSignal
    {
        public long Id { get; set; }
        public string Symbol { get; set; }
        public string Direction { get; set; } // LONG, SHORT, NEUTRAL
        public decimal Confidence { get; set; }
        public string SourceAgent { get; set; }
        public string Status { get; set; } // pending, approved, rejected, executed
        public decimal? EntryPrice { get; set; }
        public decimal? StopLoss { get; set; }
        public decimal? TakeProfit { get; set; }
        public decimal? RiskReward { get; set; }
        public string Timeframe { get; set; }
        public string StrategyId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ConsensusVote
    {
        public long Id { get; set; }
        public long SignalId { get; set; }
        public string AgentName { get; set; }
        public string Vote { get; set; } // approve, reject, abstain
        public decimal Confidence { get; set; }
        public string Reasoning { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PortfolioPosition
    {
        public long Id { get; set; }
        public string Symbol { get; set; }
        public string Side { get; set; } // LONG, SHORT
        public decimal EntryPrice { get; set; }
        public decimal? CurrentPrice { get; set; }
        public decimal Quantity { get; set; }
        public decimal Leverage { get; set; }
        public decimal UnrealizedPnl { get; set; }
        public decimal UnrealizedPnlPct { get; set; }
        public decimal? StopLoss { get; set; }
        public decimal? TakeProfit { get; set; }
        public string StrategyId { get; set; }
        public string Status { get; set; }
        public DateTime OpenedAt { get; set; }
    }
}
