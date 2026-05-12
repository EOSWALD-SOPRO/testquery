using Microsoft.AspNetCore.Mvc;
using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Api.Common;

/// <summary>
/// Single source of truth for mapping a <see cref="Result{T}"/> to an <see cref="IActionResult"/>.
/// HTTP status comes from <see cref="DomainError.Kind"/>; the body is the standard
/// <see cref="ErrorResponse"/> on failure or the value on success.
/// </summary>
public static class ResultExtensions
{
    public static IActionResult ToActionResult<T>(this Result<T> result) => result.Match<IActionResult>(
        ok  => new OkObjectResult(ok),
        err => new ObjectResult(new ErrorResponse(err.Message, err.Code))
        {
            StatusCode = StatusCodeFor(err.Kind),
        });

    public static int StatusCodeFor(ErrorKind kind) => kind switch
    {
        ErrorKind.Validation   => 400,
        ErrorKind.NotFound     => 404,
        ErrorKind.Conflict     => 409,
        ErrorKind.Unauthorized => 401,
        ErrorKind.Internal     => 500,
        _                      => 500,
    };
}
