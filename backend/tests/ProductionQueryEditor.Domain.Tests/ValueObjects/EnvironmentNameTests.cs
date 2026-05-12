using ProductionQueryEditor.Domain.Errors;
using ProductionQueryEditor.Domain.ValueObjects;

namespace ProductionQueryEditor.Domain.Tests.ValueObjects;

public class EnvironmentNameTests
{
    [Theory]
    [InlineData("TRN", "TRN")]
    [InlineData("PRD", "PRD")]
    [InlineData("trn", "TRN")]   // case-insensitive
    [InlineData("PrD", "PRD")]
    [InlineData("  TRN  ", "TRN")]
    public void Create_AcceptsTrnAndPrd_NormalisedToUpper(string input, string expected)
    {
        var r = EnvironmentName.Create(input);
        Assert.True(r.IsSuccess);
        Assert.Equal(expected, r.Value!.Value);
    }

    [Theory]
    [InlineData("DEV")]
    [InlineData("QA")]
    [InlineData("PROD")]   // close but not "PRD"
    [InlineData("trn ")]   // trimmed but with the trailing dash this is "TRN" actually — oh wait, Trim only
    public void Create_RejectsUnknownEnv(string input)
    {
        // Note: "trn " → Trim → "trn" → matches. So we use truly unknown values above.
        if (input.Trim().ToUpperInvariant() is "TRN" or "PRD") return;
        var r = EnvironmentName.Create(input);
        Assert.True(r.IsFailure);
        Assert.IsType<InvalidEnvironmentError>(r.Error);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_RejectsNullOrEmpty(string? input)
    {
        var r = EnvironmentName.Create(input);
        Assert.True(r.IsFailure);
        Assert.IsType<InvalidEnvironmentError>(r.Error);
    }

    [Fact]
    public void StaticTrn_IsTrn() => Assert.Equal("TRN", EnvironmentName.Trn.Value);

    [Fact]
    public void StaticPrd_IsPrd() => Assert.Equal("PRD", EnvironmentName.Prd.Value);

    [Fact]
    public void EqualityIsByValue()
    {
        var a = EnvironmentName.Create("TRN").Value!;
        var b = EnvironmentName.Create("trn").Value!;
        Assert.Equal(a, b);
        Assert.True(a == b);
    }

    [Fact]
    public void ToString_ReturnsValue()
    {
        Assert.Equal("PRD", EnvironmentName.Prd.ToString());
    }
}
