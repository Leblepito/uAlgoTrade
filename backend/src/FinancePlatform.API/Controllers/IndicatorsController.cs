using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using FinancePlatform.Application.Interfaces;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IndicatorsController : ControllerBase
    {
        private readonly ISupportResistanceService _supportResistanceService;
        private readonly IElliottWaveService _elliottWaveService;
        private readonly IMarketStructureService _marketStructureService;

        public IndicatorsController(
            ISupportResistanceService supportResistanceService,
            IElliottWaveService elliottWaveService,
            IMarketStructureService marketStructureService)
        {
            _supportResistanceService = supportResistanceService;
            _elliottWaveService = elliottWaveService;
            _marketStructureService = marketStructureService;
        }

        [HttpGet]
        public IActionResult GetAvailableIndicators()
        {
            return Ok(new[]
            {
                new { id = "support-resistance", name = "Support / Resistance", kind = "overlay" },
                new { id = "market-structure", name = "Market Structure", kind = "structure" },
                new { id = "elliott-wave", name = "Elliott Wave", kind = "pattern" }
            });
        }

        [HttpGet("support-resistance/{symbol}")]
        public async Task<IActionResult> GetSupportResistance(
            string symbol,
            [FromQuery] string interval = "1h",
            [FromQuery] float multiplicativeFactor = 8.0f,
            [FromQuery] int atrLength = 50,
            [FromQuery] int extendLast = 4,
            [FromQuery] int limit = 500)
        {
            var response = await _supportResistanceService.CalculateSupportResistance(
                symbol,
                interval,
                multiplicativeFactor,
                atrLength,
                extendLast,
                limit);

            return Ok(response);
        }

        [HttpGet("elliott-wave/{symbol}")]
        public async Task<IActionResult> GetElliottWave(
            string symbol,
            [FromQuery] string timeframe = "1h",
            [FromQuery] int length1 = 4,
            [FromQuery] int length2 = 8,
            [FromQuery] int length3 = 16,
            [FromQuery] bool useLength1 = true,
            [FromQuery] bool useLength2 = true,
            [FromQuery] bool useLength3 = true,
            [FromQuery] int limit = 1000)
        {
            var request = new ElliottWaveRequest
            {
                Symbol = symbol,
                Timeframe = timeframe,
                Length1 = length1,
                Length2 = length2,
                Length3 = length3,
                UseLength1 = useLength1,
                UseLength2 = useLength2,
                UseLength3 = useLength3,
                Limit = limit
            };

            var response = await _elliottWaveService.CalculateElliottWaves(request);
            return Ok(response);
        }

        [HttpGet("market-structure/{symbol}")]
        public async Task<IActionResult> GetMarketStructure(
            string symbol,
            [FromQuery] string timeframe = "1h",
            [FromQuery] int limit = 500,
            [FromQuery] int zigZagLength = 7,
            [FromQuery] float fibFactor = 0.33f)
        {
            var request = new MarketStructureRequest
            {
                Symbol = symbol,
                Timeframe = timeframe,
                Limit = limit,
                ZigZagLength = zigZagLength,
                FibFactor = fibFactor
            };

            var response = await _marketStructureService.CalculateMarketStructureAsync(request);
            return Ok(response);
        }
    }
}
