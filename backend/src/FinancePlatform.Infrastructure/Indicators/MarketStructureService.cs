using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Infrastructure.Indicators
{
    public class MarketStructureService : IMarketStructureService
    {
        private readonly IMarketDataProvider _marketDataProvider;

        public MarketStructureService(IMarketDataProvider marketDataProvider)
        {
            _marketDataProvider = marketDataProvider;
        }

        public async Task<MarketStructureResponse> CalculateMarketStructureAsync(MarketStructureRequest request)
        {
            var candles = await _marketDataProvider.GetKlinesAsync(NormalizeSymbol(request.Symbol), request.Timeframe, request.Limit);
            return CalculateMarketStructureFromCandles(candles, request, "binance");
        }

        public MarketStructureResponse CalculateMarketStructureFromCandles(
            List<Candle> candles,
            MarketStructureRequest request)
        {
            return CalculateMarketStructureFromCandles(candles, request, "binance");
        }

        private MarketStructureResponse CalculateMarketStructureFromCandles(
            List<Candle> candles,
            MarketStructureRequest request,
            string exchange)
        {
            var response = new MarketStructureResponse
            {
                Symbol = request.Symbol,
                Timeframe = request.Timeframe,
                Exchange = exchange
            };

            if (candles == null || candles.Count < request.ZigZagLength * 3)
            {
                return response;
            }

            int n = candles.Count;
            int zigzag_len = request.ZigZagLength;
            decimal fib_factor = (decimal)request.FibFactor;

            var high_points_arr = new List<decimal>();
            var high_index_arr = new List<int>();
            var low_points_arr = new List<decimal>();
            var low_index_arr = new List<int>();

            int trend = 1;
            int market = 1;
            decimal last_l0 = 0;
            decimal last_h0 = 0;
            bool last_l0_set = false;
            bool last_h0_set = false;

            var l0i_history = new int[n];
            var h0i_history = new int[n];
            for (int k = 0; k < n; k++) { l0i_history[k] = -1; h0i_history[k] = -1; }

            int bu_ob_index = -1;
            int be_ob_index = -1;
            int bu_bb_index = -1;
            int be_bb_index = -1;

            var toUp = new bool[n];
            var toDown = new bool[n];

            for (int i = 0; i < n; i++)
            {
                if (i < zigzag_len - 1)
                {
                    toUp[i] = false;
                    toDown[i] = false;
                    continue;
                }

                decimal highest = decimal.MinValue;
                decimal lowest = decimal.MaxValue;
                for (int j = i - zigzag_len + 1; j <= i; j++)
                {
                    if (candles[j].High > highest) highest = candles[j].High;
                    if (candles[j].Low < lowest) lowest = candles[j].Low;
                }

                toUp[i] = candles[i].High >= highest;
                toDown[i] = candles[i].Low <= lowest;
            }

            for (int i = zigzag_len - 1; i < n; i++)
            {
                int prev_trend = trend;

                if (trend == 1 && toDown[i])
                    trend = -1;
                else if (trend == -1 && toUp[i])
                    trend = 1;

                bool trend_changed = trend != prev_trend;

                int last_trend_up_since = BarsSince(toUp, i - 1, true);
                
                int low_lookback = last_trend_up_since > 0 ? last_trend_up_since : 1;
                if (low_lookback < 1) low_lookback = 1;
                decimal low_val = TaLowest(candles, i, low_lookback);
                
                int low_index = i - BarsSinceValue(candles, i, low_val, true);

                int last_trend_down_since = BarsSince(toDown, i - 1, true);
                
                int high_lookback = last_trend_down_since > 0 ? last_trend_down_since : 1;
                if (high_lookback < 1) high_lookback = 1;
                decimal high_val = TaHighest(candles, i, high_lookback);
                
                int high_index = i - BarsSinceValue(candles, i, high_val, false);

                if (trend_changed)
                {
                    if (trend == 1)
                    {
                        low_points_arr.Add(low_val);
                        low_index_arr.Add(low_index);
                    }
                    else
                    {
                        high_points_arr.Add(high_val);
                        high_index_arr.Add(high_index);
                    }
                }

                if (high_points_arr.Count < 2 || low_points_arr.Count < 2)
                    continue;

                decimal h0 = high_points_arr[high_points_arr.Count - 1];
                int h0i = high_index_arr[high_index_arr.Count - 1];
                decimal h1 = high_points_arr[high_points_arr.Count - 2];
                int h1i = high_index_arr[high_index_arr.Count - 2];

                decimal l0 = low_points_arr[low_points_arr.Count - 1];
                int l0i = low_index_arr[low_index_arr.Count - 1];
                decimal l1 = low_points_arr[low_points_arr.Count - 2];
                int l1i = low_index_arr[low_index_arr.Count - 2];

                l0i_history[i] = l0i;
                h0i_history[i] = h0i;

                if (trend_changed)
                {
                    if (trend == 1)
                    {
                        response.AllSwingPoints.Add(new SwingPoint
                        {
                            Price = low_val,
                            Index = low_index,
                            Date = candles[low_index].DateTime,
                            Type = "Low"
                        });
                    }
                    else
                    {
                        response.AllSwingPoints.Add(new SwingPoint
                        {
                            Price = high_val,
                            Index = high_index,
                            Date = candles[high_index].DateTime,
                            Type = "High"
                        });
                    }
                }

                int prev_market = market;

                bool canChangeMarket = true;
                if (last_l0_set && last_h0_set)
                {
                    if (last_l0 == l0 || last_h0 == h0)
                    {
                        canChangeMarket = false;
                    }
                }

                if (canChangeMarket)
                {
                    if (market == 1 && l0 < l1 && l0 < l1 - Math.Abs(h0 - l1) * fib_factor)
                    {
                        market = -1;
                    }
                    else if (market == -1 && h0 > h1 && h0 > h1 + Math.Abs(h1 - l0) * fib_factor)
                    {
                        market = 1;
                    }
                }

                if (bu_ob_index == -1) bu_ob_index = i;
                if (be_ob_index == -1) be_ob_index = i;
                if (bu_bb_index == -1) bu_bb_index = i;
                if (be_bb_index == -1) be_bb_index = i;

                int l0i_shifted = i - zigzag_len >= 0 ? l0i_history[i - zigzag_len] : -1;
                int h0i_shifted = i - zigzag_len >= 0 ? h0i_history[i - zigzag_len] : -1;

                if (l0i_shifted >= 0)
                {
                    int found = FindLastBearishCandle(candles, h1i, l0i_shifted);
                    if (found != -1) bu_ob_index = found;
                }

                if (h0i_shifted >= 0)
                {
                    int found = FindLastBullishCandle(candles, l1i, h0i_shifted);
                    if (found != -1) be_ob_index = found;
                }

                {
                    int start = Math.Max(0, h1i - zigzag_len);
                    int found = FindLastBearishCandle(candles, start, l1i);
                    if (found != -1) be_bb_index = found;
                }

                {
                    int start = Math.Max(0, l1i - zigzag_len);
                    int found = FindLastBullishCandle(candles, start, h1i);
                    if (found != -1) bu_bb_index = found;
                }

                bool market_changed = market != prev_market;

                if (market_changed)
                {
                    last_l0 = l0;
                    last_h0 = h0;
                    last_l0_set = true;
                    last_h0_set = true;

                    if (market == 1)
                    {
                        var msb = new MarketStructureBreak
                        {
                            Index = i,
                            Date = candles[i].DateTime,
                            BreakCandleIndex = i,
                            BreakCandleDate = candles[i].DateTime,
                            Type = "Bullish",
                            H0_at_break = new SwingPoint { Price = h0, Index = h0i, Date = candles[h0i].DateTime, Type = "High" },
                            H1_at_break = new SwingPoint { Price = h1, Index = h1i, Date = candles[h1i].DateTime, Type = "High" },
                            L0_at_break = new SwingPoint { Price = l0, Index = l0i, Date = candles[l0i].DateTime, Type = "Low" },
                            L1_at_break = new SwingPoint { Price = l1, Index = l1i, Date = candles[l1i].DateTime, Type = "Low" },
                            BrokenSwingPoint = new SwingPoint { Price = h1, Index = h1i, Date = candles[h1i].DateTime, Type = "High" },
                            PrecedingSwingPoint = new SwingPoint { Price = l0, Index = l0i, Date = candles[l0i].DateTime, Type = "Low" }
                        };
                        response.MarketStructureBreaks.Add(msb);

                        if (bu_ob_index >= 0 && bu_ob_index < n)
                        {
                            response.OrderBlocks.Add(new IdentifiedOrderBlock
                            {
                                OrderBlockType = "Bu-OB",
                                High = candles[bu_ob_index].High,
                                Low = candles[bu_ob_index].Low,
                                CandleIndex = bu_ob_index,
                                CandleDate = candles[bu_ob_index].DateTime,
                                MsbIndex = i,
                                MsbDate = candles[i].DateTime,
                                MsbDirection = "Bullish"
                            });
                        }

                        if (bu_bb_index >= 0 && bu_bb_index < n)
                        {
                            string bbType = l0 < l1 ? "Bu-BB" : "Bu-MB";
                            response.BreakerBlocks.Add(new IdentifiedBreakerBlock
                            {
                                BreakerBlockType = bbType,
                                High = candles[bu_bb_index].High,
                                Low = candles[bu_bb_index].Low,
                                CandleIndex = bu_bb_index,
                                CandleDate = candles[bu_bb_index].DateTime,
                                MsbIndex = i,
                                MsbDate = candles[i].DateTime,
                                MsbDirection = "Bullish"
                            });
                        }
                    }
                    else
                    {
                        var msb = new MarketStructureBreak
                        {
                            Index = i,
                            Date = candles[i].DateTime,
                            BreakCandleIndex = i,
                            BreakCandleDate = candles[i].DateTime,
                            Type = "Bearish",
                            H0_at_break = new SwingPoint { Price = h0, Index = h0i, Date = candles[h0i].DateTime, Type = "High" },
                            H1_at_break = new SwingPoint { Price = h1, Index = h1i, Date = candles[h1i].DateTime, Type = "High" },
                            L0_at_break = new SwingPoint { Price = l0, Index = l0i, Date = candles[l0i].DateTime, Type = "Low" },
                            L1_at_break = new SwingPoint { Price = l1, Index = l1i, Date = candles[l1i].DateTime, Type = "Low" },
                            BrokenSwingPoint = new SwingPoint { Price = l1, Index = l1i, Date = candles[l1i].DateTime, Type = "Low" },
                            PrecedingSwingPoint = new SwingPoint { Price = h0, Index = h0i, Date = candles[h0i].DateTime, Type = "High" }
                        };
                        response.MarketStructureBreaks.Add(msb);

                        if (be_ob_index >= 0 && be_ob_index < n)
                        {
                            response.OrderBlocks.Add(new IdentifiedOrderBlock
                            {
                                OrderBlockType = "Be-OB",
                                High = candles[be_ob_index].High,
                                Low = candles[be_ob_index].Low,
                                CandleIndex = be_ob_index,
                                CandleDate = candles[be_ob_index].DateTime,
                                MsbIndex = i,
                                MsbDate = candles[i].DateTime,
                                MsbDirection = "Bearish"
                            });
                        }

                        if (be_bb_index >= 0 && be_bb_index < n)
                        {
                            string bbType = h0 > h1 ? "Be-BB" : "Be-MB";
                            response.BreakerBlocks.Add(new IdentifiedBreakerBlock
                            {
                                BreakerBlockType = bbType,
                                High = candles[be_bb_index].High,
                                Low = candles[be_bb_index].Low,
                                CandleIndex = be_bb_index,
                                CandleDate = candles[be_bb_index].DateTime,
                                MsbIndex = i,
                                MsbDate = candles[i].DateTime,
                                MsbDirection = "Bearish"
                            });
                        }
                    }
                }

                foreach (var ob in response.OrderBlocks.Where(x => !x.IsMitigated))
                {
                    if (ob.OrderBlockType == "Bu-OB" && candles[i].Close < ob.Low) 
                    {
                        ob.IsMitigated = true;
                        ob.MitigatedIndex ??= i;
                        ob.MitigatedDate ??= candles[i].DateTime;
                    }
                    if (ob.OrderBlockType == "Be-OB" && candles[i].Close > ob.High) 
                    {
                        ob.IsMitigated = true;
                        ob.MitigatedIndex ??= i;
                        ob.MitigatedDate ??= candles[i].DateTime;
                    }
                }
                foreach (var bb in response.BreakerBlocks.Where(x => !x.IsMitigated))
                {
                    if ((bb.BreakerBlockType == "Bu-BB" || bb.BreakerBlockType == "Bu-MB") && candles[i].Close < bb.Low) 
                    {
                        bb.IsMitigated = true;
                        bb.MitigatedIndex ??= i;
                        bb.MitigatedDate ??= candles[i].DateTime;
                    }
                    if ((bb.BreakerBlockType == "Be-BB" || bb.BreakerBlockType == "Be-MB") && candles[i].Close > bb.High) 
                    {
                        bb.IsMitigated = true;
                        bb.MitigatedIndex ??= i;
                        bb.MitigatedDate ??= candles[i].DateTime;
                    }
                }
            }

            return response;
        }

        private static string NormalizeSymbol(string symbol)
        {
            var s = (symbol ?? string.Empty).Trim().ToUpperInvariant();
            if (string.IsNullOrEmpty(s)) return s;
            return s.EndsWith("USDT", StringComparison.Ordinal) ? s : s + "USDT";
        }

        private int BarsSince(bool[] array, int fromIndex, bool value)
        {
            if (fromIndex < 0) return int.MaxValue;
            for (int i = fromIndex; i >= 0; i--)
            {
                if (array[i] == value)
                    return fromIndex - i;
            }
            return int.MaxValue;
        }

        private int BarsSinceValue(List<Candle> candles, int fromIndex, decimal value, bool checkLow)
        {
            for (int i = fromIndex; i >= 0; i--)
            {
                if (checkLow && candles[i].Low == value)
                    return fromIndex - i;
                if (!checkLow && candles[i].High == value)
                    return fromIndex - i;
            }
            return 0;
        }

        private decimal TaLowest(List<Candle> candles, int currentIndex, int length)
        {
            decimal lowest = decimal.MaxValue;
            int start = Math.Max(0, currentIndex - length + 1);
            for (int i = start; i <= currentIndex; i++)
            {
                if (candles[i].Low < lowest)
                    lowest = candles[i].Low;
            }
            return lowest;
        }

        private decimal TaHighest(List<Candle> candles, int currentIndex, int length)
        {
            decimal highest = decimal.MinValue;
            int start = Math.Max(0, currentIndex - length + 1);
            for (int i = start; i <= currentIndex; i++)
            {
                if (candles[i].High > highest)
                    highest = candles[i].High;
            }
            return highest;
        }

        private int FindLastBearishCandle(List<Candle> candles, int startIndex, int endIndex)
        {
            if (startIndex < 0) startIndex = 0;
            if (endIndex >= candles.Count) endIndex = candles.Count - 1;
            if (startIndex > endIndex) return -1;

            int result = -1;
            for (int i = startIndex; i <= endIndex; i++)
            {
                if (candles[i].Open > candles[i].Close)
                    result = i;
            }
            return result;
        }

        private int FindLastBullishCandle(List<Candle> candles, int startIndex, int endIndex)
        {
            if (startIndex < 0) startIndex = 0;
            if (endIndex >= candles.Count) endIndex = candles.Count - 1;
            if (startIndex > endIndex) return -1;

            int result = -1;
            for (int i = startIndex; i <= endIndex; i++)
            {
                if (candles[i].Open < candles[i].Close)
                    result = i;
            }
            return result;
        }
    }
}
