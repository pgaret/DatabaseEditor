# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Database Editor F1 Manager — a web-based save file editor for F1 Manager 23 & 24. Users drag-drop `.sav` files (Unreal Engine GVAS format), which are parsed client-side into an in-browser SQLite database (sql.js) for editing, then re-exported.

## Build & Development

```bash
npm install          # Install dependencies
npm run build        # Production build (webpack → dist/)
```

No dev server script exists. For local development, build and serve `dist/` with any static server. Webpack is configured in development mode by default (`process.env.NODE_ENV || 'development'`).

The app is deployed on **Vercel** — serverless API routes live in `api/`, nightly deploys are triggered via GitHub Actions at 02:00 UTC.

## Architecture

**SPA with Web Worker separation:**

- **Main thread** (`src/index.js` entry) — UI only. Bootstrap 5, Chart.js for graphs.
- **Web Worker** (`src/js/backend/worker.js`) — all heavy processing: GVAS parsing, SQL queries, data transformations. Communicates with main thread via `Command` class (message passing).

**Key data flow:** File drop → `dragFile.js` → Worker parses GVAS binary → sql.js loads embedded database → UI displays editable data → edits sent as Commands to worker → export re-packages GVAS.

### Source Layout

- `src/js/frontend/` — UI modules. `renderer.js` orchestrates tab navigation and UI updates. Each feature has its own module (transfers, stats, calendar, performance, etc.).
- `src/js/backend/` — Worker-side logic.
  - `command.js` — Command class for frontend↔worker communication (supports callbacks and Promises).
  - `commandGlobals.js` — Shared state: team mappings, abbreviations, config.
  - `dbManager.js` — sql.js wrapper (`queryDB(query, params, type)`).
  - `UESaveHandler.js` + `UESaveTool/` — Unreal Engine GVAS binary format parser/serializer. `Serializer.js` handles binary read/write, `properties/` has type handlers.
  - `scriptUtils/` — Domain-specific logic (transfers, stats, calendar editing, news generation, car analysis, etc.).
- `src/data/` — Static JSON: contract data, seasonal changes, records, news prompt templates.
- `api/` — Vercel serverless functions: OpenAI proxy (rate-limited), Patreon OAuth, usage tracking.
- `lib/` — Server-side shared utils: Redis client, access control, rate limits.
- `assets/images/` — F1 team/driver/car images.

### Key Patterns

- **Command pattern** for all frontend↔worker communication — never call worker functions directly.
- **Singleton database** in `dbManager.js` — one sql.js instance shared across all worker operations.
- **`commandGlobals.js`** holds runtime state (team replacement dict, pretty names) with getter/setter access.
- `webpack.config.js` injects `APP_VERSION` and `BUILD_ID` via DefinePlugin at build time.
- Environment variables needed for full functionality: `OPENAI_API_KEY`, `PATREON_CLIENT_ID`, `PATREON_REDIRECT_URI`, Upstash Redis credentials.

### Fixtures (`fixtures/`)

Reference data for development — use these instead of requiring local game files or save files:

- `databases/save-sample.db` — SQLite database extracted from a real F1M24 career save (328 tables). Open with sql.js or any SQLite client for schema/data reference.
- `databases/volta-defaults.db` — Stock game-default database extracted from Volta.uexp (317 tables). This is what new careers start with — no career-specific data, just base game values.
- `schema.sql` — All CREATE TABLE/VIEW/INDEX statements from the save DB, for quick lookup without loading the database.
- `row-counts.md` — Row counts per table (save DB).
- `src/data/save6.sav` — Full `.sav` file (GVAS container with embedded database).

### Game-Level Modding (`MODDING.md`, `docs/modding/`)

Everything established about modding F1M24 at the game-file level (pak containers, default database, UI mods, where game logic lives) is documented in [MODDING.md](MODDING.md), which indexes the detailed docs in `docs/modding/`. Consult these before reasoning about game files, pak extraction/repacking, or what is/isn't moddable.

### Save Watcher (`watcher/`)

Standalone Node.js daemon that monitors the F1M24 SaveGames directory and auto-applies rules to saves. Uses binary pattern matching to find the GVAS/data boundary (no UESaveTool dependency). Installable as a Windows service. Has its own `package.json` — run `npm install` inside `watcher/` separately.
