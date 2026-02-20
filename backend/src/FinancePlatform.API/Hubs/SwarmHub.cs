using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace FinancePlatform.API.Hubs;

/// <summary>
/// Lightweight WebSocket hub for broadcasting real-time swarm data to connected clients.
/// No external dependency required — uses native ASP.NET WebSocket support.
/// </summary>
public sealed class SwarmHub
{
    private readonly ConcurrentDictionary<string, WebSocket> _clients = new();
    private readonly ILogger<SwarmHub> _logger;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public SwarmHub(ILogger<SwarmHub> logger)
    {
        _logger = logger;
    }

    public int ConnectionCount => _clients.Count;

    /// <summary>Accept a new WebSocket client and keep it alive.</summary>
    public async Task AcceptAsync(WebSocket ws, string clientId, CancellationToken ct)
    {
        _clients.TryAdd(clientId, ws);
        _logger.LogInformation("WebSocket client connected: {ClientId} (total: {Count})", clientId, _clients.Count);

        // Send welcome message
        await SendToAsync(ws, new
        {
            type = "connected",
            clientId,
            timestamp = DateTime.UtcNow,
            message = "Connected to uKeyTr Swarm Hub"
        }, ct);

        try
        {
            var buffer = new byte[4096];
            while (ws.State == WebSocketState.Open && !ct.IsCancellationRequested)
            {
                var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), ct);

                if (result.MessageType == WebSocketMessageType.Close)
                    break;

                // Handle ping/pong and client messages
                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var text = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    await HandleClientMessage(clientId, text, ct);
                }
            }
        }
        catch (WebSocketException ex)
        {
            _logger.LogWarning("WebSocket error for {ClientId}: {Message}", clientId, ex.Message);
        }
        catch (OperationCanceledException) { }
        finally
        {
            _clients.TryRemove(clientId, out _);
            _logger.LogInformation("WebSocket client disconnected: {ClientId} (total: {Count})", clientId, _clients.Count);

            if (ws.State == WebSocketState.Open)
            {
                try
                {
                    await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Goodbye", CancellationToken.None);
                }
                catch { /* best-effort close */ }
            }
        }
    }

    /// <summary>Broadcast a message to ALL connected clients.</summary>
    public async Task BroadcastAsync<T>(string eventType, T data, CancellationToken ct = default)
    {
        if (_clients.IsEmpty) return;

        var envelope = new
        {
            type = eventType,
            data,
            timestamp = DateTime.UtcNow,
        };

        var json = JsonSerializer.Serialize(envelope, _jsonOptions);
        var bytes = Encoding.UTF8.GetBytes(json);
        var segment = new ArraySegment<byte>(bytes);

        var deadClients = new List<string>();

        foreach (var (id, ws) in _clients)
        {
            try
            {
                if (ws.State == WebSocketState.Open)
                {
                    await ws.SendAsync(segment, WebSocketMessageType.Text, true, ct);
                }
                else
                {
                    deadClients.Add(id);
                }
            }
            catch
            {
                deadClients.Add(id);
            }
        }

        // Clean up dead connections
        foreach (var id in deadClients)
        {
            _clients.TryRemove(id, out _);
        }
    }

    /// <summary>Send to a specific client.</summary>
    private static async Task SendToAsync<T>(WebSocket ws, T data, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(data, _jsonOptions);
        var bytes = Encoding.UTF8.GetBytes(json);
        await ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, ct);
    }

    private Task HandleClientMessage(string clientId, string text, CancellationToken ct)
    {
        // Clients can send ping/subscribe messages; for now just log
        _logger.LogDebug("Message from {ClientId}: {Text}", clientId, text);
        return Task.CompletedTask;
    }
}
