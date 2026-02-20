using System.Collections.Generic;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Application.Interfaces
{
    public interface ITradeSimulatorService
    {
        SimulationResult SimulateTrades(
            List<Candle> candles,
            List<TradingSignal> signals,
            decimal initialBalance,
            decimal stopLossPercent,
            decimal takeProfitPercent,
            decimal makerFee,
            decimal takerFee,
            decimal positionSizePercent,
            int startIndex = 0);
    }

    public class SimulationResult
    {
        public List<TradeRecord> Trades { get; set; } = new List<TradeRecord>();
        public List<EquityPoint> EquityCurve { get; set; } = new List<EquityPoint>();
        public decimal FinalBalance { get; set; }
        public decimal TotalFeesPaid { get; set; }
    }
}
