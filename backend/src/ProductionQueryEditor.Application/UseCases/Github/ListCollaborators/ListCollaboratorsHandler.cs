using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Application.UseCases.Github.ListCollaborators;

public sealed record ListCollaboratorsQuery();

public sealed class ListCollaboratorsHandler
{
    private readonly IGitHubClient _gh;
    public ListCollaboratorsHandler(IGitHubClient gh) => _gh = gh;

    public async Task<Result<List<CollaboratorInfo>>> HandleAsync(ListCollaboratorsQuery _, CancellationToken ct)
        => Result<List<CollaboratorInfo>>.Success(await _gh.ListCollaboratorsAsync(ct));
}
