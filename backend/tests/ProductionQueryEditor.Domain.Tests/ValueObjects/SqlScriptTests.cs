using ProductionQueryEditor.Domain.Errors;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Domain.Tests.ValueObjects;

public class SqlScriptTests
{
    [Theory]
    [InlineData("SELECT * FROM Operation")]
    [InlineData("select 1")]
    [InlineData("WITH cte AS (SELECT 1) SELECT * FROM cte")]
    [InlineData("SELECT TOP 10 NumOF FROM Operation WHERE WorkCenterId = 1003")]
    public void Create_AcceptsReadOnlyQueries(string sql)
    {
        var r = SqlScript.Create(sql);
        Assert.True(r.IsSuccess, $"expected success but got: {r.Error?.Message}");
        Assert.Equal(sql, r.Value!.Sql);
    }

    [Theory]
    [InlineData("INSERT INTO X VALUES (1)",      "INSERT")]
    [InlineData("UPDATE X SET a = 1",            "UPDATE")]
    [InlineData("DELETE FROM X",                 "DELETE")]
    [InlineData("DROP TABLE X",                  "DROP")]
    [InlineData("CREATE TABLE X (id int)",       "CREATE")]
    [InlineData("ALTER TABLE X ADD c int",       "ALTER")]
    [InlineData("TRUNCATE TABLE X",              "TRUNCATE")]
    [InlineData("EXEC sp_who",                   "EXEC")]
    [InlineData("EXECUTE sp_who",                "EXECUTE")]
    [InlineData("MERGE X AS t USING Y AS s ON 1=1", "MERGE")]
    public void Create_RejectsForbiddenAtStart(string sql, string expectedKeyword)
    {
        var r = SqlScript.Create(sql);
        Assert.True(r.IsFailure);
        var err = Assert.IsType<ReadOnlyViolationError>(r.Error);
        Assert.Equal(expectedKeyword, err.Keyword);
    }

    [Theory]
    [InlineData("insert into x values (1)", "INSERT")]   // lowercase
    [InlineData("DeLeTe from x",            "DELETE")]   // mixed case
    public void Create_RejectsForbidden_CaseInsensitive(string sql, string expectedKeyword)
    {
        var r = SqlScript.Create(sql);
        Assert.True(r.IsFailure);
        var err = Assert.IsType<ReadOnlyViolationError>(r.Error);
        Assert.Equal(expectedKeyword, err.Keyword);
    }

    [Theory]
    [InlineData("SELECT 1; INSERT INTO X VALUES(1)", "INSERT")]
    [InlineData("SELECT 1; DELETE FROM X",           "DELETE")]
    [InlineData("SELECT 1;  DROP TABLE X",           "DROP")]   // multiple spaces after ;
    public void Create_RejectsForbidden_AfterSemicolon(string sql, string expectedKeyword)
    {
        var r = SqlScript.Create(sql);
        Assert.True(r.IsFailure);
        var err = Assert.IsType<ReadOnlyViolationError>(r.Error);
        Assert.Equal(expectedKeyword, err.Keyword);
    }

    [Theory]
    [InlineData("SELECT 'INSERT INTO foo' AS msg")]              // keyword inside string literal
    [InlineData("SELECT INSERTED_AT FROM Operation")]            // identifier containing keyword
    [InlineData("SELECT * FROM Operation WHERE Status = 'DELETED'")]
    public void Create_DoesNotFalsePositive_OnIdentifiersOrLiterals(string sql)
    {
        var r = SqlScript.Create(sql);
        Assert.True(r.IsSuccess, $"expected success but got: {r.Error?.Message}");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\n\t  ")]
    public void Create_RejectsEmptyOrWhitespace(string? sql)
    {
        var r = SqlScript.Create(sql);
        Assert.True(r.IsFailure);
        Assert.IsType<EmptySqlError>(r.Error);
    }

    [Fact]
    public void Sql_PreservesOriginalText()
    {
        const string raw = "SELECT *\n  FROM Operation\n  WHERE WorkCenterId = 1003";
        var r = SqlScript.Create(raw);
        Assert.Equal(raw, r.Value!.Sql);
    }

    [Fact]
    public void EqualityIsByValue()
    {
        var a = SqlScript.Create("SELECT 1").Value!;
        var b = SqlScript.Create("SELECT 1").Value!;
        Assert.Equal(a, b);
    }
}
