namespace ProductionQueryEditor.Application.Dtos;

public class ExecuteQueryRequest
{
    public required string Sql { get; set; }
    public required string Env { get; set; }   // "TRN" | "PRD"

    /// <summary>
    /// Maximum number of rows to return. Null = unlimited (dangerous for huge result sets,
    /// can crash the browser). The frontend exposes preset choices (100/500/1000/5000/10000/null).
    /// </summary>
    public int? RowLimit { get; set; }
}
