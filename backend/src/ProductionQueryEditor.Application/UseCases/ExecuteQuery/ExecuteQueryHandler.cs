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

        // Defensive: clamp non-positive limits to null (= unlimited) instead of failing.
        // The frontend ships well-formed presets; a 0 or negative value would just produce
        // an empty result set, which is more confusing than a noop.
        var rowLimit = cmd.RowLimit is > 0 ? cmd.RowLimit : null;

        // Normalise les valeurs cote UI : un AttributeModel blanc/vide doit etre traite
        // comme "absent" (typiquement les CUParameter qui n'envoient rien).
        var parameters = new SqlQueryParameters(
            cmd.WorkCenterId,
            string.IsNullOrWhiteSpace(cmd.AttributeModel) ? null : cmd.AttributeModel);

        var response = await _executor.ExecuteAsync(sqlResult.Value!, envResult.Value!, rowLimit, parameters, ct);
        return Result<ExecuteQueryResponse>.Success(response);
    }
}
