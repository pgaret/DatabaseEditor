# Phase 5 — React + MUI Frontend Migration (~26 sessions)

**Steps 5.1–5.12 are MVP** (shell + Transfers + Stats + Teams). Steps 5.13–5.26 are post-MVP.

Each tab migration rebuilds the UI from scratch using MUI components. No HTML extraction — read the old vanilla JS to understand the data flow and interactions, then build fresh React components.

**Pattern for every tab:**
1. Read the old vanilla JS file to understand: what data comes from the worker, what state exists, what user interactions are possible
2. Create React components using MUI primitives — **~250 line max per file**
3. Wire to worker via `useWorker()` hook
4. Style with MUI theme overrides + standard component props only (**no `sx` prop**, no custom CSS). If a layout requires hard-coded CSS, simplify the visual.
5. Replace any Chart.js usage with Recharts

**Modularity rules:**
- Each tab gets its own directory: `client/src/tabs/TabName/`
- Tab entry component (e.g., `RegulationsTab.tsx`) is a thin orchestrator — imports and composes smaller pieces
- Extract reusable pieces into `client/src/components/` (e.g., `DriverAvatar`, `TeamCard`, `StatSlider`)
- Custom hooks for data fetching go in `client/src/hooks/` (e.g., `useRegulationsData`)
- **No file over ~250 lines.** If a component grows past that, split it.

---

## Step 5.1: Zustand global state store

**Goal:** Create centralized state stores for data shared across tabs.

**Read first:**
- `client/src/js/frontend/renderer.js` lines 149-195 (module-level state variables)
- `client/src/js/frontend/config.js` lines 1-50 (team/driver dicts)

**Actions:**
1. Install `zustand` in `client/`
2. Create `client/src/store/gameStore.ts`:
   - `saveName: string | null`
   - `gameVersion: number` (2023 or 2024)
   - `currentDate: { day: number; month: string; year: number } | null`
   - `isLoaded: boolean`
   - `drivers: unknown[]` (refined later)
   - `staff: unknown[]`
   - `engines: unknown[]`
   - `teamDict: Record<number, string>` (from `combined_dict`)
   - Actions: `setSaveName`, `setGameVersion`, `setLoaded`, `setDrivers`, etc.
3. Create `client/src/store/uiStore.ts`:
   - `activeTab: number`
   - `theme: string`
   - `notifications: Array<{ message: string; type: 'success' | 'error' | 'info' }>`
   - Actions: `setActiveTab`, `addNotification`, `dismissNotification`
4. Create `client/src/store/authStore.ts`:
   - `isLoggedIn: boolean`
   - `tier: string`
   - `userName: string`
   - Actions: `setAuth`, `logout`

**Output files:**
- `client/src/store/gameStore.ts`
- `client/src/store/uiStore.ts`
- `client/src/store/authStore.ts`

**Verify:** `cd client && npx tsc --noEmit` passes.

---

## Step 5.2: App shell — navigation + notifications

**Goal:** Build the main app layout with MUI AppBar, Tabs, and Snackbar notifications.

**Read first:**
- `client/src/App.tsx` (current placeholder)
- `client/src/store/uiStore.ts`

**Actions:**
1. Update `client/src/App.tsx`:
   - MUI `AppBar` with title, version badge, Patreon login button
   - MUI `Tabs` with all 10 tab labels
   - Tab switching via `uiStore.activeTab`
   - Conditional rendering: show drop zone when `!gameStore.isLoaded`, show tabs when loaded
2. Create `client/src/components/NotificationSnackbar.tsx`:
   - Subscribe to `uiStore.notifications`
   - MUI `Snackbar` + `Alert` for each notification
   - Auto-dismiss after 4 seconds

**Output files:**
- `client/src/App.tsx` (updated)
- `client/src/components/NotificationSnackbar.tsx`

**Verify:** `cd client && npx vite dev` — app shows AppBar + tabs (placeholder content). Notifications can be triggered from console.

---

## Step 5.3: File drop zone component

**Goal:** Replace `dragFile.js` with a React drop zone that loads save files.

**Read first:**
- `client/src/js/frontend/dragFile.js` (176 lines)
- `client/src/hooks/useWorker.ts`
- `client/src/store/gameStore.ts`

**Actions:**
1. Create `client/src/components/SaveFileDropZone.tsx`:
   - MUI `Paper` with `variant="outlined"` as drop target, drag-and-drop handlers
   - MUI `CircularProgress` during loading
   - MUI `Typography` for status messages
   - Use MUI `Stack` and `Container` for layout — no `sx` prop
   - On drop: call `worker.loadDB(file)`, update `gameStore`
   - On success: transition to loaded state (show tabs)
   - Also support click-to-select via hidden `<input type="file">`
2. Integrate into `App.tsx` — show when `!gameStore.isLoaded`

**Output files:**
- `client/src/components/SaveFileDropZone.tsx`
- `client/src/App.tsx` (updated)

**Verify:** `cd client && npx vite dev` — can drag a `.sav` file, see loading spinner, app transitions to tab view.

---

## Step 5.4: Download save button

**Goal:** Build the export/download save functionality in React.

**Read first:**
- `client/src/js/frontend/renderer.js` — search for `exportSave` and `downloadSave`

**Actions:**
1. Create `client/src/components/DownloadButton.tsx`:
   - MUI `Button` with download icon
   - On click: call `worker.exportSave()`, use `file-saver` to trigger download
   - Disabled until an edit has been made (`gameStore.hasEdits`)
2. Add to `App.tsx` AppBar

**Output files:**
- `client/src/components/DownloadButton.tsx`
- `client/src/App.tsx` (updated)

**Verify:** Load a save, make an edit (once tabs exist), click download — `.sav` file downloads.

---

## Step 5.5-5.6: Transfers tab — MVP (2 sessions)

**Read first:** `client/src/js/frontend/transfers.js` (1,904 lines)

Worker commands used: `driverRequest`, `editContract`, `fireDriver`, `hireDriver`, `autoContract`, `swapDrivers`, `juniorTeamDriversRequest`, `juniorTransfer`

**Step 5.5:** Create `client/src/tabs/Transfers/` directory:
- `TransfersTab.tsx` — orchestrator, <100 lines
- `TeamRoster.tsx` — MUI `List` showing drivers for one team
- `DriverCard.tsx` — reusable card with `Avatar`, name, contract status (<80 lines)
- `FreeAgentsList.tsx` — MUI `List` of unattached drivers
- `TransferConfirmDialog.tsx` — MUI `Dialog` for hire/fire confirmation
- Install `@dnd-kit/core`, `@dnd-kit/sortable`
- `useTransfersData.ts` hook in `client/src/hooks/`

**Step 5.6:** Wire to worker (`worker.hireDriver`, `worker.fireDriver`, `worker.swapDrivers`), integrate, test.

---

## Step 5.7: Contract dialog — MVP (shared component)

**Read first:** `client/src/index.html` lines 45-240 (contract modal HTML)

**Actions:**
1. Create `client/src/components/ContractDialog.tsx`:
   - MUI `Dialog` with `TextField` for salary, year, sign bonus, race bonus
   - Future contract section with team selector
   - Break contract button
   - Wire to `worker.editContract`

**Output:** `client/src/components/ContractDialog.tsx`

**Verify:** Can open contract dialog from Transfers tab, edit values, save.

---

## Step 5.8-5.9: Stats Editor tab — MVP (2 sessions)

**Read first:** `client/src/js/frontend/stats.js` (1,604 lines)

**Step 5.8:** Create `client/src/tabs/Stats/` directory:
- `StatsTab.tsx` — orchestrator, <100 lines
- `DriverList.tsx` — MUI `List` + `Avatar` for driver/staff selection
- `StatSlider.tsx` — reusable single-stat editor (MUI `Slider` + label), <50 lines
- `StatEditPanel.tsx` — grid of `StatSlider` components for one driver
- `StatsToolbar.tsx` — MUI `ToggleButtonGroup` (drivers/staff switch) + name `TextField`
- `useStatsData.ts` hook in `client/src/hooks/`

**Step 5.9:** Wire to worker (`worker.editStats`), integrate into App.tsx, test. Add compare functionality as `ComparePanel.tsx`.

---

## Step 5.10-5.11: Teams tab — MVP (2 sessions)

**Read first:** `client/src/js/frontend/teams.js` (383 lines)

Worker commands used: `teamRequest`

**Step 5.10:** Create `client/src/tabs/Teams/` directory:
- `TeamsTab.tsx` — orchestrator, <100 lines
- `TeamSelector.tsx` — MUI dropdown to pick a team
- `FacilitiesPanel.tsx` — MUI `Slider` for facility levels
- `BudgetPanel.tsx` — MUI `TextField` for cost cap, objectives
- `useTeamsData.ts` hook in `client/src/hooks/`

**Step 5.11:** Wire to worker (`worker.teamRequest`, `worker.editTeam`), integrate, test.

---

## Step 5.12: MVP integration test

**Goal:** Verify the full MVP flow end-to-end.

**Actions:**
1. Load a save file via drop zone
2. Switch to Transfers tab — verify drivers appear, can hire/fire/swap, edit contracts
3. Switch to Stats tab — verify driver list, can edit stats, compare drivers
4. Switch to Teams tab — verify team data loads, can edit facilities/budget
5. Download save — verify changes persisted
6. Fix any issues found

**Verify:** All 3 MVP tabs work with full round-trip save/load/export.

**🟩 MVP COMPLETE. All remaining steps are post-MVP.**

---
---

## ⏳ POST-MVP STEPS BELOW

---

## Step 5.13-5.14: Regulations tab (2 sessions)

**Read first:** `client/src/js/frontend/regulations.js` (390 lines)

**Step 5.13:** Create `client/src/tabs/Regulations/RegulationsTab.tsx`
- MUI `Table` with editable cells (`TextField`)
- MUI `Button` to save changes

**Step 5.14:** Wire to worker (`worker.editRegulations`), integrate, test.

---

## Step 5.15-5.16: Calendar tab (2 sessions)

**Read first:** `client/src/js/frontend/calendar.js` (495 lines)

**Step 5.15:** Create `client/src/tabs/Calendar/CalendarTab.tsx`
- MUI `Table` showing race calendar
- MUI `Select` for weather editing
- Drag-to-reorder rows (use `@dnd-kit/sortable`)

**Step 5.16:** Wire to worker (`worker.editCalendar`), integrate, test.

---

## Step 5.17-5.18: Car Performance tab (2 sessions)

**Read first:** `client/src/js/frontend/performance.js` (1,150 lines)

**Step 5.17:** Create `client/src/tabs/CarPerformance/` directory:
- `CarPerformanceTab.tsx` — orchestrator, <100 lines
- `TeamSelector.tsx` — MUI `List` with team logos/names
- `PerformanceSliders.tsx` — grid of `StatSlider` (reuse from Stats) for car attributes
- `EngineStatsPanel.tsx` — engine performance display
- Install `recharts` in `client/`
- `PerformanceChart.tsx` — Recharts `LineChart` for season graph
- `AttributeComparisonChart.tsx` — Recharts `BarChart`
- `usePerformanceData.ts` hook in `client/src/hooks/`

**Step 5.18:** Wire to worker (`worker.editPerformance`), integrate, test. Handle parts stats as `PartsStatsPanel.tsx`.

---

## Step 5.19-5.20: Season Viewer tab (2 sessions)

**Read first:** `client/src/js/frontend/seasonViewer.js` (2,000 lines)

**Step 5.19:** Create `client/src/tabs/SeasonViewer/` directory:
- `SeasonViewerTab.tsx` — orchestrator with MUI `Tabs` for sub-views, <100 lines
- `DriverStandingsTable.tsx` — MUI `Table`
- `ConstructorStandingsTable.tsx` — MUI `Table`
- `ResultsTable.tsx` — race results grid
- `YearSelector.tsx` — MUI `Select`
- `useSeasonData.ts` hook in `client/src/hooks/`

**Step 5.20:** Wire to worker, integrate, test. Add `RecordsView.tsx` and `EngineAllocationsView.tsx`.

---

## Step 5.21-5.22: Head-to-Head tab (2 sessions)

**Read first:** `client/src/js/frontend/head2head.js` (1,932 lines)

**Step 5.21:** Create `client/src/tabs/HeadToHead/` directory:
- `HeadToHeadTab.tsx` — orchestrator, <100 lines
- `ComparisonSelector.tsx` — two MUI `Autocomplete` pickers + mode toggle
- `H2HBarChart.tsx` — Recharts `BarChart` for comparison
- `PositionLineChart.tsx` — Recharts `LineChart` for season positions
- `H2HToolbar.tsx` — year `Select` + sprint/race/quali `ToggleButtonGroup`
- `useH2HData.ts` hook in `client/src/hooks/`

**Step 5.22:** Wire to worker (`worker.configuredH2H`), integrate, test.

---

## Step 5.23-5.25: News tab (3 sessions)

**Read first:** `client/src/js/frontend/news.js` (3,547 lines)

**Step 5.23:** Create `client/src/tabs/News/` directory — Part 1:
- `NewsTab.tsx` — orchestrator, <100 lines
- `NewsCard.tsx` — single news item display (<80 lines)
- `NewsList.tsx` — scrollable list of `NewsCard` components
- `NewsToolbar.tsx` — year `Select` + generate button
- `useNewsData.ts` hook in `client/src/hooks/`

**Step 5.24:** News tab — Part 2: Turning Points
- `TurningPointCard.tsx` — card with approve/cancel buttons (<80 lines)
- `TurningPointList.tsx` — list of turning point cards
- `TurningPointDialog.tsx` — MUI `Dialog` for details
- Wire to `worker.approveTurningPoint`, `worker.cancelTurningPoint`

**Step 5.25:** News tab — Part 3: AI integration + polish
- `AIAssistantPanel.tsx` — chat-like panel calling `/api/ask-openai` (<120 lines)
- `NewsEditDialog.tsx` — inline edit dialog
- Integrate into App.tsx, test full flow

---

## Step 5.26: Engines dialog (shared component)

**Read first:** `client/src/index.html` lines 22-44 (engines modal HTML)

**Actions:**
1. Create `client/src/components/EnginesDialog.tsx`:
   - MUI `Dialog` with `Table` of custom engines
   - Add/remove engine rows
   - Wire to `worker.customEngines`

**Output:** `client/src/components/EnginesDialog.tsx`

---

## Step 5.27: Mods tab

**Read first:** `client/src/js/frontend/renderer.js` — search for `mod25` and `modPill`

**Actions:**
1. Create `client/src/tabs/Mods/ModsTab.tsx`:
   - Buttons for each mod action (change lineups, change stats, etc.)
   - Each button calls the corresponding worker command
   - MUI `Button` + `Typography` for descriptions

**Output:** `client/src/tabs/Mods/ModsTab.tsx`

**Verify:** All mod actions work.

---

**🔲 Checkpoint: All 10 tabs + shared dialogs are React + MUI. Human does a full walkthrough of every tab to confirm feature parity.**
