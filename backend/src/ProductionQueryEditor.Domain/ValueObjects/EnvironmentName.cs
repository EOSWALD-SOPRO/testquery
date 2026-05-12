using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Domain.ValueObjects;

/// <summary>
/// Strongly-typed name of a target SQL Server environment. Only "TRN" or "PRD".
/// Construction goes through <see cref="Create"/>; an existing instance is guaranteed valid.
/// </summary>
public sealed record EnvironmentName
{
    public static readonly EnvironmentName Trn = new("TRN");
    public static readonly EnvironmentName Prd = new("PRD");

    public string Value { get; }

    private EnvironmentName(string value) => Value = value;

    public static Result<EnvironmentName> Create(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return Result<EnvironmentName>.Failure(new InvalidEnvironmentError(input));

        return input.Trim().ToUpperInvariant() switch
        {
            "TRN" => Result<EnvironmentName>.Success(Trn),
            "PRD" => Result<EnvironmentName>.Success(Prd),
            _     => Result<EnvironmentName>.Failure(new InvalidEnvironmentError(input)),
        };
    }

    public override string ToString() => Value;
}
