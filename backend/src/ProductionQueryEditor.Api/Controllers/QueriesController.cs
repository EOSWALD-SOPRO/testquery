using Microsoft.AspNetCore.Mvc;
using ProductionQueryEditor.Api.Common;
using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.UseCases.ExecuteQuery;
using ProductionQueryEditor.Application.UseCases.ListAttributeModels;
using ProductionQueryEditor.Application.UseCases.ListQueries;
using ProductionQueryEditor.Application.UseCases.ListWorkCenters;

namespace ProductionQueryEditor.Api.Controllers;

[ApiController]
[Route("api/queries")]
[ProducesResponseType(typeof(ErrorResponse), 400)]
[ProducesResponseType(typeof(ErrorResponse), 500)]
[ProducesResponseType(typeof(ErrorResponse), 503)]
public class QueriesController : ControllerBase
{
    private readonly ListQueriesHandler         _listQueries;
    private readonly ListWorkCentersHandler     _listWorkCenters;
    private readonly ListAttributeModelsHandler _listAttrModels;
    private readonly ExecuteQueryHandler        _execute;

    public QueriesController(
        ListQueriesHandler listQueries,
        ListWorkCentersHandler listWorkCenters,
        ListAttributeModelsHandler listAttrModels,
        ExecuteQueryHandler execute)
    {
        _listQueries = listQueries; _listWorkCenters = listWorkCenters;
        _listAttrModels = listAttrModels; _execute = execute;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<QueryDto>), 200)]
    public async Task<IActionResult> GetAll([FromQuery] string env = "TRN", CancellationToken ct = default)
        => (await _listQueries.HandleAsync(new ListQueriesQuery(env), ct)).ToActionResult();

    [HttpGet("workcenters")]
    [ProducesResponseType(typeof(List<WorkCenterDto>), 200)]
    public async Task<IActionResult> WorkCenters([FromQuery] string env = "TRN", CancellationToken ct = default)
        => (await _listWorkCenters.HandleAsync(new ListWorkCentersQuery(env), ct)).ToActionResult();

    [HttpGet("attribute-models")]
    [ProducesResponseType(typeof(List<AttributeModelDto>), 200)]
    public async Task<IActionResult> AttributeModels([FromQuery] string env = "TRN", CancellationToken ct = default)
        => (await _listAttrModels.HandleAsync(new ListAttributeModelsQuery(env), ct)).ToActionResult();

    [HttpPost("execute")]
    [ProducesResponseType(typeof(ExecuteQueryResponse), 200)]
    public async Task<IActionResult> Execute([FromBody] ExecuteQueryRequest req, CancellationToken ct)
        => (await _execute.HandleAsync(new ExecuteQueryCommand(req.Sql, req.Env), ct)).ToActionResult();
}
