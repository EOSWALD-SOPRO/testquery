# Story 05 — Application: Git & GitHub use cases

## Goal
Apply the same Clean Architecture pattern to **all 11 git/GitHub endpoints**. After this story:
- `Infrastructure/Git/GitService.cs` and `Infrastructure/GitHub/GitHubService.cs` are **deleted**
- `GithubController` is a thin orchestrator (every endpoint calls a handler)
- Controllers depend on Application ports only — no remaining direct reference to `LibGit2Sharp` or `Octokit` from Api

## Why now
Stories 03-04 cleaned the SQL side. Story 05 finishes the same job for git/GitHub so the entire backend is on one architectural pattern. Stories 06-08 then become true cross-cutting work (pipelines, validation, integration tests) without per-endpoint plumbing.

## Acceptance criteria

- [ ] **2 ports** in `Application/Ports/`:
  - `IGitOperations` (branches, checkout, commit, push, history)
  - `IGitHubClient` (PR create / list / status / merge, collaborators)
- [ ] **11 use cases** in `Application/UseCases/{Git,Github}/`:
  - Git: `GetBranches`, `CreateBranch`, `CheckoutBranch`, `Commit`, `Push`, `GetCommitHistory`
  - Github: `ListPullRequests`, `OpenPullRequest`, `GetPullRequestStatus`, `MergePullRequest`, `ListCollaborators`
- [ ] Each handler returns `Result<T>` and validates inputs through Domain VOs where applicable (`BranchName`, etc.).
- [ ] **`OpenPullRequestHandler` orchestrates** the existing pre-PR push (catching "up-to-date" gracefully) — this multi-step logic moves out of the controller.
- [ ] **2 adapters** in `Infrastructure/`:
  - `LibGit2GitOperations : IGitOperations`
  - `OctokitGitHubClient : IGitHubClient`
  - Both use typed options (`GitOptions`, `GitHubOptions`).
- [ ] `GithubController` becomes a thin orchestrator: 11 endpoints, each ~3-5 lines using `ToActionResult<T>`.
- [ ] Result-to-HTTP helper extracted to a `ResultExtensions.ToActionResult<T>()` shared between `QueriesController` and `GithubController` (avoid duplication; story 06 can polish further but the duplication should not survive story 05).
- [ ] Legacy `Infrastructure/Git/GitService.cs` and `Infrastructure/GitHub/GitHubService.cs` **deleted**.
- [ ] DI in `Program.cs`: 2 new ports + 11 new handlers; legacy registrations removed.
- [ ] **Tests**: ≥ 12 new Application tests covering the handlers with non-trivial logic (CreateBranch validation, OpenPullRequest push-then-create flow, the up-to-date push edge case).
- [ ] Build green, all tests green, every git/github endpoint responds identically to story 04.

## Out of scope
- Authentication/authorization on these endpoints (defer until app leaves internal network).
- Webhook handlers (no use case asks for them yet).
- Diff endpoint (`GET /api/github/diff/...`) — never wired in the frontend, drop it from the surface.
- Async background jobs (e.g. polling PR status) — same — defer.

## Technical notes

### Why one big `IGitOperations` instead of split per-action interfaces
Pragmatism: one cohesive concept ("git operations on the queries clone"), one Infrastructure implementation. ISP would let us split (`IBranchOperations`, `ICommitOperations`, ...) but our 11 handlers each use 1-2 methods only — the gain is theoretical. **Revisit if** we ever need to fake half the surface in a single test.

### `OpenPullRequestHandler` keeps the push-then-create orchestration
The current controller does:
```csharp
try { _git.Push(branch); }
catch (Exception ex) when (ex.Message.Contains("up-to-date")) { /* OK */ }
var pr = await _gh.CreatePullRequestAsync(...);
```
That's two steps with a recoverable failure. Exactly the kind of thing handlers exist for. Moves to the handler with explicit `Result<,>`-style flow.

### Where the "Info" types live
`BranchListInfo`, `CommitInfo`, `PullRequestInfo`, `PullRequestStatus`, `MergeInfo`, `CollaboratorInfo` are output DTOs of port methods. They live in `Application/Dtos/` (same as the existing `WorkCenterDto` etc.) — they're shapes, not Domain entities.

### Result-to-HTTP extraction
A static `Common/ResultExtensions.cs` in Api hosts the shared `ToActionResult<T>(this Result<T>)` method. Both controllers use it. Story 06 will polish (per-error-type mapping, ProblemDetails, etc.) but the dedup is owed by story 05.

## Verification
- `dotnet build` → 0 errors, 0 warnings
- `dotnet test` → ≥ 99 tests passing (87 from story 04 + ≥ 12 from this story)
- `Infrastructure/Git/GitService.cs` and `Infrastructure/GitHub/GitHubService.cs` no longer exist
- Hit `GET /api/github/branches` (will fail with no local repo configured — expected, error message references the repo path)
- Hit `POST /api/github/branches` with `{ name: "" }` → 400 with `INVALID_BRANCH`
