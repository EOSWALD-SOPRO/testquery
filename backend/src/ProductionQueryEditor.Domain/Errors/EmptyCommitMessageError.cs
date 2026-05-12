using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Domain.Errors;

public sealed record EmptyCommitMessageError()
    : DomainError("EMPTY_COMMIT_MESSAGE", "Commit message is required.");
