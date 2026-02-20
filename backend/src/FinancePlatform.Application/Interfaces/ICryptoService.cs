using System.Threading.Tasks;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.Application.Interfaces
{
    public interface ICryptoService
    {
        Task<OHLCResponse> FetchOHLCAsync(OHLCRequest request);
    }
}
