using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;
using FinancePlatform.Domain.Models;

namespace FinancePlatform.API.Auth;

public sealed class AlertRepository
{
    private readonly string _connectionString;

    public AlertRepository(IConfiguration configuration)
    {
        _connectionString =
            configuration.GetConnectionString("Postgres")
            ?? configuration["POSTGRES_CONNECTION_STRING"]
            ?? TryBuildFromDatabaseUrl(configuration["DATABASE_URL"])
            ?? throw new InvalidOperationException(
                "Postgres connection string not configured.");
    }

    private static string? TryBuildFromDatabaseUrl(string? databaseUrl)
    {
        if (string.IsNullOrWhiteSpace(databaseUrl)) return null;
        if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri)) return null;
        if (!uri.Scheme.StartsWith("postgres", StringComparison.OrdinalIgnoreCase)) return null;
        var database = uri.AbsolutePath.Trim('/');
        if (string.IsNullOrWhiteSpace(uri.Host) || string.IsNullOrWhiteSpace(database)) return null;
        var user = string.Empty;
        var password = string.Empty;
        if (!string.IsNullOrWhiteSpace(uri.UserInfo))
        {
            var parts = uri.UserInfo.Split(':', 2);
            user = Uri.UnescapeDataString(parts[0]);
            if (parts.Length > 1) password = Uri.UnescapeDataString(parts[1]);
        }
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(database),
            Username = user,
            Password = password
        };
        return builder.ConnectionString;
    }


    public async Task<List<AlertDto>> GetAlertsAsync(Guid userId, CancellationToken ct)
    {
        const string sql = """
            SELECT id, symbol, timeframe, alert_type, target_price,
                   indicator_type, signal_subtype, status, triggered_at,
                   trigger_message, name, created_at, condition, frequency, expiration_time, last_triggered_bar_time, settings
            FROM user_alert
            WHERE user_id = @userId AND status IN ('active', 'triggered')
            ORDER BY created_at DESC;
            """;

        var list = new List<AlertDto>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        await using var r = await cmd.ExecuteReaderAsync(ct);
        while (await r.ReadAsync(ct))
        {
            list.Add(new AlertDto
            {
                Id = r.GetGuid(0),
                Symbol = r.GetString(1),
                Timeframe = r.GetString(2),
                AlertType = r.GetString(3),
                TargetPrice = r.IsDBNull(4) ? null : r.GetDecimal(4),
                IndicatorType = r.IsDBNull(5) ? null : r.GetString(5),
                SignalSubtype = r.IsDBNull(6) ? null : r.GetString(6),
                Status = r.GetString(7),
                TriggeredAt = r.IsDBNull(8) ? null : r.GetDateTime(8),
                TriggerMessage = r.IsDBNull(9) ? null : r.GetString(9),
                Name = r.IsDBNull(10) ? null : r.GetString(10),
                CreatedAt = r.GetDateTime(11),
                Condition = r.IsDBNull(12) ? "Crossing" : r.GetString(12),
                Frequency = r.IsDBNull(13) ? "OnlyOnce" : r.GetString(13),
                ExpirationTime = r.IsDBNull(14) ? null : r.GetDateTime(14),
                LastTriggeredBarTime = r.IsDBNull(15) ? null : r.GetInt64(15),
                Settings = r.IsDBNull(16) ? "{}" : r.GetString(16)
            });
        }
        return list;
    }

    public async Task<List<AlertDto>> GetTriggeredAlertsAsync(Guid userId, CancellationToken ct)
    {
        const string sql = """
            SELECT id, symbol, timeframe, alert_type, target_price,
                   indicator_type, signal_subtype, status, triggered_at,
                   trigger_message, name, created_at
            FROM user_alert
            WHERE user_id = @userId AND status = 'triggered'
            ORDER BY triggered_at DESC NULLS LAST, created_at DESC;
            """;

        var list = new List<AlertDto>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        await using var r = await cmd.ExecuteReaderAsync(ct);
        while (await r.ReadAsync(ct))
        {
            list.Add(new AlertDto
            {
                Id = r.GetGuid(0),
                Symbol = r.GetString(1),
                Timeframe = r.GetString(2),
                AlertType = r.GetString(3),
                TargetPrice = r.IsDBNull(4) ? null : r.GetDecimal(4),
                IndicatorType = r.IsDBNull(5) ? null : r.GetString(5),
                SignalSubtype = r.IsDBNull(6) ? null : r.GetString(6),
                Status = r.GetString(7),
                TriggeredAt = r.IsDBNull(8) ? null : r.GetDateTime(8),
                TriggerMessage = r.IsDBNull(9) ? null : r.GetString(9),
                Name = r.IsDBNull(10) ? null : r.GetString(10),
                CreatedAt = r.GetDateTime(11)
            });
        }
        return list;
    }

    public async Task<Guid> CreateAlertAsync(Guid userId, CreateAlertRequest req, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO user_alert (user_id, symbol, timeframe, alert_type, target_price, indicator_type, signal_subtype, name, condition, frequency, expiration_time, settings)
            VALUES (@userId, @symbol, @timeframe, @alertType, @targetPrice, @indicatorType, @signalSubtype, @name, @condition, @frequency, @expirationTime, @settings)
            RETURNING id;
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("symbol", req.Symbol);
        cmd.Parameters.AddWithValue("timeframe", req.Timeframe ?? "1h");
        cmd.Parameters.AddWithValue("alertType", req.AlertType);
        cmd.Parameters.AddWithValue("targetPrice", (object?)req.TargetPrice ?? DBNull.Value);
        cmd.Parameters.AddWithValue("indicatorType", (object?)req.IndicatorType ?? DBNull.Value);
        cmd.Parameters.AddWithValue("signalSubtype", (object?)req.SignalSubtype ?? DBNull.Value);
        cmd.Parameters.AddWithValue("name", (object?)req.Name ?? DBNull.Value);
        cmd.Parameters.AddWithValue("condition", req.Condition);
        cmd.Parameters.AddWithValue("frequency", req.Frequency);
        cmd.Parameters.AddWithValue("expirationTime", (object?)req.ExpirationTime ?? DBNull.Value);
        cmd.Parameters.AddWithValue("settings", (object?)req.Settings ?? "{}");
        var result = await cmd.ExecuteScalarAsync(ct);
        return (Guid)result!;
    }

    public async Task DeleteAlertAsync(Guid userId, Guid alertId, CancellationToken ct)
    {
        const string sql = """
            UPDATE user_alert SET status = 'canceled', updated_at = now()
            WHERE id = @id AND user_id = @userId;
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", alertId);
        cmd.Parameters.AddWithValue("userId", userId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task DismissAlertAsync(Guid userId, Guid alertId, CancellationToken ct)
    {
        const string sql = """
            UPDATE user_alert SET status = 'expired', updated_at = now()
            WHERE id = @id AND user_id = @userId AND status = 'triggered';
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", alertId);
        cmd.Parameters.AddWithValue("userId", userId);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task<List<(Guid Id, Guid UserId, string Symbol, string AlertType, decimal TargetPrice, string Condition, string Frequency, DateTime? ExpirationTime, long? LastTriggeredBarTime)>> GetActivePriceAlertsAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT id, user_id, symbol, alert_type, target_price, condition, frequency, expiration_time, last_triggered_bar_time
            FROM user_alert
            WHERE status = 'active' AND alert_type IN ('price_above', 'price_below') AND target_price IS NOT NULL;
            """;

        var list = new List<(Guid, Guid, string, string, decimal, string, string, DateTime?, long?)>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var r = await cmd.ExecuteReaderAsync(ct);
        while (await r.ReadAsync(ct))
        {
            list.Add((
                r.GetGuid(0), 
                r.GetGuid(1), 
                r.GetString(2), 
                r.GetString(3), 
                r.GetDecimal(4),
                r.IsDBNull(5) ? "Crossing" : r.GetString(5),
                r.IsDBNull(6) ? "OnlyOnce" : r.GetString(6),
                r.IsDBNull(7) ? null : r.GetDateTime(7),
                r.IsDBNull(8) ? null : r.GetInt64(8)
            ));
        }
        return list;
    }

    public async Task<List<(Guid Id, Guid UserId, string Symbol, string Timeframe, string IndicatorType, string? SignalSubtype, DateTime CreatedAt, string Condition, string Frequency, DateTime? ExpirationTime, long? LastTriggeredBarTime)>> GetActiveIndicatorAlertsAsync(CancellationToken ct)
    {
        const string sql = """
            SELECT id, user_id, symbol, timeframe, indicator_type, signal_subtype, created_at, condition, frequency, expiration_time, last_triggered_bar_time
            FROM user_alert
            WHERE status = 'active' AND alert_type = 'indicator_signal' AND indicator_type IS NOT NULL;
            """;

        var list = new List<(Guid, Guid, string, string, string, string?, DateTime, string, string, DateTime?, long?)>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var r = await cmd.ExecuteReaderAsync(ct);
        while (await r.ReadAsync(ct))
        {
            list.Add((
                r.GetGuid(0), 
                r.GetGuid(1), 
                r.GetString(2), 
                r.GetString(3), 
                r.GetString(4), 
                r.IsDBNull(5) ? null : r.GetString(5),
                r.GetDateTime(6),
                r.IsDBNull(7) ? "Crossing" : r.GetString(7),
                r.IsDBNull(8) ? "OnlyOnce" : r.GetString(8),
                r.IsDBNull(9) ? null : r.GetDateTime(9),
                r.IsDBNull(10) ? null : r.GetInt64(10)
            ));
        }
        return list;
    }

    public async Task UpdateAlertLastTriggeredAsync(Guid alertId, long barTime, CancellationToken ct)
    {
        const string sql = "UPDATE user_alert SET last_triggered_bar_time = @barTime, updated_at = now() WHERE id = @id";
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", alertId);
        cmd.Parameters.AddWithValue("barTime", barTime);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task TriggerAlertAsync(Guid alertId, string message, CancellationToken ct)
    {
        const string sql = """
            UPDATE user_alert
            SET status = 'triggered', triggered_at = now(), trigger_message = @msg, updated_at = now()
            WHERE id = @id AND status = 'active';
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", alertId);
        cmd.Parameters.AddWithValue("msg", message);
        await cmd.ExecuteNonQueryAsync(ct);
    }


    public async Task<List<DrawingDto>> GetDrawingsAsync(Guid userId, string symbol, string timeframe, CancellationToken ct)
    {
        const string sql = """
            SELECT id, symbol, timeframe, drawing_type, data::text, created_at
            FROM user_drawing
            WHERE user_id = @userId AND symbol = @symbol AND timeframe = @timeframe
            ORDER BY created_at;
            """;

        var list = new List<DrawingDto>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("symbol", symbol);
        cmd.Parameters.AddWithValue("timeframe", timeframe);
        await using var r = await cmd.ExecuteReaderAsync(ct);
        while (await r.ReadAsync(ct))
        {
            list.Add(new DrawingDto
            {
                Id = r.GetGuid(0),
                Symbol = r.GetString(1),
                Timeframe = r.GetString(2),
                DrawingType = r.GetString(3),
                Data = r.GetString(4),
                CreatedAt = r.GetDateTime(5)
            });
        }
        return list;
    }

    public async Task<Guid> SaveDrawingAsync(Guid userId, SaveDrawingRequest req, CancellationToken ct)
    {
        const string sql = """
            INSERT INTO user_drawing (user_id, symbol, timeframe, drawing_type, data)
            VALUES (@userId, @symbol, @timeframe, @drawingType, @data::jsonb)
            RETURNING id;
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("symbol", req.Symbol);
        cmd.Parameters.AddWithValue("timeframe", req.Timeframe ?? "1h");
        cmd.Parameters.AddWithValue("drawingType", req.DrawingType);
        cmd.Parameters.AddWithValue("data", req.Data ?? "{}");
        var result = await cmd.ExecuteScalarAsync(ct);
        return (Guid)result!;
    }

    public async Task UpdateDrawingAsync(Guid userId, Guid drawingId, SaveDrawingRequest req, CancellationToken ct)
    {
        const string sql = """
            UPDATE user_drawing SET data = @data::jsonb, updated_at = now()
            WHERE id = @id AND user_id = @userId;
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", drawingId);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("data", req.Data ?? "{}");
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task DeleteDrawingAsync(Guid userId, Guid drawingId, CancellationToken ct)
    {
        const string sql = """
            DELETE FROM user_drawing WHERE id = @id AND user_id = @userId;
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", drawingId);
        cmd.Parameters.AddWithValue("userId", userId);
        await cmd.ExecuteNonQueryAsync(ct);
    }
}
