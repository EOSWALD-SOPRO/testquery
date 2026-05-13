using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.Tests.Fakes;

/// <summary>
/// Hand-rolled fake — records every call and returns a configurable canned response.
/// Architecture decision: no Moq for v1, fakes are explicit and avoid magic.
/// </summary>
public sealed class FakeSqlExecutor : ISqlExecutor
{
    public List<Call> Calls { get; } = new();
    public ExecuteQueryResponse Response { get; set; } = new()
    {
        Columns  = Array.Empty<string>(),
        Rows     = Array.Empty<object?[]>(),
        RowCount = 0,
        Took     = 0,
        Plan     = "fake",
    };
    public Exception? Throws { get; set; }

    public Task<ExecuteQueryResponse> ExecuteAsync(
        SqlScript sql,
        EnvironmentName env,
        int? rowLimit,
        SqlQueryParameters parameters,
        CancellationToken ct)
    {
        Calls.Add(new Call(sql, env, rowLimit, parameters, ct));
        if (Throws is not null) throw Throws;
        return Task.FromResult(Response);
    }

    public sealed record Call(
        SqlScript Sql,
        EnvironmentName Env,
        int? RowLimit,
        SqlQueryParameters Parameters,
        CancellationToken Ct);
}
