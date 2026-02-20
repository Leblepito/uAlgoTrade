using System;
using System.Collections.Generic;

namespace FinancePlatform.API.Auth;

public sealed record AuthResponse(
    string AccessToken,
    long AccessTokenExpiresAt,
    Guid UserId,
    string Email,
    string? DisplayName,
    IReadOnlyList<string> Roles);

