using System;

namespace FinancePlatform.API.Auth;

public sealed record DbUser(
    Guid Id,
    string Email,
    string PasswordHash,
    string? DisplayName,
    bool IsEmailVerified,
    string Status,
    int FailedLoginAttempts,
    DateTimeOffset? LockedUntil,
    DateTimeOffset? PasswordChangedAt);

public sealed record DbSession(
    Guid Id,
    Guid UserId,
    DateTimeOffset ExpiresAt,
    DateTimeOffset? RevokedAt);

