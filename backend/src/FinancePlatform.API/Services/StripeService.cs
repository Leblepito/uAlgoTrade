using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace FinancePlatform.API.Services;

public sealed class StripeService
{
    private readonly StripeOptions _opts;
    private readonly Auth.PostgresAuthRepository _repo;

    public StripeService(IOptions<StripeOptions> opts, Auth.PostgresAuthRepository repo)
    {
        _opts = opts.Value;
        _repo = repo;
        StripeConfiguration.ApiKey = _opts.SecretKey;
    }

    public string GetPriceId(string planCode) => planCode switch
    {
        "pro" => _opts.ProPriceId,
        "premium" => _opts.PremiumPriceId,
        _ => throw new ArgumentException($"Unknown plan: {planCode}")
    };

    public async Task<Session> CreateCheckoutSessionAsync(
        Guid userId,
        string email,
        string planCode,
        CancellationToken ct)
    {
        var priceId = GetPriceId(planCode);

        // Find or create Stripe customer
        var customerId = await FindOrCreateCustomerAsync(userId, email, ct);

        var options = new SessionCreateOptions
        {
            Customer = customerId,
            Mode = "subscription",
            LineItems = new()
            {
                new SessionLineItemOptions
                {
                    Price = priceId,
                    Quantity = 1,
                }
            },
            SuccessUrl = _opts.SuccessUrl + "?session_id={CHECKOUT_SESSION_ID}",
            CancelUrl = _opts.CancelUrl,
            Metadata = new()
            {
                { "user_id", userId.ToString() },
                { "plan_code", planCode },
            },
            SubscriptionData = new SessionSubscriptionDataOptions
            {
                Metadata = new()
                {
                    { "user_id", userId.ToString() },
                    { "plan_code", planCode },
                }
            }
        };

        var service = new SessionService();
        return await service.CreateAsync(options, cancellationToken: ct);
    }

    public async Task<Stripe.BillingPortal.Session> CreatePortalSessionAsync(
        string stripeCustomerId,
        string returnUrl,
        CancellationToken ct)
    {
        var options = new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = stripeCustomerId,
            ReturnUrl = returnUrl,
        };
        var service = new Stripe.BillingPortal.SessionService();
        return await service.CreateAsync(options, cancellationToken: ct);
    }

    public async Task HandleCheckoutCompleted(Session session, CancellationToken ct)
    {
        if (!Guid.TryParse(session.Metadata.GetValueOrDefault("user_id"), out var userId))
            return;

        var planCode = session.Metadata.GetValueOrDefault("plan_code") ?? "pro";

        await _repo.UpsertSubscriptionAsync(
            userId,
            planCode,
            "active",
            provider: "stripe",
            providerCustomerId: session.CustomerId,
            providerSubscriptionId: session.SubscriptionId,
            ct);
    }

    public async Task HandleSubscriptionUpdated(Subscription subscription, CancellationToken ct)
    {
        if (!Guid.TryParse(subscription.Metadata.GetValueOrDefault("user_id"), out var userId))
        {
            // Try to find user by customer id
            userId = await _repo.FindUserIdByStripeCustomerIdAsync(subscription.CustomerId, ct);
            if (userId == Guid.Empty) return;
        }

        var planCode = subscription.Metadata.GetValueOrDefault("plan_code") ?? "pro";
        var status = MapStripeStatus(subscription.Status);

        await _repo.UpsertSubscriptionAsync(
            userId,
            planCode,
            status,
            provider: "stripe",
            providerCustomerId: subscription.CustomerId,
            providerSubscriptionId: subscription.Id,
            ct,
            periodStart: subscription.CurrentPeriodStart,
            periodEnd: subscription.CurrentPeriodEnd,
            cancelAt: subscription.CancelAt);
    }

    public async Task HandleSubscriptionDeleted(Subscription subscription, CancellationToken ct)
    {
        if (!Guid.TryParse(subscription.Metadata.GetValueOrDefault("user_id"), out var userId))
        {
            userId = await _repo.FindUserIdByStripeCustomerIdAsync(subscription.CustomerId, ct);
            if (userId == Guid.Empty) return;
        }

        await _repo.CancelSubscriptionAsync(userId, ct);
    }

    private async Task<string> FindOrCreateCustomerAsync(Guid userId, string email, CancellationToken ct)
    {
        var existingCustomerId = await _repo.GetStripeCustomerIdAsync(userId, ct);
        if (!string.IsNullOrEmpty(existingCustomerId))
            return existingCustomerId;

        var options = new CustomerCreateOptions
        {
            Email = email,
            Metadata = new() { { "user_id", userId.ToString() } }
        };
        var service = new CustomerService();
        var customer = await service.CreateAsync(options, cancellationToken: ct);

        return customer.Id;
    }

    private static string MapStripeStatus(string stripeStatus) => stripeStatus switch
    {
        "active" => "active",
        "trialing" => "trialing",
        "past_due" => "past_due",
        "canceled" => "canceled",
        "unpaid" => "past_due",
        "incomplete" => "past_due",
        "incomplete_expired" => "expired",
        _ => "canceled"
    };
}
