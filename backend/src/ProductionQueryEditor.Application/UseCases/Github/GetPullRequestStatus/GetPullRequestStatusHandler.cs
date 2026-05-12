using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Application.UseCases.Github.GetPullRequestStatus;

public sealed record GetPullRequestStatusQuery(int Number);

public sealed class GetPullRequestStatusHandler
{
    private readonly IGitHubClient _gh;
    public GetPullRequestStatusHandler(IGitHubClient gh) => _gh = gh;

    public async Task<Result<PullRequestStatus>> HandleAsync(GetPullRequestStatusQuery q, CancellationToken ct)
        => Result<PullRequestStatus>.Success(await _gh.GetPullRequestStatusAsync(q.Number, ct));
}
