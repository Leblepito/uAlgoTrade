using System;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinancePlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarketDataController : ControllerBase
    {
        private readonly IMarketDataProvider _marketDataProvider;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly CoinGeckoMarketDataProvider _coinGecko;

        public MarketDataController(
            IMarketDataProvider marketDataProvider,
            IHttpClientFactory httpClientFactory,
            CoinGeckoMarketDataProvider coinGecko)
        {
            _marketDataProvider = marketDataProvider;
            _httpClientFactory = httpClientFactory;
            _coinGecko = coinGecko;
        }

        [HttpGet("{symbol}")]
        public async Task<IActionResult> GetCandles(
            string symbol,
            [FromQuery] string interval = "1h",
            [FromQuery] int limit = 500,
            [FromQuery] long? endTimeMs = null,
            [FromQuery] long? endTime = null)
        {
            long? effectiveEndTimeMs = endTimeMs ?? endTime;
            if (effectiveEndTimeMs.HasValue && effectiveEndTimeMs.Value > 0 && effectiveEndTimeMs.Value < 100_000_000_000)
            {
                return BadRequest(new
                {
                    error = "Invalid endTimeMs. Expected Unix time in milliseconds.",
                    received = effectiveEndTimeMs.Value,
                    hint = "If you have Unix seconds, multiply by 1000."
                });
            }

            var candles = await _marketDataProvider.GetKlinesAsync(symbol, interval, limit, effectiveEndTimeMs);
            var normalizedCandles = candles
                .GroupBy(c => c.Timestamp)
                .Select(g => g.Last())
                .OrderBy(c => c.Timestamp)
                .ToList();

            Response.Headers["Cache-Control"] = "no-store";

            var result = normalizedCandles.Select(c => new
            {
                time = c.Timestamp / 1000,
                timeMs = c.Timestamp,
                open = c.Open,
                high = c.High,
                low = c.Low,
                close = c.Close,
                volume = c.Volume
            });
            return Ok(result);
        }

        [HttpGet("price/{symbol}")]
        public async Task<IActionResult> GetLatestPrice(string symbol)
        {
            var httpClient = _httpClientFactory.CreateClient();
            var upperSymbol = symbol.ToUpperInvariant();

            decimal price = 0;
            string dataSource = "binance";

            // Try Binance first
            try
            {
                var url = $"https://api.binance.com/api/v3/ticker/price?symbol={upperSymbol}";
                var response = await httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    var priceString = doc.RootElement.GetProperty("price").GetString();
                    if (priceString != null)
                    {
                        price = decimal.Parse(priceString, CultureInfo.InvariantCulture);
                    }
                }
                else
                {
                    throw new Exception($"Binance returned {(int)response.StatusCode}");
                }
            }
            catch
            {
                // Binance failed — try CoinGecko
                var cgPrice = await _coinGecko.GetLatestPriceAsync(upperSymbol);
                if (cgPrice.HasValue)
                {
                    price = cgPrice.Value;
                    dataSource = "coingecko";
                }
                else
                {
                    return Problem("Unable to fetch price from any data source.");
                }
            }

            Response.Headers["Cache-Control"] = "no-store";
            Response.Headers["X-Data-Source"] = dataSource;

            return Ok(new
            {
                symbol = upperSymbol,
                price,
                time = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                source = dataSource
            });
        }
    }
}
