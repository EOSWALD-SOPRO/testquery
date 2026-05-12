# Story 07 — Cross-cutting: exception pipeline + OpenAPI polish

## Goal
Replace the ad-hoc lambda-based exception middleware with .NET 8's first-class `IExceptionHandler`. Map known infra exceptions (`SqlException`) to meaningful HTTP statuses (503 for unreachable DB) instead of generic 500. Polish the OpenAPI doc so Swagger UI is actually useful for callers.

## Why now
Stories 01-06 produced a clean per-request flow but exceptional paths still go through a 12-line lambda in `Program.cs`. The lambda lost the ability to differentiate "DB unreachable" from "bug in our code" — both surface as 500 with raw `SqlException` text. Production ops would want different alerts for each. Also, Swagger today says "200 OK + ProductionQueryEditor.Application.Dtos.QueryDto" with no error documentation — useless.

## Acceptance criteria

- [ ] `Api/ExceptionHandlers/` directory with at least:
  - `SqlExceptionHandler` — catches `Microsoft.Data.SqlClient.SqlException`, returns 503 with `code: "DB_UNREACHABLE"` and a human-readable message.
  - `GlobalExceptionHandler` — fallback for any other unhandled exception, returns 500 with `code: <ExceptionType>`.
- [ ] Both registered via `AddExceptionHandler<T>()` (the .NET 8 idiom). The lambda middleware in `Program.cs` is **removed**.
- [ ] Typed `ErrorResponse(string Error, string Code)` record replaces the anonymous objects scattered across `ResultExtensions` and the exception handlers — single shape on the wire.
- [ ] Controllers annotate response shapes with `[ProducesResponseType]`:
  - Success: `200` + concrete DTO type
  - Validation errors: `400` + `ErrorResponse`
  - DB errors (where applicable): `503` + `ErrorResponse`
  - Catch-all: `500` + `ErrorResponse`
- [ ] Swagger UI now shows the right shapes per status code.
- [ ] AddSwaggerGen has a sensible title + version: "Production Query Editor API · v1".
- [ ] **Tests**: ≥ 4 new tests in `Api.Tests/ExceptionHandlers/` covering SqlException → 503 and unknown exception → 500.
- [ ] Build green, all existing 113 tests still pass.

## Out of scope
- Per-handler logging decorators (a real cross-cutting need but it adds a generic `IUseCaseHandler` interface — too much surface for this story; revisit if 15+ handlers grow to 30).
- Serilog or other sinks beyond console (default ILogger is fine until ops need structured shipping).
- Authentication/authorization.
- Distributed tracing / OpenTelemetry.

## Technical notes

### IExceptionHandler order matters
`AddExceptionHandler<T>()` builds an ordered chain. First handler that returns `true` wins. Register specific handlers before generic ones:
```csharp
builder.Services.AddExceptionHandler<SqlExceptionHandler>();    // tries first
builder.Services.AddExceptionHandler<GlobalExceptionHandler>(); // fallback
```

### SqlException → 503
`SqlException` covers connection failure, timeout, login failure, etc. We don't try to differentiate sub-types in this story — they all become "the database isn't responding", which is honest. A future story could split `503 DB_UNREACHABLE` from `408 QUERY_TIMEOUT` by inspecting `SqlException.Number`.

### ErrorResponse on the wire
Today: `ResultExtensions` and the lambda emit slightly different shapes (anonymous objects). Standardising on `record ErrorResponse(string Error, string Code)` means one less thing for the frontend to special-case.

## Verification
- `dotnet build` → 0 errors, 0 warnings
- `dotnet test` → ≥ 117 tests passing
- `curl localhost:.../api/queries?env=TRN` (DB unreachable) → **503** with `code: "DB_UNREACHABLE"` (was 500 with `code: "SqlException"`)
- `/swagger` shows 400/500/503 documented per endpoint
