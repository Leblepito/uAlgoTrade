using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace FinancePlatform.API.Auth;

public sealed class AuthService
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    private readonly PostgresAuthRepository _repo;
    private readonly JwtTokenService _jwt;
    private readonly IPasswordHasher<PasswordHasherUser> _passwordHasher;
    private readonly AuthOptions _options;
    private readonly IHostEnvironment _env;

    public AuthService(
        PostgresAuthRepository repo,
        JwtTokenService jwt,
        IPasswordHasher<PasswordHasherUser> passwordHasher,
        IOptions<AuthOptions> options,
        IHostEnvironment env)
    {
        _repo = repo;
        _jwt = jwt;
        _passwordHasher = passwordHasher;
        _options = options.Value;
        _env = env;
    }

    public async Task<AuthResponse> SignUpAsync(
        SignUpRequest request,
        string? userAgent,
        IPAddress? ip,
        HttpResponse response,
        CancellationToken ct)
    {
        var email = NormalizeEmail(request.Email);
        ValidatePassword(request.Password);

        var existing = await _repo.FindUserByEmailAsync(email, ct);
        if (existing is not null)
        {
            throw new AuthException(StatusCodes.Status409Conflict, "Email already in use.");
        }

        var passwordHash = _passwordHasher.HashPassword(new PasswordHasherUser(Guid.Empty), request.Password);
        var preferredLanguage = request.PreferredLanguage ?? "en";
        var userId = await _repo.CreateUserAsync(email, passwordHash, request.DisplayName?.Trim(), ct, preferredLanguage);

        var roles = await _repo.GetRoleCodesAsync(userId, ct);

        var refresh = RefreshToken.Generate();
        var refreshHash = RefreshToken.Hash(refresh);
        var refreshExpiresAt = DateTimeOffset.UtcNow.AddDays(_options.RefreshTokenDays);
        var sessionId = await _repo.CreateSessionAsync(userId, refreshHash, refreshExpiresAt, userAgent, ip, ct);

        SetRefreshCookie(response, refresh, refreshExpiresAt);
        var (accessToken, accessExpiresAt) = _jwt.CreateAccessToken(userId, email, request.DisplayName?.Trim(), roles, sessionId);

        return new AuthResponse(
            AccessToken: accessToken,
            AccessTokenExpiresAt: accessExpiresAt.ToUnixTimeSeconds(),
            UserId: userId,
            Email: email,
            DisplayName: request.DisplayName?.Trim(),
            Roles: roles);
    }

    public async Task<AuthResponse> SignInAsync(
        SignInRequest request,
        string? userAgent,
        IPAddress? ip,
        HttpResponse response,
        CancellationToken ct)
    {
        var email = NormalizeEmail(request.Email);

        var user = await _repo.FindUserByEmailAsync(email, ct);
        if (user is null)
        {
            throw new AuthException(StatusCodes.Status401Unauthorized, "Invalid email or password.");
        }

        EnforceUserCanSignIn(user);

        var verify = _passwordHasher.VerifyHashedPassword(new PasswordHasherUser(user.Id), user.PasswordHash, request.Password);
        if (verify == PasswordVerificationResult.Failed)
        {
            var newFailed = user.FailedLoginAttempts + 1;
            DateTimeOffset? lockedUntil = null;
            if (newFailed >= MaxFailedAttempts)
            {
                lockedUntil = DateTimeOffset.UtcNow.Add(LockoutDuration);
            }

            await _repo.UpdateLoginFailureAsync(user.Id, newFailed, lockedUntil, ct);
            throw new AuthException(StatusCodes.Status401Unauthorized, "Invalid email or password.");
        }

        await _repo.UpdateLoginSuccessAsync(user.Id, ct);

        var roles = await _repo.GetRoleCodesAsync(user.Id, ct);

        var refresh = RefreshToken.Generate();
        var refreshHash = RefreshToken.Hash(refresh);
        var refreshExpiresAt = DateTimeOffset.UtcNow.AddDays(_options.RefreshTokenDays);
        var sessionId = await _repo.CreateSessionAsync(user.Id, refreshHash, refreshExpiresAt, userAgent, ip, ct);

        SetRefreshCookie(response, refresh, refreshExpiresAt);
        var (accessToken, accessExpiresAt) = _jwt.CreateAccessToken(user.Id, user.Email, user.DisplayName, roles, sessionId);

        return new AuthResponse(
            AccessToken: accessToken,
            AccessTokenExpiresAt: accessExpiresAt.ToUnixTimeSeconds(),
            UserId: user.Id,
            Email: user.Email,
            DisplayName: user.DisplayName,
            Roles: roles);
    }

    public async Task<AuthResponse> RefreshAsync(
        string refreshToken,
        string? userAgent,
        IPAddress? ip,
        HttpResponse response,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new AuthException(StatusCodes.Status401Unauthorized, "Missing refresh token.");
        }

        var hash = RefreshToken.Hash(refreshToken);
        var (session, user) = await _repo.FindSessionByRefreshHashAsync(hash, ct);
        if (session is null || user is null)
        {
            throw new AuthException(StatusCodes.Status401Unauthorized, "Invalid refresh token.");
        }

        if (session.RevokedAt is not null)
        {
            throw new AuthException(StatusCodes.Status401Unauthorized, "Refresh token revoked.");
        }

        if (session.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            throw new AuthException(StatusCodes.Status401Unauthorized, "Refresh token expired.");
        }

        EnforceUserCanSignIn(user);

        var newRefresh = RefreshToken.Generate();
        var newRefreshHash = RefreshToken.Hash(newRefresh);
        var refreshExpiresAt = DateTimeOffset.UtcNow.AddDays(_options.RefreshTokenDays);
        var newSessionId = await _repo.RotateSessionAsync(session.Id, user.Id, newRefreshHash, refreshExpiresAt, userAgent, ip, ct);

        SetRefreshCookie(response, newRefresh, refreshExpiresAt);

        var roles = await _repo.GetRoleCodesAsync(user.Id, ct);
        var (accessToken, accessExpiresAt) = _jwt.CreateAccessToken(user.Id, user.Email, user.DisplayName, roles, newSessionId);

        return new AuthResponse(
            AccessToken: accessToken,
            AccessTokenExpiresAt: accessExpiresAt.ToUnixTimeSeconds(),
            UserId: user.Id,
            Email: user.Email,
            DisplayName: user.DisplayName,
            Roles: roles);
    }

    public async Task SignOutAsync(string refreshToken, HttpResponse response, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            var hash = RefreshToken.Hash(refreshToken);
            var (session, _) = await _repo.FindSessionByRefreshHashAsync(hash, ct);
            if (session is not null)
            {
                await _repo.RevokeSessionAsync(session.Id, ct);
            }
        }

        ClearRefreshCookie(response);
    }

    public async Task SignOutAllAsync(Guid userId, HttpResponse response, CancellationToken ct)
    {
        await _repo.RevokeAllSessionsForUserAsync(userId, ct);
        ClearRefreshCookie(response);
    }

    public static Guid GetUserId(ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.Parse(sub ?? throw new InvalidOperationException("Missing sub claim."));
    }

    private void EnforceUserCanSignIn(DbUser user)
    {
        if (!string.Equals(user.Status, "active", StringComparison.OrdinalIgnoreCase))
        {
            throw new AuthException(StatusCodes.Status403Forbidden, "Account disabled.");
        }

        if (_options.RequireEmailVerification && !user.IsEmailVerified)
        {
            throw new AuthException(StatusCodes.Status403Forbidden, "Email not verified.");
        }

        if (user.LockedUntil.HasValue && user.LockedUntil.Value > DateTimeOffset.UtcNow)
        {
            throw new AuthException(StatusCodes.Status429TooManyRequests, "Too many failed attempts. Try again later.");
        }
    }

    private static string NormalizeEmail(string email)
    {
        var e = (email ?? string.Empty).Trim();
        if (!e.Contains('@')) throw new AuthException(StatusCodes.Status400BadRequest, "Invalid email.");
        return e.ToLowerInvariant();
    }

    private static void ValidatePassword(string password)
    {
        var p = password ?? string.Empty;
        if (p.Length < 12 || p.Length > 128)
        {
            throw new AuthException(StatusCodes.Status400BadRequest, "Password must be 12-128 characters.");
        }

        var hasLower = p.Any(char.IsLower);
        var hasUpper = p.Any(char.IsUpper);
        var hasDigit = p.Any(char.IsDigit);
        var hasSymbol = p.Any(ch => !char.IsLetterOrDigit(ch));

        if (!hasLower || !hasUpper || !hasDigit || !hasSymbol)
        {
            throw new AuthException(
                StatusCodes.Status400BadRequest,
                "Password must include lowercase, uppercase, number, and symbol.");
        }
    }

    private void SetRefreshCookie(HttpResponse response, string refreshToken, DateTimeOffset expiresAt)
    {
        if (!_options.UseRefreshCookie) return;

        response.Cookies.Append(_options.RefreshCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/",
            Expires = expiresAt.UtcDateTime
        });
    }

    private void ClearRefreshCookie(HttpResponse response)
    {
        if (!_options.UseRefreshCookie) return;
        response.Cookies.Delete(_options.RefreshCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/"
        });
    }

    public sealed record PasswordHasherUser(Guid Id);
}

public sealed class AuthException : Exception
{
    public int StatusCode { get; }

    public AuthException(int statusCode, string message) : base(message)
    {
        StatusCode = statusCode;
    }
}
