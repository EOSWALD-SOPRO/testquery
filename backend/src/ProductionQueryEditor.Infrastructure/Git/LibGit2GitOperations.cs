using LibGit2Sharp;
using LibGit2Sharp.Handlers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Infrastructure.GitHub;
using DomainBranchName = ProductionQueryEditor.Domain.ValueObjects.BranchName;

namespace ProductionQueryEditor.Infrastructure.Git;

public sealed class LibGit2GitOperations : IGitOperations
{
    private readonly GitOptions _opts;
    private readonly Identity _identity;
    private readonly CredentialsHandler? _credentials;
    private readonly ILogger<LibGit2GitOperations> _logger;

    public LibGit2GitOperations(IOptions<GitOptions> gitOpts, IOptions<GitHubOptions> ghOpts, ILogger<LibGit2GitOperations> logger)
    {
        _opts = gitOpts.Value;
        _logger = logger;
        _identity = new Identity(_opts.UserName, _opts.UserEmail);

        var token = ghOpts.Value.Token;
        if (!string.IsNullOrWhiteSpace(token))
            _credentials = (_, _, _) => new UsernamePasswordCredentials { Username = token, Password = "" };
    }

    private Repository Open()
    {
        if (!Repository.IsValid(_opts.RepoPath))
            throw new InvalidOperationException(
                $"No git repository at '{_opts.RepoPath}'. Clone the queries repo there first.");
        return new Repository(_opts.RepoPath);
    }

    public Task<BranchListInfo> GetBranchesAsync(CancellationToken ct)
    {
        using var repo = Open();
        var info = new BranchListInfo
        {
            Current  = repo.Head.FriendlyName,
            Branches = repo.Branches.Where(b => !b.IsRemote).Select(b => b.FriendlyName).OrderBy(n => n).ToList(),
        };
        return Task.FromResult(info);
    }

    public Task CreateBranchAsync(DomainBranchName name, CancellationToken ct)
    {
        using var repo = Open();
        var branch = repo.CreateBranch(name.Value);
        Commands.Checkout(repo, branch);
        return Task.CompletedTask;
    }

    public Task CheckoutAsync(DomainBranchName name, CancellationToken ct)
    {
        using var repo = Open();
        var branch = repo.Branches[name.Value]
            ?? throw new ArgumentException($"Branch '{name.Value}' does not exist");
        Commands.Checkout(repo, branch);
        return Task.CompletedTask;
    }

    public Task<CommitResult> CommitAsync(string message, IReadOnlyList<string>? files, CancellationToken ct)
    {
        using var repo = Open();
        if (files is { Count: > 0 })
            foreach (var f in files) Commands.Stage(repo, f);
        else
            Commands.Stage(repo, "*");

        var sig = new Signature(_identity, DateTimeOffset.Now);
        var commit = repo.Commit(message, sig, sig);
        return Task.FromResult(new CommitResult
        {
            Commit  = commit.Sha,
            Summary = new CommitSummary { Changes = files?.Count ?? 0 },
        });
    }

    public Task PushAsync(DomainBranchName branch, CancellationToken ct)
    {
        using var repo = Open();
        var remote = repo.Network.Remotes["origin"]
            ?? throw new InvalidOperationException("No 'origin' remote configured on the queries repo");
        var pushOpts = new PushOptions { CredentialsProvider = _credentials };
        var refSpec  = $"refs/heads/{branch.Value}:refs/heads/{branch.Value}";
        repo.Network.Push(remote, refSpec, pushOpts);
        return Task.CompletedTask;
    }

    public Task<List<CommitInfo>> GetHistoryAsync(int limit, CancellationToken ct)
    {
        using var repo = Open();
        var list = repo.Commits.Take(limit).Select(c => new CommitInfo
        {
            Hash      = c.Sha,
            ShortHash = c.Sha[..7],
            Message   = c.MessageShort,
            Author    = c.Author.Name,
            Email     = c.Author.Email,
            Date      = c.Author.When.UtcDateTime.ToString("O"),
        }).ToList();
        return Task.FromResult(list);
    }
}
