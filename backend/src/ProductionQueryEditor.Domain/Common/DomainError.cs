namespace ProductionQueryEditor.Domain.Common;

/// <summary>
/// Base type for all expected, recoverable failures returned by Domain / Application layers.
/// Concrete errors live in <c>Domain/Errors/</c>; if their kind isn't <see cref="ErrorKind.Validation"/>
/// (the default), they override <see cref="Kind"/>.
/// </summary>
public abstract record DomainError(string Code, string Message)
{
    /// <summary>Coarse error category, used by the Api layer to pick an HTTP status.</summary>
    public virtual ErrorKind Kind => ErrorKind.Validation;
}
