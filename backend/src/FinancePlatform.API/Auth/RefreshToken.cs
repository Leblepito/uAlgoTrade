using System;
using System.Security.Cryptography;
using System.Text;

namespace FinancePlatform.API.Auth;

public static class RefreshToken
{
    public static string Generate()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Base64UrlEncode(bytes);
    }

    public static string Hash(string token)
    {
        var bytes = Encoding.UTF8.GetBytes(token);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string Base64UrlEncode(ReadOnlySpan<byte> bytes)
    {
        var s = Convert.ToBase64String(bytes);
        s = s.TrimEnd('=').Replace('+', '-').Replace('/', '_');
        return s;
    }
}
