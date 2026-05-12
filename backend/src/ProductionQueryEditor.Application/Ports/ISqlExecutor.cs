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
    /// Both arguments are guaranteed valid by construction (Domain VOs):
    /// the SQL has passed the read-only guard and the env is TRN or PRD.
    /// </remarks>
    Task<ExecuteQueryResponse> ExecuteAsync(SqlScript sql, EnvironmentName env, CancellationToken ct);
}
