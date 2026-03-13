# Phase 4 — Worker Communication Layer (~3 sessions)

---

## Step 4.1: Create Comlink wrapper for worker

**Goal:** Expose the Web Worker's functions as typed async methods using Comlink.

**Read first:**
- `client/src/js/backend/worker.ts` (the `workerCommands` object — all ~40 command names)
- `client/src/js/frontend/dragFile.js` (how `dbWorker` is created)
- `types/worker-commands.ts`

**Actions:**
1. Install `comlink` in `client/`
2. Create `client/src/worker/index.ts`:
   - Import `expose` from `comlink`
   - Import all the functions currently called inside `workerCommands` handlers
   - Create a `workerAPI` object that exposes each command as a named async function:
     ```ts
     const workerAPI = {
       loadDB: async (file: File) => { ... },
       exportSave: async () => { ... },
       saveSelected: async () => { ... },
       yearSelected: async (year: number, isCurrentYear: boolean, formula: number) => { ... },
       // ... all ~40 commands
     }
     ```
   - Call `expose(workerAPI)` at the bottom
   - Each function returns its result directly (no `postMessage`)
   - For commands that currently call `postMessage` multiple times (like `saveSelected`), return an object with all the data bundled
3. Do NOT delete the old `worker.ts` yet — both will coexist temporarily

**Output files:**
- `client/src/worker/index.ts`

**Verify:** `cd client && npx tsc --noEmit` passes. File compiles.

---

## Step 4.2: Create React hook for worker

**Goal:** Create a `useWorker` hook that wraps the Comlink proxy for use in React components.

**Read first:**
- `client/src/worker/index.ts` (just created)
- `types/worker-commands.ts`

**Actions:**
1. Create `client/src/hooks/useWorker.ts`:
   ```ts
   import { wrap } from 'comlink';
   
   type WorkerAPI = typeof import('../worker/index').workerAPI;
   
   let workerInstance: Worker | null = null;
   let workerProxy: Remote<WorkerAPI> | null = null;
   
   export function getWorker(): Remote<WorkerAPI> {
     if (!workerProxy) {
       workerInstance = new Worker(
         new URL('../worker/index.ts', import.meta.url),
         { type: 'module' }
       );
       workerProxy = wrap<WorkerAPI>(workerInstance);
     }
     return workerProxy;
   }
   
   export function useWorker(): Remote<WorkerAPI> {
     return getWorker();
   }
   ```
2. The hook is intentionally simple — singleton worker, lazy init
3. Components will call: `const worker = useWorker(); await worker.loadDB(file);`

**Output files:**
- `client/src/hooks/useWorker.ts`

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 4.3: Migrate existing code to use Comlink + delete old Command class

**Goal:** Replace all `dbWorker.postMessage` / `Command` usage with Comlink calls.

**Read first:**
- `client/src/js/backend/command.ts` (the old Command class)
- `client/src/js/frontend/dragFile.js` (creates `dbWorker`, uses `postMessage`)
- `client/src/js/frontend/renderer.js` (calls `new Command(...)` extensively)
- `client/src/hooks/useWorker.ts`

**Actions:**
1. In `client/src/js/frontend/dragFile.js`:
   - Replace `new Worker(...)` creation with import from `useWorker`
   - Replace `dbWorker.postMessage({ command: 'loadDB', ... })` with `getWorker().loadDB(file)`
   - Replace `dbWorker.onmessage` callback with awaiting the return value
2. In `client/src/js/frontend/renderer.js`:
   - Replace every `new Command("commandName", data).execute()` with `getWorker().commandName(data)`
   - There are ~30+ call sites — search for `new Command(` and replace each one
   - Replace the `updateFront(response)` dispatch pattern — each call site now handles its own response
3. Delete `client/src/js/backend/command.ts`
4. Delete `client/src/js/backend/worker.ts` (replaced by `client/src/worker/index.ts`)

**This is a large step.** If it's too much for one session, split into:
- 4.3a: Migrate `dragFile.js` only
- 4.3b: Migrate `renderer.js` call sites (first half)
- 4.3c: Migrate `renderer.js` call sites (second half) + delete old files

**Output:** Modified `dragFile.js`, `renderer.js`. Deleted `command.ts`, old `worker.ts`.

**Verify:** App loads a save file, all tabs respond to interactions, export works.

---

**🔲 Checkpoint: Worker has a clean typed Comlink API. No more string-based command dispatch. Human confirms save load + all tab interactions work.**
