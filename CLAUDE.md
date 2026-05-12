# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Production Query Editor** — an internal SOPROFEN tool for editing, executing, and code-reviewing SQL queries that drive workshop production screens. UI is in French. The whole point is the workflow: a developer edits a query, runs it against TRN (pre-prod) or PRD (prod), then commits → pushes → opens a PR; GitHub Actions handle the deploys (TRN on PR open, PRD on merge).

## Repository layout

- [src/](src/) — the React + Vite frontend.
- [backend/ProductionQueryEditor.Api/](backend/ProductionQueryEditor.Api/) — the **.NET 8 ASP.NET Core Web API**. Talks to SQL Server via Dapper, to a local git clone via LibGit2Sharp, to GitHub via Octokit.
- [project/](project/) — the **original Claude Design handoff bundle** (HTML/JSX prototypes + `styles.css`). This is *reference design only* — do not import from it, do not ship it. The components in [src/components/](src/components/) are the React reimplementations of these prototypes. If a design question comes up, the prototypes + [chats/chat1.md](chats/chat1.md) are the source of truth for intent.
- [sql/](sql/) — sample SQL queries (reference).
- [chats/](chats/) — design conversation transcripts.

## Commands

Frontend (from repo root):
```
npm install
npm run dev        # vite dev server on :5173
npm run build
node .claude-tests.mjs   # 57-check puppeteer suite (needs dev server running)
```

Backend (from `backend/ProductionQueryEditor.Api/`):
```
dotnet build
dotnet run         # listens on http://localhost:5000 (and Swagger at /swagger)
```

There is no automated test suite for the backend yet, no linter, no typecheck on the frontend. Don't claim a change is "verified" by running tests unless you actually ran [.claude-tests.mjs](.claude-tests.mjs).

The frontend runs in mock mode by default (`VITE_USE_MOCK=true` in [.env](.env)). Flip to `false` and set `VITE_API_URL=http://localhost:5000/api` to hit the .NET backend.

## Architecture — the parts that need explaining

### Frontend state lives in [src/App.jsx](src/App.jsx)

`App.jsx` is the single source of state — there is no Redux/Zustand/Context. It owns: tabs, per-tab buffers + baselines (used to compute `dirty`), the active branch, the queries list, the result set, and the tweaks panel. Child components are presentational and receive callbacks. When adding state, default to extending `App.jsx` rather than introducing a state library.

The `dirty` flag is computed by comparing `buffers[activeTab]` to `baselines[activeTab]` — baselines are only updated when a new query is loaded, so any in-buffer edit shows as modified.

### API client uses a mock toggle

Every file in [src/api/](src/api/) follows the same pattern: import `apiFetch` from [client.js](src/api/client.js), check `import.meta.env.VITE_USE_MOCK`, and either return a mock or hit the .NET backend. Keep this pattern when adding new endpoints — the mocks are what allow design iteration without a live SQL Server.

### Adding a new domain error

1. Create `backend/src/ProductionQueryEditor.Domain/Errors/MyError.cs` extending `DomainError`.
2. If the error isn't a validation issue (the default `ErrorKind.Validation` → 400), override `Kind`. Available kinds: `Validation`, `NotFound`, `Conflict`, `Unauthorized`, `Internal`.
3. Done. No Api changes needed — `ResultExtensions.ToActionResult<T>()` reads `Kind` and maps to the right HTTP status automatically. Add a unit test in `Application.Tests/UseCases/.../*Tests.cs` to cover the failure path.

```csharp
// Example: a use case wants to fail with 404
public sealed record PullRequestNotFoundError(int Number)
    : DomainError("PR_NOT_FOUND", $"PR #{Number} doesn't exist")
{
    public override ErrorKind Kind => ErrorKind.NotFound;
}
```

### Backend architecture (.NET 8)

[backend/ProductionQueryEditor.Api/](backend/ProductionQueryEditor.Api/) is a thin ASP.NET Core Web API split in 3 services and 3 controllers:

- **`SqlExecutorService`** — opens a fresh `SqlConnection` per query against the requested env (TRN/PRD), enforces the read-only allowlist via regex (rejects `INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|MERGE` at statement start), returns columns/rows.
- **`QueryRepositoryService`** (Dapper) — joins `dbo.ProductionScreen × dbo.WorkCenter × dbo.AttributeModel × dbo.Request` for PS entries, and `dbo.CUParameter × dbo.WorkCenter` for CU entries. Returns the same `QueryDto` shape the frontend mock produces. **⚠ Assumes a `dbo.Request(Id, Sql)` table for ProductionScreen — to verify with SOPROFEN, adapt the JOIN if the table name differs.**
- **`GitService`** (LibGit2Sharp) — operates on a local clone configured via `Git:RepoPath` in appsettings (a separate git repo holding the `.sql` files; the queries-of-record live there, not in the API repo).
- **`GitHubService`** (Octokit) — wraps PR creation/list/merge + check runs.

Controllers follow the contract documented in the original mock branches:
- `QueriesController` → `/api/queries[/execute|/workcenters|/attribute-models]`
- `GithubController`  → `/api/github/{branches|checkout|commit|push|history|pull-requests|collaborators}`
- `HealthController`  → `/api/health` (pings TRN+PRD)

Connection strings, GitHub token, and the local repo path live in `appsettings.json` (templated with `__REPLACE_ME__` placeholders) — copy to `appsettings.Development.json` (gitignored) and fill in real values for local dev. The frontend's `VITE_API_URL` should point at this backend's base URL + `/api`.

### SQL editor

The editor in [src/components/SqlEditor.jsx](src/components/SqlEditor.jsx) is **CodeMirror 6** via `@uiw/react-codemirror` with `@codemirror/lang-sql` (MSSQL dialect) and the `oneDark` theme. The previous custom `<textarea>`-overlay editor had unfixable scroll/alignment issues and was scrapped in favor of the lib. Sizing is driven entirely from CSS: `.editor-wrap` is a flex container, the `.cm-theme` wrapper React inserts must also be flex (otherwise it collapses to content height — see the comment in [styles.css](src/styles.css)).

### TRN vs PRD

Two environments wired through the UI: visual treatment differs (PRD pulses red), and the env is sent with every `executeQuery` call. The future backend will route to the right SQL Server connection.

### Domain model — read this before changing data shapes

The mocks in [src/data/mockData.js](src/data/mockData.js) mirror the real SOPROFEN schema. Three core entities plus a `REQUESTS` map:

- **`WORKCENTERS`** — physical workstations (`id`, `name`, `title`, `establishment`). Mirrors `dbo.WorkCenter`. `establishment` is the factory site (`A01`, `A03`, `A04`, `C01`, ...).
- **`ATTRIBUTE_MODELS`** — semantic component categories (`COULISSE`, `POC`, `ADAPTATEUR`, `JOINT_PT`, etc.). Mirrors `dbo.AttributeModel`. Filters in SQL via `dbo.Component.AttributeModel`.
- **`QUERIES`** — **one entry per row** of either `dbo.ProductionScreen` or `dbo.CUParameter`. Two distinct shapes by `source`:
  - `source: "production_screen"` — denormalized triple `(requestId, workCenterId, attributeModel)`.
    - `id`: `"ps-{requestId}-{workCenterId}-{attributeModel}"`
    - `name`: `"{requestId}-{workCenter}-{attributeModel}"` (e.g. `7-MDDBCO02-COULISSE`)
    - `attributeModel`: a single string
    - `requestId`: number — **multiple entries can share the same `requestId`** (= same SQL string instance), e.g. Request 7 sert `COULISSE` ET `CLR_COU` sur le même WC. The shared SQL lives in the module-local `REQUESTS` map.
  - `source: "cu_parameter"` — one entry per WorkCenter (PK).
    - `id`: `"cu-{workCenterId}"`
    - `name`: just `{workCenter}` (no AttributeModel notion in CUParameter)
    - `attributeModel: null`
    - `requestId: null`

Cardinality recap from the real DB:
- `dbo.ProductionScreen` rows join `(RequestId, AttributeModelId, WorkCenterId)` → 1 Request can serve N (WC × AttributeModel) pairs.
- `dbo.CUParameter` has `WorkCenterId` as PK → strictly 1 Request per WorkCenter, **no AttributeModel**.

When adding queries: never name a query after just a WorkCenter for `production_screen` (always include `requestId-WC-attrModel`), and never give CUParameter entries an `attributeModel`.

### Sidebar and WorkCenter navigation

[src/components/Sidebar.jsx](src/components/Sidebar.jsx) layout, top to bottom:
1. **Source tabs** — `Écran de prod` / `Requêtes CU`.
2. **Search** — matches `id`, `requestId`, `name`, `workCenter`, `establishment`, `attributeModel`.
3. **Group-by toggle** — `Établissement` / `AttributeModel`. **The `AttributeModel` option is hidden when CU is selected** (CUParameter has no AttributeModel) — handled by a `useEffect` that snaps `groupBy` back to `establishment` on source change.
4. **Grouped query list** — items show `name + status dot` only; richer chips live in the editor head.

The editor head ([src/App.jsx](src/App.jsx)) renders one tag row with up to three pairs: `Request #N`, `Modèle [chip]`, `Poste [WC chip]`. The WC chip is the only clickable one — it opens [WorkCenterDetail.jsx](src/components/WorkCenterDetail.jsx), a modal that:
- Lists all AttributeModels associated to the WC (derived from PS entries — empty list for WCs with only CUParameter entries).
- Groups ProductionScreen entries by `requestId` so the user sees when several entries share the same SQL.
- Lists CUParameter entries (at most one per WC).
Selecting any entry in the modal opens it in the editor.

## Conventions worth knowing

- ES modules everywhere (`"type": "module"` in both `package.json`s). Use `import`/`export`, not `require`.
- React components are JSX (no TypeScript). React 18 with `createRoot` + `StrictMode`.
- All UI strings are French. Keep new strings in French and don't introduce i18n machinery — this is a single-locale internal tool.
- Themeing is driven by `data-theme` and `data-accent` attributes set on `<html>` from the Tweaks panel; CSS in [src/styles.css](src/styles.css) reads them as CSS variables. Don't add a CSS-in-JS or component library.
