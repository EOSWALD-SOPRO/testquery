# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Production Query Editor** — an internal SOPROFEN tool for editing, executing, and code-reviewing SQL queries that drive workshop production screens. UI is in French. The whole point is the workflow: a developer edits a query, runs it against TRN (pre-prod) or PRD (prod), then commits → pushes → opens a PR; GitHub Actions handle the deploys (TRN on PR open, PRD on merge).

## Repository layout

- [src/](src/) — the React + Vite frontend. This is what gets built and shipped.
- [project/](project/) — the **original Claude Design handoff bundle** (HTML/JSX prototypes + `styles.css`). This is *reference design only* — do not import from it, do not ship it. The components in [src/components/](src/components/) are the React reimplementations of these prototypes. If a design question comes up, the prototypes + [chats/chat1.md](chats/chat1.md) are the source of truth for intent.
- [sql/](sql/) — sample SQL queries (reference).
- [chats/](chats/) — design conversation transcripts. Useful for understanding *why* the UI looks the way it does.

**No backend yet.** The tech stack hasn't been chosen. The frontend is fully functional in mock mode — see below.

## Commands

```
npm install
npm run dev        # vite dev server on :5173
npm run build
npm run preview
```

There is no test suite, no linter, and no typecheck configured. Don't claim a change is "verified" by running tests — there are none.

The app runs in mock mode by default (`VITE_USE_MOCK=true` in [.env](.env)). Every function in [src/api/](src/api/) returns canned data from [src/data/mockData.js](src/data/mockData.js). When a backend is wired up, set `VITE_USE_MOCK=false` and uncomment `VITE_API_URL`.

## Architecture — the parts that need explaining

### Frontend state lives in [src/App.jsx](src/App.jsx)

`App.jsx` is the single source of state — there is no Redux/Zustand/Context. It owns: tabs, per-tab buffers + baselines (used to compute `dirty`), the active branch, the queries list, the result set, and the tweaks panel. Child components are presentational and receive callbacks. When adding state, default to extending `App.jsx` rather than introducing a state library.

The `dirty` flag is computed by comparing `buffers[activeTab]` to `baselines[activeTab]` — baselines are only updated when a new query is loaded, so any in-buffer edit shows as modified.

### API client uses a mock toggle

Every file in [src/api/](src/api/) follows the same pattern: import `apiFetch` from [client.js](src/api/client.js), check `import.meta.env.VITE_USE_MOCK`, and either return a mock or hit the (future) backend. Keep this pattern when adding new endpoints — the mocks are what allow design iteration without a live SQL Server.

### SQL editor

The editor in [src/components/SqlEditor.jsx](src/components/SqlEditor.jsx) is **CodeMirror 6** via `@uiw/react-codemirror` with `@codemirror/lang-sql` (MSSQL dialect) and the `oneDark` theme. The previous custom `<textarea>`-overlay editor had unfixable scroll/alignment issues and was scrapped in favor of the lib. Sizing is driven entirely from CSS: `.editor-wrap` is a flex container, the `.cm-theme` wrapper React inserts must also be flex (otherwise it collapses to content height — see the comment in [styles.css](src/styles.css)).

### TRN vs PRD

Two environments wired through the UI: visual treatment differs (PRD pulses red), and the env is sent with every `executeQuery` call. The future backend will route to the right SQL Server connection.

### Query identity is `folder/file`

A query's ID throughout the app is the path fragment `folder/file.sql` (e.g. `commun/operations_en_cours.sql`). The folder display name comes from the API response's `folder` field — when the backend lands it'll need a slug→display mapping (`volets-roulants` → "Volets Roulants", etc.).

## Conventions worth knowing

- ES modules everywhere (`"type": "module"` in both `package.json`s). Use `import`/`export`, not `require`.
- React components are JSX (no TypeScript). React 18 with `createRoot` + `StrictMode`.
- All UI strings are French. Keep new strings in French and don't introduce i18n machinery — this is a single-locale internal tool.
- Themeing is driven by `data-theme` and `data-accent` attributes set on `<html>` from the Tweaks panel; CSS in [src/styles.css](src/styles.css) reads them as CSS variables. Don't add a CSS-in-JS or component library.
