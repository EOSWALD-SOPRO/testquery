namespace ProductionQueryEditor.Application.UseCases.ExecuteQuery;

/// <summary>Raw input from the boundary (HTTP). Validation happens inside the handler.</summary>
/// <param name="Sql">Raw SQL script — validated by SqlScript VO.</param>
/// <param name="Env">"TRN" | "PRD" — validated by EnvironmentName VO.</param>
/// <param name="RowLimit">Max rows to return. Null = unlimited.</param>
/// <param name="WorkCenterId">Valeur pour <c>@WorkCenter</c>/<c>@WorkCenterId</c> dans le script. Null = pas de liaison.</param>
/// <param name="AttributeModel">Valeur pour <c>@AttributeModel</c> dans le script. Null = pas de liaison.</param>
public sealed record ExecuteQueryCommand(
    string? Sql,
    string? Env,
    int? RowLimit = null,
    int? WorkCenterId = null,
    string? AttributeModel = null);
