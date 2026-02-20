using System.Threading.Tasks;

namespace FinancePlatform.API.Services
{
    public interface IAIAgentService
    {
        Task<string> GetResponseAsync(string userMessage, string marketContext = null);
        Task<string> AnalyzeMarketAsync(string symbol);
    }
}
