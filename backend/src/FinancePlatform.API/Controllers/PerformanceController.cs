using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinancePlatform.API.Services;

namespace FinancePlatform.API.Controllers
{
    [ApiController]
    [Route("api/performance")]
    [Authorize]
    public class PerformanceController : ControllerBase
    {
        private readonly AiSidecarClient _aiClient;

        public PerformanceController(AiSidecarClient aiClient)
        {
            _aiClient = aiClient;
        }

        /// <summary>Get performance metrics and equity curve.</summary>
        [HttpGet]
        public async Task<IActionResult> GetPerformance(
            [FromQuery] int days = 30,
            [FromQuery] string strategyId = "default")
        {
            var result = await _aiClient.GetPerformanceAsync(days, strategyId);
            if (result == null) return StatusCode(503, new { error = "AI Engine unavailable" });
            return Ok(result);
        }

        /// <summary>Trigger a nightly optimization run.</summary>
        [HttpPost("optimize")]
        public async Task<IActionResult> RunOptimization([FromBody] OptimizationRequest request)
        {
            var result = await _aiClient.RunOptimizationAsync(request?.StrategyId ?? "default");
            if (result == null) return StatusCode(503, new { error = "AI Engine unavailable" });
            return Ok(result);
        }
    }

    public class OptimizationRequest
    {
        public string StrategyId { get; set; }
    }
}
