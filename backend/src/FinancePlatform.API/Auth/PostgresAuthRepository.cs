using System;
using System.Collections.Generic;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;
using NpgsqlTypes;

namespace FinancePlatform.API.Auth;

public sealed class PostgresAuthRepository
{
    private readonly string _connectionString;

    public PostgresAuthRepository(IConfiguration configuration)
    {
        _connectionString =
            configuration.GetConnectionString("Postgres")
            ?? configuration["POSTGRES_CONNECTION_STRING"]
            ?? TryBuildPostgresConnectionStringFromDatabaseUrl(configuration["DATABASE_URL"])
            ?? TryBuildPostgresConnectionStringFromPgEnv(configuration)
            ?? throw new InvalidOperationException(
                "Postgres connection string not configured. Set ConnectionStrings:Postgres, POSTGRES_CONNECTION_STRING, or DATABASE_URL.");
    }

    private static string? TryBuildPostgresConnectionStringFromDatabaseUrl(string? databaseUrl)
    {
        if (string.IsNullOrWhiteSpace(databaseUrl)) return null;

        if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri)) return null;

        if (!string.Equals(uri.Scheme, "postgres", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(uri.Scheme, "postgresql", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var database = uri.AbsolutePath.Trim('/');
        if (string.IsNullOrWhiteSpace(uri.Host) || string.IsNullOrWhiteSpace(database)) return null;

        var user = string.Empty;
        var password = string.Empty;
        if (!string.IsNullOrWhiteSpace(uri.UserInfo))
        {
            var parts = uri.UserInfo.Split(':', 2, StringSplitOptions.None);
            user = Uri.UnescapeDataString(parts[0]);
            if (parts.Length > 1) password = Uri.UnescapeDataString(parts[1]);
        }

        if (string.IsNullOrWhiteSpace(user)) return null;

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(database),
            Username = user,
            Password = password
        };

        foreach (var (key, value) in ParseQuery(uri.Query))
        {
            if (key.Equals("sslmode", StringComparison.OrdinalIgnoreCase))
            {
                if (Enum.TryParse<SslMode>(value, true, out var sslMode))
                {
                    builder.SslMode = sslMode;
                }
                else if (string.Equals(value, "require", StringComparison.OrdinalIgnoreCase))
                {
                    builder.SslMode = SslMode.Require;
                }
            }
            else if (key.Equals("ssl", StringComparison.OrdinalIgnoreCase))
            {
                if (string.Equals(value, "true", StringComparison.OrdinalIgnoreCase) || value == "1")
                {
                    builder.SslMode = SslMode.Require;
                }
            }
        }

        return builder.ConnectionString;
    }

    private static string? TryBuildPostgresConnectionStringFromPgEnv(IConfiguration configuration)
    {
        var host = configuration["PGHOST"];
        var database = configuration["PGDATABASE"];
        var user = configuration["PGUSER"];
        var password = configuration["PGPASSWORD"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(database) || string.IsNullOrWhiteSpace(user))
        {
            return null;
        }

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Database = database,
            Username = user,
            Password = password ?? string.Empty
        };

        var portEnv = configuration["PGPORT"];
        if (int.TryParse(portEnv, out var port) && port > 0)
        {
            builder.Port = port;
        }

        var sslModeEnv = configuration["PGSSLMODE"];
        if (!string.IsNullOrWhiteSpace(sslModeEnv) && Enum.TryParse<SslMode>(sslModeEnv, true, out var sslMode))
        {
            builder.SslMode = sslMode;
        }

        return builder.ConnectionString;
    }

    private static IEnumerable<(string key, string value)> ParseQuery(string? query)
    {
        var q = (query ?? string.Empty).TrimStart('?');
        if (string.IsNullOrWhiteSpace(q)) yield break;

        foreach (var pair in q.Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var idx = pair.IndexOf('=');
            if (idx <= 0 || idx >= pair.Length - 1) continue;

            var key = Uri.UnescapeDataString(pair[..idx]);
            var value = Uri.UnescapeDataString(pair[(idx + 1)..]);
            yield return (key, value);
        }
    }

    public async Task<DbUser?> FindUserByEmailAsync(string email, CancellationToken ct)
    {
        const string sql = """
                           SELECT id, email, password_hash, display_name, is_email_verified, status,
                                  failed_login_attempts, locked_until, password_changed_at
                           FROM app_user
                           WHERE email = @email
                           LIMIT 1;
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("email", email);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return null;

        return new DbUser(
            Id: reader.GetGuid(0),
            Email: reader.GetString(1),
            PasswordHash: reader.GetString(2),
            DisplayName: reader.IsDBNull(3) ? null : reader.GetString(3),
            IsEmailVerified: reader.GetBoolean(4),
            Status: reader.GetString(5),
            FailedLoginAttempts: reader.GetInt32(6),
            LockedUntil: reader.IsDBNull(7) ? null : reader.GetFieldValue<DateTimeOffset>(7),
            PasswordChangedAt: reader.IsDBNull(8) ? null : reader.GetFieldValue<DateTimeOffset>(8)
        );
    }

    public async Task<IReadOnlyList<string>> GetRoleCodesAsync(Guid userId, CancellationToken ct)
    {
        const string sql = """
                           SELECT r.code
                           FROM user_role ur
                           JOIN app_role r ON r.id = ur.role_id
                           WHERE ur.user_id = @userId
                           ORDER BY r.code;
                           """;

        var roles = new List<string>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            roles.Add(reader.GetString(0));
        }

        return roles;
    }

    public async Task<(string planCode, int maxIndicators, int maxBacktestsPerDay)> GetEntitlementAsync(Guid userId, CancellationToken ct)
    {
        const string sql = """
                           SELECT plan_code, max_indicators, max_backtests_per_day
                           FROM v_user_entitlement
                           WHERE user_id = @userId
                           LIMIT 1;
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct))
        {
            return ("free", 1, 0);
        }

        var planCode = reader.GetString(0);
        var maxIndicators = reader.GetInt32(1);
        var maxBacktestsPerDay = reader.GetInt32(2);
        return (planCode, maxIndicators, maxBacktestsPerDay);
    }

    public async Task<Guid> CreateUserAsync(string email, string passwordHash, string? displayName, CancellationToken ct, string preferredLanguage = "en")
    {
        // Validate language code
        var validLangs = new[] { "en", "tr", "th", "ru", "zh", "es" };
        var lang = validLangs.Contains(preferredLanguage) ? preferredLanguage : "en";

        const string sql = """
                           INSERT INTO app_user (email, password_hash, display_name, preferred_language)
                           VALUES (@email, @passwordHash, @displayName, @lang)
                           RETURNING id;
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("email", email);
        cmd.Parameters.AddWithValue("passwordHash", passwordHash);
        cmd.Parameters.AddWithValue("displayName", (object?)displayName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("lang", lang);
        var result = await cmd.ExecuteScalarAsync(ct);
        if (result is not Guid id) throw new InvalidOperationException("Failed to create user.");
        return id;
    }

    public async Task UpdatePreferredLanguageAsync(Guid userId, string language, CancellationToken ct)
    {
        var validLangs = new[] { "en", "tr", "th", "ru", "zh", "es" };
        var lang = validLangs.Contains(language) ? language : "en";

        const string sql = """
                           UPDATE app_user
                           SET preferred_language = @lang
                           WHERE id = @userId;
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("lang", lang);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task UpdateDisplayNameAsync(Guid userId, string displayName, CancellationToken ct)
    {
        const string sql = """
                           UPDATE app_user
                           SET display_name = @displayName
                           WHERE id = @userId;
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("displayName", (object?)displayName ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task<int> CountBacktestRunsSinceAsync(Guid userId, DateTime sinceUtc, CancellationToken ct)
    {
        const string sql = """
                           SELECT count(*)
                           FROM user_backtest_run
                           WHERE user_id = @userId
                             AND created_at >= @since;
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("since", sinceUtc);
        var result = await cmd.ExecuteScalarAsync(ct);
        if (result is null) return 0;
        return Convert.ToInt32(result);
    }

    public async Task RecordBacktestRunAsync(Guid userId, CancellationToken ct)
    {
        const string sql = """
                           INSERT INTO user_backtest_run (user_id)
                           VALUES (@userId);
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task UpdateLoginSuccessAsync(Guid userId, CancellationToken ct)
    {
        const string sql = """
                           UPDATE app_user
                           SET failed_login_attempts = 0,
                               locked_until = NULL,
                               last_login_at = now()
                           WHERE id = @userId;
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task UpdateLoginFailureAsync(Guid userId, int newFailedAttempts, DateTimeOffset? lockedUntil, CancellationToken ct)
    {
        const string sql = """
                           UPDATE app_user
                           SET failed_login_attempts = @failed,
                               locked_until = @lockedUntil
                           WHERE id = @userId;
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("failed", newFailedAttempts);
        cmd.Parameters.AddWithValue("lockedUntil", (object?)lockedUntil?.UtcDateTime ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task<(DbSession? session, DbUser? user)> FindSessionByRefreshHashAsync(string refreshTokenHash, CancellationToken ct)
    {
        const string sql = """
                           SELECT s.id, s.user_id, s.expires_at, s.revoked_at,
                                  u.id, u.email, u.password_hash, u.display_name, u.is_email_verified, u.status,
                                  u.failed_login_attempts, u.locked_until, u.password_changed_at
                           FROM user_session s
                           JOIN app_user u ON u.id = s.user_id
                           WHERE s.refresh_token_hash = @hash
                           LIMIT 1;
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("hash", refreshTokenHash);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        if (!await reader.ReadAsync(ct)) return (null, null);

        var session = new DbSession(
            Id: reader.GetGuid(0),
            UserId: reader.GetGuid(1),
            ExpiresAt: reader.GetFieldValue<DateTimeOffset>(2),
            RevokedAt: reader.IsDBNull(3) ? null : reader.GetFieldValue<DateTimeOffset>(3));

        var user = new DbUser(
            Id: reader.GetGuid(4),
            Email: reader.GetString(5),
            PasswordHash: reader.GetString(6),
            DisplayName: reader.IsDBNull(7) ? null : reader.GetString(7),
            IsEmailVerified: reader.GetBoolean(8),
            Status: reader.GetString(9),
            FailedLoginAttempts: reader.GetInt32(10),
            LockedUntil: reader.IsDBNull(11) ? null : reader.GetFieldValue<DateTimeOffset>(11),
            PasswordChangedAt: reader.IsDBNull(12) ? null : reader.GetFieldValue<DateTimeOffset>(12));

        return (session, user);
    }

    public async Task<Guid> CreateSessionAsync(
        Guid userId,
        string refreshTokenHash,
        DateTimeOffset expiresAt,
        string? userAgent,
        IPAddress? ip,
        CancellationToken ct)
    {
        const string sql = """
                           INSERT INTO user_session (user_id, refresh_token_hash, user_agent, ip, expires_at, last_used_at)
                           VALUES (@userId, @hash, @ua, @ip, @expiresAt, now())
                           RETURNING id;
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("hash", refreshTokenHash);
        cmd.Parameters.AddWithValue("ua", (object?)userAgent ?? DBNull.Value);
        var ipParam = new NpgsqlParameter("ip", NpgsqlDbType.Inet)
        {
            Value = (object?)ip ?? DBNull.Value
        };
        cmd.Parameters.Add(ipParam);
        cmd.Parameters.AddWithValue("expiresAt", expiresAt.UtcDateTime);
        var result = await cmd.ExecuteScalarAsync(ct);
        if (result is not Guid id) throw new InvalidOperationException("Failed to create session.");
        return id;
    }

    public async Task RevokeSessionAsync(Guid sessionId, CancellationToken ct)
    {
        const string sql = """
                           UPDATE user_session
                           SET revoked_at = now()
                           WHERE id = @id AND revoked_at IS NULL;
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", sessionId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task<Guid> RotateSessionAsync(
        Guid oldSessionId,
        Guid userId,
        string newRefreshTokenHash,
        DateTimeOffset expiresAt,
        string? userAgent,
        IPAddress? ip,
        CancellationToken ct)
    {
        const string revokeSql = """
                                 UPDATE user_session
                                 SET revoked_at = now()
                                 WHERE id = @id AND revoked_at IS NULL;
                                 """;

        const string insertSql = """
                                 INSERT INTO user_session (user_id, refresh_token_hash, user_agent, ip, expires_at, last_used_at)
                                 VALUES (@userId, @hash, @ua, @ip, @expiresAt, now())
                                 RETURNING id;
                                 """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var tx = await conn.BeginTransactionAsync(ct);

        await using (var revokeCmd = new NpgsqlCommand(revokeSql, conn, tx))
        {
            revokeCmd.Parameters.AddWithValue("id", oldSessionId);
            await revokeCmd.ExecuteNonQueryAsync(ct);
        }

        Guid newId;
        await using (var insertCmd = new NpgsqlCommand(insertSql, conn, tx))
        {
            insertCmd.Parameters.AddWithValue("userId", userId);
            insertCmd.Parameters.AddWithValue("hash", newRefreshTokenHash);
            insertCmd.Parameters.AddWithValue("ua", (object?)userAgent ?? DBNull.Value);
            var ipParam = new NpgsqlParameter("ip", NpgsqlDbType.Inet)
            {
                Value = (object?)ip ?? DBNull.Value
            };
            insertCmd.Parameters.Add(ipParam);
            insertCmd.Parameters.AddWithValue("expiresAt", expiresAt.UtcDateTime);
            var result = await insertCmd.ExecuteScalarAsync(ct);
            if (result is not Guid id) throw new InvalidOperationException("Failed to rotate session.");
            newId = id;
        }

        await tx.CommitAsync(ct);
        return newId;
    }

    public async Task RevokeAllSessionsForUserAsync(Guid userId, CancellationToken ct)
    {
        const string sql = """
                           UPDATE user_session
                           SET revoked_at = now()
                           WHERE user_id = @userId AND revoked_at IS NULL;
                           """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        await cmd.ExecuteNonQueryAsync(ct);
    }
}
