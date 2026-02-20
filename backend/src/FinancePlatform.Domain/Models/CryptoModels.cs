using System;
using System.Collections.Generic;

namespace FinancePlatform.Domain.Models
{
    public class OHLCRequest
    {
        public string Symbol { get; set; } = string.Empty;
        public string Timeframe { get; set; } = "1d";
        public int Limit { get; set; } = 500;
        public DateTime? Since { get; set; } = null;
    }

    public class OHLCResponse
    {
        public string Symbol { get; set; } = string.Empty;
        public string Timeframe { get; set; } = string.Empty;
        public string Exchange { get; set; } = string.Empty;
        public List<Candle> Candles { get; set; } = new List<Candle>();
    }

    public class Candle
    {
        public long Timestamp { get; set; }
        public DateTime DateTime { get; set; }
        public decimal Open { get; set; }
        public decimal High { get; set; }
        public decimal Low { get; set; }
        public decimal Close { get; set; }
        public decimal Volume { get; set; }
    }
}
