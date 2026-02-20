using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Infrastructure.Services
{
    public class BacktestEngineService : IBacktestEngineService
    {
        private readonly IMarketDataProvider _marketDataProvider;
        private readonly ISupportResistanceService _supportResistanceService;
        private readonly IMarketStructureService _marketStructureService;
        private readonly IElliottWaveService _elliottWaveService;
        private readonly ITradeSimulatorService _tradeSimulatorService;

        public BacktestEngineService(
            IMarketDataProvider marketDataProvider,
            ISupportResistanceService supportResistanceService,
            IMarketStructureService marketStructureService,
            IElliottWaveService elliottWaveService,
            ITradeSimulatorService tradeSimulatorService)
        {
            _marketDataProvider = marketDataProvider;
            _supportResistanceService = supportResistanceService;
            _marketStructureService = marketStructureService;
            _elliottWaveService = elliottWaveService;
            _tradeSimulatorService = tradeSimulatorService;
        }

        public async Task<BacktestResult> RunBacktestAsync(BacktestRequest request)
        {
            request.StartDate = NormalizeToUtc(request.StartDate);
            request.EndDate = NormalizeToUtc(request.EndDate);
            ValidateRequest(request);

            var indicatorType = request.Strategy.IndicatorType.ToLower();
            var parameters = request.Strategy.Parameters ?? new Dictionary<string, object>();

            int warmupPeriod = GetWarmupPeriod(indicatorType, parameters);
            int minCandles = GetMinimumCandlesForTimeframe(request.Timeframe);

            int prefetchBars = GetParameter(parameters, "prefetchBars", 0);
            prefetchBars = Math.Min(2000, Math.Max(0, prefetchBars));
            DateTime fetchStart = prefetchBars > 0
                ? request.StartDate - BarsToTimeSpan(prefetchBars, request.Timeframe)
                : request.StartDate;

            var candles = await FetchHistoricalDataAsync(request.Symbol, request.Timeframe, fetchStart, request.EndDate);

            if (candles == null || candles.Count < minCandles)
            {
                throw new Exception($"Insufficient data for backtest. Need at least {minCandles} candles for {request.Timeframe} timeframe, got {candles?.Count ?? 0}");
            }

            int startIndex = candles.FindIndex(c => c.DateTime >= request.StartDate);
            if (startIndex < 0)
            {
                throw new Exception("Insufficient data for backtest. No candles found on/after StartDate.");
            }

            int inRangeCount = candles.Count - startIndex;
            if (inRangeCount < minCandles)
            {
                throw new Exception($"Insufficient data for backtest. Need at least {minCandles} candles from StartDate for {request.Timeframe}, got {inRangeCount}");
            }

            var indicatorData = CalculateIndicators(candles, request);

            var signals = GenerateSignals(candles, indicatorData, request, startIndex, warmupPeriod);

            var simulationResult = _tradeSimulatorService.SimulateTrades(
                candles,
                signals,
                request.InitialWallet,
                request.StopLossPercent,
                request.TakeProfitPercent,
                request.MakerFee,
                request.TakerFee,
                request.PositionSizePercent,
                startIndex);

            return BuildBacktestResult(request, simulationResult);
        }

        #region Indicator Calculation (One Time)

        private IndicatorDataSet CalculateIndicators(List<Candle> candles, BacktestRequest request)
        {
            var data = new IndicatorDataSet();
            var parameters = request.Strategy.Parameters ?? new Dictionary<string, object>();
            var indicatorType = request.Strategy.IndicatorType.ToLower();

            switch (indicatorType)
            {
                case "support-resistance":
                    data.SRData = CalculateSRData(candles, request, parameters);
                    break;

                case "market-structure":
                    data.MSData = CalculateMSData(candles, request, parameters);
                    break;

                case "elliott-wave":
                    data.EWData = CalculateEWData(candles, request, parameters);
                    break;
            }

            return data;
        }

        private SupportResistanceResponse CalculateSRData(List<Candle> candles, BacktestRequest request, Dictionary<string, object> parameters)
        {
            int atrLength = GetParameter(parameters, "atrLength", 50);
            float multiplicativeFactor = GetParameter(parameters, "multiplicativeFactor", 8.0f);
            int extendLast = GetParameter(parameters, "extendLast", 6);

            return _supportResistanceService.CalculateSupportResistanceFromCandles(
                candles,
                request.Symbol,
                request.Timeframe,
                multiplicativeFactor,
                atrLength,
                extendLast,
                returnAllLevels: true);
        }

        private MarketStructureResponse CalculateMSData(List<Candle> candles, BacktestRequest request, Dictionary<string, object> parameters)
        {
            int zigZagLength = GetParameter(parameters, "zigZagLength", 7);
            float fibFactor = GetParameter(parameters, "fibFactor", 0.33f);

            var msRequest = new MarketStructureRequest
            {
                Symbol = request.Symbol,
                Timeframe = request.Timeframe,
                ZigZagLength = zigZagLength,
                FibFactor = fibFactor,
                Limit = candles.Count
            };

            return _marketStructureService.CalculateMarketStructureFromCandles(candles, msRequest);
        }

        private ElliottWaveResponse CalculateEWData(List<Candle> candles, BacktestRequest request, Dictionary<string, object> parameters)
        {
            int length1 = GetParameter(parameters, "length1", 4);
            int length2 = GetParameter(parameters, "length2", 8);
            int length3 = GetParameter(parameters, "length3", 16);
            bool useLength1 = GetParameter(parameters, "useLength1", true);
            bool useLength2 = GetParameter(parameters, "useLength2", true);
            bool useLength3 = GetParameter(parameters, "useLength3", false);

            var ewRequest = new ElliottWaveRequest
            {
                Symbol = request.Symbol,
                Timeframe = request.Timeframe,
                Length1 = length1,
                Length2 = length2,
                Length3 = length3,
                UseLength1 = useLength1,
                UseLength2 = useLength2,
                UseLength3 = useLength3,
                Limit = candles.Count
            };

            return _elliottWaveService.CalculateElliottWavesFromCandles(candles, ewRequest);
        }

        #endregion

        #region Signal Generation (Event Loop)

        private List<TradingSignal> GenerateSignals(List<Candle> candles, IndicatorDataSet indicatorData, BacktestRequest request, int startIndex, int warmupPeriod)
        {
            var signals = new List<TradingSignal>();
            var indicatorType = request.Strategy.IndicatorType.ToLower();
            var signalType = request.Strategy.SignalType.ToLower();
            
            int lastSignalIndex = -5;
            const int MIN_BARS_BETWEEN_SIGNALS = 3;

            for (int i = Math.Max(warmupPeriod, startIndex); i < candles.Count; i++)
            {
                if (i - lastSignalIndex < MIN_BARS_BETWEEN_SIGNALS)
                    continue;

                var currentCandle = candles[i];
                var prevCandle = candles[i - 1];

                TradingSignal? signal = null;

                switch (indicatorType)
                {
                    case "support-resistance":
                        signal = CheckSRSignal(candles, i, indicatorData.SRData, signalType);
                        break;

                    case "market-structure":
                        signal = CheckMSSignal(candles, i, indicatorData.MSData, signalType);
                        break;

                    case "elliott-wave":
                        signal = CheckEWSignal(candles, i, indicatorData.EWData, signalType);
                        break;
                }

                if (signal != null)
                {
                    signals.Add(signal);
                    lastSignalIndex = i;
                }
            }

            return signals;
        }

        private static DateTime NormalizeToUtc(DateTime dt)
        {
            return dt.Kind switch
            {
                DateTimeKind.Utc => dt,
                DateTimeKind.Local => dt.ToUniversalTime(),
                _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
            };
        }

        private static TimeSpan BarsToTimeSpan(int bars, string timeframe)
        {
            var tf = (timeframe ?? string.Empty).Trim();
            if (string.Equals(tf, "1M", StringComparison.Ordinal))
            {
                return TimeSpan.FromDays(30 * bars);
            }

            int minutesPerBar = tf.ToLowerInvariant() switch
            {
                "1m" => 1,
                "3m" => 3,
                "5m" => 5,
                "15m" => 15,
                "30m" => 30,
                "1h" => 60,
                "2h" => 120,
                "4h" => 240,
                "6h" => 360,
                "8h" => 480,
                "12h" => 720,
                "1d" => 1440,
                "3d" => 4320,
                "1w" => 10080,
                _ => 60
            };

            return TimeSpan.FromMinutes((double)bars * minutesPerBar);
        }

        #endregion

        #region Support/Resistance Signals

        private TradingSignal? CheckSRSignal(List<Candle> candles, int index, SupportResistanceResponse? srData, string signalType)
        {
            if (srData?.Levels == null || !srData.Levels.Any())
                return null;

            if (index < 2) return null;

            var entryCandle = candles[index];
            var signalCandle = candles[index - 1];
            var prevSignalCandle = candles[index - 2];

            var availableLevels = srData.Levels
                .Where(l => l.Date < signalCandle.DateTime)
                .OrderByDescending(l => l.Date)
                .ToList();

            if (!availableLevels.Any())
                return null;

            foreach (var level in availableLevels)
            {
                var zoneTop = Math.Max((decimal)level.Y, (decimal)level.Area);
                var zoneBottom = Math.Min((decimal)level.Y, (decimal)level.Area);

                if (signalType == "bounce")
                {
                    var signal = CheckBounceSignal(entryCandle, signalCandle, prevSignalCandle, index, level, zoneTop, zoneBottom);
                    if (signal != null) return signal;
                }
                else if (signalType == "breakout")
                {
                    var signal = CheckBreakoutSignal(entryCandle, signalCandle, prevSignalCandle, index, level, zoneTop, zoneBottom);
                    if (signal != null) return signal;
                }
            }

            return null;
        }

        private TradingSignal? CheckBounceSignal(Candle entry, Candle signal, Candle prevSignal, int index, SrLevel level, decimal zoneTop, decimal zoneBottom)
        {
            if (level.IsSupport)
            {
                bool lowInZone = signal.Low >= zoneBottom && signal.Low <= zoneTop;
                bool bullishCandle = signal.Close > signal.Open;
                bool closeHigherThanPrev = signal.Close > prevSignal.Close;

                if (lowInZone && bullishCandle && closeHigherThanPrev)
                {
                    return new TradingSignal
                    {
                        Date = entry.DateTime,
                        CandleIndex = index,
                        Direction = TradeDirection.Long,
                        Price = entry.Open,
                        Source = $"Support Bounce at {zoneBottom:F2}",
                        SuggestedStopLoss = zoneBottom * 0.98m,
                        SuggestedTakeProfit = entry.Open + (entry.Open - zoneBottom) * 2
                    };
                }
            }
            else
            {
                bool highInZone = signal.High >= zoneBottom && signal.High <= zoneTop;
                bool bearishCandle = signal.Close < signal.Open;
                bool closeLowerThanPrev = signal.Close < prevSignal.Close;

                if (highInZone && bearishCandle && closeLowerThanPrev)
                {
                    return new TradingSignal
                    {
                        Date = entry.DateTime,
                        CandleIndex = index,
                        Direction = TradeDirection.Short,
                        Price = entry.Open,
                        Source = $"Resistance Bounce at {zoneTop:F2}",
                        SuggestedStopLoss = zoneTop * 1.02m,
                        SuggestedTakeProfit = entry.Open - (zoneTop - entry.Open) * 2
                    };
                }
            }

            return null;
        }

        private TradingSignal? CheckBreakoutSignal(Candle entry, Candle signal, Candle prevSignal, int index, SrLevel level, decimal zoneTop, decimal zoneBottom)
        {
            if (!level.IsSupport)
            {
                bool wasBelow = prevSignal.Close <= zoneTop;
                bool brokeAbove = signal.Close > zoneTop;
                bool bullishCandle = signal.Close > signal.Open;

                if (wasBelow && brokeAbove && bullishCandle)
                {
                    return new TradingSignal
                    {
                        Date = entry.DateTime,
                        CandleIndex = index,
                        Direction = TradeDirection.Long,
                        Price = entry.Open,
                        Source = $"Resistance Breakout at {zoneTop:F2}",
                        SuggestedStopLoss = zoneBottom,
                        SuggestedTakeProfit = entry.Open + (zoneTop - zoneBottom) * 2
                    };
                }
            }
            else
            {
                bool wasAbove = prevSignal.Close >= zoneBottom;
                bool brokeBelow = signal.Close < zoneBottom;
                bool bearishCandle = signal.Close < signal.Open;

                if (wasAbove && brokeBelow && bearishCandle)
                {
                    return new TradingSignal
                    {
                        Date = entry.DateTime,
                        CandleIndex = index,
                        Direction = TradeDirection.Short,
                        Price = entry.Open,
                        Source = $"Support Breakdown at {zoneBottom:F2}",
                        SuggestedStopLoss = zoneTop,
                        SuggestedTakeProfit = entry.Open - (zoneTop - zoneBottom) * 2
                    };
                }
            }

            return null;
        }

        #endregion

        #region Market Structure Signals

        private TradingSignal? CheckMSSignal(List<Candle> candles, int index, MarketStructureResponse? msData, string signalType)
        {
            if (msData == null)
                return null;

            var currentCandle = candles[index];
            var prevCandle = candles[index - 1];

            switch (signalType)
            {
                case "msb":
                    return CheckMSBSignal(candles, currentCandle, prevCandle, index, msData.MarketStructureBreaks);

                case "order-block":
                    return CheckOrderBlockSignal(candles, currentCandle, prevCandle, index, msData.OrderBlocks);

                case "breaker-block":
                    return CheckBreakerBlockSignal(candles, currentCandle, prevCandle, index, msData.BreakerBlocks);

                default:
                    return CheckMSBSignal(candles, currentCandle, prevCandle, index, msData.MarketStructureBreaks);
            }
        }

        private TradingSignal? CheckMSBSignal(List<Candle> candles, Candle current, Candle prev, int index, List<MarketStructureBreak>? msbs)
        {
            if (msbs == null || !msbs.Any())
                return null;

            var confirmedMSBs = msbs
                .Where(m => m.Date <= prev.DateTime && m.Date > (index >= 2 ? candles[index - 2].DateTime : DateTime.MinValue))
                .ToList();

            foreach (var msb in confirmedMSBs)
            {
                var direction = msb.Type == "Bullish" ? TradeDirection.Long : TradeDirection.Short;

                return new TradingSignal
                {
                    Date = current.DateTime,
                    CandleIndex = index,
                    Direction = direction,
                    Price = current.Open,
                    Source = $"{msb.Type} MSB (Entry after break)",
                    SuggestedStopLoss = msb.PrecedingSwingPoint?.Price ?? current.Open * (direction == TradeDirection.Long ? 0.98m : 1.02m),
                    SuggestedTakeProfit = null
                };
            }

            return null;
        }

        private TradingSignal? CheckOrderBlockSignal(List<Candle> candles, Candle current, Candle prev, int index, List<IdentifiedOrderBlock>? orderBlocks)
        {
            if (orderBlocks == null || !orderBlocks.Any())
                return null;

            var availableOBs = orderBlocks
                .Where(ob => ob.MsbDate <= prev.DateTime && IsBlockNotMitigatedYet(ob, index - 1))
                .ToList();

            foreach (var ob in availableOBs)
            {
                bool isBullishOB = ob.OrderBlockType.StartsWith("Bu");

                if (isBullishOB)
                {
                    bool prevLowInZone = prev.Low >= ob.Low * 0.998m && prev.Low <= ob.High * 1.002m;
                    bool prevBullishCandle = prev.Close > prev.Open;
                    bool prevWasAboveZone = prev.Close > ob.High;

                    if (prevLowInZone && prevBullishCandle && prevWasAboveZone)
                    {
                        return new TradingSignal
                        {
                            Date = current.DateTime,
                            CandleIndex = index,
                            Direction = TradeDirection.Long,
                            Price = current.Open,
                            Source = "Bullish Order Block (Entry after touch)",
                            SuggestedStopLoss = ob.Low * 0.98m,
                            SuggestedTakeProfit = null
                        };
                    }
                }
                else
                {
                    bool prevHighInZone = prev.High >= ob.Low * 0.998m && prev.High <= ob.High * 1.002m;
                    bool prevBearishCandle = prev.Close < prev.Open;
                    bool prevWasBelowZone = prev.Close < ob.Low;

                    if (prevHighInZone && prevBearishCandle && prevWasBelowZone)
                    {
                        return new TradingSignal
                        {
                            Date = current.DateTime,
                            CandleIndex = index,
                            Direction = TradeDirection.Short,
                            Price = current.Open,
                            Source = "Bearish Order Block (Entry after touch)",
                            SuggestedStopLoss = ob.High * 1.02m,
                            SuggestedTakeProfit = null
                        };
                    }
                }
            }

            return null;
        }

        private TradingSignal? CheckBreakerBlockSignal(List<Candle> candles, Candle current, Candle prev, int index, List<IdentifiedBreakerBlock>? breakerBlocks)
        {
            if (breakerBlocks == null || !breakerBlocks.Any())
                return null;

            var availableBBs = breakerBlocks
                .Where(bb => bb.MsbDate <= prev.DateTime && IsBlockNotMitigatedYet(bb, index - 1))
                .ToList();

            foreach (var bb in availableBBs)
            {
                bool isBullishBB = bb.BreakerBlockType.StartsWith("Bu");

                if (isBullishBB)
                {
                    bool prevLowInZone = prev.Low >= bb.Low * 0.998m && prev.Low <= bb.High * 1.002m;
                    bool prevBullishCandle = prev.Close > prev.Open;
                    bool prevWasAboveZone = prev.Close > bb.High;

                    if (prevLowInZone && prevBullishCandle && prevWasAboveZone)
                    {
                        return new TradingSignal
                        {
                            Date = current.DateTime,
                            CandleIndex = index,
                            Direction = TradeDirection.Long,
                            Price = current.Open,
                            Source = $"Bullish Breaker Block ({bb.BreakerBlockType}) (Entry after touch)",
                            SuggestedStopLoss = bb.Low * 0.98m,
                            SuggestedTakeProfit = null
                        };
                    }
                }
                else
                {
                    bool prevHighInZone = prev.High >= bb.Low * 0.998m && prev.High <= bb.High * 1.002m;
                    bool prevBearishCandle = prev.Close < prev.Open;
                    bool prevWasBelowZone = prev.Close < bb.Low;

                    if (prevHighInZone && prevBearishCandle && prevWasBelowZone)
                    {
                        return new TradingSignal
                        {
                            Date = current.DateTime,
                            CandleIndex = index,
                            Direction = TradeDirection.Short,
                            Price = current.Open,
                            Source = $"Bearish Breaker Block ({bb.BreakerBlockType}) (Entry after touch)",
                            SuggestedStopLoss = bb.High * 1.02m,
                            SuggestedTakeProfit = null
                        };
                    }
                }
            }

            return null;
        }

        #endregion

        #region Elliott Wave Signals

        private TradingSignal? CheckEWSignal(List<Candle> candles, int index, ElliottWaveResponse? ewData, string signalType)
        {
            if (ewData?.WavePatterns == null || !ewData.WavePatterns.Any())
                return null;

            var currentCandle = candles[index];
            var prevCandle = candles[index - 1];

            switch (signalType)
            {
                case "wave-complete":
                    return CheckWaveCompleteSignal(currentCandle, prevCandle, index, ewData.WavePatterns);

                case "corrective-end":
                    return CheckCorrectiveEndSignal(currentCandle, prevCandle, index, ewData.WavePatterns);

                default:
                    return CheckWaveCompleteSignal(currentCandle, prevCandle, index, ewData.WavePatterns);
            }
        }

        private TradingSignal? CheckWaveCompleteSignal(Candle current, Candle prev, int index, List<WavePattern> patterns)
        {
            var motivePatterns = patterns.Where(p => p.Type == "Motive" && p.IsValid).ToList();

            foreach (var pattern in motivePatterns)
            {
                int confirmedIndex = Math.Min(index, pattern.Index + 1);
                if (confirmedIndex > index - 1) continue;
                if ((index - 1) - confirmedIndex > 3) continue;

                var wave5Point = pattern.Points?.FirstOrDefault(p => p.Label == "5");
                if (wave5Point == null)
                    continue;

                if (wave5Point.Date > prev.DateTime)
                    continue;

                var wave1Point = pattern.Points?.FirstOrDefault(p => p.Label == "1");
                bool isUptrend = wave1Point != null && wave5Point.Price > wave1Point.Price;

                var direction = isUptrend ? TradeDirection.Short : TradeDirection.Long;

                bool confirmed = isUptrend ? (prev.Close < prev.Open) : (prev.Close > prev.Open);

                if (confirmed)
                {
                    return new TradingSignal
                    {
                        Date = current.DateTime,
                        CandleIndex = index,
                        Direction = direction,
                        Price = current.Open,
                        Source = $"Wave 5 Complete ({(isUptrend ? "Bearish" : "Bullish")} Reversal)",
                        SuggestedStopLoss = wave5Point.Price * (isUptrend ? 1.02m : 0.98m),
                        SuggestedTakeProfit = null
                    };
                }
            }

            return null;
        }

        private TradingSignal? CheckCorrectiveEndSignal(Candle current, Candle prev, int index, List<WavePattern> patterns)
        {
            var correctivePatterns = patterns.Where(p => p.Type == "Corrective" && p.IsValid).ToList();

            foreach (var pattern in correctivePatterns)
            {
                int confirmedIndex = Math.Min(index, pattern.Index + 1);
                if (confirmedIndex > index - 1) continue;
                if ((index - 1) - confirmedIndex > 3) continue;

                var waveCPoint = pattern.Points?.FirstOrDefault(p => p.Label == "C");
                if (waveCPoint == null)
                    continue;

                if (waveCPoint.Date > prev.DateTime)
                    continue;

                var waveAPoint = pattern.Points?.FirstOrDefault(p => p.Label == "A");
                bool wasDownCorrection = waveAPoint != null && waveCPoint.Price < waveAPoint.Price;

                var direction = wasDownCorrection ? TradeDirection.Long : TradeDirection.Short;

                bool confirmed = wasDownCorrection ? (prev.Close > prev.Open) : (prev.Close < prev.Open);

                if (confirmed)
                {
                    return new TradingSignal
                    {
                        Date = current.DateTime,
                        CandleIndex = index,
                        Direction = direction,
                        Price = current.Open,
                        Source = $"Corrective End ({(wasDownCorrection ? "Bullish" : "Bearish")} Continuation)",
                        SuggestedStopLoss = waveCPoint.Price * (wasDownCorrection ? 0.98m : 1.02m),
                        SuggestedTakeProfit = null
                    };
                }
            }

            return null;
        }

        private static bool IsBlockNotMitigatedYet(BaseBlockInfo block, int lastKnownIndex)
        {
            if (block.MitigatedIndex.HasValue)
            {
                return block.MitigatedIndex.Value > lastKnownIndex;
            }
            return true;
        }

        #endregion

        #region Data Fetching

        private async Task<List<Candle>> FetchHistoricalDataAsync(string symbol, string timeframe, DateTime startDate, DateTime endDate)
        {
            var allCandles = new List<Candle>();
            long? endTimeMs = new DateTimeOffset(endDate).ToUnixTimeMilliseconds();
            const int batchSize = 1000;
            int maxIterations = GetMaxIterationsForTimeframe(timeframe);
            int iteration = 0;

            while (iteration < maxIterations)
            {
                iteration++;
                var candles = await _marketDataProvider.GetKlinesAsync(symbol, timeframe, batchSize, endTimeMs);

                if (candles == null || !candles.Any())
                    break;

                var filteredCandles = candles.Where(c => c.DateTime >= startDate && c.DateTime <= endDate).ToList();
                allCandles.InsertRange(0, filteredCandles);

                var oldestCandle = candles.OrderBy(c => c.DateTime).First();
                if (oldestCandle.DateTime <= startDate)
                    break;

                endTimeMs = oldestCandle.Timestamp - 1;
            }

            return allCandles.OrderBy(c => c.Timestamp).ToList();
        }

        private int GetMaxIterationsForTimeframe(string timeframe)
        {
            return timeframe.ToLower() switch
            {
                "1m" => 1100,
                "3m" => 400,
                "5m" => 250,
                "15m" => 100,
                "30m" => 50,
                "1h" => 25,
                "2h" => 15,
                "4h" => 10,
                "6h" => 8,
                "8h" => 6,
                "12h" => 5,
                "1d" => 5,
                "3d" => 3,
                "1w" => 3,
                "1M" => 3,
                _ => 50
            };
        }

        private int GetMinimumCandlesForTimeframe(string timeframe)
        {
            return timeframe.ToLower() switch
            {
                "1m" => 100,
                "3m" => 100,
                "5m" => 100,
                "15m" => 100,
                "30m" => 100,
                "1h" => 100,
                "2h" => 80,
                "4h" => 60,
                "6h" => 50,
                "8h" => 40,
                "12h" => 30,
                "1d" => 30,
                "3d" => 20,
                "1w" => 15,
                "1M" => 12,
                _ => 50
            };
        }

        #endregion

        #region Result Building

        private BacktestResult BuildBacktestResult(BacktestRequest request, SimulationResult simulation)
        {
            var trades = simulation.Trades;
            var equityCurve = simulation.EquityCurve;

            var result = new BacktestResult
            {
                Symbol = request.Symbol,
                Timeframe = request.Timeframe,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                StrategyUsed = $"{request.Strategy.IndicatorType} - {request.Strategy.SignalType}",
                InitialBalance = request.InitialWallet,
                FinalBalance = simulation.FinalBalance,
                TotalFeesPaid = simulation.TotalFeesPaid,
                Trades = trades,
                EquityCurve = equityCurve
            };

            result.TotalPnL = result.FinalBalance - result.InitialBalance;
            result.TotalPnLPercent = result.InitialBalance > 0
                ? (result.TotalPnL / result.InitialBalance) * 100
                : 0;

            result.TotalTrades = trades.Count;

            if (trades.Any())
            {
                var winningTrades = trades.Where(t => t.PnL > 0).ToList();
                var losingTrades = trades.Where(t => t.PnL <= 0).ToList();

                result.WinningTrades = winningTrades.Count;
                result.LosingTrades = losingTrades.Count;
                result.WinRate = result.TotalTrades > 0
                    ? (decimal)result.WinningTrades / result.TotalTrades * 100
                    : 0;

                if (winningTrades.Any())
                {
                    result.AverageWin = winningTrades.Average(t => t.PnL);
                    result.AverageWinPercent = winningTrades.Average(t => t.PnLPercent);
                    result.LargestWin = winningTrades.Max(t => t.PnL);
                }

                if (losingTrades.Any())
                {
                    result.AverageLoss = Math.Abs(losingTrades.Average(t => t.PnL));
                    result.AverageLossPercent = Math.Abs(losingTrades.Average(t => t.PnLPercent));
                    result.LargestLoss = Math.Abs(losingTrades.Min(t => t.PnL));
                }

                decimal totalProfit = winningTrades.Sum(t => t.PnL);
                decimal totalLoss = Math.Abs(losingTrades.Sum(t => t.PnL));
                result.ProfitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;

                if (equityCurve.Any())
                {
                    result.MaxDrawdown = equityCurve.Max(e => e.Drawdown);
                    result.MaxDrawdownPercent = equityCurve.Max(e => e.DrawdownPercent);
                }

                result.SharpeRatio = CalculateSharpeRatio(equityCurve, request.InitialWallet, request.Timeframe);

                var avgMinutes = trades.Average(t => t.HoldingPeriodMinutes);
                result.AverageHoldingPeriod = FormatHoldingPeriod(avgMinutes);
            }

            return result;
        }

        private decimal CalculateSharpeRatio(List<EquityPoint> equityCurve, decimal initialBalance, string timeframe)
        {
            if (equityCurve == null || equityCurve.Count < 2)
                return 0;

            var returns = new List<decimal>();
            for (int i = 1; i < equityCurve.Count; i++)
            {
                if (equityCurve[i - 1].Balance > 0)
                {
                    decimal returnPct = (equityCurve[i].Balance - equityCurve[i - 1].Balance) / equityCurve[i - 1].Balance;
                    returns.Add(returnPct);
                }
            }

            if (!returns.Any())
                return 0;

            decimal avgReturn = returns.Average();
            decimal variance = returns.Sum(r => (r - avgReturn) * (r - avgReturn)) / returns.Count;
            decimal stdDev = (decimal)Math.Sqrt((double)variance);

            if (stdDev == 0)
                return avgReturn > 0 ? 999 : 0;

            var barLength = BarsToTimeSpan(1, timeframe);
            var barsPerYear = barLength.TotalSeconds > 0
                ? (decimal)(TimeSpan.FromDays(365).TotalSeconds / barLength.TotalSeconds)
                : 365m;

            decimal annualizedReturn = avgReturn * barsPerYear;
            decimal annualizedStdDev = stdDev * (decimal)Math.Sqrt((double)barsPerYear);

            return annualizedStdDev > 0 ? annualizedReturn / annualizedStdDev : 0;
        }

        private string FormatHoldingPeriod(double minutes)
        {
            var ts = TimeSpan.FromMinutes(minutes);

            if (ts.TotalDays >= 1)
                return $"{ts.TotalDays:F1} days";
            if (ts.TotalHours >= 1)
                return $"{ts.TotalHours:F1} hours";
            return $"{ts.TotalMinutes:F0} minutes";
        }

        #endregion

        #region Helpers

        private int GetWarmupPeriod(string indicatorType, Dictionary<string, object>? parameters)
        {
            parameters ??= new Dictionary<string, object>();

            return indicatorType switch
            {
                "support-resistance" => GetParameter(parameters, "atrLength", 50) + 10,
                "market-structure" => GetParameter(parameters, "zigZagLength", 7) * 3,
                "elliott-wave" => GetParameter(parameters, "length2", 8) * 3,
                _ => 50
            };
        }

        private void ValidateRequest(BacktestRequest request)
        {
            if (string.IsNullOrEmpty(request.Symbol))
                throw new ArgumentException("Symbol is required");

            if (request.StartDate >= request.EndDate)
                throw new ArgumentException("Start date must be before end date");

            if (request.InitialWallet <= 0)
                throw new ArgumentException("Initial wallet must be greater than 0");

            if (request.StopLossPercent <= 0 || request.StopLossPercent > 50)
                throw new ArgumentException("Stop loss must be between 0 and 50 percent");

            if (request.TakeProfitPercent <= 0 || request.TakeProfitPercent > 100)
                throw new ArgumentException("Take profit must be between 0 and 100 percent");
        }

        private T GetParameter<T>(Dictionary<string, object> parameters, string key, T defaultValue)
        {
            if (parameters == null || !parameters.ContainsKey(key))
                return defaultValue;

            try
            {
                var value = parameters[key];

                if (value is T typedValue)
                    return typedValue;

                if (typeof(T) == typeof(int) && value is long longVal)
                    return (T)(object)(int)longVal;

                if (typeof(T) == typeof(float) && value is double doubleVal)
                    return (T)(object)(float)doubleVal;

                if (typeof(T) == typeof(bool) && value is bool boolVal)
                    return (T)(object)boolVal;

                return (T)Convert.ChangeType(value, typeof(T));
            }
            catch
            {
                return defaultValue;
            }
        }

        #endregion

        #region Data Classes

        private class IndicatorDataSet
        {
            public SupportResistanceResponse? SRData { get; set; }
            public MarketStructureResponse? MSData { get; set; }
            public ElliottWaveResponse? EWData { get; set; }
        }

        #endregion
    }
}
