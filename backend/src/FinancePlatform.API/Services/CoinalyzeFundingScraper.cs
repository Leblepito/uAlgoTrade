using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace FinancePlatform.API.Services
{
    public sealed class CoinalyzeFundingScraper
    {
        private readonly HttpClient _httpClient;

        public record FundingData(decimal Rate, decimal OpenInterest, string Source)
        {
            public FundingData(decimal rate, string source) : this(rate, 0, source) { }
        }

        public CoinalyzeFundingScraper()
        {
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(20);
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        }

        public async Task<(decimal current, decimal predicted)> GetBtcAggregatedFundingRateAsync(CancellationToken cancellationToken)
        {
            var (currentRates, predictedRates) = await FetchAllRatesAsync(cancellationToken);

            if (currentRates.Count == 0)
            {
                throw new InvalidOperationException("Could not fetch funding rates from any exchange");
            }

            var frAvg = CalculateSimpleAverage(currentRates);
            var pfrAvg = predictedRates.Count > 0 ? CalculateSimpleAverage(predictedRates) : frAvg;

            return (frAvg, pfrAvg);
        }

        public async Task<List<FundingData>> GetIndividualRatesAsync(CancellationToken cancellationToken)
        {
            var (currentRates, _) = await FetchAllRatesAsync(cancellationToken);
            return currentRates;
        }

        public async Task<(List<FundingData> current, List<FundingData> predicted)> GetAllRatesAsync(CancellationToken cancellationToken)
        {
            return await FetchAllRatesAsync(cancellationToken);
        }

        public async Task<decimal> GetBinanceFundingRatePercentAsync(string symbol, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                throw new ArgumentException("Symbol is required.", nameof(symbol));
            }

            var normalized = symbol.Trim().ToUpperInvariant();
            var url = $"https://fapi.binance.com/fapi/v1/fundingRate?symbol={normalized}&limit=1";
            using var res = await _httpClient.GetAsync(url, cancellationToken);
            if (!res.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Binance funding request failed for {normalized}: {(int)res.StatusCode}");
            }

            using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(cancellationToken));
            if (doc.RootElement.ValueKind != JsonValueKind.Array || doc.RootElement.GetArrayLength() == 0)
            {
                throw new InvalidOperationException($"fundingRate array was not found for {normalized}.");
            }

            var first = doc.RootElement[0];
            if (!first.TryGetProperty("fundingRate", out var rateEl))
            {
                throw new InvalidOperationException($"fundingRate field was not found for {normalized}.");
            }

            if (!decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
            {
                throw new InvalidOperationException($"fundingRate parse failed for {normalized}.");
            }

            return rate * 100m;
        }

        private async Task<(List<FundingData> current, List<FundingData> predicted)> FetchAllRatesAsync(CancellationToken cancellationToken)
        {
            var currentRates = new List<FundingData>();
            var predictedRates = new List<FundingData>();

            var tasks = new List<Task>
            {
                FetchBinanceUsdtAsync(currentRates, predictedRates, cancellationToken),
                FetchBitmexUsdtAsync(currentRates, predictedRates, cancellationToken),
                FetchBybitUsdtAsync(currentRates, predictedRates, cancellationToken),
                FetchHuobiUsdtAsync(currentRates, predictedRates, cancellationToken),
                FetchHyperliquidAsync(currentRates, predictedRates, cancellationToken),
                FetchKrakenUsdtAsync(currentRates, predictedRates, cancellationToken),
                FetchOkxUsdtAsync(currentRates, predictedRates, cancellationToken),
                FetchWooXAsync(currentRates, predictedRates, cancellationToken),

                FetchBinanceCoinMAsync(currentRates, predictedRates, cancellationToken),
                FetchBitmexUsdAsync(currentRates, predictedRates, cancellationToken),
                FetchBybitInverseAsync(currentRates, predictedRates, cancellationToken),
                FetchDeribitAsync(currentRates, predictedRates, cancellationToken),
                FetchHuobiUsdAsync(currentRates, predictedRates, cancellationToken),
                FetchKrakenUsdAsync(currentRates, predictedRates, cancellationToken),
                FetchOkxUsdAsync(currentRates, predictedRates, cancellationToken),
            };

            await Task.WhenAll(tasks);

            return (currentRates, predictedRates);
        }

        private static decimal CalculateSimpleAverage(List<FundingData> data)
        {
            if (data.Count == 0) return 0;
            
            var validRates = new List<decimal>();
            foreach (var d in data)
            {
                if (d.Rate > -1m && d.Rate < 1m)
                {
                    validRates.Add(d.Rate);
                }
            }

            if (validRates.Count == 0) return 0;

            decimal sum = 0;
            foreach (var rate in validRates)
            {
                sum += rate;
            }

            return sum / validRates.Count;
        }

        #region Binance

        private async Task FetchBinanceUsdtAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                decimal oi = 0;
                var resOi = await _httpClient.GetAsync("https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT", ct);
                if (resOi.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await resOi.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("openInterest", out var oiEl))
                    {
                        decimal.TryParse(oiEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out oi);
                    }
                }

                var res = await _httpClient.GetAsync("https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1", ct);
                if (res.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
                    foreach (var item in doc.RootElement.EnumerateArray())
                    {
                        if (item.TryGetProperty("fundingRate", out var rateEl))
                        {
                            if (decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                            {
                                rate *= 100;
                                lock (current) current.Add(new FundingData(rate, oi, "Binance-USDT"));
                            }
                        }
                    }
                }
                
                var res2 = await _httpClient.GetAsync("https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT", ct);
                if (res2.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await res2.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("lastFundingRate", out var rateEl))
                    {
                        if (decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                        {
                            rate *= 100;
                            lock (predicted) predicted.Add(new FundingData(rate, oi, "Binance-USDT"));
                        }
                    }
                }
            }
            catch { }
        }

        private async Task FetchBinanceCoinMAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                decimal oi = 0;
                var resOi = await _httpClient.GetAsync("https://dapi.binance.com/dapi/v1/openInterest?symbol=BTCUSD_PERP", ct);
                if (resOi.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await resOi.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("openInterest", out var oiEl))
                    {
                        decimal.TryParse(oiEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out oi);
                    }
                }

                var res = await _httpClient.GetAsync("https://dapi.binance.com/dapi/v1/fundingRate?symbol=BTCUSD_PERP&limit=1", ct);
                if (res.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
                    foreach (var item in doc.RootElement.EnumerateArray())
                    {
                        if (item.TryGetProperty("fundingRate", out var rateEl))
                        {
                            if (decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                            {
                                rate *= 100;
                                lock (current) current.Add(new FundingData(rate, oi, "Binance-USD"));
                            }
                        }
                    }
                }
                
                var res2 = await _httpClient.GetAsync("https://dapi.binance.com/dapi/v1/premiumIndex?symbol=BTCUSD_PERP", ct);
                if (res2.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await res2.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in doc.RootElement.EnumerateArray())
                        {
                            if (item.TryGetProperty("lastFundingRate", out var rateEl))
                            {
                                if (decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                                {
                                    rate *= 100;
                                    lock (predicted) predicted.Add(new FundingData(rate, oi, "Binance-USD"));
                                }
                                break;
                            }
                        }
                    }
                }
            }
            catch { }
        }

        #endregion

        #region BitMEX

        private async Task FetchBitmexUsdtAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                var res = await _httpClient.GetAsync("https://www.bitmex.com/api/v1/instrument?symbol=XBTUSDT", ct);
                if (res.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
                    foreach (var item in doc.RootElement.EnumerateArray())
                    {
                        decimal oi = 0;
                        if (item.TryGetProperty("openInterest", out var oiEl)) oi = oiEl.GetDecimal();
                        
                        if (item.TryGetProperty("fundingRate", out var rateEl) && rateEl.ValueKind == JsonValueKind.Number)
                        {
                            var rate = rateEl.GetDecimal() * 100;
                            lock (current) current.Add(new FundingData(rate, oi, "BitMEX-XBTUSDT"));
                        }
                        
                        if (item.TryGetProperty("indicativeFundingRate", out var predEl) && predEl.ValueKind == JsonValueKind.Number)
                        {
                            var rate = predEl.GetDecimal() * 100;
                            lock (predicted) predicted.Add(new FundingData(rate, oi, "BitMEX-XBTUSDT"));
                        }
                        break;
                    }
                }
            }
            catch { }
        }

        private async Task FetchBitmexUsdAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                var res = await _httpClient.GetAsync("https://www.bitmex.com/api/v1/instrument?symbol=XBTUSD", ct);
                if (res.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
                    foreach (var item in doc.RootElement.EnumerateArray())
                    {
                        decimal oi = 0;
                        if (item.TryGetProperty("openInterest", out var oiEl)) oi = oiEl.GetDecimal();
                        
                        if (item.TryGetProperty("fundingRate", out var rateEl) && rateEl.ValueKind == JsonValueKind.Number)
                        {
                            var rate = rateEl.GetDecimal() * 100;
                            lock (current) current.Add(new FundingData(rate, oi, "BitMEX-XBTUSD"));
                        }
                        
                        if (item.TryGetProperty("indicativeFundingRate", out var predEl) && predEl.ValueKind == JsonValueKind.Number)
                        {
                            var rate = predEl.GetDecimal() * 100;
                            lock (predicted) predicted.Add(new FundingData(rate, oi, "BitMEX-XBTUSD"));
                        }
                        break;
                    }
                }
            }
            catch { }
        }

        #endregion

        #region Bybit

        private async Task FetchBybitUsdtAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                decimal oi = 0;
                var resTicker = await _httpClient.GetAsync("https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT", ct);
                if (resTicker.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await resTicker.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("result", out var result) && result.TryGetProperty("list", out var list))
                    {
                        foreach (var item in list.EnumerateArray())
                        {
                            if (item.TryGetProperty("openInterest", out var oiEl))
                            {
                                decimal.TryParse(oiEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out oi);
                            }
                        }
                    }
                }

                var histRes = await _httpClient.GetAsync("https://api.bybit.com/v5/market/funding/history?category=linear&symbol=BTCUSDT&limit=1", ct);
                if (histRes.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await histRes.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("result", out var result) && result.TryGetProperty("list", out var list))
                    {
                        foreach (var item in list.EnumerateArray())
                        {
                            if (item.TryGetProperty("fundingRate", out var rateEl))
                            {
                                if (decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                                {
                                    rate *= 100;
                                    lock (current) current.Add(new FundingData(rate, oi, "Bybit-USDT"));
                                }
                            }
                        }
                    }
                }
                
                if (resTicker.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await resTicker.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("result", out var result) && result.TryGetProperty("list", out var list))
                    {
                        foreach (var item in list.EnumerateArray())
                        {
                            if (item.TryGetProperty("fundingRate", out var rateEl))
                            {
                                if (decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                                {
                                    rate *= 100;
                                    lock (predicted) predicted.Add(new FundingData(rate, oi, "Bybit-USDT"));
                                }
                            }
                        }
                    }
                }
            }
            catch { }
        }

        private async Task FetchBybitInverseAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                decimal oi = 0;
                var resTicker = await _httpClient.GetAsync("https://api.bybit.com/v5/market/tickers?category=inverse&symbol=BTCUSD", ct);
                if (resTicker.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await resTicker.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("result", out var result) && result.TryGetProperty("list", out var list))
                    {
                        foreach (var item in list.EnumerateArray())
                        {
                            if (item.TryGetProperty("openInterest", out var oiEl))
                            {
                                decimal.TryParse(oiEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out oi);
                            }
                        }
                    }
                }

                var histRes = await _httpClient.GetAsync("https://api.bybit.com/v5/market/funding/history?category=inverse&symbol=BTCUSD&limit=1", ct);
                if (histRes.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await histRes.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("result", out var result) && result.TryGetProperty("list", out var list))
                    {
                        foreach (var item in list.EnumerateArray())
                        {
                            if (item.TryGetProperty("fundingRate", out var rateEl))
                            {
                                if (decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                                {
                                    rate *= 100;
                                    lock (current) current.Add(new FundingData(rate, oi, "Bybit-USD"));
                                }
                            }
                        }
                    }
                }
                
                if (resTicker.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await resTicker.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("result", out var result) && result.TryGetProperty("list", out var list))
                    {
                        foreach (var item in list.EnumerateArray())
                        {
                            if (item.TryGetProperty("fundingRate", out var rateEl))
                            {
                                if (decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                                {
                                    rate *= 100;
                                    lock (predicted) predicted.Add(new FundingData(rate, oi, "Bybit-USD"));
                                }
                            }
                        }
                    }
                }
            }
            catch { }
        }

        #endregion

        #region Deribit

        private async Task FetchDeribitAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                var res = await _httpClient.GetAsync("https://www.deribit.com/api/v2/public/ticker?instrument_name=BTC-PERPETUAL", ct);
                if (res.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("result", out var result))
                    {
                        decimal oi = 0;
                        if (result.TryGetProperty("open_interest", out var oiEl)) oi = oiEl.GetDecimal();

                        if (result.TryGetProperty("current_funding", out var cfEl))
                        {
                            var rate = cfEl.GetDecimal() * 100;
                            lock (current) current.Add(new FundingData(rate, oi, "Deribit"));
                        }
                        
                        if (result.TryGetProperty("funding_8h", out var f8hEl))
                        {
                            var rate = f8hEl.GetDecimal() * 100;
                            lock (predicted) predicted.Add(new FundingData(rate, oi, "Deribit"));
                        }
                    }
                }
            }
            catch { }
        }

        #endregion

        #region Huobi/HTX

        private async Task FetchHuobiUsdAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                var res = await _httpClient.GetAsync("https://api.hbdm.com/swap-api/v1/swap_funding_rate?contract_code=BTC-USD", ct);
                if (res.IsSuccessStatusCode)
                {
                    var json = await res.Content.ReadAsStringAsync(ct);
                    using var doc = JsonDocument.Parse(json);
                    
                    if (doc.RootElement.TryGetProperty("data", out var data))
                    {
                        if (data.TryGetProperty("funding_rate", out var rateEl))
                        {
                            if (decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                            {
                                rate *= 100;
                                lock (current) current.Add(new FundingData(rate, "Huobi-USD"));
                                lock (predicted) predicted.Add(new FundingData(rate, "Huobi-USD"));
                            }
                        }
                    }
                }
            }
            catch { }
        }

        private async Task FetchHuobiUsdtAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                var res = await _httpClient.GetAsync("https://api.hbdm.com/linear-swap-api/v1/swap_funding_rate?contract_code=BTC-USDT", ct);
                if (res.IsSuccessStatusCode)
                {
                    var json = await res.Content.ReadAsStringAsync(ct);
                    using var doc = JsonDocument.Parse(json);
                    
                    if (doc.RootElement.TryGetProperty("data", out var data))
                    {
                        if (data.TryGetProperty("funding_rate", out var rateEl))
                        {
                            if (decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                            {
                                rate *= 100;
                                lock (current) current.Add(new FundingData(rate, "Huobi-USDT"));
                                lock (predicted) predicted.Add(new FundingData(rate, "Huobi-USDT"));
                            }
                        }
                    }
                }
            }
            catch { }
        }

        #endregion

        #region Hyperliquid

        private async Task FetchHyperliquidAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                var metaRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.hyperliquid.xyz/info");
                metaRequest.Content = new StringContent("{\"type\":\"metaAndAssetCtxs\"}", Encoding.UTF8, "application/json");
                
                var metaRes = await _httpClient.SendAsync(metaRequest, ct);
                if (metaRes.IsSuccessStatusCode)
                {
                    var json = await metaRes.Content.ReadAsStringAsync(ct);
                    using var doc = JsonDocument.Parse(json);
                    
                    if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 1)
                    {
                        var btcIndex = -1;
                        var meta = doc.RootElement[0];
                        var assetCtxs = doc.RootElement[1];

                        if (meta.ValueKind == JsonValueKind.Object &&
                            meta.TryGetProperty("universe", out var universe) &&
                            universe.ValueKind == JsonValueKind.Array)
                        {
                            var idx = 0;
                            foreach (var coin in universe.EnumerateArray())
                            {
                                if (coin.TryGetProperty("name", out var nameEl) &&
                                    string.Equals(nameEl.GetString(), "BTC", StringComparison.OrdinalIgnoreCase))
                                {
                                    btcIndex = idx;
                                    break;
                                }
                                idx++;
                            }
                        }

                        if (assetCtxs.ValueKind == JsonValueKind.Array && assetCtxs.GetArrayLength() > 0)
                        {
                            if (btcIndex < 0 || btcIndex >= assetCtxs.GetArrayLength())
                            {
                                btcIndex = 0;
                            }

                            var btcCtx = assetCtxs[btcIndex];
                            if (btcCtx.TryGetProperty("funding", out var fundingEl) &&
                                decimal.TryParse(fundingEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                            {
                                rate *= 8 * 100;
                                lock (predicted) predicted.Add(new FundingData(rate, "Hyperliquid"));
                            }
                        }
                    }
                }

                var startTime = DateTimeOffset.UtcNow.AddHours(-2).ToUnixTimeMilliseconds();
                var histRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.hyperliquid.xyz/info");
                histRequest.Content = new StringContent($"{{\"type\":\"fundingHistory\",\"coin\":\"BTC\",\"startTime\":{startTime}}}", Encoding.UTF8, "application/json");
                
                var histRes = await _httpClient.SendAsync(histRequest, ct);
                if (histRes.IsSuccessStatusCode)
                {
                    var json = await histRes.Content.ReadAsStringAsync(ct);
                    using var doc = JsonDocument.Parse(json);

                    if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                    {
                        JsonElement? lastEntry = null;
                        foreach (var entry in doc.RootElement.EnumerateArray())
                        {
                            lastEntry = entry;
                        }

                        if (lastEntry.HasValue && lastEntry.Value.TryGetProperty("fundingRate", out var fundingEl))
                        {
                            if (decimal.TryParse(fundingEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                            {
                                rate *= 8 * 100;
                                lock (current) current.Add(new FundingData(rate, "Hyperliquid"));
                            }
                        }
                    }
                }
            }
            catch { }
        }

        #endregion

        #region Kraken

        private async Task FetchKrakenUsdtAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                decimal lastRelativeRate = 0;
                decimal lastFundingRate = 0;
                
                var histRes = await _httpClient.GetAsync("https://futures.kraken.com/derivatives/api/v3/historical-funding-rates?symbol=PF_XBTUSD", ct);
                if (histRes.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await histRes.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("rates", out var rates) && rates.GetArrayLength() > 0)
                    {
                        JsonElement? lastEntry = null;
                        foreach (var r in rates.EnumerateArray()) { lastEntry = r; }

                        if (lastEntry.HasValue)
                        {
                            if (lastEntry.Value.TryGetProperty("relativeFundingRate", out var relEl) && relEl.ValueKind == JsonValueKind.Number)
                            {
                                lastRelativeRate = relEl.GetDecimal();
                                var rate = lastRelativeRate * 8 * 100;
                                lock (current) current.Add(new FundingData(rate, "Kraken-PF"));
                            }
                            if (lastEntry.Value.TryGetProperty("fundingRate", out var fundEl) && fundEl.ValueKind == JsonValueKind.Number)
                            {
                                lastFundingRate = fundEl.GetDecimal();
                            }
                        }
                    }
                }
                
                var tickerRes = await _httpClient.GetAsync("https://futures.kraken.com/derivatives/api/v3/tickers", ct);
                if (tickerRes.IsSuccessStatusCode && lastFundingRate != 0)
                {
                    using var doc = JsonDocument.Parse(await tickerRes.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("tickers", out var tickers))
                    {
                        foreach (var ticker in tickers.EnumerateArray())
                        {
                            if (ticker.TryGetProperty("symbol", out var sym) && sym.GetString() == "PF_XBTUSD")
                            {
                                if (ticker.TryGetProperty("fundingRatePrediction", out var predEl) && predEl.ValueKind == JsonValueKind.Number)
                                {
                                    var fundingRatePred = predEl.GetDecimal();
                                    var conversionRatio = lastRelativeRate / lastFundingRate;
                                    var relativeRatePred = fundingRatePred * conversionRatio;
                                    var rate = relativeRatePred * 8 * 100;
                                    lock (predicted) predicted.Add(new FundingData(rate, "Kraken-PF"));
                                }
                                break;
                            }
                        }
                    }
                }
            }
            catch { }
        }

        private async Task FetchKrakenUsdAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                decimal lastRelativeRate = 0;
                decimal lastFundingRate = 0;
                
                var histRes = await _httpClient.GetAsync("https://futures.kraken.com/derivatives/api/v3/historical-funding-rates?symbol=PI_XBTUSD", ct);
                if (histRes.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await histRes.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("rates", out var rates) && rates.GetArrayLength() > 0)
                    {
                        JsonElement? lastEntry = null;
                        foreach (var r in rates.EnumerateArray()) { lastEntry = r; }

                        if (lastEntry.HasValue)
                        {
                            if (lastEntry.Value.TryGetProperty("relativeFundingRate", out var relEl) && relEl.ValueKind == JsonValueKind.Number)
                            {
                                lastRelativeRate = relEl.GetDecimal();
                                var rate = lastRelativeRate * 8 * 100;
                                lock (current) current.Add(new FundingData(rate, "Kraken-PI"));
                            }
                            if (lastEntry.Value.TryGetProperty("fundingRate", out var fundEl) && fundEl.ValueKind == JsonValueKind.Number)
                            {
                                lastFundingRate = fundEl.GetDecimal();
                            }
                        }
                    }
                }
                
                var tickerRes = await _httpClient.GetAsync("https://futures.kraken.com/derivatives/api/v3/tickers", ct);
                if (tickerRes.IsSuccessStatusCode && lastFundingRate != 0)
                {
                    using var doc = JsonDocument.Parse(await tickerRes.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("tickers", out var tickers))
                    {
                        foreach (var ticker in tickers.EnumerateArray())
                        {
                            if (ticker.TryGetProperty("symbol", out var sym) && sym.GetString() == "PI_XBTUSD")
                            {
                                if (ticker.TryGetProperty("fundingRatePrediction", out var predEl) && predEl.ValueKind == JsonValueKind.Number)
                                {
                                    var fundingRatePred = predEl.GetDecimal();
                                    var conversionRatio = lastRelativeRate / lastFundingRate;
                                    var relativeRatePred = fundingRatePred * conversionRatio;
                                    var rate = relativeRatePred * 8 * 100;
                                    lock (predicted) predicted.Add(new FundingData(rate, "Kraken-PI"));
                                }
                                break;
                            }
                        }
                    }
                }
            }
            catch { }
        }

        #endregion

        #region OKX

        private async Task FetchOkxUsdtAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                var res = await _httpClient.GetAsync("https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP", ct);
                if (res.IsSuccessStatusCode)
                {
                    var json = await res.Content.ReadAsStringAsync(ct);
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("data", out var data))
                    {
                        foreach (var item in data.EnumerateArray())
                        {
                            if (item.TryGetProperty("fundingRate", out var rateEl))
                            {
                                if (decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                                {
                                    rate *= 100;
                                    lock (current) current.Add(new FundingData(rate, "OKX-USDT"));
                                    lock (predicted) predicted.Add(new FundingData(rate, "OKX-USDT"));
                                }
                            }
                            break;
                        }
                    }
                }
            }
            catch { }
        }

        private async Task FetchOkxUsdAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                var res = await _httpClient.GetAsync("https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USD-SWAP", ct);
                if (res.IsSuccessStatusCode)
                {
                    var json = await res.Content.ReadAsStringAsync(ct);
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("data", out var data))
                    {
                        foreach (var item in data.EnumerateArray())
                        {
                            if (item.TryGetProperty("fundingRate", out var rateEl))
                            {
                                if (decimal.TryParse(rateEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var rate))
                                {
                                    rate *= 100;
                                    lock (current) current.Add(new FundingData(rate, "OKX-USD"));
                                    lock (predicted) predicted.Add(new FundingData(rate, "OKX-USD"));
                                }
                            }
                            break;
                        }
                    }
                }
            }
            catch { }
        }

        #endregion

        #region WOO X

        private async Task FetchWooXAsync(List<FundingData> current, List<FundingData> predicted, CancellationToken ct)
        {
            try
            {
                var res = await _httpClient.GetAsync("https://api.woo.org/v1/public/funding_rate/PERP_BTC_USDT", ct);
                if (res.IsSuccessStatusCode)
                {
                    var json = await res.Content.ReadAsStringAsync(ct);
                    using var doc = JsonDocument.Parse(json);
                    
                    if (doc.RootElement.TryGetProperty("last_funding_rate", out var lastRateEl))
                    {
                        var rate = lastRateEl.GetDecimal() * 100;
                        lock (current) current.Add(new FundingData(rate, "WooX"));
                    }
                    
                    if (doc.RootElement.TryGetProperty("est_funding_rate", out var estRateEl))
                    {
                        var rate = estRateEl.GetDecimal() * 100;
                        lock (predicted) predicted.Add(new FundingData(rate, "WooX"));
                    }
                }
            }
            catch { }
        }

        #endregion
    }
}
