# UI Mods (Coherent / Gameface)

F1M24's entire management UI is HTML/CSS/JS running in Coherent Gameface. The JS files are plain, readable, and overridable via legacy `_P` paks (build details in [game-files-and-tooling.md](game-files-and-tooling.md)). This makes the UI layer the most powerful practical modding surface: JS can read the game's datastore and send the same events the UI itself uses, so C++ does the real work.

## How the UI talks to the game

- **Datastore (read):** a hierarchical store; components subscribe with listeners. `DS.getValue([...path])` reads live values the C++ side pushes.
- **Events (write):** UI sends named events (e.g. `NewDesignSetPreset`, `SetPreviewCarSetup`, `OnSetPitCrewTrainingPlan`) and C++ recomputes and pushes results back into the datastore. Finding the right event is most of the work; some plausible-looking events are dead code.

## Shipped mods (case studies)

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
- Policy: fill with drills (Balanced focus) → once projected cumulative `PitStopStages.chanceOfErrorTotal` ≤ 5%, switch later days to gym → gym days with ~0 projected stat delta (stats 32–42 minus 38) revert to drills → before each race day, rest the nearest prior sessions until projected fatigue < 24%. ~900 ms settle waits between phases. Values may arrive 0..1 or 0..100 — normalize defensively.
