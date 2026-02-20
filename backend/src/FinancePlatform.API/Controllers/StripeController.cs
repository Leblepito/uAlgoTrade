using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FinancePlatform.API.Auth;
using FinancePlatform.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace FinancePlatform.API.Controllers;

[ApiController]
[Route("api/stripe")]
public sealed class StripeController : ControllerBase
{
    private readonly StripeService _stripe;
    private readonly StripeOptions _opts;
    private readonly PostgresAuthRepository _repo;
    private readonly ILogger<StripeController> _logger;

    public StripeController(
        StripeService stripe,
        IOptions<StripeOptions> opts,
        PostgresAuthRepository repo,
        ILogger<StripeController> logger)
    {
        _stripe = stripe;
        _opts = opts.Value;
        _repo = repo;
        _logger = logger;
    }

    /// <summary>
    /// Creates a Stripe Checkout session for Pro or Premium plan.
    /// </summary>
    [Authorize]
    [HttpPost("checkout")]
    public async Task<IActionResult> CreateCheckout(
        [FromBody] CheckoutRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request?.PlanCode))
            return BadRequest(new { error = "planCode is required (pro or premium)." });

        var planCode = request.PlanCode.ToLowerInvariant();
        if (planCode is not "pro" and not "premium")
            return BadRequest(new { error = "planCode must be 'pro' or 'premium'." });

        var userId = AuthService.GetUserId(User);
        var email = User.Claims.FirstOrDefault(c => c.Type == System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value ?? "";

        var session = await _stripe.CreateCheckoutSessionAsync(userId, email, planCode, ct);

        return Ok(new { sessionId = session.Id, url = session.Url });
    }

    /// <summary>
    /// Creates a Stripe Customer Portal session for managing subscription.
    /// </summary>
    [Authorize]
    [HttpPost("portal")]
    public async Task<IActionResult> CreatePortal(CancellationToken ct)
    {
        var userId = AuthService.GetUserId(User);
        var customerId = await _repo.GetStripeCustomerIdAsync(userId, ct);

        if (string.IsNullOrEmpty(customerId))
            return BadRequest(new { error = "No Stripe customer found. Subscribe first." });

        var returnUrl = string.IsNullOrEmpty(_opts.SuccessUrl) ? "/" : _opts.SuccessUrl;
        var portalSession = await _stripe.CreatePortalSessionAsync(customerId, returnUrl, ct);

        return Ok(new { url = portalSession.Url });
    }

    /// <summary>
    /// Stripe webhook receiver — processes checkout.session.completed,
    /// customer.subscription.updated/deleted events.
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook(CancellationToken ct)
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync(ct);
        var signatureHeader = Request.Headers["Stripe-Signature"].FirstOrDefault();

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(json, signatureHeader, _opts.WebhookSecret);
        }
        catch (StripeException ex)
        {
            _logger.LogWarning("Stripe webhook signature verification failed: {Message}", ex.Message);
            return BadRequest(new { error = "Invalid signature." });
        }

        switch (stripeEvent.Type)
        {
            case EventTypes.CheckoutSessionCompleted:
                var session = stripeEvent.Data.Object as Session;
                if (session is not null)
                    await _stripe.HandleCheckoutCompleted(session, ct);
                break;

            case EventTypes.CustomerSubscriptionUpdated:
                var subUpdated = stripeEvent.Data.Object as Subscription;
                if (subUpdated is not null)
                    await _stripe.HandleSubscriptionUpdated(subUpdated, ct);
                break;

            case EventTypes.CustomerSubscriptionDeleted:
                var subDeleted = stripeEvent.Data.Object as Subscription;
                if (subDeleted is not null)
                    await _stripe.HandleSubscriptionDeleted(subDeleted, ct);
                break;

            default:
                _logger.LogInformation("Unhandled Stripe event: {Type}", stripeEvent.Type);
                break;
        }

        return Ok(new { received = true });
    }
}

public sealed record CheckoutRequest(string? PlanCode);
