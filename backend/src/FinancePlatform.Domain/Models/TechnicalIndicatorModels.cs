using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FinancePlatform.Domain.Models
{
    public class IndicatorPoint
    {
        [JsonPropertyName("time")]
        public long Time { get; set; }

        [JsonPropertyName("value")]
        public decimal Value { get; set; }
    }

    public class LineIndicatorResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = string.Empty;

        [JsonPropertyName("timeframe")]
        public string Timeframe { get; set; } = string.Empty;

        [JsonPropertyName("period")]
        public int Period { get; set; }

        [JsonPropertyName("points")]
        public List<IndicatorPoint> Points { get; set; } = new List<IndicatorPoint>();
    }

    public class RsiResponse : LineIndicatorResponse
    {
        [JsonPropertyName("overbought")]
        public decimal Overbought { get; set; } = 70m;

        [JsonPropertyName("oversold")]
        public decimal Oversold { get; set; } = 30m;
    }
}

