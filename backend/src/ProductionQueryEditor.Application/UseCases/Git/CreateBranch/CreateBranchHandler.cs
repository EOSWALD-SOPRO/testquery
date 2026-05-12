using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.UseCases.Git.CreateBranch;

public sealed record CreateBranchCommand(string? Name);

public sealed record CreateBranchResult(string Branch);

public sealed class CreateBranchHandler
{
    private readonly IGitOperations _git;
    public CreateBranchHandler(IGitOperations git) => _git = git;

    public async Task<Result<CreateBranchResult>> HandleAsync(CreateBranchCommand cmd, CancellationToken ct)
    {
        var branch = BranchName.Create(cmd.Name);
        if (branch.IsFailure) return Result<CreateBranchResult>.Failure(branch.Error!);

        await _git.CreateBranchAsync(branch.Value!, ct);
        return Result<CreateBranchResult>.Success(new CreateBranchResult(branch.Value!.Value));
    }
}
