using ProductionQueryEditor.Application.Dtos;
using ProductionQueryEditor.Application.Tests.Fakes;
using ProductionQueryEditor.Application.UseCases.ExecuteQuery;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Application.Tests.UseCases.ExecuteQuery;

public class ExecuteQueryHandlerTests
{
    private readonly FakeSqlExecutor _executor = new();

    private ExecuteQueryHandler Handler() => new(_executor);

    [Fact]
    public async Task HandleAsync_HappyPath_CallsExecutorAndReturnsResponse()
    {
        var canned = new ExecuteQueryResponse
        {
            Columns  = new[] { "NumOF", "Status" },
            Rows     = new object?[][] { new object?[] { "1000225397", "20" } },
            RowCount = 1,
            Took     = 42,
            Plan     = "ok",
        };
        _executor.Response = canned;

        var result = await Handler().HandleAsync(new ExecuteQueryCommand("SELECT 1", "TRN"), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(canned, result.Value);
        Assert.Single(_executor.Calls);
        Assert.Equal("SELECT 1", _executor.Calls[0].Sql.Sql);
        Assert.Equal("TRN",      _executor.Calls[0].Env.Value);
    }

    [Fact]
    public async Task HandleAsync_NormalizesEnvBeforeCallingExecutor()
    {
        await Handler().HandleAsync(new ExecuteQueryCommand("SELECT 1", "trn"), CancellationToken.None);

        Assert.Equal("TRN", _executor.Calls[0].Env.Value);
    }

    [Fact]
    public async Task HandleAsync_WithInvalidEnv_ReturnsInvalidEnvironmentError_AndDoesNotCallExecutor()
    {
        var result = await Handler().HandleAsync(new ExecuteQueryCommand("SELECT 1", "DEV"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.IsType<InvalidEnvironmentError>(result.Error);
        Assert.Empty(_executor.Calls);
    }

    [Fact]
    public async Task HandleAsync_WithEmptySql_ReturnsEmptySqlError_AndDoesNotCallExecutor()
    {
        var result = await Handler().HandleAsync(new ExecuteQueryCommand("", "TRN"), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.IsType<EmptySqlError>(result.Error);
        Assert.Empty(_executor.Calls);
    }

    [Fact]
    public async Task HandleAsync_WithWhitespaceSql_ReturnsEmptySqlError()
    {
        var result = await Handler().HandleAsync(new ExecuteQueryCommand("   \t\n  ", "TRN"), CancellationToken.None);
        Assert.IsType<EmptySqlError>(result.Error);
    }

    [Fact]
    public async Task HandleAsync_WithForbiddenKeyword_ReturnsReadOnlyViolation_AndDoesNotCallExecutor()
    {
        var result = await Handler().HandleAsync(new ExecuteQueryCommand("DELETE FROM Operation", "TRN"), CancellationToken.None);

        Assert.True(result.IsFailure);
        var err = Assert.IsType<ReadOnlyViolationError>(result.Error);
        Assert.Equal("DELETE", err.Keyword);
        Assert.Empty(_executor.Calls);
    }

    [Fact]
    public async Task HandleAsync_ValidatesEnvBeforeSql()
    {
        // Both env AND sql are invalid. Env error wins (first check).
        var result = await Handler().HandleAsync(new ExecuteQueryCommand("DELETE FROM X", "DEV"), CancellationToken.None);

        Assert.IsType<InvalidEnvironmentError>(result.Error);
    }

    [Fact]
    public async Task HandleAsync_ExecutorException_PropagatesUnchanged()
    {
        _executor.Throws = new InvalidOperationException("DB down");

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            Handler().HandleAsync(new ExecuteQueryCommand("SELECT 1", "TRN"), CancellationToken.None));
    }

    [Fact]
    public async Task HandleAsync_ForwardsCancellationTokenToExecutor()
    {
        using var cts = new CancellationTokenSource();
        await Handler().HandleAsync(new ExecuteQueryCommand("SELECT 1", "TRN"), cts.Token);

        Assert.Equal(cts.Token, _executor.Calls[0].Ct);
    }
}
