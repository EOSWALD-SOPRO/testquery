using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.UseCases.ListAttributeModels;

public sealed class ListAttributeModelsHandler
{
    private readonly IAttributeModelRepository _repo;
    public ListAttributeModelsHandler(IAttributeModelRepository repo) => _repo = repo;

    public async Task<Result<List<AttributeModelDto>>> HandleAsync(ListAttributeModelsQuery query, CancellationToken ct)
    {
        var env = EnvironmentName.Create(query.Env);
        if (env.IsFailure) return Result<List<AttributeModelDto>>.Failure(env.Error!);

        var rows = await _repo.GetAllAsync(env.Value!, ct);
        return Result<List<AttributeModelDto>>.Success(rows);
    }
}
