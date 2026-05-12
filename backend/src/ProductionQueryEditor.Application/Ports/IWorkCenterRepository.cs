using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.Ports;

public interface IWorkCenterRepository
{
    Task<List<WorkCenterDto>> GetAllAsync(EnvironmentName env, CancellationToken ct);
}
