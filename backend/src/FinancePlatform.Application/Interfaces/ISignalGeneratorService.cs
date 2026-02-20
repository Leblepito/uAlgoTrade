using System.Collections.Generic;
using System.Threading.Tasks;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Application.Interfaces
{
    public interface ISignalGeneratorService
    {
        Task<List<TradingSignal>> GenerateSupportResistanceSignals(
            List<Candle> candles,
            SupportResistanceResponse srData,
            string signalType,
            Dictionary<string, object> parameters);

        Task<List<TradingSignal>> GenerateMarketStructureSignals(
            List<Candle> candles,
            MarketStructureResponse msData,
            string signalType,
            Dictionary<string, object> parameters);

        Task<List<TradingSignal>> GenerateElliottWaveSignals(
            List<Candle> candles,
            ElliottWaveResponse ewData,
            string signalType,
            Dictionary<string, object> parameters);
    }
}
