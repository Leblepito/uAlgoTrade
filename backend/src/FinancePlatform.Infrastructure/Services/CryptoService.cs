using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Binance.Net.Clients;
using Binance.Net.Enums;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Infrastructure.Services
{
    public class CryptoService : ICryptoService
    {
        private readonly HttpClient _httpClient;

        public CryptoService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<OHLCResponse> FetchOHLCAsync(OHLCRequest request)
        {
            var binanceClient = new BinanceRestClient();
            var interval = ToKlineInterval(request.Timeframe);
            var symbol = request.Symbol.ToUpperInvariant();
            int totalLimit = request.Limit;
            var startTime = request.Since;

            var response = new OHLCResponse
            {
                Symbol = request.Symbol,
                Timeframe = request.Timeframe,
                Exchange = "binance",
                Candles = new List<Candle>()
            };

            try
            {
                const int maxPerRequest = 1000;
                int remaining = totalLimit;
                DateTime? currentEndTime = null;

                while (remaining > 0)
                {
                    int batchSize = Math.Min(remaining, maxPerRequest);
                    
                    var result = await binanceClient.SpotApi.ExchangeData.GetKlinesAsync(
                        symbol.EndsWith("USDT") ? symbol : symbol + "USDT",
                        interval,
                        startTime: startTime,
                        endTime: currentEndTime,
                        limit: batchSize
                    );

                    if (result?.Data == null || !result.Data.Any())
                        break;

                    var candles = result.Data.ToList();
                    
                    foreach (var kline in candles)
                    {
                        response.Candles.Add(new Candle
                        {
                            Timestamp = new DateTimeOffset(kline.OpenTime).ToUnixTimeMilliseconds(),
                            DateTime = kline.OpenTime,
                            Open = kline.OpenPrice,
                            High = kline.HighPrice,
                            Low = kline.LowPrice,
                            Close = kline.ClosePrice,
                            Volume = kline.Volume
                        });
                    }

                    remaining -= candles.Count;

                    if (candles.Count < batchSize)
                        break;

                    currentEndTime = candles.First().OpenTime.AddMilliseconds(-1);
                }

                response.Candles = response.Candles.OrderBy(c => c.Timestamp).ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Binance API error: {ex.Message}");
            }

            return response;
        }

        private KlineInterval ToKlineInterval(string timeframe)
        {
            return timeframe switch
            {
                "1m" => KlineInterval.OneMinute,
                "3m" => KlineInterval.ThreeMinutes,
                "5m" => KlineInterval.FiveMinutes,
                "15m" => KlineInterval.FifteenMinutes,
                "30m" => KlineInterval.ThirtyMinutes,
                "1h" => KlineInterval.OneHour,
                "2h" => KlineInterval.TwoHour,
                "4h" => KlineInterval.FourHour,
                "6h" => KlineInterval.SixHour,
                "8h" => KlineInterval.EightHour,
                "12h" => KlineInterval.TwelveHour,
                "1d" => KlineInterval.OneDay,
                "3d" => KlineInterval.ThreeDay,
                "1w" => KlineInterval.OneWeek,
                "1M" => KlineInterval.OneMonth,
                _ => KlineInterval.OneDay
            };
        }
    }
}
