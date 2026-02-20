using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace FinancePlatform.API.Services
{
    public sealed class FundingRateService
    {
        private static readonly SemaphoreSlim CacheLock = new SemaphoreSlim(1, 1);
        private static decimal? CachedCurrent;
        private static decimal? CachedPredicted;
        private static DateTimeOffset? CachedAt;
        private static readonly Dictionary<string, (decimal rate, DateTimeOffset fetchedAt)> SymbolCache = new(StringComparer.OrdinalIgnoreCase);

        private readonly CoinalyzeFundingScraper _scraper;

        private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(60);

        public FundingRateService(CoinalyzeFundingScraper scraper)
        {
            _scraper = scraper;
        }

        public async Task<(decimal current, decimal predicted, DateTimeOffset fetchedAt)> GetBtcFundingRateAsync(CancellationToken cancellationToken)
        {
            var now = DateTimeOffset.UtcNow;
            
            if (CachedCurrent.HasValue && CachedAt.HasValue && (now - CachedAt.Value) < CacheDuration)
            {
                return (CachedCurrent.Value, CachedPredicted ?? 0, CachedAt.Value);
            }

            await CacheLock.WaitAsync(cancellationToken);
            try
            {
                now = DateTimeOffset.UtcNow;
                
                if (CachedCurrent.HasValue && CachedAt.HasValue && (now - CachedAt.Value) < CacheDuration)
                {
                    return (CachedCurrent.Value, CachedPredicted ?? 0, CachedAt.Value);
                }

                var (current, predicted) = await _scraper.GetBtcAggregatedFundingRateAsync(cancellationToken);
                
                CachedCurrent = current;
                CachedPredicted = predicted;
                CachedAt = DateTimeOffset.UtcNow;
                
                return (CachedCurrent.Value, CachedPredicted ?? 0, CachedAt.Value);
            }
            finally
            {
                CacheLock.Release();
            }
        }

        public async Task<string> GetRecentMarketSummary(CancellationToken cancellationToken = default)
        {
            try
            {
                var (current, predicted, fetchedAt) = await GetBtcFundingRateAsync(cancellationToken);
                var timeDiff = DateTimeOffset.UtcNow - fetchedAt;
                var freshness = timeDiff.TotalSeconds > 120 ? "(Stale Data)" : "(Fresh Data)";

                return $@"
MARKET SNAPSHOT (BTC/USD Aggregated Funding):
- Current Rate: {current:P4}
- Predicted Rate: {predicted:P4}
- Last Updated: {fetchedAt:u} {freshness}
- Interpretation: {(current > 0.01m ? "High Bullish Leverage" : current < 0 ? "Bearish Sentiment" : "Neutral/Balanced")}
";
            }
            catch (Exception ex)
            {
                return $"Error fetching market data: {ex.Message}";
            }
        }

        public async Task<(decimal fundingRatePercent, DateTimeOffset fetchedAt)> GetSymbolFundingRateAsync(string symbol, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                throw new ArgumentException("Symbol is required.", nameof(symbol));
            }

            var normalized = symbol.Trim().ToUpperInvariant();
            var now = DateTimeOffset.UtcNow;

            if (SymbolCache.TryGetValue(normalized, out var cached) && (now - cached.fetchedAt) < CacheDuration)
            {
                return cached;
            }

            await CacheLock.WaitAsync(cancellationToken);
            try
            {
                now = DateTimeOffset.UtcNow;
                if (SymbolCache.TryGetValue(normalized, out cached) && (now - cached.fetchedAt) < CacheDuration)
                {
                    return cached;
                }

                var rate = await _scraper.GetBinanceFundingRatePercentAsync(normalized, cancellationToken);
                var result = (fundingRatePercent: rate, fetchedAt: DateTimeOffset.UtcNow);
                SymbolCache[normalized] = result;
                return result;
            }
            finally
            {
                CacheLock.Release();
            }
        }
    }
}
