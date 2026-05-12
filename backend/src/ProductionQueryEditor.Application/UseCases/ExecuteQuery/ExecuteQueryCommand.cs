namespace ProductionQueryEditor.Application.UseCases.ExecuteQuery;

/// <summary>Raw input from the boundary (HTTP). Validation happens inside the handler.</summary>
public sealed record ExecuteQueryCommand(string? Sql, string? Env);
