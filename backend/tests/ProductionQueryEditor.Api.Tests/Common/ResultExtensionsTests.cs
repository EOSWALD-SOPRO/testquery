using Microsoft.AspNetCore.Mvc;
using ProductionQueryEditor.Api.Common;
using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Api.Tests.Common;

public class ResultExtensionsTests
{
    // ── ErrorKind → HTTP table ───────────────────────────────────────────────
    [Theory]
    [InlineData(ErrorKind.Validation,   400)]
    [InlineData(ErrorKind.NotFound,     404)]
    [InlineData(ErrorKind.Conflict,     409)]
    [InlineData(ErrorKind.Unauthorized, 401)]
    [InlineData(ErrorKind.Internal,     500)]
    public void StatusCodeFor_ReturnsExpectedHttpStatus(ErrorKind kind, int expected)
        => Assert.Equal(expected, ResultExtensions.StatusCodeFor(kind));

    // ── Success path ─────────────────────────────────────────────────────────
    [Fact]
    public void ToActionResult_OnSuccess_ReturnsOkWithValue()
    {
        var result = Result<int>.Success(42).ToActionResult();
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(42, ok.Value);
    }

    // ── Validation errors → 400 ──────────────────────────────────────────────
    [Fact]
    public void ToActionResult_OnInvalidEnv_Returns400WithCode()
    {
        var result = Result<int>.Failure(new InvalidEnvironmentError("DEV")).ToActionResult();

        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, obj.StatusCode);
        Assert.Contains("INVALID_ENV", obj.Value!.ToString());
    }

    [Fact]
    public void ToActionResult_OnReadOnlyViolation_Returns400()
    {
        var result = Result<int>.Failure(new ReadOnlyViolationError("DELETE")).ToActionResult();
        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(400, obj.StatusCode);
    }

    // ── NotFound → 404 ───────────────────────────────────────────────────────
    [Fact]
    public void ToActionResult_OnResourceNotFound_Returns404()
    {
        var result = Result<int>.Failure(new ResourceNotFoundError("PullRequest", "247")).ToActionResult();

        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, obj.StatusCode);
    }

    // ── Custom error declaring its own Kind ──────────────────────────────────
    [Fact]
    public void ToActionResult_RespectsErrorKindFromCustomType()
    {
        var result = Result<int>.Failure(new TestConflictError()).ToActionResult();

        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(409, obj.StatusCode);
    }

    private sealed record TestConflictError() : DomainError("TEST_CONFLICT", "x")
    {
        public override ErrorKind Kind => ErrorKind.Conflict;
    }
}
