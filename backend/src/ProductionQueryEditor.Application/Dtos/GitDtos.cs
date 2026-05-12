namespace ProductionQueryEditor.Application.Dtos;

public sealed class BranchListInfo
{
    public required string       Current  { get; set; }
    public required List<string> Branches { get; set; }
}

public sealed class CommitInfo
{
    public required string Hash      { get; set; }
    public required string ShortHash { get; set; }
    public required string Message   { get; set; }
    public required string Author    { get; set; }
    public string         Email      { get; set; } = "";
    public required string Date      { get; set; }
}

public sealed class CommitResult
{
    public required string Commit  { get; set; }
    public required CommitSummary Summary { get; set; }
}

public sealed class CommitSummary
{
    public int Changes { get; set; }
}
