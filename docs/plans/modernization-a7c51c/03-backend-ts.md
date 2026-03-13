# Phase 3 — Worker & Backend TS Conversion (~17 sessions)

Each step: read the source `.js` file, create a `.ts` file with full type annotations, delete the old `.js`, update imports in any file that imported it.

All files currently live in `client/src/js/backend/`. They stay in place during this phase (moved to `client/src/worker/` later in Phase 4).

**Steps 3.1–3.9 are MVP** (core infra + transfers/stats/teams utils). Steps 3.10–3.17 are post-MVP.

---

## Step 3.1: `dbManager.js` → `dbManager.ts` (87 lines)

**Read first:** `client/src/js/backend/dbManager.js`

**Actions:**
1. Rename `client/src/js/backend/dbManager.js` → `client/src/js/backend/dbManager.ts`
2. Add types:
   - `db` variable: type `Database | null` (from `sql.js`)
   - `metadata` variable: type `SaveMetadata | null` (define interface in same file or import from `types/`)
   - `queryDB` params: `query: string`, `params: unknown[]`, `type: 'singleValue' | 'singleRow' | 'allRows' | 'run' | 'exec'`
   - `queryDB` return: `unknown` (overloads optional but not required)
3. Add `import type { Database } from 'sql.js'` at top
4. No logic changes — types only

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 3.2: `commandGlobals.js` → `commandGlobals.ts` (29 lines)

**Read first:** `client/src/js/backend/commandGlobals.js`

**Actions:**
1. Rename to `.ts`
2. Type `teamReplaceDict` as `Record<string, string>`
3. Type `prettyNames` as `Record<string, string>`
4. Type `setGlobals` param: `{ dbPath?: string; year?: string; createTeam?: boolean; date?: unknown }`
5. Type `getGlobals` return: `{ path: string | null; yearIteration: string | null; isCreateATeam: boolean; currentDate: unknown }`
6. Type module-level variables: `path: string | null = null`, etc.

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 3.3: `command.js` → `command.ts` (84 lines)

**Read first:** `client/src/js/backend/command.js`, `client/src/js/frontend/dragFile.js` (for `dbWorker` type)

**Actions:**
1. Rename to `.ts`
2. Type `Command` class:
   - `commandName: string`
   - `data: Record<string, unknown>`
   - `execute(): Promise<void>`
   - `promiseExecute(): Promise<WorkerResponse>`
3. Import `WorkerResponse` from `types/worker-commands`
4. Type `updateFront` import as `(response: WorkerResponse) => Promise<void>`

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 3.4: `config.js` → `config.ts` (566 lines)

**Read first:** `client/src/js/frontend/config.js`

**Actions:**
1. Rename to `.ts`
2. Type all exported dicts as `Record<string, string>` or `Record<number, string>` as appropriate
3. Type `lightColors` as `string[]`
4. Type `difficultyConfig`, `weightDifConfig`, etc. as their actual shapes
5. Add `as const` to any dict that should be readonly

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 3.5: `countries.js` → `countries.ts` + `carConstants.js` → `carConstants.ts`

**Read first:**
- `client/src/js/backend/scriptUtils/countries.js` (~190 lines)
- `client/src/js/backend/scriptUtils/carConstants.js` (~180 lines)

**Actions:**
1. Rename both to `.ts`
2. `countries.js`: type all exports as `Record<string, string>` or `string[]`
3. `carConstants.js`: type all exports — likely `Record<string, number>` or constant arrays
4. Update any imports in other files that reference these (search for `from.*countries` and `from.*carConstants`)

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 3.6: `regulationsUtils.js` → `.ts` + `calendarUtils.js` → `.ts`

**Read first:**
- `client/src/js/backend/scriptUtils/regulationsUtils.js` (~130 lines)
- `client/src/js/backend/scriptUtils/calendarUtils.js` (~210 lines)

**Actions:**
1. Rename both to `.ts`
2. Add types to all function params and returns
3. Both files import from `dbManager` — update import path if needed (should be `.ts` now)
4. Use `CalendarEvent` type from `types/domain.ts` where applicable

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 3.7: `editTeamUtils.js` → `.ts` + `eidtStatsUtils.js` → `editStatsUtils.ts`

**Read first:**
- `client/src/js/backend/scriptUtils/editTeamUtils.js` (~250 lines)
- `client/src/js/backend/scriptUtils/eidtStatsUtils.js` (~340 lines)

**Actions:**
1. Rename `editTeamUtils.js` → `editTeamUtils.ts`
2. Rename `eidtStatsUtils.js` → `editStatsUtils.ts` (fix typo)
3. Add types to all function params and returns
4. **Update all imports** that reference `eidtStatsUtils` → `editStatsUtils`:
   - Search entire codebase for `eidtStatsUtils` and update
   - Known importers: `client/src/js/backend/worker.js`

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 3.8: `recordUtils.js` → `.ts` + `triggerUtils.js` → `.ts`

**Read first:**
- `client/src/js/backend/scriptUtils/recordUtils.js` (~390 lines)
- `client/src/js/backend/scriptUtils/triggerUtils.js` (~426 lines)

**Actions:**
1. Rename both to `.ts`
2. Add types to all function params and returns
3. Both import from `dbManager` — ensure import works with `.ts`

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 3.9: `transferUtils.js` → `transferUtils.ts` (677 lines)

**Read first:** `client/src/js/backend/scriptUtils/transferUtils.js`

**Actions:**
1. Rename to `.ts`
2. Add types to all exported functions: `fireDriver`, `hireDriver`, `swapDrivers`, `editContract`, `futureContract`, `transferJuniorDriver`
3. Type params using domain types where possible (driverId: number, teamId: number, etc.)

**Verify:** `cd client && npx tsc --noEmit` passes.

---

---

## ⏳ POST-MVP STEPS BELOW

---

## Step 3.10: `head2head.js` (backend) → `head2head.ts` (736 lines)

**Read first:** `client/src/js/backend/scriptUtils/head2head.js`

**Actions:**
1. Rename to `.ts`
2. Type `fetchHead2Head` and `fetchHead2HeadTeam` params and returns
3. Type internal helper functions

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 3.11: `modUtils.js` → `modUtils.ts` (884 lines)

**Read first:** `client/src/js/backend/scriptUtils/modUtils.js`

**Actions:**
1. Rename to `.ts`
2. Type all exported functions: `change2024Standings`, `changeDriverLineUps`, `changeStats`, `removeFastestLap`, `timeTravelWithData`, `manageAffiliates`, `changeRaces`, `manageStandings`, `insertStaff`, `manageFeederSeries`, `changeDriverEngineerPairs`, `updatePerofmrnace2025`, `fixes_mod`, `updateEditsWithModData`, `fetch2025ModData`, `check2025ModCompatibility`
3. Type params and returns

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 3.12: `carAnalysisUtils.js` → `carAnalysisUtils.ts` (1,416 lines)

**Read first:** `client/src/js/backend/scriptUtils/carAnalysisUtils.js`

**Actions:**
1. Rename to `.ts`
2. Type all exported functions (there are ~15)
3. Type the performance data structures (arrays of arrays, team performance objects)
4. This file is large — focus on function signatures, use `unknown` for complex internal structures if needed

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 3.13a: `dbUtils.js` → `dbUtils.ts` — Part 1 (first ~1,400 lines)

**Read first:** `client/src/js/backend/scriptUtils/dbUtils.js` lines 1-1400

**Actions:**
1. Rename to `.ts`
2. Type the first half of exported functions (roughly `fetchSeasonResults` through `fetchDriverContracts`)
3. Use `unknown` for complex return types initially — can be refined later

**Verify:** `cd client && npx tsc --noEmit` passes (may have errors in second half — that's ok if they're type errors, not syntax).

---

## Step 3.13b: `dbUtils.ts` — Part 2 (remaining ~1,400 lines)

**Read first:** `client/src/js/backend/scriptUtils/dbUtils.ts` lines 1400-2841

**Actions:**
1. Type remaining exported functions
2. Resolve any `tsc` errors from Part 1

**Verify:** `cd client && npx tsc --noEmit` passes with zero errors.

---

## Step 3.14a: `newsUtils.js` → `newsUtils.ts` — Part 1 (first ~1,800 lines)

**Read first:** `client/src/js/backend/scriptUtils/newsUtils.js` lines 1-1800

**Actions:**
1. Rename to `.ts`
2. Type the first third of functions
3. Define `NewsMap`, `TurningPointState` interfaces at top of file

**Verify:** File parses without syntax errors.

---

## Step 3.14b: `newsUtils.ts` — Part 2 (lines ~1800-3600)

**Read first:** `client/src/js/backend/scriptUtils/newsUtils.ts` lines 1800-3600

**Actions:**
1. Type the middle third of functions
2. Use the interfaces defined in Part 1

**Verify:** `cd client && npx tsc --noEmit` — fewer errors than before.

---

## Step 3.14c: `newsUtils.ts` — Part 3 (lines ~3600-5473)

**Read first:** `client/src/js/backend/scriptUtils/newsUtils.ts` lines 3600-5473

**Actions:**
1. Type the final third of functions
2. Resolve all remaining `tsc` errors in this file

**Verify:** `cd client && npx tsc --noEmit` passes with zero errors for this file.

---

## Step 3.15: `worker.js` → `worker.ts` (783 lines)

**Read first:** `client/src/js/backend/worker.js`

**Actions:**
1. Rename to `.ts`
2. Type the `workerCommands` object as `Record<string, (data: any, postMessage: (msg: WorkerResponse) => void) => void | Promise<void>>`
3. Type the `self.addEventListener('message', ...)` handler
4. Import `WorkerResponse` from `types/worker-commands`
5. Ensure all imports from now-`.ts` scriptUtils files resolve

**Verify:** `cd client && npx tsc --noEmit` passes. App still loads a save file correctly.

---

## Step 3.16: `UESaveHandler.js` → `UESaveHandler.ts` (159 lines)

**Read first:** `client/src/js/backend/UESaveHandler.js`

**Actions:**
1. Rename to `.ts`
2. Type `parseGvasProps` param and return
3. Type `analyzeFileToDatabase` — param `file: File, SQL: SqlJsStatic`, return `Promise<{ db: Database; metadata: SaveMetadata }>`
4. Type `repack` — param types, return `{ finalData: Buffer; metadata: SaveMetadata } | undefined`
5. Type `dump`
6. Define `SaveMetadata` interface (or import from `types/`)

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 3.17: `UESaveTool/` → TypeScript (28 files)

**Read first:** `client/src/js/backend/UESaveTool/index.js`, `Gvas.js`, `Serializer.js`, `GvasHeader.js`

**Actions:**
1. Rename all 28 files from `.js` → `.ts`
2. Start with core files:
   - `Serializer.ts` — type `read`, `readInt32`, `readString`, etc.
   - `Gvas.ts` — type `deserialize`, `serialize`
   - `GvasHeader.ts` — type header fields
3. Then property files in `properties/` and `arrays/` — these are mostly small classes, type their fields
4. Update `index.ts` re-exports
5. This is many files but each is small (50-150 lines). Batch rename, then fix types.

**Verify:** `cd client && npx tsc --noEmit` passes. Loading a save file still works.

---

**🔲 Checkpoint: All backend/worker code is TypeScript. Zero `.js` files remain in `client/src/js/backend/`. Human confirms save file load + export still works.**
