using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Application.UseCases.Git.GetBranches;

public sealed record GetBranchesQuery();

public sealed class GetBranchesHandler
{
    private readonly IGitOperations _git;
    public GetBranchesHandler(IGitOperations git) => _git = git;

    public async Task<Result<BranchListInfo>> HandleAsync(GetBranchesQuery _, CancellationToken ct)
        => Result<BranchListInfo>.Success(await _git.GetBranchesAsync(ct));
}
