using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Domain.Models;
using Microsoft.Extensions.Logging;

namespace FinancePlatform.Infrastructure.Services
{
    /// <summary>
    /// CoinGecko Free API provider — fallback when Binance returns 451/403.
    /// Free tier: 50 calls/minute, no API key required.
    /// OHLC endpoint returns arrays: [timestamp_ms, open, high, low, close]
    /// Note: volume not available in OHLC endpoint; set to 0.
    /// </summary>
    public class CoinGeckoMarketDataProvider : IMarketDataProvider
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<CoinGeckoMarketDataProvider> _logger;

        // Map trading pair symbols to CoinGecko coin IDs
        private static readonly Dictionary<string, string> SymbolMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["BTCUSDT"]  = "bitcoin",
            ["ETHUSDT"]  = "ethereum",
            ["SOLUSDT"]  = "solana",
            ["BNBUSDT"]  = "binancecoin",
            ["XRPUSDT"]  = "ripple",
            ["ADAUSDT"]  = "cardano",
            ["DOGEUSDT"] = "dogecoin",
            ["AVAXUSDT"] = "avalanche-2",
            ["DOTUSDT"]  = "polkadot",
            ["MATICUSDT"]= "matic-network",
            ["LINKUSDT"] = "chainlink",
            ["LTCUSDT"]  = "litecoin",
            ["UNIUSDT"]  = "uniswap",
        };

        // Map interval string to CoinGecko 'days' parameter
        // CoinGecko OHLC granularity: 1-2 days=hourly, 3-30 days=daily
        private static readonly Dictionary<string, int> IntervalToDays = new(StringComparer.OrdinalIgnoreCase)
        {
            ["1m"]  = 1,
            ["3m"]  = 1,
            ["5m"]  = 1,
            ["15m"] = 1,
            ["30m"] = 2,
            ["1h"]  = 2,
            ["2h"]  = 4,
            ["4h"]  = 7,
            ["6h"]  = 14,
            ["8h"]  = 14,
            ["12h"] = 30,
            ["1d"]  = 90,
            ["3d"]  = 180,
            ["1w"]  = 365,
            ["1M"]  = 365,
        };

        public CoinGeckoMarketDataProvider(HttpClient httpClient, ILogger<CoinGeckoMarketDataProvider> logger)
        {
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "u2algo-platform/1.0");
            _logger = logger;
        }

        public async Task<List<Candle>> GetKlinesAsync(string symbol, string interval, int limit = 500, long? endTime = null)
        {
            if (!SymbolMap.TryGetValue(symbol.ToUpperInvariant(), out var coinId))
            {
                _logger.LogWarning("CoinGecko: No mapping for symbol {Symbol}, defaulting to bitcoin", symbol);
                coinId = "bitcoin";
            }

            int days = IntervalToDays.TryGetValue(interval, out var d) ? d : 7;
            // For larger limits, increase days
            if (limit > 200) days = Math.Max(days, 90);
            if (limit > 500) days = Math.Max(days, 180);

            var url = $"https://api.coingecko.com/api/v3/coins/{coinId}/ohlc?vs_currency=usd&days={days}";

            _logger.LogInformation("CoinGecko: Fetching {Symbol} ({CoinId}) OHLC for {Days} days", symbol, coinId, days);

            HttpResponseMessage response;
            try
            {
                response = await _httpClient.GetAsync(url);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CoinGecko: HTTP request failed for {Symbol}", symbol);
                return new List<Candle>();
            }

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("CoinGecko: Received {StatusCode} for {Symbol}", (int)response.StatusCode, symbol);
                return new List<Candle>();
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var candles = new List<Candle>();

            foreach (var element in root.EnumerateArray())
            {
                // CoinGecko OHLC format: [timestamp_ms, open, high, low, close]
                var timestampMs = element[0].GetInt64();
                var open  = element[1].GetDecimal();
                var high  = element[2].GetDecimal();
                var low   = element[3].GetDecimal();
                var close = element[4].GetDecimal();

                candles.Add(new Candle
                {
                    Timestamp = timestampMs,
                    DateTime  = DateTimeOffset.FromUnixTimeMilliseconds(timestampMs).UtcDateTime,
                    Open      = open,
                    High      = high,
                    Low       = low,
                    Close     = close,
                    Volume    = 0m  // CoinGecko OHLC doesn't include volume
                });
            }

            // Apply endTime filter if provided
            if (endTime.HasValue)
            {
                candles = candles.FindAll(c => c.Timestamp <= endTime.Value);
            }

            // Take the last `limit` candles
            if (candles.Count > limit)
            {
                candles = candles.GetRange(candles.Count - limit, limit);
            }

            _logger.LogInformation("CoinGecko: Returned {Count} candles for {Symbol}", candles.Count, symbol);
            return candles;
        }

        /// <summary>Get latest price from CoinGecko simple price endpoint</summary>
        public async Task<decimal?> GetLatestPriceAsync(string symbol)
        {
            if (!SymbolMap.TryGetValue(symbol.ToUpperInvariant(), out var coinId))
                return null;

            var url = $"https://api.coingecko.com/api/v3/simple/price?ids={coinId}&vs_currencies=usd";
            try
            {
                var response = await _httpClient.GetAsync(url);
                if (!response.IsSuccessStatusCode) return null;

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty(coinId, out var coinData) &&
                    coinData.TryGetProperty("usd", out var usdPrice))
                {
                    return usdPrice.GetDecimal();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CoinGecko: Failed to get price for {Symbol}", symbol);
            }
            return null;
        }
    }
}
