# Phase 6 — MUI Theme Polish (~2 sessions)

---

## Step 6.1: Finalize MUI theme with all color tokens

**Goal:** Extract colors/fonts from old CSS into MUI theme. All visual customization lives in the theme — components use only standard props (`variant`, `color`, `size`), never `sx`.

**Read first:**
- `client/src/themes.css` (607 lines — contains CSS custom properties for multiple themes)
- `client/src/theme.ts` (created in Phase 1)

**Actions:**
1. Read `themes.css` and extract all CSS custom property values (e.g., `--bg-primary`, `--text-primary`, `--accent`, etc.)
2. Update `client/src/theme.ts`:
   - Set `palette.mode: 'dark'` as default
   - Map extracted colors to MUI palette: `primary`, `secondary`, `background`, `text`, `error`, `warning`, `success`, `info`
   - Add custom palette entries for F1-specific colors (team colors) under `palette.custom`
   - Set `typography.fontFamily` to `'Formula1, sans-serif'`
   - Add `typography` variants for headings matching current styles
   - **Heavy use of `components` overrides** — this is where ALL custom styling lives:
     - `MuiButton` — default variant, border radius, colors
     - `MuiDialog` — background color, padding
     - `MuiTable` / `MuiTableRow` — striped rows, hover states
     - `MuiTabs` / `MuiTab` — indicator color, text color
     - `MuiSlider` — track/thumb colors
     - `MuiPaper` — elevation, background
     - `MuiAppBar` — background, shadow
     - `MuiCard` — border, background
   - This ensures components look correct with just `<Button color="primary">` — no `sx` needed anywhere
3. If a visual effect can't be achieved through theme overrides + standard props, simplify the design rather than adding `sx`

**Output files:**
- `client/src/theme.ts` (updated)

**Verify:** `cd client && npx vite dev` — app looks like a polished dark F1 theme. Compare visually with the current app.

---

## Step 6.2: Theme variants + theme switcher

**Goal:** Port the multiple themes from `themes.css` as switchable MUI themes.

**Read first:**
- `client/src/themes.css` — identify all theme variants (look for class selectors like `.dark-theme`, `.light-theme`, etc.)
- `client/src/store/uiStore.ts`

**Actions:**
1. Create `client/src/themes/` directory
2. Create `client/src/themes/darkTheme.ts` — the default dark theme (move from `theme.ts`)
3. Create additional theme files for each variant found in `themes.css`:
   - e.g., `client/src/themes/lightTheme.ts`
   - e.g., `client/src/themes/classicTheme.ts`
   - Each exports a `createTheme()` result
4. Create `client/src/themes/index.ts` — exports a `Record<string, Theme>` mapping theme names to theme objects
5. Update `client/src/store/uiStore.ts`:
   - Add `themeName: string` state (default: `'dark'`)
   - Add `setTheme(name: string)` action
6. Update `client/src/App.tsx`:
   - `ThemeProvider` reads `uiStore.themeName` and looks up the theme from the map
7. Create `client/src/components/ThemeSwitcher.tsx`:
   - MUI `Select` or `ToggleButtonGroup` in the AppBar
   - Options from the theme map keys
   - On change: `uiStore.setTheme(name)`
8. Delete `client/src/styles.css` and `client/src/themes.css` — all styling now through MUI

**Output files:**
- `client/src/themes/darkTheme.ts`
- `client/src/themes/lightTheme.ts` (and any other variants)
- `client/src/themes/index.ts`
- `client/src/components/ThemeSwitcher.tsx`
- `client/src/store/uiStore.ts` (updated)
- `client/src/App.tsx` (updated)
- Deleted: `client/src/styles.css`, `client/src/themes.css`

**Verify:** Theme switcher works. Each theme applies correctly. No remaining CSS imports anywhere in the codebase. `grep -r "styles.css\|themes.css" client/src/` returns nothing.

---

**🔲 Checkpoint: All styling through MUI. Zero custom CSS files. Human confirms all themes look correct.**
