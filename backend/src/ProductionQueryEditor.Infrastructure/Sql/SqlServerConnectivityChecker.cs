using Microsoft.Data.SqlClient;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Infrastructure.Sql;

public sealed class SqlServerConnectivityChecker : ISqlConnectivityChecker
{
    private readonly SqlConnectionFactory _factory;

    public SqlServerConnectivityChecker(SqlConnectionFactory factory) => _factory = factory;

    public async Task<bool> PingAsync(EnvironmentName env, CancellationToken ct)
    {
        try
        {
            await using var conn = _factory.Create(env);
            await conn.OpenAsync(ct);
            await using var cmd = new SqlCommand("SELECT 1", conn);
            await cmd.ExecuteScalarAsync(ct);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
