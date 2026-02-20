using System.Collections.Generic;
using System.Threading.Tasks;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Application.Interfaces
{
    public interface IElliottWaveService
    {
        Task<ElliottWaveResponse> CalculateElliottWaves(ElliottWaveRequest request);

        ElliottWaveResponse CalculateElliottWavesFromCandles(
            List<Candle> candles,
            ElliottWaveRequest request);
    }
}
