using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.UseCases.ListQueries;

public sealed class ListQueriesHandler
{
    private readonly IQueryRepository _repo;
    public ListQueriesHandler(IQueryRepository repo) => _repo = repo;

    public async Task<Result<List<QueryDto>>> HandleAsync(ListQueriesQuery query, CancellationToken ct)
    {
        var env = EnvironmentName.Create(query.Env);
        if (env.IsFailure) return Result<List<QueryDto>>.Failure(env.Error!);

        var rows = await _repo.GetAllAsync(env.Value!, ct);
        return Result<List<QueryDto>>.Success(rows);
    }
}
