using System;
using System.Collections.Generic;
using System.Linq;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Infrastructure.Services
{
    public class TradeSimulatorService : ITradeSimulatorService
    {
        public SimulationResult SimulateTrades(
            List<Candle> candles,
            List<TradingSignal> signals,
            decimal initialBalance,
            decimal stopLossPercent,
            decimal takeProfitPercent,
            decimal makerFee,
            decimal takerFee,
            decimal positionSizePercent,
            int startIndex = 0)
        {
            _ = makerFee;

            var result = new SimulationResult
            {
                Trades = new List<TradeRecord>(),
                EquityCurve = new List<EquityPoint>(),
                FinalBalance = initialBalance,
                TotalFeesPaid = 0
            };

            if (candles == null || !candles.Any() || startIndex >= candles.Count)
            {
                return result;
            }

            if (startIndex < 0) startIndex = 0;

            if (signals == null || !signals.Any())
            {
                result.EquityCurve.Add(new EquityPoint
                {
                    Timestamp = candles[startIndex].Timestamp,
                    Date = candles[startIndex].DateTime,
                    Balance = initialBalance,
                    Drawdown = 0,
                    DrawdownPercent = 0
                });
                return result;
            }

            var sortedSignals = signals.OrderBy(s => s.CandleIndex).ToList();

            decimal currentBalance = initialBalance;
            decimal peakBalance = initialBalance;
            int tradeId = 1;

            TradeRecord? currentPosition = null;
            decimal currentEntryFee = 0m;

            decimal takerFeeRate = takerFee / 100m;

            for (int i = startIndex; i < candles.Count; i++)
            {
                var candle = candles[i];

                var signalsAtCandle = sortedSignals.Where(s => s.CandleIndex == i).ToList();
                var chosenSignal = signalsAtCandle.FirstOrDefault();

                if (currentPosition != null && chosenSignal != null)
                {
                    bool oppositeSignal =
                        (currentPosition.Direction == "LONG" && chosenSignal.Direction == TradeDirection.Short) ||
                        (currentPosition.Direction == "SHORT" && chosenSignal.Direction == TradeDirection.Long);

                    if (oppositeSignal)
                    {
                        ClosePositionAtPrice(
                            result,
                            ref currentBalance,
                            currentPosition,
                            currentEntryFee,
                            candle.DateTime,
                            candle.Open,
                            "Signal",
                            takerFeeRate);

                        currentPosition = null;
                        currentEntryFee = 0m;
                    }
                }

                if (currentPosition == null && chosenSignal != null && currentBalance > 0)
                {
                    decimal budget = currentBalance * (positionSizePercent / 100m);
                    if (budget <= 0 || budget > currentBalance)
                    {
                        continue;
                    }

                    decimal positionSize = budget / (1 + takerFeeRate);
                    decimal entryFee = positionSize * takerFeeRate;

                    if (positionSize > 0 && budget >= positionSize + entryFee)
                    {
                        decimal entryPrice = candle.Open;
                        decimal quantity = positionSize / entryPrice;

                        decimal slPrice, tpPrice;
                        if (chosenSignal.Direction == TradeDirection.Long)
                        {
                            slPrice = entryPrice * (1 - stopLossPercent / 100m);
                            tpPrice = entryPrice * (1 + takeProfitPercent / 100m);
                        }
                        else
                        {
                            slPrice = entryPrice * (1 + stopLossPercent / 100m);
                            tpPrice = entryPrice * (1 - takeProfitPercent / 100m);
                        }

                        currentPosition = new TradeRecord
                        {
                            Id = tradeId++,
                            Direction = chosenSignal.Direction == TradeDirection.Long ? "LONG" : "SHORT",
                            EntryDate = candle.DateTime,
                            EntryPrice = entryPrice,
                            StopLoss = slPrice,
                            TakeProfit = tpPrice,
                            PositionSize = positionSize,
                            Quantity = quantity,
                            Fees = entryFee,
                            SignalSource = chosenSignal.Source
                        };

                        currentEntryFee = entryFee;

                        currentBalance -= budget;
                    }
                }

                if (currentPosition != null)
                {
                    var exitResult = CheckPositionExit(currentPosition, candle);

                    if (exitResult.ShouldExit)
                    {
                        ClosePositionAtPrice(
                            result,
                            ref currentBalance,
                            currentPosition,
                            currentEntryFee,
                            candle.DateTime,
                            exitResult.ExitPrice,
                            exitResult.ExitReason,
                            takerFeeRate);

                        currentPosition = null;
                        currentEntryFee = 0m;
                    }
                }

                decimal equityValue = currentBalance;
                if (currentPosition != null)
                {
                    decimal unrealizedPnL = CalculateUnrealizedPnL(currentPosition, candle.Close);
                    equityValue = currentBalance + currentPosition.PositionSize + unrealizedPnL;
                }

                if (equityValue > peakBalance)
                    peakBalance = equityValue;

                decimal drawdown = peakBalance - equityValue;
                decimal drawdownPercent = peakBalance > 0 ? (drawdown / peakBalance) * 100 : 0;

                result.EquityCurve.Add(new EquityPoint
                {
                    Timestamp = candle.Timestamp,
                    Date = candle.DateTime,
                    Balance = equityValue,
                    Drawdown = drawdown,
                    DrawdownPercent = drawdownPercent
                });
            }

            if (currentPosition != null)
            {
                var lastCandle = candles.Last();
                ClosePositionAtPrice(
                    result,
                    ref currentBalance,
                    currentPosition,
                    currentEntryFee,
                    lastCandle.DateTime,
                    lastCandle.Close,
                    "EndOfData",
                    takerFeeRate);
            }

            result.FinalBalance = currentBalance;

            return result;
        }

        private (bool ShouldExit, decimal ExitPrice, string ExitReason) CheckPositionExit(TradeRecord position, Candle candle)
        {
            bool isLong = position.Direction == "LONG";

            if (isLong)
            {
                if (candle.Low <= position.StopLoss)
                {
                    decimal fillPrice = Math.Min(position.StopLoss, candle.Open);
                    return (true, fillPrice, "SL");
                }
            }
            else
            {
                if (candle.High >= position.StopLoss)
                {
                    decimal fillPrice = Math.Max(position.StopLoss, candle.Open);
                    return (true, fillPrice, "SL");
                }
            }

            if (isLong)
            {
                if (candle.High >= position.TakeProfit)
                {
                    decimal fillPrice = Math.Max(position.TakeProfit, candle.Open);
                    return (true, fillPrice, "TP");
                }
            }
            else
            {
                if (candle.Low <= position.TakeProfit)
                {
                    decimal fillPrice = Math.Min(position.TakeProfit, candle.Open);
                    return (true, fillPrice, "TP");
                }
            }

            return (false, 0, string.Empty);
        }

        private void ClosePositionAtPrice(
            SimulationResult result,
            ref decimal currentBalance,
            TradeRecord position,
            decimal entryFee,
            DateTime exitDate,
            decimal exitPrice,
            string exitReason,
            decimal takerFeeRate)
        {
            bool isLong = position.Direction == "LONG";

            position.ExitDate = exitDate;
            position.ExitPrice = exitPrice;
            position.ExitReason = exitReason;
            position.HoldingPeriodMinutes = (int)(exitDate - position.EntryDate).TotalMinutes;

            decimal exitFee = (position.Quantity * exitPrice) * takerFeeRate;
            position.Fees += exitFee;

            decimal grossPnL = isLong
                ? (exitPrice - position.EntryPrice) * position.Quantity
                : (position.EntryPrice - exitPrice) * position.Quantity;

            decimal netPnL = grossPnL - (entryFee + exitFee);
            position.PnL = netPnL;
            position.PnLPercent = position.PositionSize > 0 ? (netPnL / position.PositionSize) * 100 : 0;

            currentBalance += position.PositionSize + (grossPnL - exitFee);
            position.BalanceAfter = currentBalance;

            result.Trades.Add(position);
            result.TotalFeesPaid += position.Fees;
        }

        private decimal CalculateUnrealizedPnL(TradeRecord trade, decimal currentPrice)
        {
            bool isLong = trade.Direction == "LONG";

            if (isLong)
            {
                return (currentPrice - trade.EntryPrice) * trade.Quantity;
            }
            else
            {
                return (trade.EntryPrice - currentPrice) * trade.Quantity;
            }
        }
    }
}
