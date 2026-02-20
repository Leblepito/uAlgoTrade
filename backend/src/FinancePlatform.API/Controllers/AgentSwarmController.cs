using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinancePlatform.API.Services;

namespace FinancePlatform.API.Controllers
{
    [ApiController]
    [Route("api/swarm")]
    [Authorize]
    public class AgentSwarmController : ControllerBase
    {
        private readonly AiSidecarClient _aiClient;

        public AgentSwarmController(AiSidecarClient aiClient)
        {
            _aiClient = aiClient;
        }

        /// <summary>Get health status of the AI Engine.</summary>
        [HttpGet("health")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHealth()
        {
            var result = await _aiClient.GetHealthAsync();
            if (result == null) return StatusCode(503, new { error = "AI Engine unavailable" });
            return Ok(result);
        }

        /// <summary>Get status of all agents in the swarm.</summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetSwarmStatus()
        {
            var result = await _aiClient.GetSwarmStatusAsync();
            if (result == null) return StatusCode(503, new { error = "AI Engine unavailable" });
            return Ok(result);
        }

        /// <summary>Get heartbeat for a specific agent.</summary>
        [HttpGet("agent/{agentName}")]
        public async Task<IActionResult> GetAgentHeartbeat(string agentName)
        {
            var result = await _aiClient.GetAgentHeartbeatAsync(agentName);
            if (result == null) return NotFound(new { error = "Agent not found or AI Engine unavailable" });
            return Ok(result);
        }

        /// <summary>Trigger a signal scan.</summary>
        [HttpPost("scan")]
        public async Task<IActionResult> TriggerScan([FromBody] ScanRequest request)
        {
            var result = await _aiClient.TriggerScanAsync(
                request.Symbols ?? new List<string> { "BTCUSDT", "ETHUSDT" },
                request.StrategyId ?? "default"
            );
            if (result == null) return StatusCode(503, new { error = "AI Engine unavailable" });
            return Ok(result);
        }

        /// <summary>Get recent signals.</summary>
        [HttpGet("signals")]
        public async Task<IActionResult> GetRecentSignals(
            [FromQuery] int limit = 20,
            [FromQuery] string symbol = null,
            [FromQuery] string status = null)
        {
            var result = await _aiClient.GetRecentSignalsAsync(limit, symbol, status);
            if (result == null) return StatusCode(503, new { error = "AI Engine unavailable" });
            return Ok(result);
        }

        /// <summary>Trigger orchestration cycle for a symbol.</summary>
        [HttpPost("orchestrate")]
        public async Task<IActionResult> RunOrchestration([FromBody] OrchestrationRequest request)
        {
            var result = await _aiClient.RunOrchestrationAsync(
                request.Symbol ?? "BTCUSDT",
                request.StrategyId ?? "default"
            );
            if (result == null) return StatusCode(503, new { error = "AI Engine unavailable" });
            return Ok(result);
        }

        /// <summary>Get consensus voting details for a signal.</summary>
        [HttpGet("consensus/{signalId}")]
        public async Task<IActionResult> GetConsensus(int signalId)
        {
            var result = await _aiClient.GetConsensusAsync(signalId);
            if (result == null) return NotFound(new { error = "Consensus data not found" });
            return Ok(result);
        }
    }

    public class ScanRequest
    {
        public List<string> Symbols { get; set; }
        public string StrategyId { get; set; }
    }

    public class OrchestrationRequest
    {
        public string Symbol { get; set; }
        public string StrategyId { get; set; }
    }
}
