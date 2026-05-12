using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Infrastructure.Sql;

/// <summary>
/// Single source of truth for opening a SqlConnection per env. Used by the executor
/// and the connectivity checker — no duplication of "look up connection string by env" logic.
/// </summary>
public sealed class SqlConnectionFactory
{
    private readonly SqlConnectionOptions _options;

    public SqlConnectionFactory(IOptions<SqlConnectionOptions> options) => _options = options.Value;

    public string GetConnectionString(EnvironmentName env) => env.Value switch
    {
        "TRN" => RequireConfigured(_options.SqlTRN, "SqlTRN"),
        "PRD" => RequireConfigured(_options.SqlPRD, "SqlPRD"),
        _     => throw new InvalidOperationException($"Unknown environment '{env.Value}'"),  // VO guarantees this can't happen
    };

    public SqlConnection Create(EnvironmentName env) => new(GetConnectionString(env));

    private static string RequireConfigured(string value, string key)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException($"ConnectionStrings:{key} is not configured in appsettings.json");
        return value;
    }
}
