# The Default Database (Volta)

F1M24's entire game-default dataset — driver stats, contracts, retirements, calendar, part data — is a single SQLite database embedded in a cooked asset. Editing it changes what **new careers** start with; existing saves carry their own copy of the DB (that's what the main DatabaseEditor app and the save watcher edit).

## Where it lives

- Asset: `F1Manager24/Content/Database/Volta.uasset` + `Volta.uexp`
- Container: `pakchunk0_s3-Windows.utoc/.ucas`
- `Content/Database/Diffs/Volta_XXXX_to_YYYY.uasset` are save-migration diffs between patch versions — not needed for modding.

## Volta.uexp binary layout

| Offset | Content |
|---|---|
| 0 | 6-byte prefix |
| 6 | int32 LE payload size |
| 10 | raw, uncompressed SQLite database |
| 10 + size | 4 zero bytes, then UE package tag `C1 83 2A 9E` |

So the SQLite file can be carved straight out at offset 10 and spliced back in.

Extracted DB: 317 tables, same schema as the save-embedded DB (a copy is committed at `fixtures/databases/volta-defaults.db`, schema in `fixtures/schema.sql`).

## Working edit pipeline (verified byte-identical round trip)

1. Extract with `retoc to-legacy -f Volta` (see [game-files-and-tooling.md](game-files-and-tooling.md)), or carve directly from the raw chunk.
2. Edit the carved SQLite with sql.js. **In-place UPDATEs keep the file size identical** — SQLite's freelist also absorbs same-count row insert/delete churn — so the result can be spliced back at offset 10 with no header patching.
3. Deliver via **raw-chunk splice**: `unpack-raw` pakchunk0_s3, splice into chunk `4929639c00efdba200000001` at offset 247, `pack-raw`, replace the container in place. (`to-zen` repacked `_P` paks crash the game — see tooling doc.)
4. Full game restart required; the DB is read at boot/career load.

## Things learned the hard way

- **New enum values don't work.** Adding a new design-focus preset row (Value 8) flowed into save DBs fine, but the compiled C++ `EEmphasisPreset` enum (0–7) filters unknown values before they reach the UI. Data can only take values the native code already understands — see [logic-layers.md](logic-layers.md). The workaround was repurposing an existing enum value (Balanced) and relabeling it in the UI layer.
- **Un-retiring a driver** needs more than clearing retirement: the default DB zeroes F1 eligibility for retired drivers. Set `Staff_DriverData.HasSuperLicense=1` and `HasRacedEnoughToJoinF1=1` (the create-a-team picker filters on these), and restore `LastKnownDriverNumber`. Their portrait mapping is also gone — that's a UI-layer fix ([ui-mods.md](ui-mods.md)).
- **Behavioral rules are not data-encodable.** "Driver X only accepts offers from team Y" has no data representation: acceptance logic is C++, mentality/opinion tables are runtime-only, there's no team-preference concept, and AI-to-AI signings bypass the UI entirely. Per-entity behavioral rules belong in the save watcher (`watcher/`), which rewrites saves after the game writes them.
