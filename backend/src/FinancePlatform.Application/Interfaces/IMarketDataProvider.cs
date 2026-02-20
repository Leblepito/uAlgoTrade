using System.Collections.Generic;
using System.Threading.Tasks;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Application.Interfaces
{
    public interface IMarketDataProvider
    {
        Task<List<Candle>> GetKlinesAsync(string symbol, string interval, int limit = 500, long? endTime = null);
    }
}
