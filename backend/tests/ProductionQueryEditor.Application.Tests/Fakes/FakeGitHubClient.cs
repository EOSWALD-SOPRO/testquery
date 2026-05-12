using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;

namespace ProductionQueryEditor.Application.Tests.Fakes;

public sealed class FakeGitHubClient : IGitHubClient
{
    public List<(string Title, string Body, string Branch, string BaseBranch, IReadOnlyList<string> Reviewers)> CreateCalls { get; } = new();
    public PullRequestInfo CreateResponse { get; set; } = new()
    {
        Number = 1, Title = "fake", State = "open", Author = "tester", Branch = "main", Url = "", CreatedAt = "",
    };

    public Task<PullRequestInfo> CreatePullRequestAsync(string title, string body, string branch, string baseBranch, IReadOnlyList<string> reviewers, CancellationToken ct)
    {
        CreateCalls.Add((title, body, branch, baseBranch, reviewers));
        return Task.FromResult(CreateResponse);
    }

    public Task<PullRequestStatus> GetPullRequestStatusAsync(int number, CancellationToken ct)
        => Task.FromResult(new PullRequestStatus { Number = number, State = "open", Merged = false });

    public Task<List<PullRequestInfo>> ListPullRequestsAsync(string state, CancellationToken ct)
        => Task.FromResult(new List<PullRequestInfo>());

    public Task<MergeInfo> MergePullRequestAsync(int number, string mergeMethod, CancellationToken ct)
        => Task.FromResult(new MergeInfo { Merged = true, Sha = "abc", Message = mergeMethod });

    public Task<List<CollaboratorInfo>> ListCollaboratorsAsync(CancellationToken ct)
        => Task.FromResult(new List<CollaboratorInfo>());
}
