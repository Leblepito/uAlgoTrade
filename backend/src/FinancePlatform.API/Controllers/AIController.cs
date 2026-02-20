using Microsoft.AspNetCore.Mvc;
using FinancePlatform.API.Services;
using Microsoft.AspNetCore.Authorization;

namespace FinancePlatform.API.Controllers
{
    [ApiController]
    [Route("api/ai")]
    public class AIController : ControllerBase
    {
        private readonly IAIAgentService _aiService;
        private readonly FundingRateService _fundingService;

        public AIController(IAIAgentService aiService, FundingRateService fundingService)
        {
            _aiService = aiService;
            _fundingService = fundingService;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest("Message cannot be empty.");

            // 1. Get Real-time Context
            var marketSummary = await _fundingService.GetRecentMarketSummary();

            // 2. Get AI Response with Context
            var response = await _aiService.GetResponseAsync(request.Message, marketSummary);

            return Ok(new { reply = response });
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; }
    }
}
