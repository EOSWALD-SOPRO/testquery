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

    public async Task<ExecuteQueryResponse> ExecuteAsync(SqlScript sql, EnvironmentName env, CancellationToken ct)
    {
        var sw = Stopwatch.StartNew();

        await using var conn = _factory.Create(env);
        await conn.OpenAsync(ct);

        await using var cmd = new SqlCommand(sql.Sql, conn) { CommandTimeout = 60 };
        await using var reader = await cmd.ExecuteReaderAsync(ct);

        var columns = new string[reader.FieldCount];
        for (int i = 0; i < reader.FieldCount; i++) columns[i] = reader.GetName(i);

        var rows = new List<object?[]>();
        while (await reader.ReadAsync(ct))
        {
            var row = new object?[reader.FieldCount];
            for (int i = 0; i < reader.FieldCount; i++)
                row[i] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            rows.Add(row);
        }

        sw.Stop();
        _logger.LogInformation("ExecuteQuery {Env} -> {RowCount} rows in {Took}ms",
            env.Value, rows.Count, sw.ElapsedMilliseconds);

        return new ExecuteQueryResponse
        {
            Columns  = columns,
            Rows     = rows.ToArray(),
            RowCount = rows.Count,
            Took     = sw.ElapsedMilliseconds,
            Plan     = $"Executed on {env.Value} in {sw.ElapsedMilliseconds}ms",
        };
    }
}
