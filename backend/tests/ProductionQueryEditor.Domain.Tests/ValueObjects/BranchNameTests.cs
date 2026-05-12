using ProductionQueryEditor.Domain.Errors;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Domain.Tests.ValueObjects;

public class BranchNameTests
{
    [Theory]
    [InlineData("main",                "main")]
    [InlineData("feature/foo",         "feature/foo")]
    [InlineData("fix/cu-coloris-tab3", "fix/cu-coloris-tab3")]
    [InlineData("release_2026-05",     "release_2026-05")]
    public void Create_PassesValidNames_Through(string input, string expected)
    {
        var r = BranchName.Create(input);
        Assert.True(r.IsSuccess);
        Assert.Equal(expected, r.Value!.Value);
    }

    [Theory]
    [InlineData("feature foo",      "feature-foo")]
    [InlineData("hot fix branch",   "hot-fix-branch")]
    [InlineData("fix:something!",   "fix-something")]
    [InlineData("éàç-test",         "test")]            // accented chars sanitized
    [InlineData("--leading-dash",   "leading-dash")]    // outer dashes trimmed
    [InlineData("trailing--",       "trailing")]
    public void Create_SanitizesInvalidChars(string input, string expected)
    {
        var r = BranchName.Create(input);
        Assert.True(r.IsSuccess, $"expected success but got: {r.Error?.Message}");
        Assert.Equal(expected, r.Value!.Value);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_RejectsNullOrWhitespace(string? input)
    {
        var r = BranchName.Create(input);
        Assert.True(r.IsFailure);
        Assert.IsType<InvalidBranchNameError>(r.Error);
    }

    [Theory]
    [InlineData("@@@")]   // sanitizer leaves nothing
    [InlineData("....")]
    [InlineData("##!!")]
    public void Create_RejectsInputsWithNoUsableCharacters(string input)
    {
        var r = BranchName.Create(input);
        Assert.True(r.IsFailure);
        Assert.IsType<InvalidBranchNameError>(r.Error);
    }

    [Fact]
    public void EqualityIsByValue()
    {
        var a = BranchName.Create("feature/foo").Value!;
        var b = BranchName.Create("feature/foo").Value!;
        Assert.Equal(a, b);
    }

    [Fact]
    public void ToString_ReturnsValue()
    {
        Assert.Equal("main", BranchName.Create("main").Value!.ToString());
    }
}
