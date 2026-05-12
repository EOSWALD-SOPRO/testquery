using ProductionQueryEditor.Application.Dtos;

namespace ProductionQueryEditor.Application.Ports;

/// <summary>
/// Operations against the GitHub repository (PRs, collaborators). Implemented in Infrastructure (Octokit).
/// </summary>
public interface IGitHubClient
{
    Task<PullRequestInfo>        CreatePullRequestAsync   (string title, string body, string branch, string baseBranch, IReadOnlyList<string> reviewers, CancellationToken ct);
    Task<PullRequestStatus>      GetPullRequestStatusAsync(int number, CancellationToken ct);
    Task<List<PullRequestInfo>>  ListPullRequestsAsync    (string state, CancellationToken ct);
    Task<MergeInfo>              MergePullRequestAsync    (int number, string mergeMethod, CancellationToken ct);
    Task<List<CollaboratorInfo>> ListCollaboratorsAsync   (CancellationToken ct);
}
