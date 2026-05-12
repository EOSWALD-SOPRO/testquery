# Story 06 — Api: declarative Result→HTTP mapping

## Goal
Make the `Result<T>` → HTTP-status mapping **declarative and extensible**. Today `ResultExtensions.ToActionResult<T>()` hardcodes a list of known error types in a switch — every new error means editing both Domain (the error) AND Api (the switch). After this story, errors **declare their own kind** and the mapping reads it.

## Why now
Story 05 introduced 6 domain errors and the centralised mapper. Adding a 7th would require touching the Api layer. That's a coupling smell that gets worse with every new use case. Fix it before story 07 stacks more errors for cross-cutting concerns.

## Acceptance criteria

- [ ] `Domain/Common/ErrorKind.cs` enum with at least: `Validation`, `NotFound`, `Conflict`, `Unauthorized`, `Internal`.
- [ ] `DomainError` gains a `virtual ErrorKind Kind => ErrorKind.Validation` property (sensible default — most current errors are validation).
- [ ] Errors that aren't validation override `Kind` (e.g. a new `ResourceNotFoundError` returns `NotFound`).
- [ ] `ResultExtensions.ToActionResult<T>()` uses `err.Kind` for the switch — **no per-type names** in Api anymore.
- [ ] Add a `ResourceNotFoundError(string Resource, string Id)` as the canonical NotFound (future `GetPullRequestStatus` for non-existent PR will use it).
- [ ] **Tests**: ≥ 6 new tests covering each `ErrorKind → HTTP status` mapping. Lives in `Application.Tests` since the helper is an Api concern but its inputs are Domain — actually move it: tests go in `Api.Tests` to honour the layer boundary.
- [ ] No regressions: all existing error responses keep their current shape `{ error, code }` and status codes (validation errors still 400, etc.).
- [ ] Update CLAUDE.md with a "How to add a new domain error" subsection.

## Out of scope
- Migrating to RFC 7807 ProblemDetails (would break the wire format the React frontend consumes — needs frontend coordination, do it as its own story when the frontend has nothing in flight).
- FluentValidation — our Domain VOs already cover validation. Reintroduce only when controllers grow rules that don't fit on entities.
- Logging strategy / OpenAPI polish — that's story 07.

## Technical notes

### ErrorKind keeps Domain HTTP-free
HTTP status is an Api concept. Domain shouldn't care. So Domain exposes a *categorical* concept (`ErrorKind`), and Api translates it. The translation table lives in one file, in the layer that owns HTTP semantics.

```csharp
// Domain
public enum ErrorKind { Validation, NotFound, Conflict, Unauthorized, Internal }

public abstract record DomainError(string Code, string Message)
{
    public virtual ErrorKind Kind => ErrorKind.Validation;
}

// Api
err.Kind switch
{
    ErrorKind.Validation   => 400,
    ErrorKind.NotFound     => 404,
    ErrorKind.Conflict     => 409,
    ErrorKind.Unauthorized => 401,
    ErrorKind.Internal     => 500,
}
```

Adding a 7th error requires zero changes in Api.

### Test placement
Existing tests live in `Domain.Tests` and `Application.Tests`. The `ToActionResult<T>` helper lives in Api, so its tests belong in `Api.Tests`. Story 06 starts populating that test project (story 08 will add the integration tests on top).

## Verification
- `dotnet build` → 0 errors, 0 warnings
- `dotnet test` → ≥ 109 tests passing (103 from story 05 + ≥ 6 from this story)
- Existing 400 responses (e.g. `INVALID_ENV`) still return 400 with the same body shape
- A handler returning `ResourceNotFoundError` would respond 404 (manual verification once a use case uses it; story 06 leaves the type in place for later use)
