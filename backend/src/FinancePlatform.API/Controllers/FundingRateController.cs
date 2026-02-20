using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FinancePlatform.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace FinancePlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FundingRateController : ControllerBase
    {
        private readonly FundingRateService _fundingRateService;
        private readonly CoinalyzeFundingScraper _scraper;

        public FundingRateController(FundingRateService fundingRateService, CoinalyzeFundingScraper scraper)
        {
            _fundingRateService = fundingRateService;
            _scraper = scraper;
        }

        [HttpGet("btc")]
        public async Task<IActionResult> GetBtcFundingRate(CancellationToken cancellationToken)
        {
            try
            {
                var (current, predicted, fetchedAt) = await _fundingRateService.GetBtcFundingRateAsync(cancellationToken);
                Response.Headers["Cache-Control"] = "no-store";
                return Ok(new
                {
                    current,
                    predicted,
                    fetchedAt = fetchedAt.ToUnixTimeSeconds()
                });
            }
            catch (System.Exception ex)
            {
                return Problem(
                    detail: ex.Message,
                    title: "Funding rate unavailable",
                    statusCode: 502);
            }
        }

        [HttpGet("btc/debug")]
        public async Task<IActionResult> GetIndividualRates(CancellationToken cancellationToken)
        {
            try
            {
                var (currentRates, predictedRates) = await _scraper.GetAllRatesAsync(cancellationToken);
                
                var currentResult = currentRates
                    .OrderBy(r => r.Source)
                    .Select(r => new
                    {
                        exchange = r.Source,
                        rate = r.Rate,
                        rateFormatted = $"{(r.Rate >= 0 ? "+" : "")}{r.Rate:F4}%"
                    })
                    .ToList();

                var predictedResult = predictedRates
                    .OrderBy(r => r.Source)
                    .Select(r => new
                    {
                        exchange = r.Source,
                        rate = r.Rate,
                        rateFormatted = $"{(r.Rate >= 0 ? "+" : "")}{r.Rate:F4}%"
                    })
                    .ToList();

                return Ok(new
                {
                    current = new { count = currentResult.Count, exchanges = currentResult },
                    predicted = new { count = predictedResult.Count, exchanges = predictedResult }
                });
            }
            catch (System.Exception ex)
            {
                return Problem(
                    detail: ex.Message,
                    title: "Failed to fetch individual rates",
                    statusCode: 502);
            }
        }
    }
}
