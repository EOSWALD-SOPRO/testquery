using Microsoft.AspNetCore.Diagnostics;
using ProductionQueryEditor.Api.Common;

namespace ProductionQueryEditor.Api.ExceptionHandlers;

/// <summary>Catch-all for anything no other <see cref="IExceptionHandler"/> claimed. Always returns 500.</summary>
public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) => _logger = logger;

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Unhandled exception on {Path}", httpContext.Request.Path);

        httpContext.Response.StatusCode  = StatusCodes.Status500InternalServerError;
        httpContext.Response.ContentType = "application/json";
        await httpContext.Response.WriteAsJsonAsync(
            new ErrorResponse(exception.Message, exception.GetType().Name),
            cancellationToken);
        return true;
    }
}
