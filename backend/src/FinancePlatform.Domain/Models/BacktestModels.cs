using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FinancePlatform.Domain.Models
{
    #region Request Models

    public class BacktestRequest
    {
        public string Symbol { get; set; } = "BTCUSDT";
        public string Timeframe { get; set; } = "1h";
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public decimal InitialWallet { get; set; } = 1000m;
        public decimal StopLossPercent { get; set; } = 2m;
        public decimal TakeProfitPercent { get; set; } = 4m;
        public decimal MakerFee { get; set; } = 0.1m;
        public decimal TakerFee { get; set; } = 0.1m;

        public decimal PositionSizePercent { get; set; } = 100m;

        public IndicatorStrategy Strategy { get; set; } = new IndicatorStrategy();
    }

    public class IndicatorStrategy
    {
        [JsonPropertyName("indicatorType")]
        public string IndicatorType { get; set; } = "support-resistance";

        [JsonPropertyName("signalType")]
        public string SignalType { get; set; } = "bounce";

        [JsonPropertyName("parameters")]
        public Dictionary<string, object> Parameters { get; set; } = new Dictionary<string, object>();
    }

    #endregion

    #region Response Models

    public class BacktestResult
    {
        [JsonPropertyName("initialBalance")]
        public decimal InitialBalance { get; set; }

        [JsonPropertyName("finalBalance")]
        public decimal FinalBalance { get; set; }

        [JsonPropertyName("totalPnL")]
        public decimal TotalPnL { get; set; }

        [JsonPropertyName("totalPnLPercent")]
        public decimal TotalPnLPercent { get; set; }

        [JsonPropertyName("winRate")]
        public decimal WinRate { get; set; }

        [JsonPropertyName("totalTrades")]
        public int TotalTrades { get; set; }

        [JsonPropertyName("winningTrades")]
        public int WinningTrades { get; set; }

        [JsonPropertyName("losingTrades")]
        public int LosingTrades { get; set; }

        [JsonPropertyName("maxDrawdown")]
        public decimal MaxDrawdown { get; set; }

        [JsonPropertyName("maxDrawdownPercent")]
        public decimal MaxDrawdownPercent { get; set; }

        [JsonPropertyName("sharpeRatio")]
        public decimal SharpeRatio { get; set; }

        [JsonPropertyName("profitFactor")]
        public decimal ProfitFactor { get; set; }

        [JsonPropertyName("averageWin")]
        public decimal AverageWin { get; set; }

        [JsonPropertyName("averageLoss")]
        public decimal AverageLoss { get; set; }

        [JsonPropertyName("averageWinPercent")]
        public decimal AverageWinPercent { get; set; }

        [JsonPropertyName("averageLossPercent")]
        public decimal AverageLossPercent { get; set; }

        [JsonPropertyName("largestWin")]
        public decimal LargestWin { get; set; }

        [JsonPropertyName("largestLoss")]
        public decimal LargestLoss { get; set; }

        [JsonPropertyName("totalFeesPaid")]
        public decimal TotalFeesPaid { get; set; }

        [JsonPropertyName("averageHoldingPeriod")]
        public string AverageHoldingPeriod { get; set; } = string.Empty;

        [JsonPropertyName("trades")]
        public List<TradeRecord> Trades { get; set; } = new List<TradeRecord>();

        [JsonPropertyName("equityCurve")]
        public List<EquityPoint> EquityCurve { get; set; } = new List<EquityPoint>();

        [JsonPropertyName("symbol")]
        public string Symbol { get; set; } = string.Empty;

        [JsonPropertyName("timeframe")]
        public string Timeframe { get; set; } = string.Empty;

        [JsonPropertyName("startDate")]
        public DateTime StartDate { get; set; }

        [JsonPropertyName("endDate")]
        public DateTime EndDate { get; set; }

        [JsonPropertyName("strategyUsed")]
        public string StrategyUsed { get; set; } = string.Empty;
    }

    #endregion

    #region Trade Models

    public class TradeRecord
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("direction")]
        public string Direction { get; set; } = string.Empty;

        [JsonPropertyName("entryDate")]
        public DateTime EntryDate { get; set; }

        [JsonPropertyName("entryPrice")]
        public decimal EntryPrice { get; set; }

        [JsonPropertyName("exitDate")]
        public DateTime ExitDate { get; set; }

        [JsonPropertyName("exitPrice")]
        public decimal ExitPrice { get; set; }

        [JsonPropertyName("stopLoss")]
        public decimal StopLoss { get; set; }

        [JsonPropertyName("takeProfit")]
        public decimal TakeProfit { get; set; }

        [JsonPropertyName("positionSize")]
        public decimal PositionSize { get; set; }

        [JsonPropertyName("quantity")]
        public decimal Quantity { get; set; }

        [JsonPropertyName("pnL")]
        public decimal PnL { get; set; }

        [JsonPropertyName("pnLPercent")]
        public decimal PnLPercent { get; set; }

        [JsonPropertyName("fees")]
        public decimal Fees { get; set; }

        [JsonPropertyName("exitReason")]
        public string ExitReason { get; set; } = string.Empty;

        [JsonPropertyName("balanceAfter")]
        public decimal BalanceAfter { get; set; }

        [JsonPropertyName("signalSource")]
        public string SignalSource { get; set; } = string.Empty;

        [JsonPropertyName("holdingPeriodMinutes")]
        public int HoldingPeriodMinutes { get; set; }
    }

    public enum TradeDirection
    {
        Long,
        Short
    }

    public enum ExitReason
    {
        TakeProfit,
        StopLoss,
        Signal,
        EndOfData
    }

    #endregion

    #region Equity Models

    public class EquityPoint
    {
        [JsonPropertyName("timestamp")]
        public long Timestamp { get; set; }

        [JsonPropertyName("date")]
        public DateTime Date { get; set; }

        [JsonPropertyName("balance")]
        public decimal Balance { get; set; }

        [JsonPropertyName("drawdown")]
        public decimal Drawdown { get; set; }

        [JsonPropertyName("drawdownPercent")]
        public decimal DrawdownPercent { get; set; }
    }

    #endregion

    #region Signal Models

    public class TradingSignal
    {
        public DateTime Date { get; set; }
        public int CandleIndex { get; set; }
        public TradeDirection Direction { get; set; }
        public decimal Price { get; set; }
        public string Source { get; set; } = string.Empty;
        public decimal? SuggestedStopLoss { get; set; }
        public decimal? SuggestedTakeProfit { get; set; }
    }

    #endregion

    #region Strategy Definitions

    public static class StrategyDefinitions
    {
        public static readonly Dictionary<string, List<StrategyOption>> AvailableStrategies = new()
        {
            {
                "support-resistance", new List<StrategyOption>
                {
                    new StrategyOption
                    {
                        Id = "bounce",
                        Name = "Zone Bounce",
                        Description = "LONG when price bounces from support, SHORT when price bounces from resistance"
                    },
                    new StrategyOption
                    {
                        Id = "breakout",
                        Name = "Zone Breakout",
                        Description = "LONG when price breaks above resistance, SHORT when price breaks below support"
                    }
                }
            },
            {
                "market-structure", new List<StrategyOption>
                {
                    new StrategyOption
                    {
                        Id = "msb",
                        Name = "Market Structure Break",
                        Description = "LONG on Bullish MSB, SHORT on Bearish MSB"
                    },
                    new StrategyOption
                    {
                        Id = "order-block",
                        Name = "Order Block",
                        Description = "LONG when price touches Bullish OB, SHORT when price touches Bearish OB"
                    },
                    new StrategyOption
                    {
                        Id = "breaker-block",
                        Name = "Breaker Block",
                        Description = "LONG when price touches Bullish BB, SHORT when price touches Bearish BB"
                    }
                }
            },
            {
                "elliott-wave", new List<StrategyOption>
                {
                    new StrategyOption
                    {
                        Id = "wave-complete",
                        Name = "Wave 5 Complete",
                        Description = "SHORT after Bullish Wave 5 completes, LONG after Bearish Wave 5 completes"
                    },
                    new StrategyOption
                    {
                        Id = "corrective-end",
                        Name = "Corrective Wave End",
                        Description = "LONG after Bullish ABC correction, SHORT after Bearish ABC correction"
                    }
                }
            }
        };
    }

    public class StrategyOption
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
    }

    public class IndicatorInfo
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("strategies")]
        public List<StrategyOption> Strategies { get; set; } = new List<StrategyOption>();

        [JsonPropertyName("defaultParameters")]
        public Dictionary<string, object> DefaultParameters { get; set; } = new Dictionary<string, object>();
    }

    #endregion
}
