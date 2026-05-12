using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Tests.Fakes;
using ProductionQueryEditor.Application.UseCases.Git.Push;

namespace ProductionQueryEditor.Application.Tests.UseCases.Git;

public class PushHandlerTests
{
    private readonly FakeGitOperations _git = new();
    private PushHandler Handler() => new(_git);

    [Fact]
    public async Task HandleAsync_WithExplicitBranch_PushesIt()
    {
        var result = await Handler().HandleAsync(new PushCommand("feature/foo"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("feature/foo", result.Value!.Branch);
        Assert.Equal("feature/foo", _git.PushCalls[0].Value);
    }

    [Fact]
    public async Task HandleAsync_WithoutBranch_FallsBackToCurrent()
    {
        _git.BranchListResponse = new BranchListInfo { Current = "main", Branches = new() { "main" } };

        var result = await Handler().HandleAsync(new PushCommand(null), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("main", _git.PushCalls[0].Value);
    }
}
