using System;
using System.Linq;
using System.Threading.Tasks;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Infrastructure.Indicators
{
    public class RsiService : IRsiService
    {
        private readonly ICryptoService _cryptoService;

        public RsiService(ICryptoService cryptoService)
        {
            _cryptoService = cryptoService;
        }

        public async Task<RsiResponse> CalculateRsiAsync(string symbol, string timeframe, int period, int limit)
        {
            if (period <= 0) throw new ArgumentOutOfRangeException(nameof(period), "Period must be > 0");
            if (limit <= 0) throw new ArgumentOutOfRangeException(nameof(limit), "Limit must be > 0");

            var requiredCandles = Math.Max(limit + period + 1, period + 2);

            var ohlc = await _cryptoService.FetchOHLCAsync(new OHLCRequest
            {
                Symbol = symbol,
                Timeframe = timeframe,
                Limit = requiredCandles
            });

            var candles = ohlc.Candles;
            if (candles is null || candles.Count < period + 1)
            {
                throw new InvalidOperationException($"Not enough data to calculate RSI({period}).");
            }

            decimal avgGain = 0m;
            decimal avgLoss = 0m;

            for (int i = 1; i <= period; i++)
            {
                var change = candles[i].Close - candles[i - 1].Close;
                if (change > 0) avgGain += change;
                else avgLoss += -change;
            }

            avgGain /= period;
            avgLoss /= period;

            var response = new RsiResponse
            {
                Id = "rsi",
                Name = $"RSI ({period})",
                Symbol = symbol,
                Timeframe = timeframe,
                Period = period
            };

            decimal first = ComputeRsi(avgGain, avgLoss);
            response.Points.Add(new IndicatorPoint
            {
                Time = candles[period].Timestamp / 1000,
                Value = first
            });

            for (int i = period + 1; i < candles.Count; i++)
            {
                var change = candles[i].Close - candles[i - 1].Close;
                var gain = change > 0 ? change : 0m;
                var loss = change < 0 ? -change : 0m;

                avgGain = (avgGain * (period - 1) + gain) / period;
                avgLoss = (avgLoss * (period - 1) + loss) / period;

                response.Points.Add(new IndicatorPoint
                {
                    Time = candles[i].Timestamp / 1000,
                    Value = ComputeRsi(avgGain, avgLoss)
                });
            }

            if (response.Points.Count > limit)
            {
                response.Points = response.Points.Skip(response.Points.Count - limit).ToList();
            }

            return response;
        }

        private static decimal ComputeRsi(decimal avgGain, decimal avgLoss)
        {
            if (avgGain == 0m && avgLoss == 0m) return 50m;
            if (avgLoss == 0m) return 100m;
            if (avgGain == 0m) return 0m;

            var rs = avgGain / avgLoss;
            return 100m - (100m / (1m + rs));
        }
    }
}
