using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FinancePlatform.Domain.Models
{
    public class SrLevel
    {
        [JsonPropertyName("y")]
        public float Y { get; set; }

        [JsonPropertyName("area")]
        public float Area { get; set; }

        [JsonIgnore]
        public long X { get; set; }

        [JsonPropertyName("date")]
        public DateTime Date => DateTimeOffset.FromUnixTimeMilliseconds(X).UtcDateTime;

        [JsonPropertyName("isSupport")]
        public bool IsSupport { get; set; }
    }

    public class SupportResistanceResponse
    {
        [JsonPropertyName("levels")]
        public List<SrLevel> Levels { get; set; } = new List<SrLevel>();

        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = string.Empty;

        [JsonPropertyName("timeframe")]
        public string Timeframe { get; set; } = string.Empty;

        [JsonPropertyName("calculationTime")]
        public DateTime CalculationTime { get; set; } = DateTime.UtcNow;
    }
}
