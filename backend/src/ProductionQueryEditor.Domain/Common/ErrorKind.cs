namespace ProductionQueryEditor.Domain.Common;

/// <summary>
/// Coarse categorisation of a <see cref="DomainError"/>. The Api layer maps each kind
/// to an HTTP status code — Domain stays HTTP-free.
/// </summary>
public enum ErrorKind
{
    /// <summary>Bad input from the caller (default).</summary>
    Validation,
    /// <summary>The requested resource doesn't exist.</summary>
    NotFound,
    /// <summary>The operation collides with current state (e.g. branch already exists).</summary>
    Conflict,
    /// <summary>The caller isn't authenticated or lacks permission.</summary>
    Unauthorized,
    /// <summary>Something went wrong inside the system (rarely used — prefer letting unexpected exceptions bubble).</summary>
    Internal,
}
