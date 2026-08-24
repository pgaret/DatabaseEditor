# Where the Game's Logic Lives

Result of a 2026-08-24 spike answering: *could we edit the game's logical core directly instead of working around it (save watcher, UI mods, DB edits)?* Short answer: **no for targeted rules — the core is native C++ — but there's a pak-moddable tuning layer between "code" and "database" worth knowing about.**

## Layer 1: Native C++ (the actual logic — effectively closed)

`F1Manager24.exe` is a 553 MB statically-linked monolith, no PDB, no anti-cheat. All decision logic is native: contract acceptance, enum validation, sim stepping, AI evaluation. Symbols like `ProposeContracts` / `ContractNegotiation` and `/Script/RaceManagement` class names are visible in binary strings.

The paks contain **2,086 Blueprint assets — every one cosmetic** (track spline props, circuit scenery, pit-stop animations, dialogue behaviors). There are zero gameplay-logic Blueprints, so there is no bytecode-editing route to game rules.

Directly modifying this layer means binary patching a half-gigabyte symbol-less binary and redoing it every game update. Runtime hooking (UE4SS-style) would technically work since there's no anti-tamper, but is per-machine, fragile, and can't express our per-save rules any more cleanly than the watcher does. **Not reasonable.**

## Layer 2: Data-asset tuning (~169 assets — the underexplored middle)

`F1Manager24/Content/Management/` and `Content/RaceSim/` (mostly in `pakchunk0_s3`, the same container as Volta) hold the *parameters* the native logic runs on. Extracts cleanly with `retoc to-legacy` (see [game-files-and-tooling.md](game-files-and-tooling.md)). Highlights:

- **AI utility system** — 11 decision sets (`DA_AIDecisionSet_ProposeContracts`, `_DesignCarParts`, `_ReconcileBudget`, `_UpgradeBuilding`, `_SelectSponsorPackages`, …) plus `DA_AITeamBehaviourConfig` and config tables (`DT_AIResponseCurvePresets`, `DT_AISpendingStrategyPresets`, …). Each decision set is a full utility-AI spec in data: considerations (e.g. `TeamOpinionDeltaToStaffTeam`, `AvailableAffiliateSlots`, `StaffContractRemainingDays`), response curves, and scoring functions for tasks like `SelectContractGenerosity`, `SelectMaxContractLength`, `SelectContractBreakoutClause`. The C++ is just the evaluator; the decision *structure* is data.
- **Management curves** — salary curves per staff type (plain `CurveFloat`), 3 mentality curves, sponsorship curves, pit-crew training curves, `Staff_ContractReview_UnemployedStaffAppealMultiplier`.
- **RaceSim tuning** — incident distributions (crash, mechanical failure, collision), driver accuracy curves, tyre temperature/wear (30+ assets), fuel, brakes, weather.

**What this layer can do:** globally bias behavior — AI contract generosity, poaching appetite, incident rates, salary economics, mentality response.

**What it cannot do:** anything per-entity. Considerations are global per decision type; there is no per-staff or per-team hook. "Stroll only signs for Aston Martin" is provably inexpressible here.

**Repack caveat:** `retoc to-zen` output crashes the game (see tooling doc), so today this layer is editable only via same-size raw-chunk splices — fine for changing existing `CurveFloat` key *values* in place (floats swap byte-for-byte), not for adding/removing keys or considerations.

## Layer 3: Save database (the watcher's domain)

The only layer with per-entity granularity. Survives game patches, no repack problem, editable after every game write (the game reads saves only at load). This is why the save watcher (`watcher/`) is the correct architecture for targeted rules.

## Decision guide

| Goal | Layer |
|---|---|
| Per-driver / per-team rules ("X only signs for Y", salary caps on specific contracts) | Save watcher (layer 3) |
| Changing what new careers start with | Default DB splice (layer 3 data, [default-database.md](default-database.md)) |
| League-wide behavior tuning (AI generosity, incident rates, salary inflation) | Management/RaceSim assets (layer 2), same-size float edits |
| New UI features, automations, relabels | UI pak overrides ([ui-mods.md](ui-mods.md)) |
| New game rules the native code doesn't have | Not feasible — don't fight layer 1 |
