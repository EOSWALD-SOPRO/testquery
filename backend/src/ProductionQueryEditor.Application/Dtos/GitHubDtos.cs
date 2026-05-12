namespace ProductionQueryEditor.Application.Dtos;

public sealed class PullRequestInfo
{
    public int    Number    { get; set; }
    public string Title     { get; set; } = "";
    public string State     { get; set; } = "";
    public string Author    { get; set; } = "";
    public string Url       { get; set; } = "";
    public string Branch    { get; set; } = "";
    public string CreatedAt { get; set; } = "";
}

public sealed class PullRequestStatus
{
    public int                Number    { get; set; }
    public string             State     { get; set; } = "";
    public bool?              Mergeable { get; set; }
    public bool               Merged    { get; set; }
    public List<CheckRunInfo> Checks    { get; set; } = new();
}

public sealed class CheckRunInfo
{
    public string  Name       { get; set; } = "";
    public string  Status     { get; set; } = "";
    public string? Conclusion { get; set; }
    public string  Url        { get; set; } = "";
}

public sealed class MergeInfo
{
    public bool   Merged  { get; set; }
    public string Message { get; set; } = "";
    public string Sha     { get; set; } = "";
}

public sealed class CollaboratorInfo
{
    public string Login     { get; set; } = "";
    public string Name      { get; set; } = "";
    public string AvatarUrl { get; set; } = "";
}
