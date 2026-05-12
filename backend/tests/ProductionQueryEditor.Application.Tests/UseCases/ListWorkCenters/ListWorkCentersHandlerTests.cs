using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Tests.Fakes;
using ProductionQueryEditor.Application.UseCases.ListWorkCenters;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Application.Tests.UseCases.ListWorkCenters;

public class ListWorkCentersHandlerTests
{
    private readonly FakeWorkCenterRepository _repo = new();
    private ListWorkCentersHandler Handler() => new(_repo);

    [Fact]
    public async Task HandleAsync_HappyPath_ReturnsRows()
    {
        _repo.Response = new List<WorkCenterDto>
        {
            new() { Id = 136, Name = "MDDBCO02", Title = "MDDBCO 02", Establishment = "A04" },
        };

        var result = await Handler().HandleAsync(new ListWorkCentersQuery("PRD"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        Assert.Equal("PRD", _repo.Calls[0].Value);
    }

    [Fact]
    public async Task HandleAsync_InvalidEnv_FailsAndSkipsRepo()
    {
        var result = await Handler().HandleAsync(new ListWorkCentersQuery(""), CancellationToken.None);

        Assert.IsType<InvalidEnvironmentError>(result.Error);
        Assert.Empty(_repo.Calls);
    }

    [Fact]
    public async Task HandleAsync_NullEnv_FailsWithInvalidEnv()
    {
        var result = await Handler().HandleAsync(new ListWorkCentersQuery(null), CancellationToken.None);
        Assert.IsType<InvalidEnvironmentError>(result.Error);
    }
}
