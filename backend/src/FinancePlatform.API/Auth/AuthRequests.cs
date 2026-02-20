namespace FinancePlatform.API.Auth;

public sealed record SignUpRequest(string Email, string Password, string? DisplayName, string? PreferredLanguage);
public sealed record SignInRequest(string Email, string Password);
public sealed record RefreshRequest(string? RefreshToken);
public sealed record SignOutRequest(string? RefreshToken);

