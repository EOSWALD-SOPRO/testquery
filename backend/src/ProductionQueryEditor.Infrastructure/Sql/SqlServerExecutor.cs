using System.Diagnostics;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Infrastructure.Sql;

/// <summary>
/// SQL Server adapter for <see cref="ISqlExecutor"/>. The read-only guard already ran
/// (the SqlScript VO won't construct otherwise), so this class only opens the connection,
/// runs the reader, and shapes the result.
/// </summary>
public sealed class SqlServerExecutor : ISqlExecutor
{
    private readonly SqlConnectionFactory _factory;
    private readonly ILogger<SqlServerExecutor> _logger;

    public SqlServerExecutor(SqlConnectionFactory factory, ILogger<SqlServerExecutor> logger)
    {
        _factory = factory;
        _logger  = logger;
    }

    public async Task<ExecuteQueryResponse> ExecuteAsync(SqlScript sql, EnvironmentName env, int? rowLimit, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();

        await using var conn = _factory.Create(env);
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand(sql.Sql, conn) { CommandTimeout = 60 };
        await using var reader = await cmd.ExecuteReaderAsync(ct);

        var columns = new string[reader.FieldCount];
        for (int i = 0; i < reader.FieldCount; i++) columns[i] = reader.GetName(i);

        var rows = new List<object?[]>();
        var truncated = false;
        while (await reader.ReadAsync(ct))
        {
            // Stop the reader as soon as we've buffered `rowLimit` rows. Note we don't
            // inject TOP into the SQL because (a) the script can contain CTEs/ORDER BY
            // that would conflict, and (b) we want the limit to apply even when the user
            // writes their own TOP — whichever is smaller wins.
            if (rowLimit is int limit && rows.Count >= limit)
            {
                truncated = true;
                break;
            }

            var row = new object?[reader.FieldCount];
            for (int i = 0; i < reader.FieldCount; i++)
                row[i] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            rows.Add(row);
        }

        sw.Stop();
        _logger.LogInformation("ExecuteQuery {Env} -> {RowCount} rows in {Took}ms (limit={Limit}, truncated={Truncated})",
            env.Value, rows.Count, sw.ElapsedMilliseconds, rowLimit, truncated);

        return new ExecuteQueryResponse
        {
            Columns      = columns,
            Rows         = rows.ToArray(),
            RowCount     = rows.Count,
            Took         = sw.ElapsedMilliseconds,
            Plan         = $"Executed on {env.Value} in {sw.ElapsedMilliseconds}ms",
            Truncated    = truncated,
            AppliedLimit = rowLimit,
        };
    }
}
