# Phase 2 — Fastify API Port (~4 sessions)

---

## Step 2.1: Port lib/ helpers to TypeScript

**Goal:** Convert the 4 small server-side utility files to TypeScript in `server/src/lib/`.

**Read first:**
- `lib/redis.js` (3 lines)
- `lib/accessControl.js` (52 lines)
- `lib/rateLimits.js` (10 lines)
- `lib/getUserTierServer.js` (41 lines)

**Actions:**
1. Create `server/src/lib/redis.ts` — copy `lib/redis.js`, add types. Import stays `@upstash/redis`.
2. Create `server/src/lib/accessControl.ts` — copy `lib/accessControl.js`, add:
   - `interface TierInput { name: string; baseTier: string; }`
   - Type `TIER_ORDER` as `Record<string, number>`
   - Return type `string` on `getEffectiveTier`
3. Create `server/src/lib/rateLimits.ts` — copy `lib/rateLimits.js`, add:
   - Parameter type `tier: string`
   - Return type `number`
4. Create `server/src/lib/getUserTierServer.ts` — copy `lib/getUserTierServer.js`, add types for the request object and return value.
5. Install `@upstash/redis`, `jsonwebtoken`, `cookie`, `@types/jsonwebtoken`, `@types/cookie` in `server/`.

**Output files:**
- `server/src/lib/redis.ts`
- `server/src/lib/accessControl.ts`
- `server/src/lib/rateLimits.ts`
- `server/src/lib/getUserTierServer.ts`

**Verify:** `cd server && npx tsc --noEmit` passes.

---

## Step 2.2: Port Patreon auth routes to Fastify

**Goal:** Convert the 3 Patreon auth endpoints to a single Fastify route plugin.

**Read first:**
- `api/auth/patreon/login.js` (14 lines)
- `api/auth/patreon/verify.js` (138 lines)
- `api/auth/patreon/logout.js` (14 lines)
- `server/src/lib/accessControl.ts` (just created)

**Actions:**
1. Create `server/src/routes/auth.ts`:
   - Export a Fastify plugin function: `async function authRoutes(fastify: FastifyInstance)`
   - `GET /api/auth/patreon/login` — redirect to Patreon OAuth URL (from `login.js`)
   - `GET /api/auth/patreon/verify` — exchange code for token, set JWT cookie (from `verify.js`)
     - Use `fastify.setCookie()` instead of `res.setHeader('Set-Cookie', ...)`
   - `GET /api/auth/patreon/logout` — clear cookie (from `logout.js`)
2. Register the plugin in `server/src/index.ts`: `fastify.register(authRoutes)`
3. Install `openai` in `server/` (needed for step 2.3)

**Output files:**
- `server/src/routes/auth.ts`
- `server/src/index.ts` (updated — add `import { authRoutes } from './routes/auth'` and register)

**Verify:** `cd server && npx tsc --noEmit` passes. Manual test: visit `/api/auth/patreon/login` redirects to Patreon.

---

## Step 2.3: Port remaining 4 API routes to Fastify

**Goal:** Convert check-cookie, me, ask-openai, usage-today to Fastify routes.

**Read first:**
- `api/check-cookie.js` (44 lines)
- `api/me.js` (39 lines)
- `api/ask-openai.js` (75 lines)
- `api/usage-today.js` (38 lines)

**Actions:**
1. Create `server/src/routes/check-cookie.ts`:
   - Export Fastify plugin
   - `GET /api/check-cookie` — verify JWT from cookie, return `{ ok, hasCookie, valid }`
2. Create `server/src/routes/me.ts`:
   - `GET /api/me` — decode JWT, return user info + tier
3. Create `server/src/routes/ask-openai.ts`:
   - `POST /api/ask-openai` — auth check, rate limit via Redis, call OpenAI, return response
   - Import `redis` from `../lib/redis`
   - Import `getDailyLimitForTier` from `../lib/rateLimits`
   - Import `getUserTierServer` from `../lib/getUserTierServer`
4. Create `server/src/routes/usage-today.ts`:
   - `GET /api/usage-today` — return daily usage count from Redis
5. Register all 4 plugins in `server/src/index.ts`

**Output files:**
- `server/src/routes/check-cookie.ts`
- `server/src/routes/me.ts`
- `server/src/routes/ask-openai.ts`
- `server/src/routes/usage-today.ts`
- `server/src/index.ts` (updated — register all routes)

**Verify:** `cd server && npx tsc --noEmit` passes. `npm run dev` — all API endpoints respond (test with curl).

---

## Step 2.4: Delete old serverless code

**Goal:** Remove the old `api/`, `lib/`, and `vercel.json` files.

**Read first:** `server/src/index.ts` (confirm all routes registered)

**Actions:**
1. Delete `api/` directory entirely
2. Delete `lib/` directory entirely
3. Delete `vercel.json`
4. Remove from root `package.json` any dependencies that were only used by `api/`/`lib/` and are now in `server/package.json` (e.g., `jsonwebtoken`, `cookie`, `openai`, `@upstash/redis`)
5. Verify no remaining imports reference `api/` or `lib/` paths

**Output:** Deleted files only. No new files.

**Verify:** `npm run dev` — full app works. API calls from frontend hit Fastify routes correctly.

---

**🔲 Checkpoint: API fully on Fastify. All old serverless code deleted. Human confirms all endpoints work.**
