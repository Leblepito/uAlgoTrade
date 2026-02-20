using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using FinancePlatform.API.Auth;
using FinancePlatform.Application.Interfaces;

namespace FinancePlatform.API.Services;

public sealed class AlertBackgroundService : BackgroundService
{
    private static readonly string[] CompositePairs = { "BTCUSDT", "ETHUSDT", "XRPUSDT" };
    private readonly IServiceProvider _services;
    private readonly ILogger<AlertBackgroundService> _logger;

    private readonly Dictionary<string, decimal> _priceCache = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, DateTimeOffset> _lastCompositeSignalAt = new(StringComparer.OrdinalIgnoreCase);

    private static readonly TimeSpan PriceCheckInterval = TimeSpan.FromSeconds(5);
    private static readonly TimeSpan IndicatorCheckInterval = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan CompositeCheckInterval = TimeSpan.FromSeconds(20);
    private static readonly TimeSpan CompositeSignalCooldown = TimeSpan.FromMinutes(15);

    public AlertBackgroundService(IServiceProvider services, ILogger<AlertBackgroundService> logger)
    {
        _services = services;
        _logger = logger;
    }

    public async Task TriggerImmediateAnalysisAsync(CancellationToken ct)
    {
        _logger.LogInformation("Triggering immediate alert analysis...");
        await CheckPriceAlertsAsync(ct);
        await CheckIndicatorAlertsAsync(ct);
        await CheckCompositeOpportunitiesAsync(ct);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AlertBackgroundService started.");

        var lastIndicatorCheck = DateTime.UtcNow;
        var lastCompositeCheck = DateTime.UtcNow;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await TryRunSafelyAsync(() => CheckPriceAlertsAsync(stoppingToken), "Price alerts");

                if (DateTime.UtcNow - lastIndicatorCheck > IndicatorCheckInterval)
                {
                    await TryRunSafelyAsync(() => CheckIndicatorAlertsAsync(stoppingToken), "Indicator alerts");
                    lastIndicatorCheck = DateTime.UtcNow;
                }

                if (DateTime.UtcNow - lastCompositeCheck > CompositeCheckInterval)
                {
                    await TryRunSafelyAsync(() => CheckCompositeOpportunitiesAsync(stoppingToken), "Composite opportunities");
                    lastCompositeCheck = DateTime.UtcNow;
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AlertBackgroundService loop.");
            }

            await Task.Delay(PriceCheckInterval, stoppingToken);
        }

        _logger.LogInformation("AlertBackgroundService stopped.");
    }

    private async Task TryRunSafelyAsync(Func<Task> action, string section)
    {
        try
        {
            await action();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "{Section} execution failed.", section);
        }
    }

    private async Task CheckCompositeOpportunitiesAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var marketData = scope.ServiceProvider.GetRequiredService<IMarketDataProvider>();
        var fundingRateService = scope.ServiceProvider.GetRequiredService<FundingRateService>();
        var telegram = scope.ServiceProvider.GetRequiredService<TelegramSignalService>();

        foreach (var symbol in CompositePairs)
        {
            try
            {
                var candles = await marketData.GetKlinesAsync(symbol, "15m", 220, null);
                if (candles == null || candles.Count < 80)
                {
                    continue;
                }

                var current = candles[^1];
                var previous = candles[^2];

                var buyReasons = new List<string>();
                var sellReasons = new List<string>();

                var (srBuy, srSell) = EvaluateSupportResistance(candles, current, previous);
                if (srBuy) buyReasons.Add("S/R support touch");
                if (srSell) sellReasons.Add("S/R resistance touch");

                var (obBuy, obSell) = EvaluateOrderBlockTouch(candles, current, previous);
                if (obBuy) buyReasons.Add("Order Block / Breaker Block touch");
                if (obSell) sellReasons.Add("Order Block / Breaker Block touch");

                var (ewBuy, ewSell) = EvaluateElliottSwing(candles);
                if (ewBuy) buyReasons.Add("Elliott bottom (C/5)");
                if (ewSell) sellReasons.Add("Elliott top (C/5)");

                try
                {
                    decimal fundingRatePercent;
                    if (symbol.Equals("BTCUSDT", StringComparison.OrdinalIgnoreCase))
                    {
                        var (btcCurrent, _, _) = await fundingRateService.GetBtcFundingRateAsync(ct);
                        fundingRatePercent = btcCurrent;
                    }
                    else
                    {
                        var (symbolFundingRate, _) = await fundingRateService.GetSymbolFundingRateAsync(symbol, ct);
                        fundingRatePercent = symbolFundingRate;
                    }

                    if (fundingRatePercent < 0)
                    {
                        buyReasons.Add("Aggregated funding negative");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Funding signal failed for {Symbol}", symbol);
                }

                var buyScore = buyReasons.Count;
                var sellScore = sellReasons.Count;

                if (buyScore < 2 && sellScore < 2)
                {
                    continue;
                }

                if (buyScore >= sellScore && buyScore >= 2)
                {
                    await TrySendCompositeSignalAsync(telegram, symbol, "BUY", buyScore, buyReasons, ct);
                }
                else if (sellScore >= 2)
                {
                    await TrySendCompositeSignalAsync(telegram, symbol, "SELL", sellScore, sellReasons, ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Composite opportunity check failed for {Symbol}", symbol);
            }
        }
    }

    private async Task TrySendCompositeSignalAsync(
        TelegramSignalService telegram,
        string symbol,
        string side,
        int score,
        List<string> reasons,
        CancellationToken ct)
    {
        var key = $"{symbol}|{side}";
        var now = DateTimeOffset.UtcNow;
        if (_lastCompositeSignalAt.TryGetValue(key, out var lastAt) && (now - lastAt) < CompositeSignalCooldown)
        {
            return;
        }

        var sent = await telegram.SendOpportunityAsync(symbol, side, score, reasons.ToArray(), now, ct);
        if (!sent)
        {
            return;
        }

        _lastCompositeSignalAt[key] = now;
        _logger.LogInformation("Composite {Side} signal sent for {Symbol} (score={Score})", side, symbol, score);
    }

    private static (bool buy, bool sell) EvaluateSupportResistance(
        List<FinancePlatform.Domain.Models.Candle> candles,
        FinancePlatform.Domain.Models.Candle current,
        FinancePlatform.Domain.Models.Candle previous)
    {
        var recent = candles.TakeLast(50).ToList();
        if (recent.Count < 50)
        {
            return (false, false);
        }

        var recentHigh = recent.Max(c => c.High);
        var recentLow = recent.Min(c => c.Low);
        var threshold = current.Close * 0.005m;

        var nearSupportNow = Math.Abs(current.Close - recentLow) <= threshold;
        var nearSupportPrev = Math.Abs(previous.Close - recentLow) <= threshold;

        var nearResistanceNow = Math.Abs(current.Close - recentHigh) <= threshold;
        var nearResistancePrev = Math.Abs(previous.Close - recentHigh) <= threshold;

        var buy = nearSupportNow && !nearSupportPrev;
        var sell = nearResistanceNow && !nearResistancePrev;
        return (buy, sell);
    }

    private static (bool buy, bool sell) EvaluateOrderBlockTouch(
        List<FinancePlatform.Domain.Models.Candle> candles,
        FinancePlatform.Domain.Models.Candle current,
        FinancePlatform.Domain.Models.Candle previous)
    {
        if (candles.Count < 60)
        {
            return (false, false);
        }

        var avgBody = candles.TakeLast(50).Average(c => Math.Abs(c.Close - c.Open));
        var start = Math.Max(2, candles.Count - 30);
        var buy = false;
        var sell = false;

        for (var i = start; i < candles.Count - 2; i++)
        {
            var moveCandle = candles[i];
            var bodySize = Math.Abs(moveCandle.Close - moveCandle.Open);
            if (bodySize <= avgBody * 1.5m)
            {
                continue;
            }

            var isBullishMove = moveCandle.Close > moveCandle.Open;
            var obIndex = i - 1;
            if (obIndex < 0)
            {
                continue;
            }

            var obCandle = candles[obIndex];
            var zoneHigh = obCandle.High;
            var zoneLow = obCandle.Low;

            var currentIntersects = current.Low <= zoneHigh && current.High >= zoneLow;
            var previousIntersects = previous.Low <= zoneHigh && previous.High >= zoneLow;
            if (!currentIntersects || previousIntersects)
            {
                continue;
            }

            if (isBullishMove)
            {
                buy = true;
            }
            else
            {
                sell = true;
            }

            if (buy && sell)
            {
                break;
            }
        }

        return (buy, sell);
    }

    private static (bool buy, bool sell) EvaluateElliottSwing(List<FinancePlatform.Domain.Models.Candle> candles)
    {
        if (candles.Count < 60)
        {
            return (false, false);
        }

        var swings = new List<(int Index, decimal Price, string Type, long Time)>();
        for (var i = 2; i < candles.Count - 2; i++)
        {
            var c = candles[i];
            var isHigh = c.High > candles[i - 1].High && c.High > candles[i - 2].High &&
                         c.High > candles[i + 1].High && c.High > candles[i + 2].High;
            var isLow = c.Low < candles[i - 1].Low && c.Low < candles[i - 2].Low &&
                        c.Low < candles[i + 1].Low && c.Low < candles[i + 2].Low;

            if (isHigh) swings.Add((i, c.High, "High", c.Timestamp));
            if (isLow) swings.Add((i, c.Low, "Low", c.Timestamp));
        }

        var relevant = swings.TakeLast(5).ToList();
        if (relevant.Count < 5)
        {
            return (false, false);
        }

        var buy = false;
        var sell = false;

        if (relevant[4].Type == "High" && relevant[3].Type == "Low" && relevant[2].Type == "High" && relevant[1].Type == "Low")
        {
            sell = relevant[4].Price > relevant[2].Price &&
                   relevant[3].Price > relevant[1].Price;
        }

        if (relevant[4].Type == "Low" && relevant[3].Type == "High" && relevant[2].Type == "Low" && relevant[1].Type == "High")
        {
            buy = relevant[4].Price < relevant[2].Price &&
                  relevant[3].Price < relevant[1].Price;
        }

        return (buy, sell);
    }

    private async Task CheckPriceAlertsAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<AlertRepository>();
        var marketData = scope.ServiceProvider.GetRequiredService<IMarketDataProvider>();

        var alerts = await repo.GetActivePriceAlertsAsync(ct);
        if (alerts.Count == 0) return;

        var bySymbol = alerts.GroupBy(a => a.Symbol, StringComparer.OrdinalIgnoreCase);

        foreach (var group in bySymbol)
        {
            var symbol = group.Key;
            List<FinancePlatform.Domain.Models.Candle> candles;

            try
            {
                candles = await marketData.GetKlinesAsync(symbol, "1m", 5, null);
                if (candles == null || candles.Count < 2) continue;
                _priceCache[symbol] = candles.Last().Close;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch price for {Symbol}", symbol);
                continue;
            }

            var currentCandle = candles.Last();
            var previousCandle = candles[candles.Count - 2];

            foreach (var (id, userId, sym, alertType, targetPrice, condition, frequency, expiration, lastTriggeredBar) in group)
            {
                if (expiration.HasValue && DateTime.UtcNow > expiration.Value) continue;

                bool useClosed = frequency == "OncePerBarClose";
                var checkCandle = useClosed ? previousCandle : currentCandle;
                var prevCheckCandle = useClosed ? candles[candles.Count - 3] : previousCandle; 
                
                decimal priceToCheck = checkCandle.Close;
                decimal prevPrice = (candles.Count > 2 && useClosed) ? prevCheckCandle.Close : previousCandle.Close;

                bool conditionMet = CheckCondition(condition, priceToCheck, prevPrice, targetPrice, alertType);

                if (!conditionMet) continue;

                long barTime = checkCandle.Timestamp;
                if (!ShouldTrigger(frequency, lastTriggeredBar, barTime)) continue;

                var message = $"{symbol}: Price ({priceToCheck:N2}) {condition} {targetPrice:N2}";
                await repo.TriggerAlertAsync(id, message, ct);

                if (frequency == "OnlyOnce")
                {
                    await repo.DismissAlertAsync(userId, id, ct); // Mark expired/triggered
                }
                else
                {
                    await repo.UpdateAlertLastTriggeredAsync(id, barTime, ct);
                }

                _logger.LogInformation("Price Alert {AlertId} triggered: {Message}", id, message);
            }
        }
    }

    private static bool CheckCondition(string condition, decimal current, decimal previous, decimal target, string legacyType)
    {
        if (condition == "Crossing") 
        {
             if (legacyType == "price_above") condition = "CrossingUp";
             else if (legacyType == "price_below") condition = "CrossingDown";
        }

        return condition switch
        {
            "Crossing" => (previous < target && current >= target) || (previous > target && current <= target),
            "CrossingUp" => previous < target && current >= target,
            "CrossingDown" => previous > target && current <= target,
            "GreaterThan" => current > target,
            "LessThan" => current < target,
            _ => false
        };
    }

    private static bool ShouldTrigger(string frequency, long? lastTriggeredBarTime, long currentBarTime)
    {
        if (frequency == "OnlyOnce") return true; 
        
        if (frequency == "OncePerBar" || frequency == "OncePerBarClose")
        {
            return lastTriggeredBarTime != currentBarTime;
        }

        return true;
    }

    private async Task CheckIndicatorAlertsAsync(CancellationToken ct)
    {
        using var scope = _services.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<AlertRepository>();
        var marketData = scope.ServiceProvider.GetRequiredService<IMarketDataProvider>();

        var alerts = await repo.GetActiveIndicatorAlertsAsync(ct);
        if (alerts.Count == 0) return;

        var groups = alerts.GroupBy(a => $"{a.Symbol}|{a.Timeframe}|{a.IndicatorType}", StringComparer.OrdinalIgnoreCase);

        foreach (var group in groups)
        {
            var first = group.First();
            var symbol = first.Symbol;
            var timeframe = first.Timeframe;
            var indicatorType = first.IndicatorType;

            try
            {
                var candles = await marketData.GetKlinesAsync(symbol, timeframe, 200, null);
                if (candles == null || candles.Count < 50) continue;

                var currentCandle = candles.Last();

                foreach (var (id, userId, sym, tf, indType, signalSubtype, createdAt, condition, frequency, expiration, lastTriggeredBar) in group)
                {
                    if (expiration.HasValue && DateTime.UtcNow > expiration.Value) continue;

                    bool triggered = false;
                    string message = "";

                    switch (indicatorType?.ToLower())
                    {
                        case "support-resistance":
                            triggered = CheckSRAlert(candles, signalSubtype, createdAt, out message, symbol);
                            break;

                        case "market-structure":
                            triggered = CheckMSAlert(candles, signalSubtype, createdAt, out message, symbol);
                            break;

                        case "elliott-wave":
                            triggered = CheckEWAlert(candles, signalSubtype, createdAt, out message, symbol);
                            break;
                    }

                    if (!triggered) continue;

                    long barTime = currentCandle.Timestamp;
                    if (!ShouldTrigger(frequency, lastTriggeredBar, barTime)) continue;

                    await repo.TriggerAlertAsync(id, message, ct);
                    
                    if (frequency == "OnlyOnce")
                    {
                        await repo.DismissAlertAsync(userId, id, ct);
                    }
                    else
                    {
                        await repo.UpdateAlertLastTriggeredAsync(id, barTime, ct);
                    }

                    _logger.LogInformation("Indicator alert {AlertId} triggered: {Message}", id, message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to check indicator alert for {Symbol}/{Timeframe}/{Indicator}", symbol, timeframe, indicatorType);
            }
        }
    }


    private static bool CheckSRAlert(List<FinancePlatform.Domain.Models.Candle> candles, string? signalSubtype, DateTime createdAt, out string message, string symbol)
    {
        message = "";
        if (candles.Count < 50) return false;

        var current = candles.Last();
        var previous = candles[candles.Count - 2];
        var currentPrice = current.Close;
        var prevPrice = previous.Close;

        var recentCandles = candles.TakeLast(50).ToList();
        var recentHigh = recentCandles.Max(c => c.High);
        var recentLow = recentCandles.Min(c => c.Low);

        var threshold = currentPrice * 0.005m; // 0.5% proximity

        if (signalSubtype == "sr_bounce" || signalSubtype == null)
        {

            bool isNearLow = Math.Abs(currentPrice - recentLow) <= threshold;
            bool wasNearLow = Math.Abs(prevPrice - recentLow) <= threshold;

            if (isNearLow && !wasNearLow)
            {
                message = $"{symbol}: Price entered support zone ({currentPrice:N2} ~ {recentLow:N2})";
                return true;
            }

            bool isNearHigh = Math.Abs(currentPrice - recentHigh) <= threshold;
            bool wasNearHigh = Math.Abs(prevPrice - recentHigh) <= threshold;

            if (isNearHigh && !wasNearHigh)
            {
                message = $"{symbol}: Price entered resistance zone ({currentPrice:N2} ~ {recentHigh:N2})";
                return true;
            }
        }

        if (signalSubtype == "sr_breakout")
        {
            if (currentPrice > recentHigh && prevPrice <= recentHigh)
            {
                message = $"{symbol}: New resistance breakout! Price {currentPrice:N2} > {recentHigh:N2}";
                return true;
            }
            if (currentPrice < recentLow && prevPrice >= recentLow)
            {
                message = $"{symbol}: New support breakdown! Price {currentPrice:N2} < {recentLow:N2}";
                return true;
            }
        }

        return false;
    }

    private static bool CheckMSAlert(List<FinancePlatform.Domain.Models.Candle> candles, string? signalSubtype, DateTime createdAt, out string message, string symbol)
    {
        message = "";
        if (candles.Count < 50) return false;

        var current = candles.Last();
        var previous = candles[candles.Count - 2];
        
        
        var avgBody = candles.TakeLast(50).Average(c => Math.Abs(c.Close - c.Open));

        for (int i = candles.Count - 20; i < candles.Count - 2; i++)
        {
            var moveCandle = candles[i];
            var bodySize = Math.Abs(moveCandle.Close - moveCandle.Open);

            if (bodySize > avgBody * 1.5m) // Relaxed threshold
            {
                bool isBullishMove = moveCandle.Close > moveCandle.Open;
                
                var obCandleIndex = i - 1;
                if (obCandleIndex < 0) continue;
                
                var obCandle = candles[obCandleIndex];
                bool isRedCoin = obCandle.Close < obCandle.Open;
                bool isGreenCoin = obCandle.Close > obCandle.Open;

                if ((isBullishMove && !isGreenCoin) || (!isBullishMove && !isRedCoin))
                {
                    var obHigh = Math.Max(obCandle.Open, obCandle.Close); // Use Body or Wicks? Usually Body for precision, Wicks for zones. using High/Low for safety.
                    var obLow = Math.Min(obCandle.Open, obCandle.Close); // Let's use High/Low for the zone to catch wicks.
                    obHigh = obCandle.High;
                    obLow = obCandle.Low;

                    bool currentIntersects = current.Low <= obHigh && current.High >= obLow;
                    bool previousIntersects = previous.Low <= obHigh && previous.High >= obLow;

                    
                    if (currentIntersects && !previousIntersects)
                    {
                        var obType = isBullishMove ? "Bullish" : "Bearish";
                        message = $"{symbol}: Price entered {obType} order block zone ({obLow:N2} - {obHigh:N2})";
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private static bool CheckEWAlert(List<FinancePlatform.Domain.Models.Candle> candles, string? signalSubtype, DateTime createdAt, out string message, string symbol)
    {
        message = "";
        if (candles.Count < 50) return false;


        var swings = new List<(int Index, decimal Price, string Type, long Time)>();
        
        for (int i = 2; i < candles.Count - 2; i++)
        {
            var c = candles[i];
            bool isHigh = c.High > candles[i-1].High && c.High > candles[i-2].High && 
                          c.High > candles[i+1].High && c.High > candles[i+2].High;
            
            bool isLow = c.Low < candles[i-1].Low && c.Low < candles[i-2].Low &&
                         c.Low < candles[i+1].Low && c.Low < candles[i+2].Low;

            if (isHigh) swings.Add((i, c.High, "High", c.Timestamp));
            if (isLow) swings.Add((i, c.Low, "Low", c.Timestamp));
        }

        if (swings.Count < 5) return false;
        
        var lastSwing = swings.Last();
        var swingTime = DateTimeOffset.FromUnixTimeMilliseconds(lastSwing.Time).UtcDateTime;

        if (swingTime < createdAt) return false;

        
        var relevantSwings = swings.TakeLast(5).ToList();
        if (relevantSwings.Count < 5) return false;

        if (lastSwing.Type == "High")
        {
            
            if (relevantSwings[4].Type == "High" && relevantSwings[3].Type == "Low" &&
                relevantSwings[2].Type == "High" && relevantSwings[1].Type == "Low")
            {
                
                bool isBullishImpulse = relevantSwings[2].Price > relevantSwings[0].Price && // High(3) > High(1)? No, Index 0 is Low?
                                        
                                        
                                        relevantSwings[4].Price > relevantSwings[2].Price && // H5 > H3
                                        relevantSwings[3].Price > relevantSwings[1].Price;   // L4 > L2
                                        
                if (isBullishImpulse)
                {
                    message = $"{symbol}: Elliott Wave (Bullish) Wave 5 completed! ({lastSwing.Price:N2})";
                    return true;
                }
            }
        }
        
        if (lastSwing.Type == "Low")
        {
             if (relevantSwings[4].Type == "Low" && relevantSwings[3].Type == "High" &&
                 relevantSwings[2].Type == "Low" && relevantSwings[1].Type == "High")
             {
                 bool isBearishImpulse = relevantSwings[4].Price < relevantSwings[2].Price && // L5 < L3
                                         relevantSwings[3].Price < relevantSwings[1].Price;   // H4 < H2
                                         
                 if (isBearishImpulse)
                 {
                     message = $"{symbol}: Elliott Wave (Bearish) Wave 5 completed! ({lastSwing.Price:N2})";
                     return true;
                 }
             }
        }

        return false;
    }
}
