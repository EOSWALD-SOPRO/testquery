namespace ProductionQueryEditor.Application.Dtos;

public class CreateBranchRequest    { public required string Name   { get; set; } }
public class CheckoutRequest        { public required string Branch { get; set; } }
public class CommitRequest          { public required string  Message { get; set; }
                                       public string[]?       Files   { get; set; } }

public class PullRequestCreateRequest
{
    public required string   Title      { get; set; }
    public string            Body       { get; set; } = "";
    public required string   Branch     { get; set; }
    public string            BaseBranch { get; set; } = "main";
    public string[]?         Reviewers  { get; set; }
}
