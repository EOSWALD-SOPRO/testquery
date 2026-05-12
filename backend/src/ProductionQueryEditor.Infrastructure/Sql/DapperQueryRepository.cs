using Dapper;
using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Ports;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Infrastructure.Sql;

/// <summary>
/// Dapper-backed adapter for <see cref="IQueryRepository"/>. Reads PS + CU rows
/// and maps them to the shape the React frontend consumes.
///
/// ⚠ Hypothesis to verify with the SOPROFEN team:
///   dbo.ProductionScreen.RequestId is JOIN'd to dbo.Request(Id, Sql).
///   If the actual table differs, only the JOIN line below needs adjusting.
/// </summary>
public sealed class DapperQueryRepository : IQueryRepository
{
    private readonly SqlConnectionFactory _factory;

    public DapperQueryRepository(SqlConnectionFactory factory) => _factory = factory;

    public async Task<List<QueryDto>> GetAllAsync(EnvironmentName env, CancellationToken ct)
    {
        var ps = await GetProductionScreenAsync(env, ct);
        var cu = await GetCuParameterAsync(env, ct);
        return ps.Concat(cu).ToList();
    }

    private async Task<List<QueryDto>> GetProductionScreenAsync(EnvironmentName env, CancellationToken ct)
    {
        const string sql = @"
            SELECT
                ps.RequestId         AS RequestId,
                ps.WorkCenterId      AS WorkCenterId,
                ps.ShouldUseComponent,
                ps.IsReadonly,
                ps.UseColumnSelection,
                wc.Name              AS WorkCenter,
                wc.Establishment     AS Establishment,
                am.Name              AS AttributeModel,
                r.Content                AS Sql
            FROM dbo.ProductionScreen ps
            INNER JOIN dbo.WorkCenter     wc ON wc.Id = ps.WorkCenterId
            INNER JOIN dbo.AttributeModel am ON am.Id = ps.AttributeModelId
            INNER JOIN dbo.Request        r  ON r.Id  = ps.RequestId
            WHERE wc.IsHidden = 0
            ORDER BY wc.Establishment, wc.Name, am.Name";

        await using var conn = _factory.Create(env);
        var rows = await conn.QueryAsync<PsRow>(new CommandDefinition(sql, cancellationToken: ct));

        return rows.Select(r => new QueryDto
        {
            Id                 = $"ps-{r.RequestId}-{r.WorkCenterId}-{r.AttributeModel}",
            Source             = "production_screen",
            Name               = $"{r.RequestId}-{r.WorkCenter}-{r.AttributeModel}",
            RequestId          = r.RequestId,
            WorkCenterId       = r.WorkCenterId,
            WorkCenter         = r.WorkCenter,
            Establishment      = r.Establishment,
            AttributeModel     = r.AttributeModel,
            ShouldUseComponent = r.ShouldUseComponent,
            IsReadonly         = r.IsReadonly,
            UseColumnSelection = r.UseColumnSelection,
            Sql                = r.Sql ?? string.Empty,
        }).ToList();
    }

    private async Task<List<QueryDto>> GetCuParameterAsync(EnvironmentName env, CancellationToken ct)
    {
        const string sql = @"
            SELECT
                cu.WorkCenterId    AS WorkCenterId,
                cu.Request         AS Sql,
                wc.Name            AS WorkCenter,
                wc.Establishment   AS Establishment
            FROM dbo.CUParameter cu
            INNER JOIN dbo.WorkCenter wc ON wc.Id = cu.WorkCenterId
            WHERE wc.IsHidden = 0
            ORDER BY wc.Establishment, wc.Name";

        await using var conn = _factory.Create(env);
        var rows = await conn.QueryAsync<CuRow>(new CommandDefinition(sql, cancellationToken: ct));

        return rows.Select(r => new QueryDto
        {
            Id             = $"cu-{r.WorkCenterId}",
            Source         = "cu_parameter",
            Name           = r.WorkCenter,
            RequestId      = null,
            WorkCenterId   = r.WorkCenterId,
            WorkCenter     = r.WorkCenter,
            Establishment  = r.Establishment,
            AttributeModel = null,
            Sql            = r.Sql ?? string.Empty,
        }).ToList();
    }

    private class PsRow
    {
        public int     RequestId          { get; set; }
        public int     WorkCenterId       { get; set; }
        public bool    ShouldUseComponent { get; set; }
        public bool    IsReadonly         { get; set; }
        public bool    UseColumnSelection { get; set; }
        public string  WorkCenter         { get; set; } = "";
        public string  Establishment      { get; set; } = "";
        public string  AttributeModel     { get; set; } = "";
        public string? Sql                { get; set; }
    }

    private class CuRow
    {
        public int     WorkCenterId  { get; set; }
        public string? Sql           { get; set; }
        public string  WorkCenter    { get; set; } = "";
        public string  Establishment { get; set; } = "";
    }
}
