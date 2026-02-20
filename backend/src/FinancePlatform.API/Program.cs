using FinancePlatform.Infrastructure;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text;
using FinancePlatform.API.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

var portEnv = Environment.GetEnvironmentVariable("PORT");
if (int.TryParse(portEnv, out var port) && port > 0)
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme."
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddInfrastructure();
builder.Services.AddSingleton<FinancePlatform.API.Services.CoinalyzeFundingScraper>();
builder.Services.AddSingleton<FinancePlatform.API.Services.FundingRateService>();
builder.Services.Configure<FinancePlatform.API.Services.TelegramOptions>(builder.Configuration.GetSection("Telegram"));
builder.Services.AddSingleton<FinancePlatform.API.Services.TelegramSignalService>();

builder.Services.Configure<AuthOptions>(builder.Configuration.GetSection("Auth"));
builder.Services.AddSingleton<PostgresAuthRepository>();
builder.Services.AddSingleton<AlertRepository>();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddSingleton<IPasswordHasher<AuthService.PasswordHasherUser>, PasswordHasher<AuthService.PasswordHasherUser>>();
builder.Services.AddSingleton<FinancePlatform.API.Services.AlertBackgroundService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<FinancePlatform.API.Services.AlertBackgroundService>());

// Stripe Payments
builder.Services.Configure<FinancePlatform.API.Services.StripeOptions>(builder.Configuration.GetSection("Stripe"));
builder.Services.AddSingleton<FinancePlatform.API.Services.StripeService>();

// AI Services
builder.Services.AddHttpClient<FinancePlatform.API.Services.AnthropicService>();
builder.Services.AddScoped<FinancePlatform.API.Services.IAIAgentService, FinancePlatform.API.Services.AnthropicService>();

// AI Engine Sidecar (Python)
builder.Services.AddHttpClient<FinancePlatform.API.Services.AiSidecarClient>();

// WebSocket Hub — real-time swarm data broadcasting
builder.Services.AddSingleton<FinancePlatform.API.Hubs.SwarmHub>();
builder.Services.AddHostedService<FinancePlatform.API.Services.SwarmBroadcastService>();

var authOptions = builder.Configuration.GetSection("Auth").Get<AuthOptions>() ?? new AuthOptions();
if (string.IsNullOrWhiteSpace(authOptions.SigningKey))
{
    // Fallback: generate a random signing key if not configured
    // This allows the app to start for health checks and non-auth endpoints
    var fallbackKey = "DEVELOPMENT-FALLBACK-KEY-CHANGE-ME-IN-PRODUCTION-" + Guid.NewGuid().ToString("N");
    authOptions.SigningKey = fallbackKey;
    Console.WriteLine("⚠️  WARNING: Auth:SigningKey not configured. Using auto-generated fallback key. Set Auth__SigningKey environment variable for production.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.SaveToken = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = authOptions.Issuer,
            ValidAudience = authOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authOptions.SigningKey)),
            ClockSkew = TimeSpan.FromSeconds(10)
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Default", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        if (!builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
        {
            Console.WriteLine("⚠️  WARNING: Cors:AllowedOrigins not configured. Allowing all origins. Set Cors__AllowedOrigins__0 for production.");
        }

        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
        else
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    var forwardedHeadersOptions = new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    };
    forwardedHeadersOptions.KnownNetworks.Clear();
    forwardedHeadersOptions.KnownProxies.Clear();
    app.UseForwardedHeaders(forwardedHeadersOptions);
}

app.UseHttpsRedirection();

app.UseCors("Default");

app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(30),
});

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { ok = true }));

// WebSocket endpoint — /ws/swarm
app.Map("/ws/swarm", async (HttpContext context) =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsync("WebSocket connections only");
        return;
    }

    var hub = context.RequestServices.GetRequiredService<FinancePlatform.API.Hubs.SwarmHub>();
    var ws = await context.WebSockets.AcceptWebSocketAsync();
    var clientId = $"ws-{Guid.NewGuid():N}";
    await hub.AcceptAsync(ws, clientId, context.RequestAborted);
});

app.MapControllers();

app.Run();
