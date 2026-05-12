using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Domain.Errors;

public sealed record InvalidBranchNameError(string Reason)
    : DomainError("INVALID_BRANCH", $"Branch name is invalid: {Reason}");
