using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Infrastructure.Services
{
    public class SignalGeneratorService : ISignalGeneratorService
    {
        #region Support/Resistance Signals

        public Task<List<TradingSignal>> GenerateSupportResistanceSignals(
            List<Candle> candles,
            SupportResistanceResponse srData,
            string signalType,
            Dictionary<string, object> parameters)
        {
            var signals = new List<TradingSignal>();

            if (srData?.Levels == null || !srData.Levels.Any() || candles == null || !candles.Any())
                return Task.FromResult(signals);

            switch (signalType.ToLower())
            {
                case "bounce":
                    signals = GenerateSRBounceSignals(candles, srData.Levels);
                    break;
                case "breakout":
                    signals = GenerateSRBreakoutSignals(candles, srData.Levels);
                    break;
                default:
                    signals = GenerateSRBounceSignals(candles, srData.Levels);
                    break;
            }

            return Task.FromResult(signals);
        }

        private List<TradingSignal> GenerateSRBounceSignals(List<Candle> candles, List<SrLevel> levels)
        {
            var signals = new List<TradingSignal>();
            
            int lastSignalIndex = -10;
            const int MIN_CANDLES_BETWEEN_SIGNALS = 3;

            for (int i = 1; i < candles.Count; i++)
            {
                if (i - lastSignalIndex < MIN_CANDLES_BETWEEN_SIGNALS)
                    continue;

                var candle = candles[i];
                var prevCandle = candles[i - 1];

                TradingSignal? bestSignal = null;
                decimal bestDistance = decimal.MaxValue;

                    foreach (var level in levels)
                    {
                        var levelDate = level.Date;
                        if (candle.DateTime < levelDate)
                            continue;

                    var zoneTop = Math.Max((decimal)level.Y, (decimal)level.Area);
                    var zoneBottom = Math.Min((decimal)level.Y, (decimal)level.Area);
                    var zoneMid = (zoneTop + zoneBottom) / 2;

                    if (level.IsSupport)
                    {
                        bool touchedSupport = candle.Low <= zoneTop && candle.Low >= zoneBottom * 0.995m;
                        bool bouncedUp = candle.Close > candle.Open && candle.Close > prevCandle.Close;
                        
                        bool closeAboveZone = candle.Close > zoneTop;

                        if (touchedSupport && bouncedUp && closeAboveZone)
                        {
                            decimal distance = Math.Abs(candle.Low - zoneMid);
                            if (distance < bestDistance)
                            {
                                bestDistance = distance;
                                bestSignal = new TradingSignal
                                {
                                    Date = candle.DateTime,
                                    CandleIndex = i,
                                    Direction = TradeDirection.Long,
                                    Price = candle.Close,
                                    Source = $"Support Bounce at {zoneBottom:F2}",
                                    SuggestedStopLoss = zoneBottom * 0.99m,
                                    SuggestedTakeProfit = candle.Close + (candle.Close - zoneBottom) * 2
                                };
                            }
                        }
                    }
                    else
                    {
                        bool touchedResistance = candle.High >= zoneBottom * 0.995m && candle.High <= zoneTop * 1.005m;
                        bool bouncedDown = candle.Close < candle.Open && candle.Close < prevCandle.Close;
                        
                        bool closeBelowZone = candle.Close < zoneBottom;

                        if (touchedResistance && bouncedDown && closeBelowZone)
                        {
                            decimal distance = Math.Abs(candle.High - zoneMid);
                            if (distance < bestDistance)
                            {
                                bestDistance = distance;
                                bestSignal = new TradingSignal
                                {
                                    Date = candle.DateTime,
                                    CandleIndex = i,
                                    Direction = TradeDirection.Short,
                                    Price = candle.Close,
                                    Source = $"Resistance Bounce at {zoneTop:F2}",
                                    SuggestedStopLoss = zoneTop * 1.01m,
                                    SuggestedTakeProfit = candle.Close - (zoneTop - candle.Close) * 2
                                };
                            }
                        }
                    }
                }

                if (bestSignal != null)
                {
                    signals.Add(bestSignal);
                    lastSignalIndex = i;
                }
            }

            return signals;
        }

        private List<TradingSignal> GenerateSRBreakoutSignals(List<Candle> candles, List<SrLevel> levels)
        {
            var signals = new List<TradingSignal>();
            
            int lastSignalIndex = -10;
            const int MIN_CANDLES_BETWEEN_SIGNALS = 3;

            for (int i = 1; i < candles.Count; i++)
            {
                if (i - lastSignalIndex < MIN_CANDLES_BETWEEN_SIGNALS)
                    continue;

                var candle = candles[i];
                var prevCandle = candles[i - 1];

                TradingSignal? bestSignal = null;

                foreach (var level in levels)
                {
                    var levelDate = level.Date;
                    if (candle.DateTime < levelDate)
                        continue;

                    var zoneTop = Math.Max((decimal)level.Y, (decimal)level.Area);
                    var zoneBottom = Math.Min((decimal)level.Y, (decimal)level.Area);

                    if (!level.IsSupport)
                    {
                        bool brokeAbove = prevCandle.Close <= zoneTop && candle.Close > zoneTop;
                        bool strongCandle = candle.Close > candle.Open;
                        
                        bool clearBreakout = candle.High > zoneTop * 1.002m;

                        if (brokeAbove && strongCandle && clearBreakout)
                        {
                            bestSignal = new TradingSignal
                            {
                                Date = candle.DateTime,
                                CandleIndex = i,
                                Direction = TradeDirection.Long,
                                Price = candle.Close,
                                Source = $"Resistance Breakout at {zoneTop:F2}",
                                SuggestedStopLoss = zoneBottom,
                                SuggestedTakeProfit = candle.Close + (zoneTop - zoneBottom) * 2
                            };
                            break;
                        }
                    }
                    else
                    {
                        bool brokeBelow = prevCandle.Close >= zoneBottom && candle.Close < zoneBottom;
                        bool strongCandle = candle.Close < candle.Open;
                        
                        bool clearBreakdown = candle.Low < zoneBottom * 0.998m;

                        if (brokeBelow && strongCandle && clearBreakdown)
                        {
                            bestSignal = new TradingSignal
                            {
                                Date = candle.DateTime,
                                CandleIndex = i,
                                Direction = TradeDirection.Short,
                                Price = candle.Close,
                                Source = $"Support Breakdown at {zoneBottom:F2}",
                                SuggestedStopLoss = zoneTop,
                                SuggestedTakeProfit = candle.Close - (zoneTop - zoneBottom) * 2
                            };
                            break;
                        }
                    }
                }

                if (bestSignal != null)
                {
                    signals.Add(bestSignal);
                    lastSignalIndex = i;
                }
            }

            return signals;
        }

        #endregion

        #region Market Structure Signals

        public Task<List<TradingSignal>> GenerateMarketStructureSignals(
            List<Candle> candles,
            MarketStructureResponse msData,
            string signalType,
            Dictionary<string, object> parameters)
        {
            var signals = new List<TradingSignal>();

            if (msData == null || candles == null || !candles.Any())
                return Task.FromResult(signals);

            switch (signalType.ToLower())
            {
                case "msb":
                    signals = GenerateMSBSignals(candles, msData.MarketStructureBreaks);
                    break;
                case "order-block":
                    signals = GenerateOrderBlockSignals(candles, msData.OrderBlocks);
                    break;
                case "breaker-block":
                    signals = GenerateBreakerBlockSignals(candles, msData.BreakerBlocks);
                    break;
                default:
                    signals = GenerateMSBSignals(candles, msData.MarketStructureBreaks);
                    break;
            }

            return Task.FromResult(signals);
        }

        private List<TradingSignal> GenerateMSBSignals(List<Candle> candles, List<MarketStructureBreak> msbs)
        {
            var signals = new List<TradingSignal>();

            if (msbs == null || !msbs.Any())
                return signals;

            foreach (var msb in msbs)
            {
                var candleIndex = candles.FindIndex(c => 
                    c.DateTime >= msb.Date && c.DateTime < msb.Date.AddMinutes(GetTimeframeMinutes(candles)));

                if (candleIndex < 0 || candleIndex >= candles.Count)
                    continue;

                var candle = candles[candleIndex];

                var direction = msb.Type == "Bullish" ? TradeDirection.Long : TradeDirection.Short;
                var source = msb.Type == "Bullish" ? "Bullish MSB" : "Bearish MSB";

                signals.Add(new TradingSignal
                {
                    Date = candle.DateTime,
                    CandleIndex = candleIndex,
                    Direction = direction,
                    Price = candle.Close,
                    Source = source,
                    SuggestedStopLoss = direction == TradeDirection.Long 
                        ? msb.PrecedingSwingPoint?.Price 
                        : msb.PrecedingSwingPoint?.Price,
                    SuggestedTakeProfit = null
                });
            }

            return signals;
        }

        private List<TradingSignal> GenerateOrderBlockSignals(List<Candle> candles, List<IdentifiedOrderBlock> orderBlocks)
        {
            var signals = new List<TradingSignal>();

            if (orderBlocks == null || !orderBlocks.Any())
                return signals;

            var obList = orderBlocks.OrderBy(ob => ob.CandleDate).ToList();
            
            int lastSignalIndex = -10;
            const int MIN_CANDLES_BETWEEN_SIGNALS = 3;

            for (int i = 1; i < candles.Count; i++)
            {
                if (i - lastSignalIndex < MIN_CANDLES_BETWEEN_SIGNALS)
                    continue;

                var candle = candles[i];
                TradingSignal? bestSignal = null;

                foreach (var ob in obList)
                {
                    if (candle.DateTime <= ob.CandleDate)
                        continue;

                    bool isBullishOB = ob.OrderBlockType.StartsWith("Bu");

                    if (isBullishOB)
                    {
                        bool touchedOB = candle.Low <= ob.High && candle.Low >= ob.Low * 0.995m;
                        bool bouncedUp = candle.Close > candle.Open && candle.Close > ob.High;

                        if (touchedOB && bouncedUp)
                        {
                            bestSignal = new TradingSignal
                            {
                                Date = candle.DateTime,
                                CandleIndex = i,
                                Direction = TradeDirection.Long,
                                Price = candle.Close,
                                Source = $"Bullish Order Block Touch",
                                SuggestedStopLoss = ob.Low * 0.99m,
                                SuggestedTakeProfit = null
                            };
                            break;
                        }
                    }
                    else
                    {
                        bool touchedOB = candle.High >= ob.Low * 0.995m && candle.High <= ob.High * 1.005m;
                        bool bouncedDown = candle.Close < candle.Open && candle.Close < ob.Low;

                        if (touchedOB && bouncedDown)
                        {
                            bestSignal = new TradingSignal
                            {
                                Date = candle.DateTime,
                                CandleIndex = i,
                                Direction = TradeDirection.Short,
                                Price = candle.Close,
                                Source = $"Bearish Order Block Touch",
                                SuggestedStopLoss = ob.High * 1.01m,
                                SuggestedTakeProfit = null
                            };
                            break;
                        }
                    }
                }

                if (bestSignal != null)
                {
                    signals.Add(bestSignal);
                    lastSignalIndex = i;
                }
            }

            return signals;
        }

        private List<TradingSignal> GenerateBreakerBlockSignals(List<Candle> candles, List<IdentifiedBreakerBlock> breakerBlocks)
        {
            var signals = new List<TradingSignal>();

            if (breakerBlocks == null || !breakerBlocks.Any())
                return signals;

            var bbList = breakerBlocks.OrderBy(bb => bb.CandleDate).ToList();
            
            int lastSignalIndex = -10;
            const int MIN_CANDLES_BETWEEN_SIGNALS = 3;

            for (int i = 1; i < candles.Count; i++)
            {
                if (i - lastSignalIndex < MIN_CANDLES_BETWEEN_SIGNALS)
                    continue;

                var candle = candles[i];
                TradingSignal? bestSignal = null;

                foreach (var bb in bbList)
                {
                    if (candle.DateTime <= bb.CandleDate)
                        continue;

                    bool isBullishBB = bb.BreakerBlockType.StartsWith("Bu");

                    if (isBullishBB)
                    {
                        bool touchedBB = candle.Low <= bb.High && candle.Low >= bb.Low * 0.995m;
                        bool bouncedUp = candle.Close > candle.Open && candle.Close > bb.High;

                        if (touchedBB && bouncedUp)
                        {
                            bestSignal = new TradingSignal
                            {
                                Date = candle.DateTime,
                                CandleIndex = i,
                                Direction = TradeDirection.Long,
                                Price = candle.Close,
                                Source = $"Bullish Breaker Block Touch ({bb.BreakerBlockType})",
                                SuggestedStopLoss = bb.Low * 0.99m,
                                SuggestedTakeProfit = null
                            };
                            break;
                        }
                    }
                    else
                    {
                        bool touchedBB = candle.High >= bb.Low * 0.995m && candle.High <= bb.High * 1.005m;
                        bool bouncedDown = candle.Close < candle.Open && candle.Close < bb.Low;

                        if (touchedBB && bouncedDown)
                        {
                            bestSignal = new TradingSignal
                            {
                                Date = candle.DateTime,
                                CandleIndex = i,
                                Direction = TradeDirection.Short,
                                Price = candle.Close,
                                Source = $"Bearish Breaker Block Touch ({bb.BreakerBlockType})",
                                SuggestedStopLoss = bb.High * 1.01m,
                                SuggestedTakeProfit = null
                            };
                            break;
                        }
                    }
                }

                if (bestSignal != null)
                {
                    signals.Add(bestSignal);
                    lastSignalIndex = i;
                }
            }

            return signals;
        }

        #endregion

        #region Elliott Wave Signals

        public Task<List<TradingSignal>> GenerateElliottWaveSignals(
            List<Candle> candles,
            ElliottWaveResponse ewData,
            string signalType,
            Dictionary<string, object> parameters)
        {
            var signals = new List<TradingSignal>();

            if (ewData?.WavePatterns == null || !ewData.WavePatterns.Any() || candles == null || !candles.Any())
                return Task.FromResult(signals);

            switch (signalType.ToLower())
            {
                case "wave-complete":
                    signals = GenerateWaveCompleteSignals(candles, ewData.WavePatterns);
                    break;
                case "corrective-end":
                    signals = GenerateCorrectiveEndSignals(candles, ewData.WavePatterns);
                    break;
                default:
                    signals = GenerateWaveCompleteSignals(candles, ewData.WavePatterns);
                    break;
            }

            return Task.FromResult(signals);
        }

        private List<TradingSignal> GenerateWaveCompleteSignals(List<Candle> candles, List<WavePattern> patterns)
        {
            var signals = new List<TradingSignal>();

            var motivePatterns = patterns.Where(p => p.Type == "Motive" && p.IsValid).ToList();

            foreach (var pattern in motivePatterns)
            {
                var wave5Point = pattern.Points?.FirstOrDefault(p => p.Label == "5");
                if (wave5Point == null)
                    continue;

                var candleIndex = candles.FindIndex(c => c.DateTime >= wave5Point.Date);
                if (candleIndex < 0 || candleIndex >= candles.Count - 1)
                    continue;

                candleIndex = Math.Min(candleIndex + 1, candles.Count - 1);
                var candle = candles[candleIndex];

                var direction = pattern.Direction == "Bullish" ? TradeDirection.Short : TradeDirection.Long;
                var source = pattern.Direction == "Bullish" 
                    ? "Bullish Wave 5 Complete (Reversal SHORT)" 
                    : "Bearish Wave 5 Complete (Reversal LONG)";

                if (!signals.Any(s => Math.Abs(s.CandleIndex - candleIndex) <= 2))
                {
                    signals.Add(new TradingSignal
                    {
                        Date = candle.DateTime,
                        CandleIndex = candleIndex,
                        Direction = direction,
                        Price = candle.Close,
                        Source = source,
                        SuggestedStopLoss = wave5Point.Price,
                        SuggestedTakeProfit = null
                    });
                }
            }

            return signals;
        }

        private List<TradingSignal> GenerateCorrectiveEndSignals(List<Candle> candles, List<WavePattern> patterns)
        {
            var signals = new List<TradingSignal>();

            var correctivePatterns = patterns.Where(p => p.Type == "Corrective" && p.IsValid).ToList();

            foreach (var pattern in correctivePatterns)
            {
                var waveCPoint = pattern.Points?.FirstOrDefault(p => p.Label == "C");
                if (waveCPoint == null)
                    continue;

                var candleIndex = candles.FindIndex(c => c.DateTime >= waveCPoint.Date);
                if (candleIndex < 0 || candleIndex >= candles.Count - 1)
                    continue;

                candleIndex = Math.Min(candleIndex + 1, candles.Count - 1);
                var candle = candles[candleIndex];

                var direction = pattern.Direction == "Bullish" ? TradeDirection.Long : TradeDirection.Short;
                var source = pattern.Direction == "Bullish" 
                    ? "Bullish ABC Correction End (Continue LONG)" 
                    : "Bearish ABC Correction End (Continue SHORT)";

                if (!signals.Any(s => Math.Abs(s.CandleIndex - candleIndex) <= 2))
                {
                    signals.Add(new TradingSignal
                    {
                        Date = candle.DateTime,
                        CandleIndex = candleIndex,
                        Direction = direction,
                        Price = candle.Close,
                        Source = source,
                        SuggestedStopLoss = waveCPoint.Price,
                        SuggestedTakeProfit = null
                    });
                }
            }

            return signals;
        }

        #endregion

        #region Helpers

        private int GetTimeframeMinutes(List<Candle> candles)
        {
            if (candles.Count < 2)
                return 60;

            var diff = candles[1].DateTime - candles[0].DateTime;
            return (int)diff.TotalMinutes;
        }

        #endregion
    }
}
