using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ProductionQueryEditor.Api.Common;
using ProductionQueryEditor.Application.Dtos;

namespace ProductionQueryEditor.Api.Tests.Endpoints;

public class QueriesEndpointTests : IClassFixture<TestApplicationFactory>
{
    private readonly TestApplicationFactory _factory;
    public QueriesEndpointTests(TestApplicationFactory factory) => _factory = factory;

    // ── GET /api/queries ─────────────────────────────────────────────────────
    [Fact]
    public async Task GetAll_HappyPath_Returns200WithList()
    {
        _factory.Queries.Response = new List<QueryDto>
        {
            new() { Id="ps-7-136-COULISSE", Source="production_screen", Name="7-MDDBCO02-COULISSE",
                    WorkCenter="MDDBCO02", Establishment="A04", Sql="SELECT 1" },
        };

        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/queries?env=TRN");
        var body = await resp.Content.ReadFromJsonAsync<List<QueryDto>>();

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        Assert.Single(body!);
    }

    [Fact]
    public async Task GetAll_InvalidEnv_Returns400WithCode()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/queries?env=DEV");
        var body = await resp.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        Assert.Equal("INVALID_ENV", body!.Code);
    }

    // ── GET /api/queries/workcenters ─────────────────────────────────────────
    [Fact]
    public async Task WorkCenters_HappyPath_Returns200()
    {
        _factory.WorkCenters.Response = new List<WorkCenterDto>
        {
            new() { Id=136, Name="MDDBCO02", Title="MDDBCO 02", Establishment="A04" },
        };

        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/queries/workcenters?env=TRN");
        var body = await resp.Content.ReadFromJsonAsync<List<WorkCenterDto>>();

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        Assert.Single(body!);
        Assert.Equal("MDDBCO02", body![0].Name);
    }

    // ── GET /api/queries/attribute-models ────────────────────────────────────
    [Fact]
    public async Task AttributeModels_HappyPath_Returns200()
    {
        _factory.AttributeModels.Response = new List<AttributeModelDto>
        {
            new() { Id=9, Name="COULISSE", Title="Coulisse" },
        };

        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/queries/attribute-models?env=TRN");
        var body = await resp.Content.ReadFromJsonAsync<List<AttributeModelDto>>();

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        Assert.Single(body!);
    }

    // ── POST /api/queries/execute ────────────────────────────────────────────
    [Fact]
    public async Task Execute_HappyPath_Returns200AndCallsExecutor()
    {
        _factory.SqlExecutor.Calls.Clear();
        var client = _factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/queries/execute",
            new { sql = "SELECT 1", env = "TRN" });

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        Assert.Single(_factory.SqlExecutor.Calls);
        Assert.Equal("SELECT 1", _factory.SqlExecutor.Calls[0].Sql.Sql);
    }

    [Fact]
    public async Task Execute_ForbiddenKeyword_Returns400_AndDoesNotCallExecutor()
    {
        _factory.SqlExecutor.Calls.Clear();
        var client = _factory.CreateClient();

        var resp = await client.PostAsJsonAsync("/api/queries/execute",
            new { sql = "DELETE FROM x", env = "TRN" });
        var body = await resp.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        Assert.Equal("READONLY_VIOLATION", body!.Code);
        Assert.Empty(_factory.SqlExecutor.Calls);
    }

    [Fact]
    public async Task Execute_EmptySql_Returns400()
    {
        var client = _factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/queries/execute",
            new { sql = "", env = "TRN" });
        var body = await resp.Content.ReadFromJsonAsync<ErrorResponse>();

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        Assert.Equal("EMPTY_SQL", body!.Code);
    }

    [Fact]
    public async Task Execute_ForwardsWorkCenterAndAttributeModelFromBody_ToExecutor()
    {
        _factory.SqlExecutor.Calls.Clear();
        var client = _factory.CreateClient();

        var resp = await client.PostAsJsonAsync("/api/queries/execute",
            new
            {
                sql            = "SELECT * FROM dbo.Operation WHERE op.WorkCenterId = @WorkCenter",
                env            = "TRN",
                workCenterId   = 136,
                attributeModel = "COULISSE",
            });

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var call = Assert.Single(_factory.SqlExecutor.Calls);
        Assert.Equal(136,        call.Parameters.WorkCenterId);
        Assert.Equal("COULISSE", call.Parameters.AttributeModel);
    }
}
