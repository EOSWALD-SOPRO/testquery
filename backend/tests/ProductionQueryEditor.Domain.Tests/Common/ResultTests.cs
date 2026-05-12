using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Domain.Tests.Common;

public class ResultTests
{
    [Fact]
    public void Success_HasValueAndIsSuccess()
    {
        var r = Result<int>.Success(42);
        Assert.True(r.IsSuccess);
        Assert.False(r.IsFailure);
        Assert.Equal(42, r.Value);
        Assert.Null(r.Error);
    }

    [Fact]
    public void Failure_HasErrorAndIsFailure()
    {
        var err = new EmptySqlError();
        var r = Result<int>.Failure(err);
        Assert.False(r.IsSuccess);
        Assert.True(r.IsFailure);
        Assert.Same(err, r.Error);
    }

    [Fact]
    public void Failure_WithNullError_Throws()
    {
        Assert.Throws<ArgumentNullException>(() => Result<int>.Failure(null!));
    }

    [Fact]
    public void Match_RoutesSuccessThroughOnSuccess()
    {
        var r = Result<int>.Success(7);
        var folded = r.Match(ok => $"ok:{ok}", err => $"err:{err.Code}");
        Assert.Equal("ok:7", folded);
    }

    [Fact]
    public void Match_RoutesFailureThroughOnFailure()
    {
        var r = Result<int>.Failure(new EmptySqlError());
        var folded = r.Match(ok => $"ok:{ok}", err => $"err:{err.Code}");
        Assert.Equal("err:EMPTY_SQL", folded);
    }

    [Fact]
    public void Map_TransformsSuccess()
    {
        var r = Result<int>.Success(3).Map(x => x * 2);
        Assert.True(r.IsSuccess);
        Assert.Equal(6, r.Value);
    }

    [Fact]
    public void Map_PropagatesFailureUnchanged()
    {
        var err = new EmptySqlError();
        var r = Result<int>.Failure(err).Map(x => x * 2);
        Assert.True(r.IsFailure);
        Assert.Same(err, r.Error);
    }
}
