using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FinancePlatform.API.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinancePlatform.API.Controllers;

[ApiController]
[Route("api/account")]
public sealed class AccountController : ControllerBase
{
    private readonly PostgresAuthRepository _repo;

    public AccountController(PostgresAuthRepository repo)
    {
        _repo = repo;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var userId = AuthService.GetUserId(User);
        var sub = User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;
        var email = User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Email)?.Value;
        var displayName = User.Claims.FirstOrDefault(c => c.Type == "display_name")?.Value;
        var roles = User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToArray();

        var (planCode, maxIndicators, maxBacktestsPerDay) = await _repo.GetEntitlementAsync(userId, ct);

        return Ok(new
        {
            userId = sub ?? userId.ToString(),
            email,
            displayName = string.IsNullOrWhiteSpace(displayName) ? null : displayName,
            roles,
            planCode,
            maxIndicators,
            maxBacktestsPerDay
        });
    }

    [Authorize]
    [HttpPatch("language")]
    public async Task<IActionResult> UpdateLanguage([FromBody] UpdateLanguageRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request?.Language))
            return BadRequest(new { error = "Language is required." });

        var validLangs = new[] { "en", "tr", "th", "ru", "zh", "es" };
        if (!validLangs.Contains(request.Language.ToLowerInvariant()))
            return BadRequest(new { error = "Invalid language code. Supported: en, tr, th, ru, zh, es." });

        var userId = AuthService.GetUserId(User);
        await _repo.UpdatePreferredLanguageAsync(userId, request.Language.ToLowerInvariant(), ct);

        return Ok(new { ok = true, language = request.Language.ToLowerInvariant() });
    }

    [Authorize]
    [HttpPatch("display-name")]
    public async Task<IActionResult> UpdateDisplayName([FromBody] UpdateDisplayNameRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request?.DisplayName))
            return BadRequest(new { error = "Display name is required." });

        var trimmed = request.DisplayName.Trim();
        if (trimmed.Length < 2 || trimmed.Length > 64)
            return BadRequest(new { error = "Display name must be 2-64 characters." });

        var userId = AuthService.GetUserId(User);
        await _repo.UpdateDisplayNameAsync(userId, trimmed, ct);

        return Ok(new { ok = true, displayName = trimmed });
    }
}

public sealed record UpdateLanguageRequest(string? Language);
public sealed record UpdateDisplayNameRequest(string? DisplayName);
