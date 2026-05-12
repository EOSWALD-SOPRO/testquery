using Microsoft.Extensions.Options;
using Octokit;
using ProductionQueryEditor.Application.Dtos;
using IGitHubClient = ProductionQueryEditor.Application.Ports.IGitHubClient;

namespace ProductionQueryEditor.Infrastructure.GitHub;

public sealed class OctokitGitHubClient : IGitHubClient
{
    private readonly GitHubClient _client;
    private readonly string _owner;
    private readonly string _repo;

    public OctokitGitHubClient(IOptions<GitHubOptions> options)
    {
        var opts = options.Value;
        if (string.IsNullOrWhiteSpace(opts.Token))
            throw new InvalidOperationException("GitHub:Token must be configured in appsettings.json");
        if (string.IsNullOrWhiteSpace(opts.Repo))
            throw new InvalidOperationException("GitHub:Repo must be configured (owner/repo)");

        var parts = opts.Repo.Split('/', 2);
        if (parts.Length != 2)
            throw new InvalidOperationException("GitHub:Repo must be in the form owner/repo");

        _owner = parts[0];
        _repo  = parts[1];
        _client = new GitHubClient(new ProductHeaderValue("ProductionQueryEditor")) { Credentials = new Credentials(opts.Token) };
    }

    public async Task<PullRequestInfo> CreatePullRequestAsync(string title, string body, string branch, string baseBranch, IReadOnlyList<string> reviewers, CancellationToken ct)
    {
        var pr = await _client.PullRequest.Create(_owner, _repo, new NewPullRequest(title, branch, baseBranch) { Body = body });

        if (reviewers.Count > 0)
        {
            try
            {
                await _client.PullRequest.ReviewRequest.Create(_owner, _repo, pr.Number,
                    new PullRequestReviewRequest(reviewers, Array.Empty<string>()));
            }
            catch { /* reviewer add failure shouldn't fail PR creation */ }
        }

        return ToInfo(pr);
    }

    public async Task<PullRequestStatus> GetPullRequestStatusAsync(int number, CancellationToken ct)
    {
        var pr     = await _client.PullRequest.Get(_owner, _repo, number);
        var checks = await _client.Check.Run.GetAllForReference(_owner, _repo, pr.Head.Sha);

        return new PullRequestStatus
        {
            Number    = pr.Number,
            State     = pr.State.ToString().ToLowerInvariant(),
            Mergeable = pr.Mergeable,
            Merged    = pr.Merged,
            Checks    = checks.CheckRuns.Select(c => new CheckRunInfo
            {
                Name       = c.Name,
                Status     = c.Status.StringValue,
                Conclusion = c.Conclusion?.StringValue,
                Url        = c.HtmlUrl,
            }).ToList(),
        };
    }

    public async Task<List<PullRequestInfo>> ListPullRequestsAsync(string state, CancellationToken ct)
    {
        var req = new PullRequestRequest
        {
            State = state.ToLowerInvariant() switch
            {
                "closed" => ItemStateFilter.Closed,
                "all"    => ItemStateFilter.All,
                _        => ItemStateFilter.Open,
            },
        };
        var prs = await _client.PullRequest.GetAllForRepository(_owner, _repo, req);
        return prs.Select(ToInfo).ToList();
    }

    public async Task<MergeInfo> MergePullRequestAsync(int number, string mergeMethod, CancellationToken ct)
    {
        var method = mergeMethod.ToLowerInvariant() switch
        {
            "rebase" => PullRequestMergeMethod.Rebase,
            "merge"  => PullRequestMergeMethod.Merge,
            _        => PullRequestMergeMethod.Squash,
        };
        var result = await _client.PullRequest.Merge(_owner, _repo, number, new MergePullRequest { MergeMethod = method });
        return new MergeInfo { Merged = result.Merged, Message = result.Message, Sha = result.Sha };
    }

    public async Task<List<CollaboratorInfo>> ListCollaboratorsAsync(CancellationToken ct)
    {
        try
        {
            var collabs = await _client.Repository.Collaborator.GetAll(_owner, _repo);
            return collabs.Select(u => new CollaboratorInfo { Login = u.Login, Name = u.Login, AvatarUrl = u.AvatarUrl }).ToList();
        }
        catch
        {
            return new List<CollaboratorInfo>();
        }
    }

    private static PullRequestInfo ToInfo(PullRequest pr) => new()
    {
        Number    = pr.Number,
        Title     = pr.Title,
        State     = pr.State.ToString().ToLowerInvariant(),
        Author    = pr.User.Login,
        Url       = pr.HtmlUrl,
        Branch    = pr.Head.Ref,
        CreatedAt = pr.CreatedAt.UtcDateTime.ToString("O"),
    };
}
