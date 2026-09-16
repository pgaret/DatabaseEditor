# Game UI mods

Source for the Coherent/Gameface UI mods described in [docs/modding/ui-mods.md](../docs/modding/ui-mods.md). Each folder mirrors the game's `UIGameface/` tree, so a file at `mods/<name>/js/project/.../Foo.js` overrides the base game's `js/project/.../Foo.js`.

These are game-file mods — unrelated to the save-file editing the web app and `watcher/` do. They are here only so the source survives; nothing in the build pipeline touches them.

## Building

```bash
node mods/build-pak.js zz_PitCrewAuto
```

Writes `zz_PitCrewAuto_1_P.pak` to the current directory. `build-pak.js` is a self-contained pak V3 writer (uncompressed, unencrypted, single mount point) — no repak or retoc needed, and it reproduces repak's output byte for byte.

Install by copying the pak into `F1Manager24\Content\Paks`, backing up anything you replace into `PakBackup\`, then restarting the game (paks are read at boot only).

## Mods

| Folder | What it does |
|---|---|
| `zz_PitCrewAuto` | Adds an 'Auto-Optimize' button to the pit crew training screen that fills the month with drills/gym and rests just enough before each race. |

The other shipped mods (`zz_VettelFace`, `zz_NerobaxPreset`, `zz_PerfectSetup`) are documented in ui-mods.md but their source is not here yet — recover it from the installed paks with the reader logic in `build-pak.js` if you need to change them.
