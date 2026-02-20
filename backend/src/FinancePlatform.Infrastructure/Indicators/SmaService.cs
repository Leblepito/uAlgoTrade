using System;
using System.Linq;
using System.Threading.Tasks;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Infrastructure.Indicators
{
    public class SmaService : ISmaService
    {
        private readonly ICryptoService _cryptoService;

        public SmaService(ICryptoService cryptoService)
        {
            _cryptoService = cryptoService;
        }

        public async Task<LineIndicatorResponse> CalculateSmaAsync(string symbol, string timeframe, int period, int limit)
        {
            if (period <= 0) throw new ArgumentOutOfRangeException(nameof(period), "Period must be > 0");
            if (limit <= 0) throw new ArgumentOutOfRangeException(nameof(limit), "Limit must be > 0");

            var requiredCandles = Math.Max(limit, period + 1);

            var ohlc = await _cryptoService.FetchOHLCAsync(new OHLCRequest
            {
                Symbol = symbol,
                Timeframe = timeframe,
                Limit = requiredCandles
            });

            var candles = ohlc.Candles;
            if (candles is null || candles.Count < period)
            {
                throw new InvalidOperationException($"Not enough data to calculate SMA({period}).");
            }

            decimal sum = 0m;
            var response = new LineIndicatorResponse
            {
                Id = "sma",
                Name = $"SMA ({period})",
                Symbol = symbol,
                Timeframe = timeframe,
                Period = period
            };

            for (int i = 0; i < candles.Count; i++)
            {
                sum += candles[i].Close;

                if (i >= period)
                {
                    sum -= candles[i - period].Close;
                }

                if (i >= period - 1)
                {
                    response.Points.Add(new IndicatorPoint
                    {
                        Time = candles[i].Timestamp / 1000,
                        Value = sum / period
                    });
                }
            }

            if (response.Points.Count > limit)
            {
                response.Points = response.Points.Skip(response.Points.Count - limit).ToList();
            }

            return response;
        }
    }
}
