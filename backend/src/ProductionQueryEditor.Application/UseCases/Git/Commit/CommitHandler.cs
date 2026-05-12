using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Application.UseCases.Git.Commit;

public sealed record CommitCommand(string? Message, IReadOnlyList<string>? Files);

public sealed class CommitHandler
{
    private readonly IGitOperations _git;
    public CommitHandler(IGitOperations git) => _git = git;

    public async Task<Result<CommitResult>> HandleAsync(CommitCommand cmd, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(cmd.Message))
            return Result<CommitResult>.Failure(new EmptyCommitMessageError());

        var result = await _git.CommitAsync(cmd.Message, cmd.Files, ct);
        return Result<CommitResult>.Success(result);
    }
}
