# Phase 1 — Scaffold (~6 sessions)

---

## Step 1.1: Project restructure

**Goal:** Move existing code into `client/` directory, create `server/` and `types/` directories.

**Read first:** `package.json`, `webpack.config.js`

**Actions:**
1. Create directories: `client/`, `server/`, `types/`
2. Move `src/` → `client/src/`
3. Move `assets/` → `client/assets/`
4. Move `webpack.config.js` → `client/webpack.config.js` (temporary, will be replaced by Vite)
5. Create root `package.json` with workspaces or scripts pointing to `client/` and `server/`
6. Update `client/webpack.config.js` paths to reflect new location
7. Keep `api/`, `lib/` in place for now (moved in Phase 2)

**Output files:**
- `client/src/` (all existing src contents)
- `client/assets/` (all existing assets)
- `client/webpack.config.js`
- Root `package.json` (updated)

**Verify:** `cd client && npx webpack` still builds successfully.

---

## Step 1.2: Add TypeScript + Vite to client

**Goal:** Replace Webpack with Vite, add TypeScript config.

**Read first:** `client/webpack.config.js`, `client/src/index.js`

**Actions:**
1. Create `client/package.json` with dependencies:
   - `vite`, `@vitejs/plugin-react`, `typescript`
   - Move relevant deps from root `package.json` (bootstrap, chart.js, sql.js, etc.)
2. Create `client/tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "moduleResolution": "bundler",
       "jsx": "react-jsx",
       "strict": true,
       "allowJs": true,
       "checkJs": false,
       "outDir": "dist",
       "rootDir": "src",
       "baseUrl": ".",
       "paths": { "@types/*": ["../types/*"] }
     },
     "include": ["src", "../types"]
   }
   ```
3. Create `client/vite.config.ts`:
   - Entry: `client/src/main.tsx` (will create in next step)
   - Configure `resolve.alias` for `buffer` polyfill
   - Configure `worker` plugin for Web Worker support
   - Copy `DefinePlugin` env vars to `define` config
   - Copy asset handling from webpack config
4. Create `client/src/main.tsx` that just imports `./index.js` (bridge file)
5. Create `client/index.html` — minimal HTML that loads `src/main.tsx`

**Output files:**
- `client/package.json`
- `client/tsconfig.json`
- `client/vite.config.ts`
- `client/src/main.tsx`
- `client/index.html`

**Verify:** `cd client && npx vite build` completes without errors.

---

## Step 1.3: Install React + MUI, create theme

**Goal:** Add React and MUI dependencies, create the MUI theme file.

**Read first:** `client/src/index.html` (the old one at `client/src/index.html`), `client/src/themes.css` (to extract color tokens)

**Actions:**
1. Install in `client/`:
   - `react`, `react-dom`
   - `@mui/material`, `@emotion/react`, `@emotion/styled`
   - `@mui/icons-material`
   - `@types/react`, `@types/react-dom`
2. Create `client/src/theme.ts`:
   - Dark mode as default
   - Extract primary/secondary/background colors from `themes.css` CSS variables
   - Set typography fontFamily to `'Formula1, sans-serif'`
   - Export `createTheme()` result
3. Update `client/src/main.tsx`:
   - Import React, ReactDOM
   - Import `ThemeProvider` from MUI
   - Import theme from `./theme`
   - Render `<ThemeProvider theme={theme}><App /></ThemeProvider>` into `#root`
   - Also still import `./index.js` (bridge to old code — temporary)
4. Create `client/src/App.tsx`:
   - Import MUI `Box`, `CssBaseline`
   - Return `<CssBaseline />` + placeholder `<Box>App Shell</Box>`

**Output files:**
- `client/src/theme.ts`
- `client/src/App.tsx`
- `client/src/main.tsx` (updated)

**Verify:** `cd client && npx vite dev` — browser shows "App Shell" with dark MUI theme.

---

## Step 1.4: Create MUI app shell with tabs

**Goal:** Build the tab navigation matching the current 10-tab structure.

**Read first:** `client/src/App.tsx`, the old `client/src/js/frontend/renderer.js` lines 71-95 (tab pill elements)

**Actions:**
1. Update `client/src/App.tsx`:
   - MUI `AppBar` at top with app title "Database Editor for F1 Manager"
   - MUI `Tabs` component with 10 tabs:
     - Transfers, Stats, Calendar, Regulations, Car Performance, Season Viewer, Head-to-Head, Teams, News, Mods
   - Each tab renders a placeholder component: `<Typography>Tab Name - Coming Soon</Typography>`
   - Tab state managed with `useState`
2. Create `client/src/components/` directory
3. Create `client/src/components/TabPanel.tsx` — reusable tab panel wrapper

**Output files:**
- `client/src/App.tsx` (updated)
- `client/src/components/TabPanel.tsx`

**Verify:** `cd client && npx vite dev` — browser shows app bar + 10 clickable tabs, each showing placeholder text.

---

## Step 1.5: Fastify server scaffold

**Goal:** Create a Fastify server that serves the Vite build and will host API routes.

**Read first:** Root `package.json`

**Actions:**
1. Create `server/package.json` with dependencies:
   - `fastify`, `@fastify/cookie`, `@fastify/cors`, `@fastify/static`
   - `typescript`, `tsx` (for dev running)
   - `@types/node`
2. Create `server/tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "moduleResolution": "bundler",
       "outDir": "dist",
       "rootDir": "src",
       "strict": true,
       "baseUrl": ".",
       "paths": { "@types/*": ["../types/*"] }
     },
     "include": ["src", "../types"]
   }
   ```
3. Create `server/src/index.ts`:
   - Import and create Fastify instance
   - Register `@fastify/cookie`
   - Register `@fastify/cors` (allow localhost in dev)
   - Register `@fastify/static` pointing to `../client/dist`
   - Listen on `process.env.PORT || 3000`
   - Add health check route `GET /health` → `{ status: 'ok' }`
4. Update root `package.json` scripts:
   - `"dev:client": "cd client && npx vite dev"`
   - `"dev:server": "cd server && npx tsx watch src/index.ts"`
   - `"dev": "concurrently \"npm run dev:client\" \"npm run dev:server\""`
   - `"build": "cd client && npx vite build && cd ../server && npx tsc"`
5. Install `concurrently` at root

**Output files:**
- `server/package.json`
- `server/tsconfig.json`
- `server/src/index.ts`
- Root `package.json` (updated scripts)

**Verify:** `npm run dev` starts both Vite dev server and Fastify. `curl http://localhost:3000/health` returns `{"status":"ok"}`.

---

## Step 1.6: Shared types foundation

**Goal:** Create TypeScript interfaces for core domain objects used by both client and server.

**Read first:**
- `client/src/js/frontend/config.js` (team/driver dicts)
- `client/src/js/backend/commandGlobals.js` (globals shape)
- `client/src/js/backend/worker.js` lines 51-765 (all command names and their data shapes)

**Actions:**
1. Create `types/domain.ts` with interfaces:
   - `Driver` — `{ id: number; name: string; teamId: number; abbreviation: string; number: number; ... }`
   - `Team` — `{ id: number; name: string; ... }`
   - `StaffMember` — `{ id: number; name: string; type: string; ... }`
   - `Engine` — `{ id: number; name: string; stats: Record<string, number>; ... }`
   - `Contract` — `{ driverId: number; teamId: number; salary: number; validUntil: number; ... }`
   - `CalendarEvent` — `{ id: number; code: string; country: string; weather: number; ... }`
   - `NewsItem` — `{ stableKey: string; text: string; date: number; ... }`
   - `TurningPoint` — `{ stableKey: string; type: string; ... }`
   - `Season` — `{ year: number; ... }`
2. Create `types/worker-commands.ts`:
   - `type WorkerCommandName = 'loadDB' | 'exportSave' | 'saveSelected' | 'yearSelected' | ... ` (all ~40 command names from `worker.js`)
   - `interface WorkerRequest { command: WorkerCommandName; data: unknown; }`
   - `interface WorkerResponse { responseMessage: string; content?: unknown; error?: string; noti_msg?: string; isEditCommand?: boolean; unlocksDownload?: boolean; }`
3. Create `types/index.ts` that re-exports everything

**Output files:**
- `types/domain.ts`
- `types/worker-commands.ts`
- `types/index.ts`

**Verify:** `cd client && npx tsc --noEmit` and `cd server && npx tsc --noEmit` both pass.

---

**🔲 Checkpoint: Human reviews scaffold. Confirm directory structure, MUI theme appearance, Fastify health check, and types before proceeding to Phase 2.**
