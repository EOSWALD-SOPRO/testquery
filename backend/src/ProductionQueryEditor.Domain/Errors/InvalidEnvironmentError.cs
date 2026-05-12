using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Domain.Errors;

public sealed record InvalidEnvironmentError(string? Provided)
    : DomainError("INVALID_ENV", $"Environment '{Provided ?? "<null>"}' is invalid. Must be TRN or PRD.");
