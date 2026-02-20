using System.Collections.Generic;
using System.Threading.Tasks;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Application.Interfaces
{
    public interface ISupportResistanceService
    {
        Task<SupportResistanceResponse> CalculateSupportResistance(
            string symbol,
            string interval,
            float multiplicativeFactor = 8.0f,
            int atrLength = 50,
            int extendLast = 4,
            int limit = 500);

        SupportResistanceResponse CalculateSupportResistanceFromCandles(
            List<Candle> candles,
            string symbol,
            string interval,
            float multiplicativeFactor = 8.0f,
            int atrLength = 50,
            int extendLast = 4,
            bool returnAllLevels = false);
    }
}
