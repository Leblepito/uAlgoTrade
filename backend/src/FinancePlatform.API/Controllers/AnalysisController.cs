using System.Threading.Tasks;
using FinancePlatform.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FinancePlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalysisController : ControllerBase
    {
        private readonly IMarketDataProvider _marketDataProvider;
        private readonly ISupportResistanceService _supportResistanceService;

        public AnalysisController(IMarketDataProvider marketDataProvider, ISupportResistanceService supportResistanceService)
        {
            _marketDataProvider = marketDataProvider;
            _supportResistanceService = supportResistanceService;
        }

        [HttpGet("sr/{symbol}")]
        public async Task<IActionResult> GetSupportResistance(
            string symbol,
            [FromQuery] string interval = "1h",
            [FromQuery] int atrPeriod = 50,
            [FromQuery] float factor = 8.0f)
        {
            var result = await _supportResistanceService.CalculateSupportResistance(
                symbol, interval, factor, atrPeriod);
            return Ok(result);
        }
    }
}
