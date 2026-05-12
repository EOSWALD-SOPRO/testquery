using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Domain.Errors;

public sealed record EmptySqlError()
    : DomainError("EMPTY_SQL", "SQL is empty.");
