using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FinancePlatform.API.Services
{
    /// <summary>
    /// HttpClient proxy for the Python AI Engine sidecar service.
    /// Communicates via Railway internal networking or localhost in dev.
    /// </summary>
    public class AiSidecarClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AiSidecarClient> _logger;
        private readonly string _baseUrl;

        public AiSidecarClient(HttpClient httpClient, IConfiguration configuration, ILogger<AiSidecarClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _baseUrl = configuration["AiEngine:BaseUrl"] ?? "http://localhost:8000";
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
        }

        /// <summary>Check AI Engine health.</summary>
        public async Task<JsonElement?> GetHealthAsync()
        {
            return await GetAsync("/health");
        }

        /// <summary>Get status of all agents in the swarm.</summary>
        public async Task<JsonElement?> GetSwarmStatusAsync()
        {
            return await GetAsync("/agents/status");
        }

        /// <summary>Get heartbeat for a specific agent.</summary>
        public async Task<JsonElement?> GetAgentHeartbeatAsync(string agentName)
        {
            return await GetAsync($"/agents/heartbeat/{agentName}");
        }

        /// <summary>Trigger a signal scan for given symbols.</summary>
        public async Task<JsonElement?> TriggerScanAsync(List<string> symbols, string strategyId = "default")
        {
            var payload = new { symbols, strategy_id = strategyId };
            return await PostAsync("/signals/scan", payload);
        }

        /// <summary>Get recent signals.</summary>
        public async Task<JsonElement?> GetRecentSignalsAsync(int limit = 20, string symbol = null, string status = null)
        {
            var query = $"/signals/recent?limit={limit}";
            if (!string.IsNullOrEmpty(symbol)) query += $"&symbol={symbol}";
            if (!string.IsNullOrEmpty(status)) query += $"&status={status}";
            return await GetAsync(query);
        }

        /// <summary>Trigger orchestration for a symbol.</summary>
        public async Task<JsonElement?> RunOrchestrationAsync(string symbol, string strategyId = "default")
        {
            var payload = new { symbol, strategy_id = strategyId };
            return await PostAsync("/orchestrate/run", payload);
        }

        /// <summary>Get consensus details for a signal.</summary>
        public async Task<JsonElement?> GetConsensusAsync(int signalId)
        {
            return await GetAsync($"/orchestrate/consensus/{signalId}");
        }

        /// <summary>Get performance data.</summary>
        public async Task<JsonElement?> GetPerformanceAsync(int days = 30, string strategyId = "default")
        {
            return await GetAsync($"/optimize/performance?days={days}&strategy_id={strategyId}");
        }

        /// <summary>Trigger optimization run.</summary>
        public async Task<JsonElement?> RunOptimizationAsync(string strategyId = "default")
        {
            var payload = new { strategy_id = strategyId };
            return await PostAsync("/optimize/run", payload);
        }

        private async Task<JsonElement?> GetAsync(string path)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}{path}");
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                return JsonDocument.Parse(json).RootElement;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI Engine GET {Path} failed", path);
                return null;
            }
        }

        private async Task<JsonElement?> PostAsync(string path, object payload)
        {
            try
            {
                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json"
                );
                var response = await _httpClient.PostAsync($"{_baseUrl}{path}", content);
                response.EnsureSuccessStatusCode();
                var json = await response.Content.ReadAsStringAsync();
                return JsonDocument.Parse(json).RootElement;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI Engine POST {Path} failed", path);
                return null;
            }
        }
    }
}
