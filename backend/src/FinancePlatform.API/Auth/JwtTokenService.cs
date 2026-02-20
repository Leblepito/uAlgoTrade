using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace FinancePlatform.API.Auth;

public sealed class JwtTokenService
{
    private readonly AuthOptions _options;
    private readonly SigningCredentials _creds;

    public JwtTokenService(IOptions<AuthOptions> options)
    {
        _options = options.Value;
        if (string.IsNullOrWhiteSpace(_options.SigningKey) || _options.SigningKey.Length < 32)
        {
            throw new InvalidOperationException("Auth:SigningKey must be set (min 32 chars recommended).");
        }

        var keyBytes = Encoding.UTF8.GetBytes(_options.SigningKey);
        var key = new SymmetricSecurityKey(keyBytes);
        _creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    }

    public (string token, DateTimeOffset expiresAt) CreateAccessToken(
        Guid userId,
        string email,
        string? displayName,
        IReadOnlyList<string> roles,
        Guid? sessionId)
    {
        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.AddMinutes(_options.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new("display_name", displayName ?? string.Empty),
        };

        if (sessionId.HasValue)
        {
            claims.Add(new Claim("sid", sessionId.Value.ToString()));
        }

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var jwt = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: _creds);

        var token = new JwtSecurityTokenHandler().WriteToken(jwt);
        return (token, expiresAt);
    }
}

