# Story 08 — Integration tests

## Goal
Stand up `WebApplicationFactory<Program>` to run the full API in-process for tests. Replace the SQL/Git/GitHub adapters with hand-rolled fakes via DI override, so tests cover the **HTTP contract** of every endpoint without touching real infrastructure. The idea: catch breakage in routing, deserialization, exception pipeline, or DI registration that unit tests miss.

## Why this last
Stories 02-06 covered the unit-level behaviour layer-by-layer. Story 08 stitches those layers together and makes sure the wires haven't crossed. It's the first story where a regression in `Program.cs` DI wiring would actually fail a test.

## Acceptance criteria

- [ ] `Api.Tests` references `Application.Tests` (or duplicates the fakes — story chooses the simpler path) so the existing `Fake*` classes can drive the integration tests.
- [ ] A `TestApplicationFactory : WebApplicationFactory<Program>` registers the fakes in place of real adapters: `IQueryRepository`, `IWorkCenterRepository`, `IAttributeModelRepository`, `ISqlExecutor`, `ISqlConnectivityChecker`, `IGitOperations`, `IGitHubClient`.
- [ ] `Endpoints/HealthEndpointTests.cs` — happy path 200, degraded path 503.
- [ ] `Endpoints/QueriesEndpointTests.cs` — `GET /api/queries`, `GET /api/queries/workcenters`, `GET /api/queries/attribute-models`, `POST /api/queries/execute`. Cover happy path + at least one validation error per shape.
- [ ] `Endpoints/GithubEndpointTests.cs` — `GET /api/github/branches`, `POST /api/github/branches` (sanitization happy + invalid name), `POST /api/github/commit` (empty message → 400), `POST /api/github/pull-requests` (empty title → 400 + happy path).
- [ ] `Endpoints/ExceptionPipelineTests.cs` — provoke an exception via a fake that throws; confirm it surfaces as 500 with the standard `ErrorResponse` shape (proves the IExceptionHandler chain is wired).
- [ ] **≥ 12 new tests**. Build green, all 117 prior tests still pass.
- [ ] No real network calls (no SQL Server, no GitHub) — verifiable by running with no internet and no DB.

## Out of scope
- Performance tests / load tests.
- Tests against a real SQL Server (LocalDB / Testcontainers) — useful but a separate story; the cost-to-value of installing SqlServer in CI is real and the current Dapper queries are simple enough to trust for now.
- Frontend e2e tests (those live in the React project's puppeteer suite, story 08 is backend-only).

## Technical notes

### TestApplicationFactory pattern
```csharp
public sealed class TestApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IQueryRepository>();
            services.AddSingleton<IQueryRepository>(new FakeQueryRepository());
            // ...etc
        });
    }
}
```
Each test class injects the factory via `IClassFixture<TestApplicationFactory>` and calls `factory.CreateClient()`.

### Reusing fakes
The `Fake*` classes already live in `Application.Tests/Fakes/`. Cleanest move: add a project reference from `Api.Tests` → `Application.Tests`. Yes, test-project-references-test-project is unusual, but it's better than duplicating the fakes. The alternative (extracting them into a `TestSupport` shared project) is over-engineering for ~6 fakes.

### What the tests *don't* prove
Integration tests with fake adapters don't catch real DB/git/GitHub bugs. Those need real infrastructure. We accept that gap — the tradeoff is fast, hermetic tests that catch routing / DI / serialization / exception-pipeline regressions.

## Verification
- `dotnet test` → ≥ 129 passing
- Disconnect machine from network, repeat — should still pass
- Run on a fresh checkout with no `appsettings.Development.json` — should still pass
