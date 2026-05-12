# Story 03 — Application: Execute query use case

## Goal
First end-to-end vertical slice in Clean Architecture for the **most security-critical operation**: SQL execution against TRN/PRD. The use case orchestrates `EnvironmentName` + `SqlScript` validation (Domain), delegates execution to a port `ISqlExecutor` (Application), with a SQL Server adapter (Infrastructure) plugging in via DI. Health connectivity check follows the same port pattern.

## Why this slice first
1. It's the riskiest endpoint (DML on PRD = data loss). Tightening it first means everything downstream inherits the safety guarantees.
2. It exercises every Clean Architecture concept: Domain validation, Application port, Infrastructure adapter, Api thin controller, and unit-tested handler with a fake. Once this works, stories 04-05 are the same recipe for other use cases.

## Acceptance criteria

- [ ] `Application/Ports/ISqlExecutor.cs` exists. Signature: `Task<ExecuteQueryResponse> ExecuteAsync(SqlScript sql, EnvironmentName env, CancellationToken ct)`. **Takes validated VOs**, not raw strings.
- [ ] `Application/Ports/ISqlConnectivityChecker.cs` exists for health pings.
- [ ] `Application/UseCases/ExecuteQuery/ExecuteQueryCommand.cs` (record with raw `Sql`, `Env`).
- [ ] `Application/UseCases/ExecuteQuery/ExecuteQueryHandler.cs` returns `Result<ExecuteQueryResponse>`. Validates input via VOs (so failures are typed `DomainError`, not exceptions).
- [ ] `Infrastructure/Sql/SqlServerExecutor.cs` implements `ISqlExecutor`. Uses an `IOptions<SqlConnectionOptions>` for connection strings.
- [ ] `Infrastructure/Sql/SqlServerConnectivityChecker.cs` implements `ISqlConnectivityChecker`.
- [ ] `Infrastructure/Sql/SqlConnectionFactory.cs` — single source of truth for opening a connection, used by both adapters above.
- [ ] `QueriesController.Execute` becomes a thin orchestrator: deserialize → handler → `Result.Match` → HTTP. **No business logic** in the controller.
- [ ] `HealthController` switches from `SqlExecutorService.PingAsync` to `ISqlConnectivityChecker`.
- [ ] Old `SqlExecutorService.ExecuteAsync` and `PingAsync` are deleted (the rest of the class survives for story 04).
- [ ] DI in `Program.cs` registers ports → adapters explicitly.
- [ ] **Tests**: ≥ 8 new tests in `Application.Tests` covering happy path + each failure mode (empty sql, forbidden keyword, invalid env). All use a hand-rolled `FakeSqlExecutor`.
- [ ] Build green, all tests green, `/api/queries/execute` and `/api/health` respond identically to story 02.

## Out of scope
- Other queries endpoints (GetAll, WorkCenters, AttributeModels) — story 04.
- Git/GitHub use cases — story 05.
- A reusable `Result<T>.ToActionResult()` extension — story 06 will add it; for story 03 the controller does an inline `Match`.
- Logging strategy beyond `ILogger<T>` injection — story 07.
- Real DB integration tests — story 08.

## Technical notes

### Layer boundaries
- The handler depends on the **port**, never on `SqlServerExecutor` directly.
- The adapter depends on `Microsoft.Data.SqlClient` and `IOptions<>`. Application stays infra-free.
- The fake in test code lives in `Application.Tests` — it's a test concern.

### Connection string typed options
Replace ad-hoc `IConfiguration["ConnectionStrings:Sql{env}"]` with:
```csharp
public class SqlConnectionOptions
{
    public string SqlTRN { get; set; } = "";
    public string SqlPRD { get; set; } = "";
}
```
Bound to `ConnectionStrings` section in `Program.cs`. The factory looks up by env name.

### Result→HTTP mapping (inline for now)
```csharp
result.Match<IActionResult>(
    ok  => Ok(ok),
    err => err switch
    {
        InvalidEnvironmentError or EmptySqlError or ReadOnlyViolationError
            => BadRequest(new { error = err.Message, code = err.Code }),
        _   => StatusCode(500, new { error = err.Message, code = err.Code }),
    });
```
Story 06 lifts this into a `Result<T>.ToActionResult()` extension shared by all controllers.

### Test fake
Hand-rolled fake (no Moq):
```csharp
public sealed class FakeSqlExecutor : ISqlExecutor
{
    public List<(SqlScript Sql, EnvironmentName Env)> Calls { get; } = new();
    public ExecuteQueryResponse Result { get; set; } = new() { Columns = [], Rows = [] };

    public Task<ExecuteQueryResponse> ExecuteAsync(SqlScript sql, EnvironmentName env, CancellationToken ct)
    {
        Calls.Add((sql, env));
        return Task.FromResult(Result);
    }
}
```

## Verification
- `dotnet build` → 0 errors, 0 warnings
- `dotnet test` → ≥ 77 tests passing (69 from story 02 + ≥ 8 from this story)
- `dotnet run --project src/.../Api` then `curl localhost:5050/api/health` → same shape as story 01
- Send a forbidden query via `POST /api/queries/execute` → 400 with `{ code: "READONLY_VIOLATION", error: "...INSERT..." }`
- Send `{ sql: "", env: "TRN" }` → 400 with `{ code: "EMPTY_SQL", ... }`
- Send `{ sql: "SELECT 1", env: "QA" }` → 400 with `{ code: "INVALID_ENV", ... }`
