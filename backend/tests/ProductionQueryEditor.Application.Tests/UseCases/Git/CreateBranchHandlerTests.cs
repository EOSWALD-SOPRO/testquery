using ProductionQueryEditor.Application.Tests.Fakes;
using ProductionQueryEditor.Application.UseCases.Git.CreateBranch;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Application.Tests.UseCases.Git;

public class CreateBranchHandlerTests
{
    private readonly FakeGitOperations _git = new();
    private CreateBranchHandler Handler() => new(_git);

    [Fact]
    public async Task HandleAsync_HappyPath_CreatesBranchWithSanitizedName()
    {
        var result = await Handler().HandleAsync(new CreateBranchCommand("feature foo"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("feature-foo", result.Value!.Branch);
        Assert.Single(_git.CreateBranchCalls);
        Assert.Equal("feature-foo", _git.CreateBranchCalls[0].Value);
    }

    [Fact]
    public async Task HandleAsync_EmptyName_FailsAndDoesNotCallGit()
    {
        var result = await Handler().HandleAsync(new CreateBranchCommand(""), CancellationToken.None);

        Assert.IsType<InvalidBranchNameError>(result.Error);
        Assert.Empty(_git.CreateBranchCalls);
    }

    [Fact]
    public async Task HandleAsync_DotsOnly_Fails()
    {
        var result = await Handler().HandleAsync(new CreateBranchCommand("...."), CancellationToken.None);
        Assert.IsType<InvalidBranchNameError>(result.Error);
    }

    [Fact]
    public async Task HandleAsync_NullName_Fails()
    {
        var result = await Handler().HandleAsync(new CreateBranchCommand(null), CancellationToken.None);
        Assert.IsType<InvalidBranchNameError>(result.Error);
    }
}
