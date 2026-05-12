using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.Ports;

public interface IAttributeModelRepository
{
    Task<List<AttributeModelDto>> GetAllAsync(EnvironmentName env, CancellationToken ct);
}
