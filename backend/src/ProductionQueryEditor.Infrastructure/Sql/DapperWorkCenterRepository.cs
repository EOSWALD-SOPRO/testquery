using Dapper;
using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Infrastructure.Sql;

public sealed class DapperWorkCenterRepository : IWorkCenterRepository
{
    private readonly SqlConnectionFactory _factory;
    public DapperWorkCenterRepository(SqlConnectionFactory factory) => _factory = factory;

    public async Task<List<WorkCenterDto>> GetAllAsync(EnvironmentName env, CancellationToken ct)
    {
        const string sql = @"
            SELECT Id, Name, Title, Establishment
            FROM dbo.WorkCenter
            WHERE IsHidden = 0
            ORDER BY Establishment, Name";

        await using var conn = _factory.Create(env);
        var rows = await conn.QueryAsync<WorkCenterDto>(new CommandDefinition(sql, cancellationToken: ct));
        return rows.ToList();
    }
}
