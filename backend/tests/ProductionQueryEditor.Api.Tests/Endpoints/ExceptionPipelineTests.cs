using System.Net;
using System.Net.Http.Json;
using ProductionQueryEditor.Api.Common;

namespace ProductionQueryEditor.Api.Tests.Endpoints;

/// <summary>
/// End-to-end coverage for the IExceptionHandler chain registered in Program.cs.
/// Provokes an exception inside an adapter; verifies the response is shaped by GlobalExceptionHandler.
/// </summary>
public class ExceptionPipelineTests : IClassFixture<TestApplicationFactory>
{
    private readonly TestApplicationFactory _factory;
    public ExceptionPipelineTests(TestApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task UnknownExceptionFromExecutor_BecomesErrorResponse500()
    {
        _factory.SqlExecutor.Throws = new InvalidOperationException("simulated infra failure");
        var client = _factory.CreateClient();

        var resp = await client.PostAsJsonAsync("/api/queries/execute",
            new { sql = "SELECT 1", env = "TRN" });
        var body = await resp.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.InternalServerError, resp.StatusCode);
        Assert.Equal("InvalidOperationException", body!.Code);
        Assert.Contains("simulated infra failure", body.Error);

        // cleanup so other tests aren't affected
        _factory.SqlExecutor.Throws = null;
    }

    [Fact]
    public async Task ExceptionInsideGitOperation_BecomesErrorResponse500()
    {
        _factory.Git.PushThrows = new InvalidOperationException("authentication failed");
        var client = _factory.CreateClient();

        var resp = await client.PostAsJsonAsync("/api/github/pull-requests", new
        {
            title  = "title",
            body   = "",
            branch = "feature/x",
        });
        var body = await resp.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.InternalServerError, resp.StatusCode);
        Assert.Contains("authentication failed", body!.Error);

        _factory.Git.PushThrows = null;
    }
}
