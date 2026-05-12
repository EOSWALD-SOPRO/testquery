namespace ProductionQueryEditor.Domain.Common;

// Explicit success/failure type used by Domain factories and Application handlers.
// `Value` is meaningful only when `IsSuccess`. `Error` is meaningful only when `IsFailure`.
//
// Single type param — the error is always a DomainError (subtype). The boundary
// (Api layer) pattern-matches on the concrete error type to map it to an HTTP status.
public readonly record struct Result<T>
{
    public T?           Value      { get; }
    public DomainError? Error      { get; }
    public bool         IsSuccess  { get; }
    public bool         IsFailure  => !IsSuccess;

    private Result(T? value, DomainError? error, bool isSuccess)
    {
        Value = value; Error = error; IsSuccess = isSuccess;
    }

    public static Result<T> Success(T value) => new(value, null, true);

    public static Result<T> Failure(DomainError error)
    {
        ArgumentNullException.ThrowIfNull(error);
        return new(default, error, false);
    }

    /// <summary>Reduce the result to a single value by handling both branches.</summary>
    public TOut Match<TOut>(Func<T, TOut> onSuccess, Func<DomainError, TOut> onFailure)
        => IsSuccess ? onSuccess(Value!) : onFailure(Error!);

    /// <summary>Transform the success value, propagating failure unchanged.</summary>
    public Result<TOut> Map<TOut>(Func<T, TOut> map)
        => IsSuccess ? Result<TOut>.Success(map(Value!)) : Result<TOut>.Failure(Error!);
}
