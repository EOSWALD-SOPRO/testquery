namespace ProductionQueryEditor.Application.UseCases.ExecuteQuery;

/// <summary>Raw input from the boundary (HTTP). Validation happens inside the handler.</summary>
/// <param name="Sql">Raw SQL script — validated by SqlScript VO.</param>
/// <param name="Env">"TRN" | "PRD" — validated by EnvironmentName VO.</param>
/// <param name="RowLimit">Max rows to return. Null = unlimited.</param>
public sealed record ExecuteQueryCommand(string? Sql, string? Env, int? RowLimit = null);
