# Backend architecture — Production Query Editor

## Context

The current backend ([backend/ProductionQueryEditor.Api/](../backend/ProductionQueryEditor.Api/)) is a single .NET 8 Web API project where Controllers / Services / Models all live under one project, with infrastructure dependencies (`Microsoft.Data.SqlClient`, `LibGit2Sharp`, `Octokit`) leaking directly into the service layer.

This is fine for a 200-LOC throwaway. It will not scale to a tool that real SOPROFEN devs use daily to commit SQL that goes to production. The pain points it generates as soon as we add features:

- Business rules (read-only SQL guard, branch naming, query identity) are entangled with infrastructure → can't test them without a real DB.
- One service (e.g. `QueryRepositoryService`) takes a hard dependency on `SqlConnection` → impossible to fake for tests.
- No clear boundary between "what the app does" (use cases) and "how it does it" (infra).
- Controllers contain validation logic that should live closer to the use case.
- Errors are thrown across layers and caught in middleware with no domain-specific shape.

## Goals

1. **Testable** — every business rule covered by unit tests that don't touch the DB or network.
2. **Swappable infra** — replacing Dapper with EF Core, or LibGit2Sharp with shell `git`, or Octokit with GitLab, must touch one project only.
3. **Explicit failure modes** — domain errors as values (not exceptions), mapped to HTTP at the boundary.
4. **No surprise dependencies** — Domain has zero NuGet packages. Application has only the bare minimum (no Dapper, no SqlClient).
5. **Discoverable** — a new dev opens the solution and the layer responsibilities are obvious from the project names alone.

## Pattern: Clean Architecture (a.k.a. Onion / Hexagonal)

Four concentric layers. **Dependencies always point inward.** A class in Domain has no knowledge of Application; Application has no knowledge of Infrastructure; Infrastructure plugs into Application via interfaces.

```
┌─────────────────────────────────────────────────────────┐
│  Api  (Controllers, Program.cs, DI, OpenAPI)            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Infrastructure  (SqlServer, LibGit2, Octokit)    │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Application  (Use cases, ports, DTOs)      │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │  Domain  (Entities, value objects,    │  │  │  │
│  │  │  │           business rules, errors)     │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Domain

Pure C#. **Zero NuGet dependencies.** Contains:

- **Entities** that own business invariants: `Query`, `WorkCenter`, `AttributeModel`, `Request`, `Branch`, `PullRequest`.
- **Value objects** for primitive obsession avoidance: `EnvironmentName` (TRN/PRD only), `WorkCenterId`, `BranchName` (sanitized at construction), `SqlScript`, `RequestId`.
- **Domain services** for rules that don't naturally fit on one entity: `ReadOnlySqlGuard` (the keyword check is a domain rule, not infra).
- **Domain errors** as types (records): `ReadOnlyViolationError`, `BranchAlreadyExistsError`, `QueryNotFoundError`, etc.

### Application

Depends on Domain only. Contains:

- **Ports** (interfaces) that Infrastructure implements: `IQueryRepository`, `ISqlExecutor`, `IGitOperations`, `IGitHubClient`.
- **Use case handlers** (one class per use case): `ExecuteQueryHandler`, `OpenPullRequestHandler`, `GetAllQueriesHandler`, etc.
- **Result<T, TError>** type for explicit success/failure (no throws for expected outcomes).
- **DTOs** for handler input/output (records).

We do **not** introduce MediatR for v1. Direct method calls on handler classes. We can add Mediator if/when the handler count justifies it.

### Infrastructure

Depends on Application (for the ports) and Domain (for entities/errors). Contains:

- **`SqlServerQueryRepository : IQueryRepository`** (Dapper)
- **`SqlServerExecutor : ISqlExecutor`** (raw SqlClient + `ReadOnlySqlGuard` from Domain)
- **`LibGit2GitOperations : IGitOperations`**
- **`OctokitGitHubClient : IGitHubClient`**
- **Configuration types** typed-bound to `appsettings.json` sections (`SqlOptions`, `GitOptions`, `GitHubOptions`).

### Api

Depends on Application + Infrastructure. Contains:

- **Controllers** that *only*: deserialize requests → call handler → translate `Result<T>` to HTTP. No business logic.
- **`Program.cs`** — DI wiring, CORS, OpenAPI.
- **Result-to-HTTP middleware/extension** — single source of truth for mapping domain errors to status codes.
- **`appsettings.json`** with placeholder values; real values live in `appsettings.Development.json` (gitignored).

## Cross-cutting concerns

### Error handling
Domain/Application errors flow as `Result<T, TError>`. Only **unexpected** exceptions (DB connection lost, network down) bubble up to the global middleware. The middleware logs + returns a generic 500. Domain errors are mapped explicitly in controller extension methods (e.g. `ReadOnlyViolationError → 400`, `QueryNotFoundError → 404`).

### Logging
Built-in `ILogger<T>` everywhere. Structured logs with named placeholders (`_log.LogInformation("Query executed on {Env} in {Took}ms", env, ms)`). No Serilog for v1 — we add it if/when we need sinks beyond console.

### Validation
Use case handlers validate their inputs against domain invariants (creating a `BranchName` value object throws if the name is invalid — that's a constructor-time guarantee). Controllers do shallow null/format checks via DataAnnotations or FluentValidation — we'll add FluentValidation in story 6 if the controllers grow validation rules.

### Configuration
`IOptions<T>` pattern. Each infrastructure adapter binds to its own typed options object loaded from a section of `appsettings.json`. No magic strings via `IConfiguration["..."]` directly in services.

### Testing
- **Domain**: pure unit tests. xUnit. Should be hundreds of fast tests.
- **Application**: unit tests with hand-rolled fakes for ports (no Moq for v1, fakes are fine and avoid magic).
- **Infrastructure**: integration tests against LocalDB or a containerized SQL Server. Skipped in CI unless explicitly enabled.
- **Api**: smoke tests via `WebApplicationFactory<Program>` hitting endpoints with in-memory test server.

## Tech choices, justified

| Choice | Why |
|---|---|
| **.NET 8** | LTS, aligned with SOPROFEN production screens. |
| **Dapper** (not EF Core) | The DB schema is owned by another team — we read existing tables, no migrations to manage. Dapper's raw-SQL model fits "read existing schema" better than EF. |
| **LibGit2Sharp** (not shell git) | Cross-platform, no `git` binary required on host, native API for atomicity. |
| **Octokit** | The .NET-canonical GitHub client. |
| **xUnit** | De facto standard for .NET tests. |
| **No MediatR** for now | One handler call per controller endpoint isn't worth the indirection. Reintroduce when we have ≥ 20 handlers. |
| **No AutoMapper** | DTO ↔ Domain mappings are 5-10 lines of explicit code; better than mapping rules buried in profiles. |
| **No FluentValidation** for v1 | DataAnnotations cover the simple cases. Add FluentValidation if/when controllers grow ≥ 5 validation rules. |
| **`Result<T, TError>`** | Explicit success/failure in signatures; no exception flow control for expected errors. |

## Project structure

```
backend/
├── ProductionQueryEditor.sln
├── src/
│   ├── ProductionQueryEditor.Domain/             ← no NuGet deps
│   ├── ProductionQueryEditor.Application/        ← refs Domain only
│   ├── ProductionQueryEditor.Infrastructure/     ← refs Application + Dapper/LibGit2/Octokit
│   └── ProductionQueryEditor.Api/                ← refs Application + Infrastructure
└── tests/
    ├── ProductionQueryEditor.Domain.Tests/
    ├── ProductionQueryEditor.Application.Tests/
    └── ProductionQueryEditor.Api.Tests/          ← integration via WebApplicationFactory
```

## Conventions

- **File-scoped namespaces** everywhere (`namespace X;` not `namespace X { ... }`).
- **`record`** for value objects + DTOs (immutability default).
- **`required`** for non-nullable members (no nullable suppression workarounds).
- **Constructor injection only** (no property injection, no service locator).
- **`async/await` all the way down** (no `.Result`, no `.GetAwaiter().GetResult()`).
- **One class per file**, named after the class.
- **Tests named `MethodName_Scenario_ExpectedResult`** (e.g. `ExecuteAsync_WithForbiddenKeyword_ReturnsViolationError`).

## What's out of scope for v1

- Authentication/authorization (the app is internal-network only at first; we add auth when it leaves).
- Multi-tenancy (one SOPROFEN deployment).
- CQRS / Event Sourcing (overkill).
- gRPC / GraphQL (REST is fine).
- Distributed tracing (single process, observability comes later).

## How we get from current to target

The migration is broken into stories ([docs/stories/](stories/)). Each story is independently shippable and the build stays green between stories.
