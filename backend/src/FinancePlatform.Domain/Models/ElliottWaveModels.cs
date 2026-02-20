using System;
using System.Collections.Generic;

namespace FinancePlatform.Domain.Models
{
    public class ElliottWaveRequest
    {
        public string Symbol { get; set; } = string.Empty;
        public string Timeframe { get; set; } = string.Empty;
        public int Length1 { get; set; } = 4;
        public int Length2 { get; set; } = 8;
        public int Length3 { get; set; } = 16;
        public bool UseLength1 { get; set; } = true;
        public bool UseLength2 { get; set; } = true;
        public bool UseLength3 { get; set; } = true;
        public decimal FibLevel1 { get; set; } = 0.5m;
        public decimal FibLevel2 { get; set; } = 0.618m;
        public decimal FibLevel3 { get; set; } = 0.764m;
        public decimal FibLevel4 { get; set; } = 0.854m;
        public int Limit { get; set; } = 1000;
        public DateTime? Since { get; set; }
    }

    public class ElliottWaveResponse
    {
        public string Symbol { get; set; } = string.Empty;
        public string Timeframe { get; set; } = string.Empty;
        public string Exchange { get; set; } = string.Empty;
        public List<WavePattern> WavePatterns { get; set; } = new List<WavePattern>();
        public List<ZigZagPoint> ZigZagPoints { get; set; } = new List<ZigZagPoint>();
    }

    public class WavePattern
    {
        public string Type { get; set; } = string.Empty;
        public string Direction { get; set; } = string.Empty;
        public bool IsValid { get; set; } = true;
        public DateTime Date { get; set; }
        public int Index { get; set; }
        public List<WavePoint> Points { get; set; } = new List<WavePoint>();
        public List<FibonacciLevel> FibonacciLevels { get; set; } = new List<FibonacciLevel>();
        public bool IsFibonacciLevelsBroken { get; set; } = false;
        public WavePattern? NextPattern { get; set; }
        public bool PossibleNewStart { get; set; } = false;
    }

    public class WavePoint
    {
        public string Label { get; set; } = string.Empty;
        public int Index { get; set; }
        public decimal Price { get; set; }
        public DateTime Date { get; set; }
    }

    public class FibonacciLevel
    {
        public decimal Level { get; set; }
        public decimal Ratio { get; set; }
        public decimal Price { get; set; }
    }

    public class ZigZagPoint
    {
        public int Direction { get; set; }
        public int Index { get; set; }
        public decimal Price { get; set; }
        public DateTime Date { get; set; }
    }
}
