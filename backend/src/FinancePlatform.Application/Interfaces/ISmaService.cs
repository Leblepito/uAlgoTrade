using System.Threading.Tasks;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Application.Interfaces
{
    public interface ISmaService
    {
        Task<LineIndicatorResponse> CalculateSmaAsync(string symbol, string timeframe, int period, int limit);
    }
}

