using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using ProductionQueryEditor.Api.Common;
using ProductionQueryEditor.Api.ExceptionHandlers;

namespace ProductionQueryEditor.Api.Tests.ExceptionHandlers;

public class GlobalExceptionHandlerTests
{
    [Fact]
    public async Task TryHandleAsync_ReturnsTrueAndWrites500WithErrorResponse()
    {
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);
        var ctx = new DefaultHttpContext { Response = { Body = new MemoryStream() } };

        var handled = await handler.TryHandleAsync(ctx, new InvalidCastException("oops"), CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(500, ctx.Response.StatusCode);
        Assert.StartsWith("application/json", ctx.Response.ContentType);

        ctx.Response.Body.Position = 0;
        var body = await JsonSerializer.DeserializeAsync<ErrorResponse>(ctx.Response.Body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(body);
        Assert.Equal("oops", body!.Error);
        Assert.Equal("InvalidCastException", body.Code);
    }

    [Fact]
    public async Task TryHandleAsync_AlwaysClaimsTheException()
    {
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);
        var ctx = new DefaultHttpContext { Response = { Body = new MemoryStream() } };

        // Even an exotic exception type is handled
        var handled = await handler.TryHandleAsync(ctx, new TimeoutException(), CancellationToken.None);
        Assert.True(handled);
    }
}
