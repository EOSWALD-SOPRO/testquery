using System.Net;
using System.Text.Json;

namespace ProductionQueryEditor.Api.Tests.Endpoints;

public class HealthEndpointTests : IClassFixture<TestApplicationFactory>
{
    private readonly TestApplicationFactory _factory;
    public HealthEndpointTests(TestApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Get_BothEnvsHealthy_Returns200WithStatusOk()
    {
        _factory.SqlConnectivity.Reachable["TRN"] = true;
        _factory.SqlConnectivity.Reachable["PRD"] = true;
        var client = _factory.CreateClient();

        var resp = await client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        Assert.Equal("ok", doc.RootElement.GetProperty("status").GetString());
        Assert.Equal("healthy", doc.RootElement.GetProperty("services").GetProperty("database_trn").GetString());
        Assert.Equal("healthy", doc.RootElement.GetProperty("services").GetProperty("database_prd").GetString());
    }

    [Fact]
    public async Task Get_OneEnvDown_Returns503WithDegraded()
    {
        _factory.SqlConnectivity.Reachable["TRN"] = false;
        _factory.SqlConnectivity.Reachable["PRD"] = true;
        var client = _factory.CreateClient();

        var resp = await client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, resp.StatusCode);
        var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        Assert.Equal("degraded", doc.RootElement.GetProperty("status").GetString());
    }
}
