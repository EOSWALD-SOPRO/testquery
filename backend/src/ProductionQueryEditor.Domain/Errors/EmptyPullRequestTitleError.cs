using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Domain.Errors;

public sealed record EmptyPullRequestTitleError()
    : DomainError("EMPTY_PR_TITLE", "Pull request title is required.");
