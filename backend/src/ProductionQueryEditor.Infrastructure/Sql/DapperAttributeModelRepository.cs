using Dapper;
using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Infrastructure.Sql;

public sealed class DapperAttributeModelRepository : IAttributeModelRepository
{
    private readonly SqlConnectionFactory _factory;
    public DapperAttributeModelRepository(SqlConnectionFactory factory) => _factory = factory;

    public async Task<List<AttributeModelDto>> GetAllAsync(EnvironmentName env, CancellationToken ct)
    {
        const string sql = @"
            SELECT Id, Name, Title
            FROM dbo.AttributeModel
            ORDER BY Name";

        await using var conn = _factory.Create(env);
        var rows = await conn.QueryAsync<AttributeModelDto>(new CommandDefinition(sql, cancellationToken: ct));
        return rows.ToList();
    }
}
