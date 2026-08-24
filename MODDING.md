# F1 Manager 24 Modding Notes

Index of everything we've established about modding F1M24 at the game-file level (as opposed to the save-file editing this repo's web app and watcher do). Details live in `docs/modding/`.

## The layers, top to bottom

1. **Native C++ exe** — all game logic; not reasonably editable. → [docs/modding/logic-layers.md](docs/modding/logic-layers.md)
2. **UI (Coherent HTML/JS)** — most powerful practical surface; JS can read the datastore and drive C++ via events. → [docs/modding/ui-mods.md](docs/modding/ui-mods.md)
3. **Tuning data assets** (`Content/Management/`, `Content/RaceSim/`) — global AI/econ/sim parameters, pak-moddable. → [docs/modding/logic-layers.md](docs/modding/logic-layers.md)
4. **Default database** (Volta) — SQLite inside a cooked asset; sets what new careers start with. → [docs/modding/default-database.md](docs/modding/default-database.md)
5. **Save files** — per-entity, per-career state; edited by this repo's web app and the `watcher/` daemon.

## Docs

| Doc | Covers |
|---|---|
| [game-files-and-tooling.md](docs/modding/game-files-and-tooling.md) | Install layout, IoStore containers, obtaining the AES key, retoc usage, the two working mod-delivery routes (raw-chunk splice, legacy `_P` paks), known tooling failures |
| [default-database.md](docs/modding/default-database.md) | Volta.uexp binary layout, carve/splice pipeline, enum-filtering limits, un-retiring drivers, why behavioral rules aren't data-encodable |
| [ui-mods.md](docs/modding/ui-mods.md) | Datastore/event architecture, and the four shipped UI mods as case studies (portrait overrides, Nerobax preset, Perfect Setup, pit-crew auto-optimizer) |
| [logic-layers.md](docs/modding/logic-layers.md) | Spike results: where logic actually lives, the ~169 tunable Management/RaceSim assets, and a decision guide for which layer to use per goal |

## Quick facts

- Game at `C:\Program Files (x86)\Steam\steamapps\common\F1 Manager 2024`; containers are UE 5.1-era IoStore, AES-encrypted (dump the key with AESDumpster — not committed here).
- Mods load as `<Name>_P` paks in `F1Manager24\Content\Paks`; `zz_` prefix wins load order.
- The game reads DB/tuning content only at boot/career load, and saves only at save load — restart to test container changes; post-write save editing is safe.
- Extracted reference copies of the default DB and schema are committed under `fixtures/`.
