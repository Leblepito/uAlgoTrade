using System;
using System.Collections.Generic;

namespace FinancePlatform.Domain.Models
{
    public class AlertDto
    {
        public Guid Id { get; set; }
        public string Symbol { get; set; } = "";
        public string Timeframe { get; set; } = "1h";
        public string AlertType { get; set; } = ""; // price_above, price_below, indicator_signal
        public decimal? TargetPrice { get; set; }
        public string? IndicatorType { get; set; }
        public string? SignalSubtype { get; set; }
        public string Status { get; set; } = "active";
        public DateTime? TriggeredAt { get; set; }
        public string? TriggerMessage { get; set; }
        public string? Name { get; set; }
        public string Condition { get; set; } = "Crossing";
        public string Frequency { get; set; } = "OnlyOnce";
        public DateTime? ExpirationTime { get; set; }
        public long? LastTriggeredBarTime { get; set; }
        public string Settings { get; set; } = "{}";
        public DateTime CreatedAt { get; set; }
    }

    public class CreateAlertRequest
    {
        public string Symbol { get; set; } = "";
        public string Timeframe { get; set; } = "1h";
        public string AlertType { get; set; } = ""; // price_above, price_below, indicator_signal
        public decimal? TargetPrice { get; set; }
        public string? IndicatorType { get; set; }
        public string? SignalSubtype { get; set; }
        public string? Name { get; set; }
        public string Condition { get; set; } = "Crossing"; // Default
        public string Frequency { get; set; } = "OnlyOnce"; // Default
        public DateTime? ExpirationTime { get; set; }
        public string? Settings { get; set; }
    }

    public class DrawingDto
    {
        public Guid Id { get; set; }
        public string Symbol { get; set; } = "";
        public string Timeframe { get; set; } = "1h";
        public string DrawingType { get; set; } = "";
        public string Data { get; set; } = "{}"; // JSON string
        public DateTime CreatedAt { get; set; }
    }

    public class SaveDrawingRequest
    {
        public string Symbol { get; set; } = "";
        public string Timeframe { get; set; } = "1h";
        public string DrawingType { get; set; } = "";
        public string Data { get; set; } = "{}";
    }
}
