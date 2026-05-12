using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.UseCases.Git.Push;

/// <summary>If <see cref="Branch"/> is null, the handler pushes whatever branch is currently checked out.</summary>
public sealed record PushCommand(string? Branch);

public sealed record PushResult(string Branch);

public sealed class PushHandler
{
    private readonly IGitOperations _git;
    public PushHandler(IGitOperations git) => _git = git;

    public async Task<Result<PushResult>> HandleAsync(PushCommand cmd, CancellationToken ct)
    {
        BranchName branchVo;
        if (string.IsNullOrWhiteSpace(cmd.Branch))
        {
            var current = (await _git.GetBranchesAsync(ct)).Current;
            var v = BranchName.Create(current);
            if (v.IsFailure) return Result<PushResult>.Failure(v.Error!);
            branchVo = v.Value!;
        }
        else
        {
            var v = BranchName.Create(cmd.Branch);
            if (v.IsFailure) return Result<PushResult>.Failure(v.Error!);
            branchVo = v.Value!;
        }

        await _git.PushAsync(branchVo, ct);
        return Result<PushResult>.Success(new PushResult(branchVo.Value));
    }
}
