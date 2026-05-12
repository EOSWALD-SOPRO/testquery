# Story 02 — Domain core

## Goal
Build the pure-C# Domain layer: value objects with construction-time invariants, a `Result<T>` type for explicit failures, a `DomainError` hierarchy, and the `ReadOnlySqlGuard` rule. Everything covered by unit tests. **Zero NuGet packages in Domain.**

## Why now
Every subsequent story (03+) needs `Result<T>`, `DomainError`, and the value objects in its handlers. Building them first means stories 03-05 implement use cases, not foundations.

## Acceptance criteria

- [ ] `Domain.csproj` has 0 PackageReference entries (asserted by reading the csproj — Domain stays pure).
- [ ] `Result<T>` type exists with `Success(T)` / `Failure(DomainError)` factories and `Match` / `Map` helpers.
- [ ] `DomainError` abstract base with `Code` (string, e.g. `"READONLY_VIOLATION"`) and `Message` (string).
- [ ] Concrete errors: `InvalidEnvironmentError`, `InvalidBranchNameError`, `EmptySqlError`, `ReadOnlyViolationError(keyword)`.
- [ ] Value object `EnvironmentName` — accepts `"TRN"`/`"PRD"` (case-insensitive input, normalized to upper). Private constructor; `Create(string)` returns `Result<EnvironmentName>`.
- [ ] Value object `BranchName` — sanitizes input via `[^a-zA-Z0-9-_/]+ → -`, rejects empty / whitespace-only / pure-dot inputs. `Create(string)` returns `Result<BranchName>`.
- [ ] Value object `SqlScript` — non-empty, read-only validated (rejects DML/DDL keywords at statement start). `Create(string)` returns `Result<SqlScript>`. The validated SQL is exposed via `Sql` property.
- [ ] All value objects implement value equality (records).
- [ ] `Domain.Tests` has ≥ 25 passing tests covering happy path + every failure mode.
- [ ] `dotnet build` and `dotnet test` both green.

## Out of scope
- Entities for Query/WorkCenter/AttributeModel — those stay as DTOs in Application until story 04 (the use cases will drive what shape they need).
- Anything related to Git, GitHub, or DB access (those have their own stories).
- `BranchName` validation against semantic git rules (no `..`, no leading/trailing slash, etc.) — current behaviour is sanitize-only; tightening can come later if needed.

## Technical notes

### Result<T>
Single type parameter, error is always `DomainError` (polymorphic at the boundary via pattern matching). Lighter than the more general `Result<T, E>` and matches our actual usage.

```csharp
public readonly record struct Result<T>
{
    public T?           Value     { get; }
    public DomainError? Error     { get; }
    public bool         IsSuccess { get; }
    public bool         IsFailure => !IsSuccess;

    public static Result<T> Success(T value);
    public static Result<T> Failure(DomainError error);

    public TOut Match<TOut>(Func<T, TOut> ok, Func<DomainError, TOut> err);
    public Result<TOut> Map<TOut>(Func<T, TOut> map);
}
```

### Read-only guard
Same regex pattern as the previous mock backend (`(^|;\s*)(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|MERGE)\s`). Lives inside `SqlScript.Create` so an existing `SqlScript` is guaranteed read-only — "make illegal states unrepresentable".

### Value object pattern
```csharp
public sealed record EnvironmentName
{
    public string Value { get; }
    private EnvironmentName(string value) => Value = value;
    public static Result<EnvironmentName> Create(string? input) { ... }
    public override string ToString() => Value;
}
```

Records get value equality for free. Private constructor + static factory enforces the only valid construction path.

## Verification
- `dotnet build backend/ProductionQueryEditor.sln` → 0 errors, 0 warnings
- `dotnet test backend/tests/ProductionQueryEditor.Domain.Tests` → ≥ 25 tests, 100% pass
- Read `backend/src/ProductionQueryEditor.Domain/ProductionQueryEditor.Domain.csproj` → no `<PackageReference>`
