# Backend rework — stories

Migration from a single-project Web API to Clean Architecture, sliced into independently shippable stories. After each story, `dotnet build` is green and `dotnet test` passes (where tests exist).

Each story is detailed in its own file. Click through to see acceptance criteria, technical notes, and dependencies.

| # | Story | Goal | Depends on |
|---|---|---|---|
| 01 | [Solution restructure](./01-solution-restructure.md) | Split current single project into 4 layered projects + tests projects. No behaviour change. | — |
| 02 | [Domain core](./02-domain-core.md) | Move business rules into pure Domain entities + value objects + `ReadOnlySqlGuard`. Cover with unit tests. | 01 |
| 03 | [Application — Execute query use case](./03-application-execute-query.md) | First end-to-end vertical slice in Clean Architecture: `ExecuteQueryHandler` + `ISqlExecutor` port + SQL Server adapter. | 02 |
| 04 | [Application — Repository use cases](./04-application-queries-repo.md) | `GetAllQueries`, `GetWorkCenters`, `GetAttributeModels` handlers + `IQueryRepository` port + Dapper adapter. | 03 |
| 05 | [Application — Git & GitHub use cases](./05-application-git-github.md) | `CreateBranch`, `Commit`, `OpenPullRequest`, `GetPullRequestStatus` handlers + `IGitOperations` / `IGitHubClient` ports + adapters. | 04 |
| 06 | [Api — Thin controllers, Result→HTTP mapping](./06-api-thin-controllers.md) | Controllers become 5-10 line orchestrators. Single source of truth for mapping domain errors → HTTP status. | 05 |
| 07 | [Cross-cutting — logging, OpenAPI, error pipeline](./07-cross-cutting.md) | Structured logs, Swagger UI polish, global exception middleware for unexpected errors only. | 06 |
| 08 | [Integration tests](./08-integration-tests.md) | `WebApplicationFactory<Program>` smoke tests covering each endpoint contract. CI-friendly (LocalDB fallback). | 07 |

## Working rhythm

- Implement story N → build green → tests green → commit → I show you the diff → you say go/no-go → next story.
- If something becomes clearly wrong during implementation, we **stop** and adjust the architecture doc + the relevant story. Don't power through a bad design.
- Out-of-scope items don't go into the current story even if they're easy. They become a new story or get added to the v2 backlog.
