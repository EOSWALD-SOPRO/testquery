using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Tests.Fakes;
using ProductionQueryEditor.Application.UseCases.ListQueries;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Application.Tests.UseCases.ListQueries;

public class ListQueriesHandlerTests
{
    private readonly FakeQueryRepository _repo = new();
    private ListQueriesHandler Handler() => new(_repo);

    [Fact]
    public async Task HandleAsync_HappyPath_ReturnsRowsAndCallsRepoWithEnv()
    {
        _repo.Response = new List<QueryDto>
        {
            new() { Id = "ps-7-136-COULISSE", Source = "production_screen", Name = "7-MDDBCO02-COULISSE",
                    WorkCenter = "MDDBCO02", Establishment = "A04", Sql = "SELECT 1" }
        };

        var result = await Handler().HandleAsync(new ListQueriesQuery("trn"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        Assert.Single(_repo.Calls);
        Assert.Equal("TRN", _repo.Calls[0].Value);
    }

    [Fact]
    public async Task HandleAsync_InvalidEnv_ReturnsErrorAndDoesNotCallRepo()
    {
        var result = await Handler().HandleAsync(new ListQueriesQuery("DEV"), CancellationToken.None);

        Assert.IsType<InvalidEnvironmentError>(result.Error);
        Assert.Empty(_repo.Calls);
    }

    [Fact]
    public async Task HandleAsync_RepoException_Propagates()
    {
        _repo.Throws = new InvalidOperationException("boom");
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Handler().HandleAsync(new ListQueriesQuery("TRN"), CancellationToken.None));
    }
}
