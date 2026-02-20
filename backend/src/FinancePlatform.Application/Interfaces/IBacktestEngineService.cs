using System.Threading.Tasks;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Application.Interfaces
{
    public interface IBacktestEngineService
    {
        Task<BacktestResult> RunBacktestAsync(BacktestRequest request);
    }
}
