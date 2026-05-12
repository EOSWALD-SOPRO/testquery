using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.SqlClient;
using ProductionQueryEditor.Api.Common;

namespace ProductionQueryEditor.Api.ExceptionHandlers;

/// <summary>
/// Translates SQL Server connectivity / login / timeout failures into 503 with a stable code,
/// so the React client can distinguish "DB down" from "bug in the API".
/// </summary>
public sealed class SqlExceptionHandler : IExceptionHandler
{
    private readonly ILogger<SqlExceptionHandler> _logger;
    public SqlExceptionHandler(ILogger<SqlExceptionHandler> logger) => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not SqlException sqlEx) return false;

        _logger.LogWarning(sqlEx, "SQL Server unavailable on {Path}", httpContext.Request.Path);

        httpContext.Response.StatusCode  = StatusCodes.Status503ServiceUnavailable;
        httpContext.Response.ContentType = "application/json";
        await httpContext.Response.WriteAsJsonAsync(
            new ErrorResponse(sqlEx.Message, "DB_UNREACHABLE"),
            cancellationToken);
        return true;
    }
}
