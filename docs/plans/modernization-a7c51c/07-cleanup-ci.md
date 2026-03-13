# Phase 7 — Cleanup & CI (~4 sessions)

Steps 7.2–7.4 are **MVP** (can run as soon as MVP tabs work). Step 7.1 is **post-MVP** (needs all tabs migrated first).

---

## ⏳ Step 7.1: Delete all old frontend files (POST-MVP)

**Goal:** Remove every file from the old vanilla JS frontend that has been replaced by React components. Only do this after ALL tabs are migrated.

**Read first:** `client/src/js/frontend/` directory listing, `client/src/App.tsx` (confirm all tabs are React)

**Actions:**
1. Delete `client/src/js/frontend/renderer.js`
2. Delete `client/src/js/frontend/transfers.js`
3. Delete `client/src/js/frontend/stats.js`
4. Delete `client/src/js/frontend/performance.js`
5. Delete `client/src/js/frontend/seasonViewer.js`
6. Delete `client/src/js/frontend/head2head.js`
7. Delete `client/src/js/frontend/teams.js`
8. Delete `client/src/js/frontend/regulations.js`
9. Delete `client/src/js/frontend/calendar.js`
10. Delete `client/src/js/frontend/news.js`
11. Delete `client/src/js/frontend/dragFile.js`
12. Delete `client/src/js/frontend/config.js` (data moved to types/ or store/)
13. Delete `client/src/js/frontend/recentsManager.js` (functionality moved to React)
14. Delete `client/src/js/` directory if empty
15. Delete the old `client/src/index.js` (replaced by `main.tsx`)
16. Delete old `client/src/index.html` if a separate one exists from the original `src/`
17. Verify no remaining imports reference any deleted file: `grep -r "from.*js/frontend" client/src/`

**Output:** Deleted files only.

**Verify:** `cd client && npx vite build` succeeds. `cd client && npx tsc --noEmit` passes. No broken imports.

---

---

## 🟩 MVP STEPS BELOW (run after step 5.12)

---

## Step 7.2: Clean up dependencies

**Goal:** Remove all unused dependencies from both package.json files.

**Read first:**
- `client/package.json`
- Root `package.json`

**Actions:**
1. Remove from `client/package.json` dependencies that are no longer used:
   - `bootstrap`, `bootstrap-icons` (replaced by MUI)
   - `chart.js`, `chartjs-plugin-annotation`, `chartjs-plugin-datalabels` (replaced by Recharts)
   - `interactjs` (replaced by @dnd-kit)
   - `style-loader` (Vite handles CSS)
   - `css-loader`, `mini-css-extract-plugin`, `postcss-loader`, `sass`, `sass-loader` (no more custom CSS)
   - `babel-loader` (Vite handles transpilation)
   - `webpack`, `webpack-cli`, `html-webpack-plugin`, `copy-webpack-plugin` (replaced by Vite)
   - `image-minimizer-webpack-plugin`, `sharp` (Vite handles assets)
   - `autoprefixer` (MUI handles prefixing)
   - `crypto-browserify` (check if still needed)
   - `marked`, `dompurify`, `turndown` (check if still used in news tab)
2. Delete `client/webpack.config.js` if it still exists
3. Run `cd client && npm install` to update lockfile
4. Run `cd server && npm install` to update lockfile

**Output:** Updated `client/package.json`, deleted `webpack.config.js`

**Verify:** `cd client && npx vite build` succeeds. `npm run dev` works.

---

## Step 7.3: ESLint + Prettier

**Goal:** Add linting and formatting to the entire codebase.

**Read first:** `client/tsconfig.json`, `server/tsconfig.json`

**Actions:**
1. Install at root: `eslint`, `prettier`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-config-prettier`
2. Create root `eslint.config.js` (flat config):
   ```js
   import tseslint from '@typescript-eslint/eslint-plugin';
   import react from 'eslint-plugin-react';
   import reactHooks from 'eslint-plugin-react-hooks';
   // ... standard flat config for TS + React
   ```
3. Create root `.prettierrc`:
   ```json
   {
     "semi": true,
     "singleQuote": true,
     "trailingComma": "all",
     "printWidth": 100,
     "tabWidth": 2
   }
   ```
4. Add scripts to root `package.json`:
   - `"lint": "eslint client/src server/src types"`
   - `"lint:fix": "eslint --fix client/src server/src types"`
   - `"format": "prettier --write 'client/src/**/*.{ts,tsx}' 'server/src/**/*.ts' 'types/**/*.ts'"`
5. Run `npm run lint:fix` and `npm run format` — fix any remaining issues manually

**Output files:**
- `eslint.config.js`
- `.prettierrc`
- Root `package.json` (updated scripts)

**Verify:** `npm run lint` passes with zero errors. `npm run format` produces no changes (already formatted).

---

## Step 7.4: Playwright tests + GitHub Actions + Railway deploy

**Goal:** Add E2E tests, CI pipeline, and Railway deployment config.

**Read first:** `.github/workflows/nightly.yml` (existing workflow)

**Actions:**
1. Create `e2e/` directory at root
2. Create `e2e/playwright.config.ts`:
   - Base URL: `http://localhost:3000`
   - Web server command: `npm run dev`
3. Create `e2e/save-load.spec.ts`:
   - Test: navigate to app, upload a test `.sav` file, verify tabs appear
   - Test: switch to each tab, verify no errors
   - Test: make an edit (e.g., regulations), download save
4. Create `e2e/api.spec.ts`:
   - Test: `GET /health` returns 200
   - Test: `GET /api/check-cookie` returns 200 with `hasCookie: false`
5. Create `.github/workflows/ci.yml`:
   ```yaml
   name: CI
   on: [push, pull_request]
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20 }
         - run: npm ci
         - run: cd client && npm ci
         - run: cd server && npm ci
         - run: npm run lint
         - run: cd client && npx tsc --noEmit
         - run: cd server && npx tsc --noEmit
         - run: cd client && npx vite build
         - run: npx playwright install --with-deps
         - run: npx playwright test
   ```
6. Create `Dockerfile` at root:
   ```dockerfile
   FROM node:20-slim
   WORKDIR /app
   COPY . .
   RUN npm ci && cd client && npm ci && npx vite build && cd ../server && npm ci && npx tsc
   EXPOSE 3000
   CMD ["node", "server/dist/index.js"]
   ```
7. Create `railway.toml`:
   ```toml
   [build]
   builder = "dockerfile"
   
   [deploy]
   healthcheckPath = "/health"
   restartPolicyType = "on_failure"
   ```
8. Update `README.md`:
   - New tech stack section (TypeScript, React, MUI, Fastify, Recharts)
   - New development setup instructions
   - New deployment instructions (Railway)

**Output files:**
- `e2e/playwright.config.ts`
- `e2e/save-load.spec.ts`
- `e2e/api.spec.ts`
- `.github/workflows/ci.yml`
- `Dockerfile`
- `railway.toml`
- `README.md` (updated)

**Verify:** `npx playwright test` passes locally. Push to GitHub — CI workflow runs green. Deploy to Railway — app accessible at Railway URL.

---

**🔲 Final checkpoint: Fully modernized codebase. TypeScript + React + MUI + Fastify + Recharts. Deployed on Railway. CI passing. Human does final walkthrough.**
