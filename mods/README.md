# Game UI mods

Source for the Coherent/Gameface UI mods described in [docs/modding/ui-mods.md](../docs/modding/ui-mods.md). Each folder mirrors the game's `UIGameface/` tree, so a file at `mods/<name>/js/project/.../Foo.js` overrides the base game's `js/project/.../Foo.js`.

These are game-file mods — unrelated to the save-file editing the web app and `watcher/` do. They are here only so the source survives; nothing in the build pipeline touches them.

## Building

```bash
node mods/build-pak.js zz_PitCrewAuto
```

Writes `zz_PitCrewAuto_1_P.pak` to the current directory (pass a second argument for a different output directory). `build-pak.js` is a self-contained pak V3 writer — uncompressed, unencrypted, single mount point, no repak or retoc needed.

Install by copying the pak into `F1Manager24\Content\Paks`, backing up anything you replace into `PakBackup\`, then restarting the game (paks are read at boot only).

## Reading a pak back

```bash
node mods/unpack-pak.js path/to/zz_PerfectSetup_1_P.pak            # list
node mods/unpack-pak.js path/to/zz_PerfectSetup_1_P.pak mods/zz_X  # extract
```

This is how every folder here was recovered after the original working copies were lost — the JS is stored in the clear, so a shipped pak is always the backstop. It verifies each entry's SHA-1 and refuses compressed or encrypted paks rather than emitting garbage. IoStore containers (`.utoc`/`.ucas`) are a different format and still need retoc.

## Mods

| Folder | What it does |
|---|---|
| `zz_PitCrewAuto` | Adds an 'Auto-Optimize' button to the pit crew training screen that fills the month with drills/gym and rests just enough before each race. |
| `zz_StrategyDefaults` | Opens the race weekend setup screen with fuel load at the minimum and Fuel Usage on Conserve. |
| `zz_PaceOptimiser` | Adds an 'Optimise Pace' button to the strategy editor that raises each stint's intensity as far as the tyre and the projected race time allow. |
| `zz_PerfectSetup` | Adds a 'Perfect Setup' button to the race weekend setup screen that solves the sliders to the revealed ideal handling targets. |
| `zz_NerobaxPreset` | Replaces the Balanced design preset's recipe and relabels it 'Nerobax'. |
| `zz_VettelFace` | Maps face/body textures onto un-retired drivers whose portraits the game ships but doesn't wire up. |

## Rebuild fidelity

Rebuilding each of these reproduces the installed pak byte for byte, except `zz_NerobaxPreset`: it holds two files, and repak happened to store them in the opposite order. Contents, names, and hashes are identical and the game doesn't care about entry order — `build-pak.js` just packs in sorted order. Don't read that one diff as corruption.
