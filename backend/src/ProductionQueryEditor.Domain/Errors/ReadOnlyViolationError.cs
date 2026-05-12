using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Domain.Errors;

public sealed record ReadOnlyViolationError(string Keyword)
    : DomainError("READONLY_VIOLATION",
        $"Query contains forbidden keyword '{Keyword}'. Only SELECT queries are allowed.");
