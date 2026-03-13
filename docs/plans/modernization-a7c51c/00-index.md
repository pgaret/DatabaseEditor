# Modernization: TypeScript + React + Fastify (AI-Executed)

AI-driven incremental migration of the F1 Manager Database Editor, structured as atomic Sonnet-executable steps with explicit file paths, commands, and verification.

---

## Decisions (Locked In)

| Decision | Choice |
|---|---|
| **Deployment** | Railway (no Vercel) |
| **UI Framework** | Material UI (MUI) — replaces Bootstrap entirely |
| **Styling** | MUI theme overrides + standard props only — **no `sx` prop**, no custom CSS. Prefer simpler visuals over hard-coded styling. |
| **Charts** | Recharts — replaces Chart.js |
| **Components** | MUI components (Dialog, Tabs, Select, etc.) |
| **Repo structure** | `client/` + `server/` dirs in single repo, shared `types/` at root |

---

## Current State

- **~57k total lines** — 34k JS, 5.7k HTML (single file), 16.5k CSS, 460 lines serverless API
- **Client-side architecture** — sql.js in a Web Worker, UESaveTool binary parser, all DB logic in-browser
- **Vanilla JS + Bootstrap** — imperative DOM manipulation, no framework, no types
- **7 Vercel Serverless Functions** — Patreon OAuth, OpenAI proxy, rate-limiting (Upstash Redis)
- **Webpack 5** — single bundle, no TypeScript

---

## Sonnet Execution Rules

Each step is designed for Sonnet-level AI execution:
- **Max 1-2 files created/modified per step** (unless they're tiny)
- **Exact file paths** for every input and output
- **"Read first" instructions** — which files to load into context before starting
- **Literal verification command** at the end of every step
- **No judgment calls** — every step has a deterministic outcome
- **Max ~400 lines of new code per step**

**Human role:** Review diffs, run verification commands, approve/reject.

---

## Phase Index (MVP-First)

The MVP delivers a working app with **Transfers (Contracts), Stats (Attributes), and Teams** tabs only. All other tabs are deferred to post-MVP.

### MVP (~30 steps)

| File | Phase | Steps |
|---|---|---|
| `01-scaffold.md` | Scaffold (Vite, React+MUI, Fastify, types) | 1.1–1.6 (6 steps) |
| `02-api-port.md` | Fastify API port | 2.1–2.4 (4 steps) |
| `03-backend-ts.md` | Backend TS — **MVP subset only** (core + transfers/stats/teams utils) | 3.1–3.9 (9 steps) |
| `04-worker-rpc.md` | Comlink typed worker API | 4.1–4.3 (3 steps) |
| `05-react-frontend.md` | React frontend — **MVP tabs only** (shell + Transfers + Stats + Teams) | 5.1–5.12 (12 steps) |
| `07-cleanup-ci.md` | Linting, CI, Railway deploy (new code only) | 7.2–7.4 (3 steps) |
| **MVP Total** | | **~37 steps** |

**🟩 MVP Checkpoint: Working app deployed on Railway with CI. Transfers, Stats, and Teams tabs live.**

### Post-MVP (~26+ steps)

| File | Phase | Steps |
|---|---|---|
| `03-backend-ts.md` | Backend TS — remaining files | 3.10–3.17 (8 steps) |
| `05-react-frontend.md` | Remaining 7 tabs + shared dialogs | 5.13–5.27 (15 steps) |
| `06-theme-polish.md` | MUI theme finalization | 6.1–6.2 (2 steps) |
| `07-cleanup-ci.md` | Delete old files (step 7.1 only) | 7.1 (1 step) |
| **Post-MVP Total** | | **~26 steps** |

Each step is one AI session. Some steps may be split further if Sonnet struggles with scope.

---

## Constraints

- **UESaveTool + sql.js stay client-side** — no server-side save processing
- **Feature parity required** — every tab must work identically after migration
- **App must be functional after each phase** — no big-bang cutover
- **Each AI session must produce a committable, buildable state**
- **No custom CSS, no `sx` prop** — all styling through MUI theme overrides + standard component props (`variant`, `color`, `size`, `margin`, etc.). If a design requires hard-coded CSS, simplify the visual instead.
- **~250 line max per file** — break larger concerns into small, modular, reusable pieces. Prefer many focused files over few large ones. Prioritize human readability.
- **Each step must be completable by Sonnet** — no ambiguity, no multi-file reasoning
