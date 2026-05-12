using System.Net;
using System.Net.Http.Json;
using ProductionQueryEditor.Api.Common;

namespace ProductionQueryEditor.Api.Tests.Endpoints;

public class GithubEndpointTests : IClassFixture<TestApplicationFactory>
{
    private readonly TestApplicationFactory _factory;
    public GithubEndpointTests(TestApplicationFactory factory) => _factory = factory;

    // ── GET /api/github/branches ─────────────────────────────────────────────
    [Fact]
    public async Task Branches_Returns200WithCurrentAndList()
    {
        var client = _factory.CreateClient();
        var resp   = await client.GetAsync("/api/github/branches");

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var json = await resp.Content.ReadAsStringAsync();
        Assert.Contains("\"current\"", json);
        Assert.Contains("\"branches\"", json);
    }

    // ── POST /api/github/branches ────────────────────────────────────────────
    [Fact]
    public async Task CreateBranch_ValidName_Returns200AndSanitizes()
    {
        _factory.Git.CreateBranchCalls.Clear();
        var client = _factory.CreateClient();

        var resp = await client.PostAsJsonAsync("/api/github/branches", new { name = "feature foo" });

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        Assert.Single(_factory.Git.CreateBranchCalls);
        Assert.Equal("feature-foo", _factory.Git.CreateBranchCalls[0].Value);
    }

    [Fact]
    public async Task CreateBranch_EmptyName_Returns400()
    {
        var client = _factory.CreateClient();
        var resp   = await client.PostAsJsonAsync("/api/github/branches", new { name = "" });
        var body   = await resp.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        Assert.Equal("INVALID_BRANCH", body!.Code);
    }

    // ── POST /api/github/commit ──────────────────────────────────────────────
    [Fact]
    public async Task Commit_EmptyMessage_Returns400()
    {
        var client = _factory.CreateClient();
        var resp   = await client.PostAsJsonAsync("/api/github/commit", new { message = "", files = new string[0] });
        var body   = await resp.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        Assert.Equal("EMPTY_COMMIT_MESSAGE", body!.Code);
    }

    // ── POST /api/github/pull-requests ───────────────────────────────────────
    [Fact]
    public async Task OpenPullRequest_EmptyTitle_Returns400()
    {
        var client = _factory.CreateClient();
        var resp   = await client.PostAsJsonAsync("/api/github/pull-requests",
            new { title = "", branch = "feature/x" });
        var body   = await resp.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        Assert.Equal("EMPTY_PR_TITLE", body!.Code);
    }

    [Fact]
    public async Task OpenPullRequest_HappyPath_PushesThenCreatesPr()
    {
        _factory.Git.PushCalls.Clear();
        _factory.GitHub.CreateCalls.Clear();
        var client = _factory.CreateClient();

        var resp = await client.PostAsJsonAsync("/api/github/pull-requests", new
        {
            title  = "fix(L6IBAD01): coloris tab3",
            body   = "details",
            branch = "fix/coloris-tab3",
        });

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        Assert.Single(_factory.Git.PushCalls);
        Assert.Single(_factory.GitHub.CreateCalls);
        Assert.Equal("fix/coloris-tab3", _factory.GitHub.CreateCalls[0].Branch);
        Assert.Equal("main",             _factory.GitHub.CreateCalls[0].BaseBranch);
    }
}
