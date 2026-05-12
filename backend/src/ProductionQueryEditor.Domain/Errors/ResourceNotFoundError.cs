using ProductionQueryEditor.Domain.Common;

namespace ProductionQueryEditor.Domain.Errors;

/// <summary>Generic "the thing you asked about doesn't exist" error.</summary>
/// <example>new ResourceNotFoundError("PullRequest", "247")</example>
public sealed record ResourceNotFoundError(string Resource, string Id)
    : DomainError("NOT_FOUND", $"{Resource} '{Id}' not found.")
{
    public override ErrorKind Kind => ErrorKind.NotFound;
}
