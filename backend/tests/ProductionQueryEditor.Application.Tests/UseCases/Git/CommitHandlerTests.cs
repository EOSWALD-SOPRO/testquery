using ProductionQueryEditor.Application.Tests.Fakes;
using ProductionQueryEditor.Application.UseCases.Git.Commit;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Application.Tests.UseCases.Git;

public class CommitHandlerTests
{
    private readonly FakeGitOperations _git = new();
    private CommitHandler Handler() => new(_git);

    [Fact]
    public async Task HandleAsync_WithFiles_PassesThemToGit()
    {
        var files = new[] { "sql/cu-1017.sql" };
        var result = await Handler().HandleAsync(new CommitCommand("fix: foo", files), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("fake-sha", result.Value!.Commit);
        Assert.Single(_git.CommitCalls);
        Assert.Equal(files, _git.CommitCalls[0].Files);
    }

    [Fact]
    public async Task HandleAsync_WithoutFiles_StillCommits()
    {
        var result = await Handler().HandleAsync(new CommitCommand("chore: cleanup", null), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Null(_git.CommitCalls[0].Files);
    }

    [Fact]
    public async Task HandleAsync_EmptyMessage_FailsWithoutCallingGit()
    {
        var result = await Handler().HandleAsync(new CommitCommand("", null), CancellationToken.None);
        Assert.IsType<EmptyCommitMessageError>(result.Error);
        Assert.Empty(_git.CommitCalls);
    }

    [Fact]
    public async Task HandleAsync_NullMessage_Fails()
    {
        var result = await Handler().HandleAsync(new CommitCommand(null, null), CancellationToken.None);
        Assert.IsType<EmptyCommitMessageError>(result.Error);
    }
}
