# Story 01 — Solution restructure

## Goal
Split the current single `ProductionQueryEditor.Api` project into a 4-project Clean Architecture solution + 3 test projects. **Zero behaviour change.** All existing endpoints respond identically before and after.

## Why first
Every subsequent story moves code between layers. Without the layers existing, we'd be making the existing code worse before making it better.

## Acceptance criteria

- [ ] `backend/ProductionQueryEditor.sln` exists and contains 7 projects:
  - `src/ProductionQueryEditor.Domain/` (classlib, no NuGet deps)
  - `src/ProductionQueryEditor.Application/` (classlib, refs Domain)
  - `src/ProductionQueryEditor.Infrastructure/` (classlib, refs Application + current NuGet deps)
  - `src/ProductionQueryEditor.Api/` (web API, refs Application + Infrastructure)
  - `tests/ProductionQueryEditor.Domain.Tests/` (xUnit, refs Domain)
  - `tests/ProductionQueryEditor.Application.Tests/` (xUnit, refs Application)
  - `tests/ProductionQueryEditor.Api.Tests/` (xUnit + WebApplicationFactory, refs Api)
- [ ] All current Services move to Infrastructure (they have infra deps).
- [ ] All current Models move to Application (they're DTOs the use cases will exchange).
- [ ] Controllers stay in Api but their `using` statements update to point at the new project namespaces.
- [ ] `appsettings.json`, `Program.cs` stay in Api.
- [ ] `dotnet build` passes with 0 warnings, 0 errors.
- [ ] Manual smoke test: `dotnet run` starts the API, `GET /api/health` returns the same shape as before.
- [ ] Test projects compile but contain no tests yet (placeholder file).

## Out of scope
- Refactoring service internals (that's stories 02-05).
- Changing any endpoint shape.
- Adding new features.
- Writing actual tests beyond the scaffolding.

## Technical notes

### Project references
```
Api ─→ Application
Api ─→ Infrastructure
Infrastructure ─→ Application
Application ─→ Domain
```

Domain.csproj should contain `<Nullable>enable</Nullable>` and **no `<PackageReference>` whatsoever**. Use this as a static assertion of "no infra deps in Domain".

### File moves
| From | To |
|---|---|
| `Models/QueryDto.cs` | `Application/Dtos/` (split into one file per type to follow conventions) |
| `Services/SqlExecutorService.cs` | `Infrastructure/Sql/` |
| `Services/QueryRepositoryService.cs` | `Infrastructure/Sql/` |
| `Services/GitService.cs` | `Infrastructure/Git/` |
| `Services/GitHubService.cs` | `Infrastructure/GitHub/` |
| `Controllers/*.cs` | unchanged location |

DI registration in `Program.cs` keeps the same `AddSingleton<T>()` calls — only the `using` statements change.

### Solution file
Use `dotnet new sln` + `dotnet sln add` for each project, not hand-editing.

## Risk / things to watch

- **Namespace migration** — the JSON serializer uses property names; classes moving namespaces won't break the wire format unless we accidentally rename properties. Don't rename anything in this story.
- **`using` cycles** — projects don't allow circular refs; if you find yourself wanting to ref Infrastructure from Application, something is wrong (it should be the inverse).
- **NuGet packages** — they currently sit on the API project. Move them to Infrastructure (`Dapper`, `Microsoft.Data.SqlClient`, `LibGit2Sharp`, `Octokit`). Keep `Swashbuckle.AspNetCore` on Api.

## Verification
1. `cd backend && dotnet build` → 0 errors, 0 warnings
2. `dotnet run --project src/ProductionQueryEditor.Api` → starts on :5000
3. `curl http://localhost:5000/api/health` → 503 (DB unreachable) but JSON shape matches the pre-restructure response
4. `dotnet test` → 0 tests run, 0 failures (test projects exist but empty)
