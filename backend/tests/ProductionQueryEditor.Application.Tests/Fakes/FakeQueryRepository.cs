using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Application.Tests.Fakes;

public sealed class FakeQueryRepository : IQueryRepository
{
    public List<EnvironmentName> Calls { get; } = new();
    public List<QueryDto> Response { get; set; } = new();
    public Exception? Throws { get; set; }

    public Task<List<QueryDto>> GetAllAsync(EnvironmentName env, CancellationToken ct)
    {
        Calls.Add(env);
        if (Throws is not null) throw Throws;
        return Task.FromResult(Response);
    }
}
