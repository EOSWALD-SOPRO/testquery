namespace ProductionQueryEditor.Infrastructure.Git;

public sealed class GitOptions
{
    public string RepoPath  { get; set; } = "./repo";
    public string UserName  { get; set; } = "Production Query Editor";
    public string UserEmail { get; set; } = "pqe@soprofen.local";
}
