namespace ProductionQueryEditor.Application.Dtos;

public class ExecuteQueryRequest
{
    public required string Sql { get; set; }
    public required string Env { get; set; }   // "TRN" | "PRD"
}
