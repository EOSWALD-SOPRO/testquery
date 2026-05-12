using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.Ports;

/// <summary>
/// Source of <see cref="QueryDto"/>: combines the rows of <c>dbo.ProductionScreen</c>
/// (joined with WorkCenter / AttributeModel / Request) and <c>dbo.CUParameter</c>.
/// </summary>
public interface IQueryRepository
{
    Task<List<QueryDto>> GetAllAsync(EnvironmentName env, CancellationToken ct);
}
