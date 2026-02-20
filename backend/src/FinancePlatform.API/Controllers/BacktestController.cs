using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Domain.Models;
using FinancePlatform.API.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Threading;
using Microsoft.Extensions.DependencyInjection;

namespace FinancePlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BacktestController : ControllerBase
    {
        private readonly IBacktestEngineService _backtestEngineService;

        public BacktestController(IBacktestEngineService backtestEngineService)
        {
            _backtestEngineService = backtestEngineService;
        }

        [Authorize]
        [HttpPost("run")]
        public async Task<IActionResult> RunBacktest([FromBody] BacktestRequest request, CancellationToken ct)
        {
            try
            {
                if (request == null)
                    return BadRequest(new { error = "Request body is required" });

                PostgresAuthRepository authRepo;
                try
                {
                    authRepo = HttpContext.RequestServices.GetRequiredService<PostgresAuthRepository>();
                }
                catch
                {
                    return StatusCode(503, new
                    {
                        error = "Backtest entitlement tracking is unavailable. Configure Postgres to enable plan-based limits.",
                        hint = "Set ConnectionStrings:Postgres, POSTGRES_CONNECTION_STRING, or DATABASE_URL."
                    });
                }

                var userId = AuthService.GetUserId(User);
                var (planCode, _, maxBacktestsPerDay) = await authRepo.GetEntitlementAsync(userId, ct);
                if (maxBacktestsPerDay <= 0)
                {
                    return StatusCode(403, new
                    {
                        error = "Backtests are available on Pro/Premium plans.",
                        plan = planCode
                    });
                }

                var sinceUtc = DateTime.UtcNow.Date;
                var usedToday = await authRepo.CountBacktestRunsSinceAsync(userId, sinceUtc, ct);
                if (usedToday >= maxBacktestsPerDay)
                {
                    return StatusCode(429, new
                    {
                        error = $"Daily backtest limit reached ({maxBacktestsPerDay}).",
                        used = usedToday,
                        limit = maxBacktestsPerDay
                    });
                }

                await authRepo.RecordBacktestRunAsync(userId, ct);
                var result = await _backtestEngineService.RunBacktestAsync(request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Backtest failed: {ex.Message}" });
            }
        }

        [HttpGet("strategies")]
        public IActionResult GetAvailableStrategies()
        {
            var indicators = new List<IndicatorInfo>
            {
                new IndicatorInfo
                {
                    Id = "support-resistance",
                    Name = "Support / Resistance",
                    Strategies = StrategyDefinitions.AvailableStrategies["support-resistance"],
                    DefaultParameters = new Dictionary<string, object>
                    {
                        { "atrLength", 50 },
                        { "multiplicativeFactor", 8.0 },
                        { "extendLast", 6 }
                    }
                },
                new IndicatorInfo
                {
                    Id = "market-structure",
                    Name = "Market Structure",
                    Strategies = StrategyDefinitions.AvailableStrategies["market-structure"],
                    DefaultParameters = new Dictionary<string, object>
                    {
                        { "zigZagLength", 7 },
                        { "fibFactor", 0.33 }
                    }
                },
                new IndicatorInfo
                {
                    Id = "elliott-wave",
                    Name = "Elliott Wave",
                    Strategies = StrategyDefinitions.AvailableStrategies["elliott-wave"],
                    DefaultParameters = new Dictionary<string, object>
                    {
                        { "length1", 4 },
                        { "length2", 8 },
                        { "length3", 16 },
                        { "useLength1", true },
                        { "useLength2", true },
                        { "useLength3", false }
                    }
                }
            };

            return Ok(indicators);
        }

        [HttpGet("symbols")]
        public IActionResult GetAvailableSymbols()
        {
            var symbols = new[]
            {
                new { id = "BTCUSDT", name = "Bitcoin / USDT", type = "spot" },
                new { id = "ETHUSDT", name = "Ethereum / USDT", type = "spot" },
                new { id = "SOLUSDT", name = "Solana / USDT", type = "spot" },
                new { id = "BNBUSDT", name = "BNB / USDT", type = "spot" },
                new { id = "XRPUSDT", name = "XRP / USDT", type = "spot" }
            };

            return Ok(symbols);
        }

        [HttpGet("timeframes")]
        public IActionResult GetAvailableTimeframes()
        {
            var timeframes = new[]
            {
                new { id = "1m", name = "1 Minute", minutes = 1 },
                new { id = "5m", name = "5 Minutes", minutes = 5 },
                new { id = "15m", name = "15 Minutes", minutes = 15 },
                new { id = "30m", name = "30 Minutes", minutes = 30 },
                new { id = "1h", name = "1 Hour", minutes = 60 },
                new { id = "4h", name = "4 Hours", minutes = 240 },
                new { id = "1d", name = "1 Day", minutes = 1440 },
                new { id = "1w", name = "1 Week", minutes = 10080 }
            };

            return Ok(timeframes);
        }

        [HttpGet("defaults")]
        public IActionResult GetDefaultSettings()
        {
            var defaults = new
            {
                symbol = "BTCUSDT",
                timeframe = "1h",
                startDate = DateTime.UtcNow.AddMonths(-3).ToString("yyyy-MM-dd"),
                endDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd"),
                initialWallet = 1000,
                stopLossPercent = 2,
                takeProfitPercent = 4,
                makerFee = 0.1,
                takerFee = 0.1,
                positionSizePercent = 100,
                strategy = new
                {
                    indicatorType = "support-resistance",
                    signalType = "bounce",
                    parameters = new Dictionary<string, object>()
                }
            };

            return Ok(defaults);
        }
    }
}
