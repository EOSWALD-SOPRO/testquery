# Story 04 — Application: Repository use cases

## Goal
Apply the same Clean Architecture pattern from story 03 to the 3 read endpoints: `GET /api/queries`, `GET /api/queries/workcenters`, `GET /api/queries/attribute-models`. Each gets a dedicated port, handler, and Dapper adapter. The legacy `SqlExecutorService` and `QueryRepositoryService` are deleted at the end of the story.

## Why now
Story 03 proved the pattern. Story 04 finishes the SQL side of the API so the next story (Git/GitHub) can start clean. Until this lands, controllers still depend directly on Infrastructure types — that's a leak we close here.

## Acceptance criteria

- [ ] 3 ports in `Application/Ports/`: `IQueryRepository`, `IWorkCenterRepository`, `IAttributeModelRepository`. Each has a single `GetAllAsync(EnvironmentName env, CancellationToken ct)` method (ISP — one repo per dimension).
- [ ] 3 use cases in `Application/UseCases/`:
  - `ListQueries/{ListQueriesQuery, ListQueriesHandler}`
  - `ListWorkCenters/{ListWorkCentersQuery, ListWorkCentersHandler}`
  - `ListAttributeModels/{ListAttributeModelsQuery, ListAttributeModelsHandler}`
- [ ] Each handler validates the env via `EnvironmentName.Create` and returns `Result<List<TDto>>`.
- [ ] 3 Dapper adapters in `Infrastructure/Sql/`: `DapperQueryRepository`, `DapperWorkCenterRepository`, `DapperAttributeModelRepository`. All use `SqlConnectionFactory` (no more direct `SqlConnection` instantiation).
- [ ] `QueriesController`'s 3 read endpoints become thin orchestrators using the same `Result.Match` pattern as `Execute`.
- [ ] **`SqlExecutorService` is deleted** (its only remaining method `GetConnectionString` is now redundant with `SqlConnectionFactory`).
- [ ] **`QueryRepositoryService` is deleted** (replaced by the 3 Dapper adapters).
- [ ] DI in `Program.cs` registers the 3 ports → 3 adapters; legacy registrations removed.
- [ ] **Tests**: ≥ 9 new tests in `Application.Tests` — at minimum 1 happy path + 1 invalid-env per handler. Exception propagation covered for at least one.
- [ ] Build green, all tests green, all 4 endpoints respond identically to story 03.

## Out of scope
- Caching (WorkCenter and AttributeModel are dimension tables that change rarely — caching would be a sensible v2 addition, but it's a separate story).
- Any write endpoints (`POST /api/queries`, `PUT /api/queries/:id`) — not currently supported by the frontend, defer until needed.
- Schema introspection endpoint (`GET /api/schema`) for autocomplete — separate future story.

## Technical notes

### Why split into 3 repositories instead of one
- Interface Segregation Principle: a handler that lists workcenters has no business depending on a `IQueryRepository.GetAllQueries` method.
- Future caching/lifetime concerns differ: WorkCenters might become singleton-cached, queries probably not.
- Same Dapper backing class is allowed and even desirable (they all share `SqlConnectionFactory`); the split is at the abstraction level.

### Handler pattern (same for all 3)
```csharp
public sealed class ListXHandler
{
    private readonly IXRepository _repo;
    public ListXHandler(IXRepository repo) => _repo = repo;

    public async Task<Result<List<XDto>>> HandleAsync(ListXQuery query, CancellationToken ct)
    {
        var env = EnvironmentName.Create(query.Env);
        if (env.IsFailure) return Result<List<XDto>>.Failure(env.Error!);
        var rows = await _repo.GetAllAsync(env.Value!, ct);
        return Result<List<XDto>>.Success(rows);
    }
}
```

### Dapper adapter pattern
SQL queries from the deleted `QueryRepositoryService` move verbatim into the new adapters. The hypothesis comment about `dbo.Request(Id, Sql)` follows them — still needs SOPROFEN team confirmation, still flagged.

### Test fakes
Same hand-rolled-fake pattern as story 03's `FakeSqlExecutor`. One fake per port, all in `Application.Tests/Fakes/`.

## Verification
- `dotnet build` → 0 errors, 0 warnings
- `dotnet test` → ≥ 87 tests passing (78 from story 03 + ≥ 9 from this story)
- `curl localhost:.../api/queries?env=DEV` → 400 with `{ code: "INVALID_ENV", ... }`
- `curl localhost:.../api/queries?env=TRN` → 500 (DB unreachable in dev) — same as before, exception bubbles to middleware
- `curl localhost:.../api/queries/workcenters?env=TRN` → same shape as story 03
- `curl localhost:.../api/queries/attribute-models?env=TRN` → same shape as story 03
- `Infrastructure/Sql/SqlExecutorService.cs` and `QueryRepositoryService.cs` no longer exist
