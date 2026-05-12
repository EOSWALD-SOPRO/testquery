namespace ProductionQueryEditor.Application.Dtos;

public class ExecuteQueryResponse
{
    public required string[]    Columns  { get; set; }
    public required object?[][] Rows     { get; set; }
    public int                  RowCount { get; set; }
    public long                 Took     { get; set; }
    public string               Plan     { get; set; } = "";

    /// <summary>
    /// True if the result set was clipped because RowLimit was reached.
    /// The frontend uses this to render a "tronque" banner.
    /// </summary>
    public bool                 Truncated { get; set; }

    /// <summary>The limit that was applied (null when no limit was requested).</summary>
    public int?                 AppliedLimit { get; set; }
}
