using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.Tests.Fakes;

public sealed class FakeSqlConnectivityChecker : ISqlConnectivityChecker
{
    /// <summary>Per-env override. Default for a missing env: true.</summary>
    public Dictionary<string, bool> Reachable { get; } = new() { ["TRN"] = true, ["PRD"] = true };

    public Task<bool> PingAsync(EnvironmentName env, CancellationToken ct)
        => Task.FromResult(Reachable.TryGetValue(env.Value, out var ok) ? ok : true);
}
