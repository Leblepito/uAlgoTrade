namespace FinancePlatform.API.Services;

public sealed class TelegramOptions
{
    public string? BotToken { get; set; }
    public string? ChatId { get; set; }
    public string JoinUrl { get; set; } = "https://t.me/ukeytr";
}
