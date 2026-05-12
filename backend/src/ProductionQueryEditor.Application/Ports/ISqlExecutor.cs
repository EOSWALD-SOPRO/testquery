using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.Ports;

/// <summary>
/// Executes a validated SQL script against a target environment.
/// Implementations live in Infrastructure.
/// </summary>
public interface ISqlExecutor
{
    /// <summary>Run the script and return its result set + timing.</summary>
    /// <remarks>
    /// Both VO arguments are guaranteed valid by construction:
    /// the SQL has passed the read-only guard and the env is TRN or PRD.
    /// <paramref name="rowLimit"/> is optional and validated by the handler (must be > 0 if set).
    /// When set, the adapter stops reading once the limit is reached and flags Truncated=true.
    /// </remarks>
    Task<ExecuteQueryResponse> ExecuteAsync(SqlScript sql, EnvironmentName env, int? rowLimit, CancellationToken ct);
}
