using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.UseCases.ExecuteQuery;

/// <summary>
/// Validates the user-provided SQL + env via Domain VOs, then delegates execution
/// to <see cref="ISqlExecutor"/>. Any expected failure (invalid env, empty SQL,
/// forbidden keyword) is returned as a <see cref="DomainError"/> via <see cref="Result{T}"/>;
/// only unexpected exceptions (DB unreachable, timeout) bubble up.
/// </summary>
public sealed class ExecuteQueryHandler
{
    private readonly ISqlExecutor _executor;

    public ExecuteQueryHandler(ISqlExecutor executor) => _executor = executor;

    public async Task<Result<ExecuteQueryResponse>> HandleAsync(ExecuteQueryCommand cmd, CancellationToken ct)
    {
        var envResult = EnvironmentName.Create(cmd.Env);
        if (envResult.IsFailure)
            return Result<ExecuteQueryResponse>.Failure(envResult.Error!);

        var sqlResult = SqlScript.Create(cmd.Sql);
        if (sqlResult.IsFailure)
            return Result<ExecuteQueryResponse>.Failure(sqlResult.Error!);

        var response = await _executor.ExecuteAsync(sqlResult.Value!, envResult.Value!, ct);
        return Result<ExecuteQueryResponse>.Success(response);
    }
}
