using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FinancePlatform.API.Services;

public sealed class TelegramSignalService
{
    private readonly ILogger<TelegramSignalService> _logger;
    private readonly TelegramOptions _options;
    private readonly HttpClient _httpClient;

    public TelegramSignalService(
        IOptions<TelegramOptions> options,
        IConfiguration configuration,
        ILogger<TelegramSignalService> logger)
    {
        _logger = logger;

        var bound = options.Value ?? new TelegramOptions();
        bound.BotToken ??= configuration["TELEGRAM_BOT_TOKEN"];
        bound.ChatId ??= configuration["TELEGRAM_CHAT_ID"];
        _options = bound;

        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(15)
        };
    }

    public bool IsEnabled =>
        !string.IsNullOrWhiteSpace(_options.BotToken) &&
        !string.IsNullOrWhiteSpace(_options.ChatId);

    public async Task<bool> SendOpportunityAsync(
        string symbol,
        string side,
        int score,
        string[] reasons,
        DateTimeOffset timestamp,
        CancellationToken ct)
    {
        if (!IsEnabled)
        {
            _logger.LogWarning("Telegram signal skipped: configuration is missing BotToken or ChatId.");
            return false;
        }

        var reasonText = reasons.Length > 0 ? string.Join(", ", reasons) : "n/a";
        var opportunityText = side.Equals("BUY", StringComparison.OrdinalIgnoreCase)
            ? "Buy opportunity"
            : "Sell opportunity";
        var text =
            $"U2Algo Signal\n" +
            $"Pair: {symbol}\n" +
            $"Signal: {opportunityText}\n" +
            $"Side: {side}\n" +
            $"Score: {score}\n" +
            $"Reasons: {reasonText}\n" +
            $"Time: {timestamp:yyyy-MM-dd HH:mm:ss} UTC";

        var payload = new
        {
            chat_id = _options.ChatId,
            text
        };

        var url = $"https://api.telegram.org/bot{_options.BotToken}/sendMessage";
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };

        using var response = await _httpClient.SendAsync(request, ct);
        if (response.IsSuccessStatusCode)
        {
            return true;
        }

        var body = await response.Content.ReadAsStringAsync(ct);
        _logger.LogWarning("Telegram sendMessage failed: {StatusCode} {Body}", (int)response.StatusCode, body);
        return false;
    }
}
