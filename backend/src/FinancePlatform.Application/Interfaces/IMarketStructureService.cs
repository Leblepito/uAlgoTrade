using System.Collections.Generic;
using System.Threading.Tasks;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Application.Interfaces
{
    public interface IMarketStructureService
    {
        Task<MarketStructureResponse> CalculateMarketStructureAsync(MarketStructureRequest request);

        MarketStructureResponse CalculateMarketStructureFromCandles(
            List<Candle> candles,
            MarketStructureRequest request);
    }
}
