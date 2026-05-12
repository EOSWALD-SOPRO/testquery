using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Application.UseCases.Github.MergePullRequest;

public sealed record MergePullRequestCommand(int Number, string? MergeMethod);

public sealed class MergePullRequestHandler
{
    private readonly IGitHubClient _gh;
    public MergePullRequestHandler(IGitHubClient gh) => _gh = gh;

    public async Task<Result<MergeInfo>> HandleAsync(MergePullRequestCommand cmd, CancellationToken ct)
    {
        var method = string.IsNullOrWhiteSpace(cmd.MergeMethod) ? "squash" : cmd.MergeMethod!;
        return Result<MergeInfo>.Success(await _gh.MergePullRequestAsync(cmd.Number, method, ct));
    }
}
