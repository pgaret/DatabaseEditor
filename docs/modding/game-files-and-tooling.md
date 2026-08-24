# Game Files & Tooling

How F1 Manager 24 packages its content, and the tooling/workflows for getting data out and mods in.

## Install layout

Game root (Steam): `C:\Program Files (x86)\Steam\steamapps\common\F1 Manager 2024`

- `F1Manager24\Binaries\Win64\F1Manager24.exe` — 553 MB statically-linked UE5 (5.1-era) executable. All gameplay logic is native C++ (see [logic-layers.md](logic-layers.md)).
- `F1Manager24\Content\Paks\` — all game content as IoStore containers (`.utoc`/`.ucas` pairs plus stub `.pak` files). `pakchunk0_s3-Windows` holds the default database and the Management tuning assets.
- `PakBackup\` (our convention, not the game's) — originals of any container we replace in place, plus quarantined third-party mods.

There is no anti-cheat or tamper protection (single-player game).

## AES key

The containers are encrypted. The key is **not committed to this repo** — dump it yourself:

1. Grab [AESDumpster](https://github.com/GHFear/AESDumpster).
2. Run it against `F1Manager24.exe`; it prints candidate keys extracted from the binary.
3. F1M24 reuses F1M23's key, so a known-good F1M23 key also works if you have one.

Pass the key to retoc as `-a 0x<64 hex chars>`.

## retoc (extraction / repacking)

[trumank/retoc](https://github.com/trumank/retoc) is the main tool. Key subcommands:

- `retoc -a <key> list --path <utoc>` — list container contents with resolved paths.
- `retoc -a <key> to-legacy -f <NameFilter> <PaksDir> <outDir>` — extract assets converted to legacy (`.uasset`/`.uexp`) format. **Must point at a directory containing `global.utoc`** (the Paks folder itself works); otherwise it fails with a missing ScriptObjects chunk.
- `retoc unpack-raw` / `pack-raw` — round-trip raw chunks without reinterpreting them (the reliable repack path, see below).

Known issues (retoc v0.1.5):

- Crashes (generic-array panic) on some third-party mod containers (e.g. RRacingV3), but handles all base-game containers fine.
- **`to-zen` output crashes the game on launch** — the regenerated zen package header is rejected. UnrealReZen 1.0 can't parse these assets either (produces empty paks).

## The two working mod-delivery routes

### 1. Raw-chunk splice (data edits inside existing containers)

For same-size binary edits to an asset inside a container (e.g. the default database — see [default-database.md](default-database.md)):

1. `retoc unpack-raw` the container.
2. Splice your same-size bytes into the target chunk file.
3. `retoc pack-raw` and replace the container in the Paks folder (back up the original to `PakBackup\`).

Uncompressed + unencrypted replacement containers mount fine. Requires the edit to **not change the payload size**.

### 2. Legacy `_P` patch paks (UI/file overrides)

Files named `<Name>_P.pak` dropped into `F1Manager24\Content\Paks` mount on top of base content (highest-sorting name wins — hence `zz_` prefixes). Old-style (pak V3) paks built with [repak](https://github.com/trumank/repak), uncompressed and unencrypted, load fine alongside the IoStore containers — this is how community UI mods (e.g. extendedstandings) work, and how all our UI mods are built (see [ui-mods.md](ui-mods.md)). Mount point for UI files: `../../../F1Manager24/Content/UIGameface/`.

## Gotchas

- Third-party overhaul mods (e.g. RRacingV3) may bundle their own full database, masking any base-container edits — check what's mounted before debugging "my edit does nothing".
- The game loads DB/tuning content at boot or career load; swapping containers mid-session silently does nothing until a full restart.
- PowerShell chokes on deep `UIGameface` paths (>260 chars) — use `\\?\` path prefixes, or Node/rg instead.
