using System.Text.RegularExpressions;
using ProductionQueryEditor.Domain.Common;
using ProductionQueryEditor.Domain.Errors;

namespace ProductionQueryEditor.Domain.ValueObjects;

/// <summary>
/// A SQL script that has passed the read-only guard: no DML/DDL keywords at statement start.
/// An existing <see cref="SqlScript"/> is guaranteed safe to execute as-is against TRN/PRD.
/// </summary>
public sealed record SqlScript
{
    private static readonly string[] ForbiddenKeywords =
        { "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER", "TRUNCATE", "EXEC", "EXECUTE", "MERGE" };

    // Matches a forbidden keyword at the start of the script or just after a semicolon.
    // The trailing \s ensures we don't false-positive on identifiers that *contain* a keyword
    // (e.g. "DELETE_LOG" would match, "DELETED_AT" would not).
    private static readonly Regex ForbiddenRegex = new(
        @"(^|;\s*)(" + string.Join("|", ForbiddenKeywords) + @")\s",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public string Sql { get; }

    private SqlScript(string sql) => Sql = sql;

    public static Result<SqlScript> Create(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return Result<SqlScript>.Failure(new EmptySqlError());

        var match = ForbiddenRegex.Match(input);
        if (match.Success)
        {
            var keyword = match.Groups[2].Value.ToUpperInvariant();
            return Result<SqlScript>.Failure(new ReadOnlyViolationError(keyword));
        }

        return Result<SqlScript>.Success(new SqlScript(input));
    }

    public override string ToString() => Sql;
}
