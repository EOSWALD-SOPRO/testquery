using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.Ports;

/// <summary>
/// Operations against the local git clone of the queries repository. Implemented in
/// Infrastructure (LibGit2Sharp). The handler layer ensures inputs are valid (BranchName VO).
/// </summary>
public interface IGitOperations
{
    Task<BranchListInfo>   GetBranchesAsync   (CancellationToken ct);
    Task                   CreateBranchAsync  (BranchName name, CancellationToken ct);
    Task                   CheckoutAsync      (BranchName name, CancellationToken ct);
    Task<CommitResult>     CommitAsync        (string message, IReadOnlyList<string>? files, CancellationToken ct);
    Task                   PushAsync          (BranchName branch, CancellationToken ct);
    Task<List<CommitInfo>> GetHistoryAsync    (int limit, CancellationToken ct);
}
