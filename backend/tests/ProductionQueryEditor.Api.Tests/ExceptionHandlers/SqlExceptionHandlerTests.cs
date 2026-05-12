using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using ProductionQueryEditor.Api.ExceptionHandlers;

namespace ProductionQueryEditor.Api.Tests.ExceptionHandlers;

public class SqlExceptionHandlerTests
{
    // Note: instantiating a real Microsoft.Data.SqlClient.SqlException requires either a real
    // failed connection (story 08 integration test territory) or reflection trickery — neither
    // is worth the complexity here. We unit-test the negative branch ("not my exception, pass")
    // and rely on the integration test in story 08 to cover the positive case end-to-end.

    [Fact]
    public async Task TryHandleAsync_OnNonSqlException_ReturnsFalseWithoutTouchingResponse()
    {
        var handler = new SqlExceptionHandler(NullLogger<SqlExceptionHandler>.Instance);
        var ctx = new DefaultHttpContext { Response = { Body = new MemoryStream() } };

        var handled = await handler.TryHandleAsync(ctx, new InvalidOperationException("nope"), CancellationToken.None);

        Assert.False(handled);
        Assert.Equal(0, ctx.Response.Body.Length);  // didn't write anything
    }

    [Fact]
    public async Task TryHandleAsync_OnArgumentException_ReturnsFalse()
    {
        var handler = new SqlExceptionHandler(NullLogger<SqlExceptionHandler>.Instance);
        var ctx = new DefaultHttpContext { Response = { Body = new MemoryStream() } };

        var handled = await handler.TryHandleAsync(ctx, new ArgumentException("nope"), CancellationToken.None);

        Assert.False(handled);
    }
}
