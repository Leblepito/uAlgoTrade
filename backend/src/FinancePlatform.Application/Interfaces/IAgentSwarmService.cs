using FinancePlatform.Domain.Models;

namespace FinancePlatform.Application.Interfaces
{
    /// <summary>
    /// Interface for agent swarm operations.
    /// Implemented by AiSidecarClient as a proxy to the Python AI Engine.
    /// </summary>
    public interface IAgentSwarmService
    {
        Task<SwarmStatus> GetSwarmStatusAsync();
        Task<AgentHeartbeat> GetAgentHeartbeatAsync(string agentName);
        Task<IEnumerable<SwarmSignal>> GetRecentSignalsAsync(int limit = 20);
        Task<object> TriggerScanAsync(List<string> symbols, string strategyId = "default");
    }
}
