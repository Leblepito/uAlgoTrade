using System.Threading.Tasks;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Application.Interfaces
{
    public interface IRsiService
    {
        Task<RsiResponse> CalculateRsiAsync(string symbol, string timeframe, int period, int limit);
    }
}

