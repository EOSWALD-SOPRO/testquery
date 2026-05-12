using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.UseCases.ListWorkCenters;

public sealed class ListWorkCentersHandler
{
    private readonly IWorkCenterRepository _repo;
    public ListWorkCentersHandler(IWorkCenterRepository repo) => _repo = repo;

    public async Task<Result<List<WorkCenterDto>>> HandleAsync(ListWorkCentersQuery query, CancellationToken ct)
    {
        var env = EnvironmentName.Create(query.Env);
        if (env.IsFailure) return Result<List<WorkCenterDto>>.Failure(env.Error!);

        var rows = await _repo.GetAllAsync(env.Value!, ct);
        return Result<List<WorkCenterDto>>.Success(rows);
    }
}
