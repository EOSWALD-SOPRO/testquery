using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Application.UseCases.Github.ListPullRequests;

public sealed record ListPullRequestsQuery(string State);

public sealed class ListPullRequestsHandler
{
    private readonly IGitHubClient _gh;
    public ListPullRequestsHandler(IGitHubClient gh) => _gh = gh;

    public async Task<Result<List<PullRequestInfo>>> HandleAsync(ListPullRequestsQuery q, CancellationToken ct)
    {
        var state = string.IsNullOrWhiteSpace(q.State) ? "open" : q.State;
        return Result<List<PullRequestInfo>>.Success(await _gh.ListPullRequestsAsync(state, ct));
    }
}
