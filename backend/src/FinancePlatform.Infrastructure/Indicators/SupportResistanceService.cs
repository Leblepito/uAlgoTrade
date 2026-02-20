using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Infrastructure.Indicators
{
    public class SupportResistanceService : ISupportResistanceService
    {
        private readonly IMarketDataProvider _marketDataProvider;

        public SupportResistanceService(IMarketDataProvider marketDataProvider)
        {
            _marketDataProvider = marketDataProvider;
        }

        public async Task<SupportResistanceResponse> CalculateSupportResistance(
            string symbol,
            string interval,
            float multiplicativeFactor = 8.0f,
            int atrLength = 50,
            int extendLast = 4,
            int limit = 500)
        {
            int requiredCandles = Math.Max(limit, atrLength * 2);
            var candles = await _marketDataProvider.GetKlinesAsync(NormalizeSymbol(symbol), interval, requiredCandles);

            return CalculateSupportResistanceFromCandles(candles, symbol, interval, multiplicativeFactor, atrLength, extendLast);
        }

        private static string NormalizeSymbol(string symbol)
        {
            var s = (symbol ?? string.Empty).Trim().ToUpperInvariant();
            if (string.IsNullOrEmpty(s)) return s;
            return s.EndsWith("USDT", StringComparison.Ordinal) ? s : s + "USDT";
        }

        public SupportResistanceResponse CalculateSupportResistanceFromCandles(
            List<Candle> candles,
            string symbol,
            string interval,
            float multiplicativeFactor = 8.0f,
            int atrLength = 50,
            int extendLast = 4,
            bool returnAllLevels = false)
        {
            if (candles == null || candles.Count < atrLength + 1)
            {
                return new SupportResistanceResponse
                {
                    Symbol = symbol,
                    Timeframe = interval,
                    Levels = new List<SrLevel>()
                };
            }

            decimal[] atr = CalculateATR(candles, atrLength);

            List<SrLevel> srLevels = new List<SrLevel>();
            decimal avg = candles[0].Close;
            decimal holdAtr = 0;
            int os = 0;

            decimal prevAvg = avg;

            for (int i = 0; i < candles.Count; i++)
            {
                decimal close = candles[i].Close;
                long timestamp = candles[i].Timestamp;

                if (i < atrLength)
                    continue;

                decimal breakoutAtr = atr[i] * (decimal)multiplicativeFactor;
                bool isBreakoutPoint = false;

                prevAvg = avg;
                if (Math.Abs((double)(close - avg)) > (double)breakoutAtr)
                {
                    avg = close;
                    holdAtr = breakoutAtr;
                    isBreakoutPoint = true;
                }

                if (avg > prevAvg)
                    os = 1;
                else if (avg < prevAvg)
                    os = 0;

                decimal? upperRes = os == 0 ? avg + holdAtr / (decimal)multiplicativeFactor : (decimal?)null;
                decimal? lowerRes = os == 0 ? avg + holdAtr / (decimal)multiplicativeFactor / 2 : (decimal?)null;
                decimal? upperSup = os == 1 ? avg - holdAtr / (decimal)multiplicativeFactor / 2 : (decimal?)null;
                decimal? lowerSup = os == 1 ? avg - holdAtr / (decimal)multiplicativeFactor : (decimal?)null;

                if (isBreakoutPoint)
                {
                    if (os == 1)
                    {
                        srLevels.Add(new SrLevel
                        {
                            Y = (float)(decimal)lowerSup!.Value,
                            Area = (float)(decimal)upperSup!.Value,
                            X = timestamp,
                            IsSupport = true
                        });
                    }
                    else
                    {
                        srLevels.Add(new SrLevel
                        {
                            Y = (float)(decimal)upperRes!.Value,
                            Area = (float)(decimal)lowerRes!.Value,
                            X = timestamp,
                            IsSupport = false
                        });
                    }
                }
            }

            var response = new SupportResistanceResponse
            {
                Symbol = symbol,
                Timeframe = interval,
                Levels = returnAllLevels 
                    ? srLevels 
                    : srLevels.TakeLast(Math.Min(extendLast, srLevels.Count)).ToList()
            };

            return response;
        }

        private decimal[] CalculateATR(List<Candle> candles, int period)
        {
            int len = candles.Count;
            decimal[] atr = new decimal[len];
            decimal[] tr = new decimal[len];

            for (int i = 0; i < len; i++)
            {
                decimal high = candles[i].High;
                decimal low = candles[i].Low;
                decimal prevClose = i > 0 ? candles[i - 1].Close : candles[i].Open;

                decimal tr1 = high - low;
                decimal tr2 = Math.Abs(high - prevClose);
                decimal tr3 = Math.Abs(low - prevClose);

                tr[i] = Math.Max(Math.Max(tr1, tr2), tr3);
            }

            decimal sum = 0;

            for (int i = 0; i < period; i++)
            {
                sum += tr[i];
            }

            atr[period - 1] = sum / period;

            decimal alpha = 1.0m / period;
            for (int i = period; i < len; i++)
            {
                atr[i] = tr[i] * alpha + atr[i - 1] * (1 - alpha);
            }

            return atr;
        }
    }
}
