using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Application.UseCases.Git.GetCommitHistory;

public sealed record GetCommitHistoryQuery(int Limit);

public sealed class GetCommitHistoryHandler
{
    private readonly IGitOperations _git;
    public GetCommitHistoryHandler(IGitOperations git) => _git = git;

    public async Task<Result<List<CommitInfo>>> HandleAsync(GetCommitHistoryQuery q, CancellationToken ct)
    {
        var limit = q.Limit <= 0 ? 20 : Math.Min(q.Limit, 200);
        return Result<List<CommitInfo>>.Success(await _git.GetHistoryAsync(limit, ct));
    }
}
