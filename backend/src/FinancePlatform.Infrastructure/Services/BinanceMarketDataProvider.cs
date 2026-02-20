using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Infrastructure.Services
{
    public class BinanceMarketDataProvider : IMarketDataProvider
    {
        private readonly HttpClient _httpClient;
        private readonly CoinGeckoMarketDataProvider _coinGecko;
        private readonly ILogger<BinanceMarketDataProvider> _logger;
        private readonly string _baseUrl;

        public BinanceMarketDataProvider(
            HttpClient httpClient,
            CoinGeckoMarketDataProvider coinGecko,
            ILogger<BinanceMarketDataProvider> logger,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _coinGecko = coinGecko;
            _logger = logger;
            _baseUrl = configuration["Binance:BaseUrl"] ?? "https://api.binance.com";
        }

        public async Task<List<Candle>> GetKlinesAsync(string symbol, string interval, int limit = 500, long? endTime = null)
        {
            var url = $"{_baseUrl}/api/v3/klines?symbol={symbol.ToUpper()}&interval={interval}&limit={limit}";
            if (endTime.HasValue)
            {
                url += $"&endTime={endTime.Value}";
            }

            HttpResponseMessage? successResponse = null;
            for (int attempt = 1; attempt <= 4; attempt++)
            {
                HttpResponseMessage response;
                try
                {
                    response = await _httpClient.GetAsync(url);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Binance: Request failed on attempt {Attempt}: {Message}", attempt, ex.Message);
                    if (attempt >= 3)
                    {
                        _logger.LogWarning("Binance: Connection error for {Symbol}, falling back to CoinGecko", symbol);
                        return await _coinGecko.GetKlinesAsync(symbol, interval, limit, endTime);
                    }
                    await Task.Delay(750 * attempt);
                    continue;
                }

                if (response.IsSuccessStatusCode)
                {
                    successResponse = response;
                    break;
                }

                var statusCode = (int)response.StatusCode;

                // 451 = Unavailable For Legal Reasons (US IP blocked), 403 = Forbidden
                if (statusCode == 451 || statusCode == 403)
                {
                    _logger.LogWarning("Binance: Received {StatusCode} — falling back to CoinGecko for {Symbol}", statusCode, symbol);
                    return await _coinGecko.GetKlinesAsync(symbol, interval, limit, endTime);
                }

                if (statusCode == 429 || statusCode >= 500)
                {
                    if (attempt >= 4)
                    {
                        _logger.LogWarning("Binance: Max retries reached for {Symbol}, falling back to CoinGecko", symbol);
                        return await _coinGecko.GetKlinesAsync(symbol, interval, limit, endTime);
                    }
                    await Task.Delay(750 * attempt);
                    continue;
                }

                _logger.LogWarning("Binance: Unexpected {StatusCode} for {Symbol}, falling back to CoinGecko", statusCode, symbol);
                return await _coinGecko.GetKlinesAsync(symbol, interval, limit, endTime);
            }

            if (successResponse == null)
            {
                _logger.LogWarning("Binance: No success response for {Symbol}, falling back to CoinGecko", symbol);
                return await _coinGecko.GetKlinesAsync(symbol, interval, limit, endTime);
            }

            var json = await successResponse.Content.ReadAsStringAsync();
            return ParseBinanceResponse(json);
        }

        private List<Candle> ParseBinanceResponse(string json)
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var candles = new List<Candle>();

            foreach (var element in root.EnumerateArray())
            {
                var openTimeUnix = element[0].GetInt64();
                var open   = decimal.Parse(element[1].GetString()!, CultureInfo.InvariantCulture);
                var high   = decimal.Parse(element[2].GetString()!, CultureInfo.InvariantCulture);
                var low    = decimal.Parse(element[3].GetString()!, CultureInfo.InvariantCulture);
                var close  = decimal.Parse(element[4].GetString()!, CultureInfo.InvariantCulture);
                var volume = decimal.Parse(element[5].GetString()!, CultureInfo.InvariantCulture);

                candles.Add(new Candle
                {
                    Timestamp = openTimeUnix,
                    DateTime  = DateTimeOffset.FromUnixTimeMilliseconds(openTimeUnix).UtcDateTime,
                    Open      = open,
                    High      = high,
                    Low       = low,
                    Close     = close,
                    Volume    = volume
                });
            }

            return candles;
        }
    }
}
