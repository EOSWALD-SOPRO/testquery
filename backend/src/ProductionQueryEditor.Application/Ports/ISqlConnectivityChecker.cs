using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.Ports;

/// <summary>Lightweight connectivity probe used by the health endpoint.</summary>
public interface ISqlConnectivityChecker
{
    /// <summary>Returns true if a fresh connection to <paramref name="env"/> opens and answers <c>SELECT 1</c>.</summary>
    Task<bool> PingAsync(EnvironmentName env, CancellationToken ct);
}
