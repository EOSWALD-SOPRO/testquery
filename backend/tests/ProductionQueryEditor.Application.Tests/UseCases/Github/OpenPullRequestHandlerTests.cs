using ProductionQueryEditor.Application.Tests.Fakes;
using ProductionQueryEditor.Application.UseCases.Github.OpenPullRequest;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Application.Tests.UseCases.Github;

public class OpenPullRequestHandlerTests
{
    private readonly FakeGitOperations _git = new();
    private readonly FakeGitHubClient  _gh  = new();
    private OpenPullRequestHandler Handler() => new(_git, _gh);

    [Fact]
    public async Task HandleAsync_HappyPath_PushesThenCreatesPr()
    {
        var result = await Handler().HandleAsync(
            new OpenPullRequestCommand("Title", "Body", "feature/foo", null, null),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(_git.PushCalls);
        Assert.Equal("feature/foo", _git.PushCalls[0].Value);
        Assert.Single(_gh.CreateCalls);
        Assert.Equal("Title",       _gh.CreateCalls[0].Title);
        Assert.Equal("Body",        _gh.CreateCalls[0].Body);
        Assert.Equal("main",        _gh.CreateCalls[0].BaseBranch);   // default
    }

    [Fact]
    public async Task HandleAsync_WithCustomBaseBranch_UsesIt()
    {
        await Handler().HandleAsync(
            new OpenPullRequestCommand("Title", "", "feature/x", "develop", null),
            CancellationToken.None);

        Assert.Equal("develop", _gh.CreateCalls[0].BaseBranch);
    }

    [Fact]
    public async Task HandleAsync_PushAlreadyUpToDate_StillCreatesPr()
    {
        // Real LibGit2 raises with this message when there's nothing new to push
        _git.PushThrows = new InvalidOperationException("everything up-to-date");

        var result = await Handler().HandleAsync(
            new OpenPullRequestCommand("Title", "", "feature/x", null, null),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(_gh.CreateCalls);
    }

    [Fact]
    public async Task HandleAsync_PushFailsWithRealError_BubblesException()
    {
        _git.PushThrows = new InvalidOperationException("authentication failed");

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Handler().HandleAsync(
                new OpenPullRequestCommand("Title", "", "feature/x", null, null),
                CancellationToken.None));

        // PR creation never reached
        Assert.Empty(_gh.CreateCalls);
    }

    [Fact]
    public async Task HandleAsync_EmptyTitle_FailsWithoutPushOrCreate()
    {
        var result = await Handler().HandleAsync(
            new OpenPullRequestCommand("", "body", "feature/x", null, null),
            CancellationToken.None);

        Assert.IsType<EmptyPullRequestTitleError>(result.Error);
        Assert.Empty(_git.PushCalls);
        Assert.Empty(_gh.CreateCalls);
    }

    [Fact]
    public async Task HandleAsync_InvalidBranch_FailsWithoutCallingPort()
    {
        var result = await Handler().HandleAsync(
            new OpenPullRequestCommand("Title", "body", "", null, null),
            CancellationToken.None);

        Assert.IsType<InvalidBranchNameError>(result.Error);
        Assert.Empty(_git.PushCalls);
        Assert.Empty(_gh.CreateCalls);
    }
}
