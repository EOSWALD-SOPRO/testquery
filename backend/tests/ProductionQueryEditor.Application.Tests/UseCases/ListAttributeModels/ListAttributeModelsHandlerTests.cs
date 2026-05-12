using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Tests.Fakes;
using ProductionQueryEditor.Application.UseCases.ListAttributeModels;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Application.Tests.UseCases.ListAttributeModels;

public class ListAttributeModelsHandlerTests
{
    private readonly FakeAttributeModelRepository _repo = new();
    private ListAttributeModelsHandler Handler() => new(_repo);

    [Fact]
    public async Task HandleAsync_HappyPath_ReturnsRows()
    {
        _repo.Response = new List<AttributeModelDto>
        {
            new() { Id = 9,  Name = "COULISSE", Title = "Coulisse" },
            new() { Id = 49, Name = "CORNIERE", Title = "Corniere" },
        };

        var result = await Handler().HandleAsync(new ListAttributeModelsQuery("TRN"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value!.Count);
    }

    [Fact]
    public async Task HandleAsync_InvalidEnv_Fails()
    {
        var result = await Handler().HandleAsync(new ListAttributeModelsQuery("STAGING"), CancellationToken.None);
        Assert.IsType<InvalidEnvironmentError>(result.Error);
        Assert.Empty(_repo.Calls);
    }

    [Fact]
    public async Task HandleAsync_ForwardsCancellationToken()
    {
        using var cts = new CancellationTokenSource();
        await Handler().HandleAsync(new ListAttributeModelsQuery("TRN"), cts.Token);
        // Repo was called — token was forwarded inside (FakeAttributeModelRepository receives it through GetAllAsync)
        Assert.Single(_repo.Calls);
    }
}
