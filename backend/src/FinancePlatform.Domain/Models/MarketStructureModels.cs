using System;
using System.Collections.Generic;

namespace FinancePlatform.Domain.Models
{
    public class MarketStructureRequest
    {
        public string Symbol { get; set; } = string.Empty;
        public string Timeframe { get; set; } = "1d";
        public int Limit { get; set; } = 500;
        public DateTime? Since { get; set; } = null;
        public int ZigZagLength { get; set; } = 7;
        public float FibFactor { get; set; } = 0.33f;
    }

    public class MarketStructureResponse
    {
        public string Symbol { get; set; } = string.Empty;
        public string Timeframe { get; set; } = string.Empty;
        public string Exchange { get; set; } = string.Empty;
        public List<SwingPoint> AllSwingPoints { get; set; } = new List<SwingPoint>();
        public List<IdentifiedOrderBlock> OrderBlocks { get; set; } = new List<IdentifiedOrderBlock>();
        public List<IdentifiedBreakerBlock> BreakerBlocks { get; set; } = new List<IdentifiedBreakerBlock>();
        public List<MarketStructureBreak> MarketStructureBreaks { get; set; } = new List<MarketStructureBreak>();
    }

    public class SwingPoint
    {
        public DateTime Date { get; set; }
        public int Index { get; set; }
        public decimal Price { get; set; }
        public string Type { get; set; } = string.Empty;
    }

    public class BaseBlockInfo
    {
        public decimal High { get; set; }
        public decimal Low { get; set; }
        public DateTime CandleDate { get; set; }
        public int CandleIndex { get; set; }
        public DateTime MsbDate { get; set; }
        public int MsbIndex { get; set; }
        public string MsbDirection { get; set; } = string.Empty;
        public bool IsMitigated { get; set; } = false;
        public DateTime? MitigatedDate { get; set; } = null;
        public int? MitigatedIndex { get; set; } = null;
    }

    public class IdentifiedOrderBlock : BaseBlockInfo
    {
        public string OrderBlockType { get; set; } = string.Empty;
    }

    public class IdentifiedBreakerBlock : BaseBlockInfo
    {
        public string BreakerBlockType { get; set; } = string.Empty;
    }

    public class MarketStructureBreak
    {
        public DateTime Date { get; set; }
        
        public int Index { get; set; }
        
        public DateTime BreakCandleDate { get; set; }
        
        public int BreakCandleIndex { get; set; }
        
        public string Type { get; set; } = string.Empty;
        public SwingPoint BrokenSwingPoint { get; set; } = new SwingPoint();
        public SwingPoint PrecedingSwingPoint { get; set; } = new SwingPoint();
        public SwingPoint H0_at_break { get; set; } = new SwingPoint();
        public SwingPoint L0_at_break { get; set; } = new SwingPoint();
        public SwingPoint H1_at_break { get; set; } = new SwingPoint();
        public SwingPoint L1_at_break { get; set; } = new SwingPoint();
    }
}
