namespace ProductionQueryEditor.Application.Dtos;

public class ExecuteQueryResponse
{
    public required string[]    Columns  { get; set; }
    public required object?[][] Rows     { get; set; }
    public int                  RowCount { get; set; }
    public long                 Took     { get; set; }
    public string               Plan     { get; set; } = "";
}
