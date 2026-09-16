# UI Mods (Coherent / Gameface)

F1M24's entire management UI is HTML/CSS/JS running in Coherent Gameface. The JS files are plain, readable, and overridable via legacy `_P` paks (build details in [game-files-and-tooling.md](game-files-and-tooling.md)). This makes the UI layer the most powerful practical modding surface: JS can read the game's datastore and send the same events the UI itself uses, so C++ does the real work.

## How the UI talks to the game

- **Datastore (read):** a hierarchical store; components subscribe with listeners. `DS.getValue([...path])` reads live values the C++ side pushes.
- **Events (write):** UI sends named events (e.g. `NewDesignSetPreset`, `SetPreviewCarSetup`, `OnSetPitCrewTrainingPlan`) and C++ recomputes and pushes results back into the datastore. Finding the right event is most of the work; some plausible-looking events are dead code.

## Shipped mods (case studies)

Source for all six lives in [`mods/`](../../mods/README.md). `node mods/build-pak.js <name>` rebuilds a pak and `node mods/unpack-pak.js <file.pak> [outDir]` reads one back, neither needing retoc, repak, or the AES key — these paks store their JS uncompressed and unencrypted, so a shipped pak is always recoverable.

### `zz_VettelFace_1_P` — portrait overrides for un-retired drivers

Face/body textures ship for many retired drivers (e.g. `UITextures/StaffPhotos/Faces/Named/Drivers/F1/S_Vettel_TN`), but the StaffID→texture map only covers active staff. That map is `UITextures/StaffPhotos/StaffPhotoData.uasset` (uexp: 335 entries, 31-byte records, count at offset 8, records from offset 12, key = StaffID int32). Rather than resizing that asset, the mod overrides `js/project/components/CharacterImage.js` with `FACE_OVERRIDES`/`BODY_OVERRIDES` maps keyed by StaffID (texture src format: `Texture2D'/Game/UITextures/<path>.<name>'`). Extend those maps for future un-retirements.

### `zz_NerobaxPreset_1_P` — custom design-slider preset

Couldn't be a *new* preset (C++ enum filters unknown values — see [default-database.md](default-database.md)), so the Balanced preset's DB recipe was replaced and the UI relabeled. Files: `CarBuildSelectPresetButton.js` (label 'Nerobax' ×2 sites, filters.svg icon, stepper reorder) + `CarBuildConfig.js` (`CarPartDesignLabelPreset`).

Critical quirk: C++ only applies preset sliders on a preset **change**, and the design screen opens with Balanced pre-selected but unapplied. Fix: `autoReapplyBalanced()` — on the `selectedEmphasisPreset` listener firing with Balanced (once per mount), send `NewDesignSetPreset(HighSpeedPerformance)` then `NewDesignSetPreset(Balanced)` back-to-back. The intermediate **must be a real preset**: C++ ignores `SetPreset(Custom)` in its current-preset tracking, so Custom→Balanced reads as Balanced→Balanced and no-ops.

### `zz_PerfectSetup_1_P` — one-click perfect car setup

Overrides `js/project/modules/raceWeekend/strategy/CarSetupSetup.js`, adding a 'Perfect Setup' button next to Revert. Key discoveries:

- Datastore path `[...getPracticePlayerCarContext(playerCar), 'PerfectCarSetup']` carries the TRUE ideal handling targets (oversteer/cornerEntries/midCorners/cornerExits/straights, plus revealed Min/Max bands).
- `SetPreviewCarSetup(carID, {frontWingAngle, rearWingAngle, antiRollBarsStiffness, camber, toe})` (values 0..1) makes C++ live-recompute preview characteristics. `UpdateCarSetup` exists but is dead code — SetPreviewCarSetup IS the edit path; the game commits the preview itself.
- Solver: probe each slider (delta 0.15, poll datastore every 35 ms until change/timeout), build a 5×5 influence matrix, Newton-iterate (Gaussian elimination) to targets, snap to the `partsSetupMinMax` step grid. Disabled unless `canEditFullCarSetup` (parc fermé).

### `zz_PitCrewAuto_1_P` — pit crew training auto-optimizer

Overrides `js/project/modules/staff/pitCrew/TMPitCrewDevelopment.js`, adding an 'Auto-Optimize' button. Mechanics:

- Plan at datastore `['PitCrew', teamID, 'DevelopmentPlanDaily']`, child contexts `'1'..'31'` (**index, not absolute day**); each has `day` (absolute, compare vs `['Calendar'].currentDay`), `raceDay`, sessions `'0'`/`'1'` with `trainingType` (0 PitStopDrills / 1 Gym / 2 CarSetupPractice / 3 Rest) and `trainingFocus`.
- Fatigue: `PerformanceStats/38.value` (EStaffFatigue 0 WellRested … 3 Exhausted).
- Edit event `OnSetPitCrewTrainingPlan(index, session, type, focus)` — C++ live-recomputes projections; submit via the existing `OnSubmitPitCrewDevelopmentPlan` button.
- Policy: calibrate (rest the whole month, read each race day's projected fatigue; drill the whole month, read it again — those two readings bracket what's achievable) → fill with drills (Balanced focus) → once projected cumulative `PitStopStages.chanceOfErrorTotal` ≤ 5%, switch later days to gym → gym days with ~0 projected stat delta (stats 32–42 minus 38) revert to drills → before each race day, rest the nearest prior sessions until its fatigue reaches `rested + 0.3 × (drilled − rested)`. ~900 ms settle waits between phases.
- **Do not treat the fatigue figure as a percentage.** Its units are not established: the enum `Staff_Enum_Fatigue` is 0–3 (WellRested/Fatigued/Tired/Exhausted) while `Staff_PitCrew_RaceWeekendFatigue.Val` in a save runs ~168–400. The original version normalized it as 0..1/0..100 and compared against a fixed 24% target, which no reading could satisfy — every session in the month got converted to Rest. Hence the per-race-day calibration above, plus two backstops: at most 6 rested sessions per race, and abandon a race after two rests that don't move its number. The rest count is reported back in the button label.
- The same 0..1/0..100 normalization is still applied to `chanceOfErrorTotal`, which does read as a probability; only fatigue needed the scale-free treatment.

### `zz_StrategyDefaults_1_P` — minimum fuel & Conserve by default

Overrides two components on the same race weekend setup screen as Perfect Setup (`CarSetup.js` composes `CarSetupTyres`, `CarSetupComponents`, `CarSetupSetup`, `CarSetupFuel` and — outside qualifying — `CarSetupOptions`).

- **Fuel load → minimum** (`CarSetupFuel.js`). `getPreSessionPlayerCarContext(playerCar)` carries `minimumAllowedFuelLoad` and `estimatedFuelUsagePerLap`; the current load is `previewFuelLevel` on `getPracticePlayerCarContext(playerCar)`. Edit event `FuelLoadChange(carID, fuelLoad, laps)` — the same one the stepper sends. Qualifying is untouched: its run plan is flying laps plus `additionalLapsOfFuel`, not a fuel figure. `MOD_MIN_FUEL_IN_RACE` at the top of the file gates whether race sessions get it too — the minimum is not clamped to race distance, so a race left on it runs dry.
- **Fuel Usage → Conserve** (`CarSetupOptions.js`). The `[CAR_SETUP_FUEL_USAGE]` row is backed by `liftAndCoastStrategy` on `[...getPlayerCarContext(playerCar), 'CarInteraction']`: `LiftAndCoastStrategy` is None=0 (Push, 3 dots) / Balanced=1 (2 dots) / Conserve=2 (1 dot), so minimum usage is Conserve=2. Event `DriverCommandLiftAndCoastChange(carID, strategy)`.
- **Put a default on a component that actually mounts.** `ButtonDropDown` renders its children only while `isExpanded`, so `CarSetupLiftAndCoastRow` (and the inner `CarSetupFuelPracticeRace`) do not exist until the player opens that dropdown — far too late for a default. Both defaults therefore live in the always-mounted outer component.
- Each default is applied once per `carID` + `Weekend.currentStage`, so a manual change sticks for the rest of the session and the next session defaults again.

### `zz_PaceOptimiser_1_P` — stint pace hill-climber

Overrides `js/project/modules/raceWeekend/strategyView/StintList.js`, adding an 'Optimise Pace' button under the stint rows. The generated strategies tend to leave a stint on Standard when the tyre has life to spare; the generator is native C++ with no data-asset lever (the only `Strategy` assets under `Content/RaceSim` + `Content/Management` are `AISpendingStrategyPresets`/`AIDecisionSet_SelectSpendingStrategy`, i.e. finances), so this post-processes the plan in the editor instead.

- Edit working copy at `['RaceSim','CarStrategyEdit','Current']` (`StrategyDataHelper.EDIT_STRATEGY_CONTEXT`), stints under `.../Stints/<i>` — but enumerate via the `DataStoreCollection` the list already binds, since the context id is the stint id passed to events, not necessarily the row order.
- Per stint: `startLap`, `pitLap`, `endLap`, **`tyreEndLap`**, `startTime`, `endTime`, `tyreWearMultiplier`, `tyreStartWear`, **`tyreEndWear`**, `tyreType`, `tyreID`, `tyreWearStrategy`. Strategy-level: **`estimatedRaceTimeSeconds`**, `stintCount`, `currentStint`, `canAddStint`, `fuelCapacity`.
- Lever: `StrategyStintEditTyreWearStrategy(carIndex, stintId, value)`. `TyreWearSavingStrategy` runs **Attack=0 … Conserve=4**, so raising intensity means *decrementing*; the UI's dot count is `COUNT - strategy`.
- Policy: for each editable stint (`isPreSession || index >= currentStint`), step intensity up while `estimatedRaceTimeSeconds` improves by >0.05 s **and** every editable stint still survives; on the first failure put the stint back and move on. Two sweeps, since raising one stint shifts fuel and pit laps elsewhere. Capped at 40 steps; ~450 ms settle per step.
- Survival test is `tyreEndLap >= endLap` plus a 5% margin on `tyreEndWear`. **The wear scale's direction is measured, not assumed** — compare `tyreStartWear` to `tyreEndWear` on any stint and see which way it moves. If neither signal is present the button declines ('NO TYRE DATA') rather than optimise on time alone, which could shred tyres.
- Nothing is committed until the existing confirm button is pressed, and every step is individually reverted if it doesn't pay, so a run can only leave the plan as good as it found it. Result is reported in the button label (`OPTIMISE PACE -12.4S` / `NO GAIN`).
- Caveat worth remembering: `estimatedRaceTimeSeconds` is a clean-air projection — no safety cars, no traffic, no undercut. It optimises predicted time, which is not the same as finishing position; hence the deliberate tyre margin.
