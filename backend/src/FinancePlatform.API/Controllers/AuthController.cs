using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FinancePlatform.API.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace FinancePlatform.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly AuthOptions _options;

    public AuthController(AuthService auth, IOptions<AuthOptions> options)
    {
        _auth = auth;
        _options = options.Value;
    }

    [HttpPost("signup")]
    public async Task<IActionResult> SignUp([FromBody] SignUpRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _auth.SignUpAsync(
                request,
                userAgent: Request.Headers.UserAgent.FirstOrDefault(),
                ip: HttpContext.Connection.RemoteIpAddress,
                response: Response,
                ct: ct);

            return Ok(result);
        }
        catch (AuthException ex)
        {
            return StatusCode(ex.StatusCode, new { error = ex.Message });
        }
    }

    [HttpPost("signin")]
    public async Task<IActionResult> SignIn([FromBody] SignInRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _auth.SignInAsync(
                request,
                userAgent: Request.Headers.UserAgent.FirstOrDefault(),
                ip: HttpContext.Connection.RemoteIpAddress,
                response: Response,
                ct: ct);

            return Ok(result);
        }
        catch (AuthException ex)
        {
            return StatusCode(ex.StatusCode, new { error = ex.Message });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request, CancellationToken ct)
    {
        try
        {
            var refreshToken = ResolveRefreshToken(request.RefreshToken);
            var result = await _auth.RefreshAsync(
                refreshToken,
                userAgent: Request.Headers.UserAgent.FirstOrDefault(),
                ip: HttpContext.Connection.RemoteIpAddress,
                response: Response,
                ct: ct);

            return Ok(result);
        }
        catch (AuthException ex)
        {
            return StatusCode(ex.StatusCode, new { error = ex.Message });
        }
    }

    [HttpPost("signout")]
    public async Task<IActionResult> SignOut([FromBody] SignOutRequest request, CancellationToken ct)
    {
        try
        {
            var refreshToken = ResolveRefreshToken(request.RefreshToken);
            await _auth.SignOutAsync(refreshToken, Response, ct);
            return Ok(new { ok = true });
        }
        catch (AuthException ex)
        {
            return StatusCode(ex.StatusCode, new { error = ex.Message });
        }
    }

    [Authorize]
    [HttpPost("signout-all")]
    public async Task<IActionResult> SignOutAll(CancellationToken ct)
    {
        try
        {
            var userId = AuthService.GetUserId(User);
            await _auth.SignOutAllAsync(userId, Response, ct);
            return Ok(new { ok = true });
        }
        catch (AuthException ex)
        {
            return StatusCode(ex.StatusCode, new { error = ex.Message });
        }
    }

    private string ResolveRefreshToken(string? provided)
    {
        if (!string.IsNullOrWhiteSpace(provided)) return provided.Trim();

        if (_options.UseRefreshCookie && Request.Cookies.TryGetValue(_options.RefreshCookieName, out var cookieToken))
        {
            return cookieToken;
        }

        return string.Empty;
    }
}

