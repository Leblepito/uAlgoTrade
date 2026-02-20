namespace FinancePlatform.API.Auth;

public sealed class AuthOptions
{
    public string Issuer { get; init; } = "FinancePlatform";
    public string Audience { get; init; } = "FinancePlatform";

    public string SigningKey { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; init; } = 15;
    public int RefreshTokenDays { get; init; } = 30;

    public bool RequireEmailVerification { get; init; } = false;

    public string RefreshCookieName { get; init; } = "refresh_token";
    public bool UseRefreshCookie { get; init; } = true;
}
