using FinancePlatform.Application.Interfaces;
using FinancePlatform.Infrastructure.Indicators;
using FinancePlatform.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace FinancePlatform.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services)
        {
            // CoinGecko provider registered as singleton with its own HttpClient
            services.AddHttpClient<CoinGeckoMarketDataProvider>();
            // Binance provider — primary market data, falls back to CoinGecko automatically
            services.AddHttpClient<IMarketDataProvider, BinanceMarketDataProvider>();
            services.AddHttpClient<ICryptoService, CryptoService>();
            
            services.AddScoped<ISupportResistanceService, SupportResistanceService>();
            services.AddScoped<IElliottWaveService, ElliottWaveService>();
            services.AddScoped<IMarketStructureService, MarketStructureService>();
            services.AddScoped<ISmaService, SmaService>();
            services.AddScoped<IRsiService, RsiService>();
            
            services.AddScoped<ISignalGeneratorService, SignalGeneratorService>();
            services.AddScoped<ITradeSimulatorService, TradeSimulatorService>();
            services.AddScoped<IBacktestEngineService, BacktestEngineService>();
            
            return services;
        }
    }
}
