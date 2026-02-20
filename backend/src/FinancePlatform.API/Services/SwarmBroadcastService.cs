using FinancePlatform.API.Hubs;

namespace FinancePlatform.API.Services;

/// <summary>
/// Background service that periodically fetches swarm status from the AI Engine
/// and broadcasts updates to all connected WebSocket clients.
/// </summary>
public sealed class SwarmBroadcastService : BackgroundService
{
    private readonly SwarmHub _hub;
    private readonly IServiceProvider _services;
    private readonly ILogger<SwarmBroadcastService> _logger;

    // Broadcast intervals
    private static readonly TimeSpan SwarmStatusInterval = TimeSpan.FromSeconds(5);
    private static readonly TimeSpan SignalCheckInterval = TimeSpan.FromSeconds(10);

    public SwarmBroadcastService(SwarmHub hub, IServiceProvider services, ILogger<SwarmBroadcastService> logger)
    {
        _hub = hub;
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SwarmBroadcastService started — broadcasting to WebSocket clients");

        var swarmTimer = TimeSpan.Zero;
        var signalTimer = TimeSpan.Zero;
        var tick = TimeSpan.FromSeconds(1);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(tick, stoppingToken);
                swarmTimer += tick;
                signalTimer += tick;

                // Skip if nobody is listening
                if (_hub.ConnectionCount == 0) continue;

                if (swarmTimer >= SwarmStatusInterval)
                {
                    swarmTimer = TimeSpan.Zero;
                    await BroadcastSwarmStatus(stoppingToken);
                }

                if (signalTimer >= SignalCheckInterval)
                {
                    signalTimer = TimeSpan.Zero;
                    await BroadcastSignals(stoppingToken);
                }
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SwarmBroadcast error");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }

        _logger.LogInformation("SwarmBroadcastService stopped");
    }

    private async Task BroadcastSwarmStatus(CancellationToken ct)
    {
        try
        {
            using var scope = _services.CreateScope();
            var sidecar = scope.ServiceProvider.GetRequiredService<AiSidecarClient>();
            var status = await sidecar.GetSwarmStatusAsync();
            if (status is not null)
            {
                await _hub.BroadcastAsync("swarm:status", status, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to broadcast swarm status: {Msg}", ex.Message);
        }
    }

    private async Task BroadcastSignals(CancellationToken ct)
    {
        try
        {
            using var scope = _services.CreateScope();
            var sidecar = scope.ServiceProvider.GetRequiredService<AiSidecarClient>();
            var signals = await sidecar.GetRecentSignalsAsync(10);
            if (signals is not null)
            {
                await _hub.BroadcastAsync("swarm:signals", signals, ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Failed to broadcast signals: {Msg}", ex.Message);
        }
    }
}
