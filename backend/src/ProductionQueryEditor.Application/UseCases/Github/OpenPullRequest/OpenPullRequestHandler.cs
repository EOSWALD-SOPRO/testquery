using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.Errors;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.UseCases.Github.OpenPullRequest;

public sealed record OpenPullRequestCommand(
    string?              Title,
    string?              Body,
    string?              Branch,
    string?              BaseBranch,
    IReadOnlyList<string>? Reviewers);

public sealed class OpenPullRequestHandler
{
    private readonly IGitOperations _git;
    private readonly IGitHubClient _gh;

    public OpenPullRequestHandler(IGitOperations git, IGitHubClient gh) { _git = git; _gh = gh; }

    public async Task<Result<PullRequestInfo>> HandleAsync(OpenPullRequestCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.Title))
            return Result<PullRequestInfo>.Failure(new EmptyPullRequestTitleError());

        var branch = BranchName.Create(cmd.Branch);
        if (branch.IsFailure) return Result<PullRequestInfo>.Failure(branch.Error!);

        // Push the branch before opening the PR. Tolerate the "everything up-to-date"
        // case which manifests as the remote already having the same SHA — anything
        // else (auth failure, network) bubbles up as an exception caught by the middleware.
        try
        {
            await _git.PushAsync(branch.Value!, ct);
        }
        catch (Exception ex) when (IsAlreadyUpToDate(ex))
        {
            // OK: we just don't have new commits to push, the remote branch already exists.
        }

        var baseBranch = string.IsNullOrWhiteSpace(cmd.BaseBranch) ? "main" : cmd.BaseBranch!;
        var pr = await _gh.CreatePullRequestAsync(
            cmd.Title!,
            cmd.Body ?? string.Empty,
            branch.Value!.Value,
            baseBranch,
            cmd.Reviewers ?? Array.Empty<string>(),
            ct);

        return Result<PullRequestInfo>.Success(pr);
    }

    private static bool IsAlreadyUpToDate(Exception ex)
        => ex.Message.Contains("up-to-date", StringComparison.OrdinalIgnoreCase)
        || ex.Message.Contains("up to date", StringComparison.OrdinalIgnoreCase);
}

