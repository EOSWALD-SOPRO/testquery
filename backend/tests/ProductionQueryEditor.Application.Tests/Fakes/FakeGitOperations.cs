using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.Tests.Fakes;

public sealed class FakeGitOperations : IGitOperations
{
    public BranchListInfo BranchListResponse { get; set; } = new() { Current = "main", Branches = new() { "main" } };
    public Exception? PushThrows { get; set; }

    public List<BranchName> CreateBranchCalls { get; } = new();
    public List<BranchName> CheckoutCalls    { get; } = new();
    public List<BranchName> PushCalls        { get; } = new();
    public List<(string Message, IReadOnlyList<string>? Files)> CommitCalls { get; } = new();

    public Task<BranchListInfo> GetBranchesAsync(CancellationToken ct) => Task.FromResult(BranchListResponse);

    public Task CreateBranchAsync(BranchName name, CancellationToken ct)
    {
        CreateBranchCalls.Add(name);
        return Task.CompletedTask;
    }

    public Task CheckoutAsync(BranchName name, CancellationToken ct)
    {
        CheckoutCalls.Add(name);
        return Task.CompletedTask;
    }

    public Task<CommitResult> CommitAsync(string message, IReadOnlyList<string>? files, CancellationToken ct)
    {
        CommitCalls.Add((message, files));
        return Task.FromResult(new CommitResult
        {
            Commit  = "fake-sha",
            Summary = new CommitSummary { Changes = files?.Count ?? 0 },
        });
    }

    public Task PushAsync(BranchName branch, CancellationToken ct)
    {
        PushCalls.Add(branch);
        if (PushThrows is not null) throw PushThrows;
        return Task.CompletedTask;
    }

    public Task<List<CommitInfo>> GetHistoryAsync(int limit, CancellationToken ct)
        => Task.FromResult(new List<CommitInfo>());
}
