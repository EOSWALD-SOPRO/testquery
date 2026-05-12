using System.Text.RegularExpressions;
using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Domain.ValueObjects;

/// <summary>
/// A git branch name with sanitization applied: any sequence of characters outside
/// <c>[A-Za-z0-9_/-]</c> is collapsed to a single dash. Empty / whitespace-only / dot-only
/// inputs are rejected.
/// </summary>
public sealed record BranchName
{
    private static readonly Regex Sanitizer = new("[^A-Za-z0-9_/-]+", RegexOptions.Compiled);

    public string Value { get; }

    private BranchName(string value) => Value = value;

    public static Result<BranchName> Create(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return Result<BranchName>.Failure(new InvalidBranchNameError("name is empty"));

        var sanitized = Sanitizer.Replace(input.Trim(), "-").Trim('-');

        if (string.IsNullOrEmpty(sanitized))
            return Result<BranchName>.Failure(new InvalidBranchNameError("name has no usable characters"));

        if (sanitized.All(c => c == '.'))
            return Result<BranchName>.Failure(new InvalidBranchNameError("name is dots only"));

        return Result<BranchName>.Success(new BranchName(sanitized));
    }

    public override string ToString() => Value;
}
