using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.UseCases.Git.CheckoutBranch;

public sealed record CheckoutBranchCommand(string? Branch);

public sealed record CheckoutBranchResult(string Branch);

public sealed class CheckoutBranchHandler
{
    private readonly IGitOperations _git;
    public CheckoutBranchHandler(IGitOperations git) => _git = git;

    public async Task<Result<CheckoutBranchResult>> HandleAsync(CheckoutBranchCommand cmd, CancellationToken ct)
    {
        var branch = BranchName.Create(cmd.Branch);
        if (branch.IsFailure) return Result<CheckoutBranchResult>.Failure(branch.Error!);

        await _git.CheckoutAsync(branch.Value!, ct);
        return Result<CheckoutBranchResult>.Success(new CheckoutBranchResult(branch.Value!.Value));
    }
}
