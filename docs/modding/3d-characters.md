# 3D Characters (podium scenes)

How the game builds the 3D people in cinematics, and what we've established about modding them. Motivating case: un-retired Vettel (StaffID 9) has no 3D model, and **the game skips the podium ceremony whenever a podium finisher has no bespoke model**.

## How a character is assembled

Everything hangs off data assets in `Characters/ModularCharacters/ModularCharactersData/` (container `pakchunk1_s3`):

| Asset | What it holds |
|---|---|
| `FixedStaff` (`StaffMeshAssignmentDataAsset`) | The 26 people with bespoke models: StaffID → Head / Hair / Helmet parts |
| `HeadPool` | ~20 male + 11 female generic heads, picked by `Staff_BasicData.FaceType` / `FaceIndex` for generated staff |
| `Driver` | Suit meshes (Suit01/Suit02, male/female) plus per-`EF1Team` suit and helmet materials, so the 3D suit follows the driver's current team automatically |

- Podium cinematics (`Cinematics/PostRace/Podiums/`) are generic pre-animated sequences with placeholder actors; finishers are slotted in.
- All heads, bespoke and generic, are `SkeletalMesh`es on the shared `Characters/ModularCharacters/Human_Male_Skeleton`. Face animation is a per-head `PoseAsset` (`PA_<Name>_FacePoses`) of bone poses on that skeleton.
- Vertex layouts differ between heads (e.g. Head01 LOD0 10,720 verts, Verstappen 12,417, Lawson 10,061), so a reshape has to keep whichever head it starts from.
- `FaceType` is an ethnicity group (0 = the northern European heads). Legends like Schumacher (258) and Barrichello (260) are `IsGeneratedStaff = 1` with a pool head; real drivers with bespoke models are `IsGeneratedStaff = 0` with NULL face fields.

## What gates the podium ceremony

**Membership in `FixedStaff`.** Giving Vettel Schumacher's pool-head setup (generated, FaceType 0, FaceIndex 13) did *not* bring the ceremony back. Re-keying an existing `FixedStaff` entry to StaffID 9 did — he appeared with that driver's head, hair and helmet.

### `FixedStaff` layout

Unversioned property serialization; the whole export is one `TMap<int32 StaffID, struct>` (26 entries). Each entry starts:

```
int32  StaffID
uint16 unversioned header   (bit 0x100 = last fragment, 0x80 = has zero mask)
uint8  zero mask            (only if header & 0x80)
int32  name length, then name + NUL   ("MaxVerstappen", "NyckdeVries", ...)
...    part references
```

`tools/head-spike/fixedstaff-rekey.js <chunk> <entryName> <fromID> <toID>` does the same-size re-key on the raw zen chunk (`f54ae2238c4db7be00000001` in `pakchunk1_s3`). Adding a *new* entry changes the export size and isn't attempted yet — re-keying a donor who's retired in the career is the working route.

## Editing meshes in place

Cooked position buffers are plain `float3` in cm, found by the int32 pattern `[12, N, 12, N]` followed by `N × 12` bytes; there's one per LOD (6 on a typical head). Moving vertices is a same-size edit, so it goes through the proven raw-chunk route in [game-files-and-tooling.md](game-files-and-tooling.md): `retoc unpack-raw` → edit chunk → `retoc pack-raw` → replace the container in place, originals in `PakBackup\`. Verified in game by pushing out the chest of both male suit torsos.

## Reshaping a donor head into someone else (Vettel, first attempt)

Vettel took over de Vries's `FixedStaff` entry, so reshaping and retexturing de Vries's head (`pakchunk1_s2`) in place makes it Vettel's, with no new assets. The pipeline scripts live in the gitignored `tools/head-spike/` for now:

1. **Read** every LOD of the cooked mesh: 16-bit index buffer immediately before the positions; after them 2 bytes of strip flags, `NumTexCoords, N, fullPrecUVs, highPrecTangents`, packed int8 tangents (`8, N, N × (TangentX, TangentZ)`), then half-float UVs (`4, N × NumTexCoords, …`). UV u-tiles separate materials: tile 0 is head skin, 1 the eyes, 4 the mouth interior. The triangle winding is clockwise seen from outside.
2. **Landmarks**: render the donor front-on, run MediaPipe Face Landmarker (478 points) on the render and map each point back to the mesh surface. Run it on the source photo too, and align the two with a 2D similarity transform on the rigid points (eye corners, nose bridge).
3. **Reshape**: per-landmark displacements, mirror-averaged for symmetry, with the eyes pinned because the eyeballs pivot on skeleton bones. A thin-plate RBF, anchored at zero on the back of the head, the neck and the ears (so helmet and suit still fit), is evaluated on every LOD. Each vertex's stored tangent frame is rotated by the change in its geometric normal.
4. **Texture**: bake the reshaped mesh into UV space, project the photo through the front camera, then mask it: face oval, cut at the brows, narrowed at the temples, extended over the beard, and faded on steep surfaces. Match colours in Lab: the photo's lightness level goes to the donor skin's, and the hue meets halfway. Re-encode BC1 with every mip (12, 5 of them in the bulk chunk), same size.
5. **Splice** into the raw chunks and `pack-raw`. Read it back with `to-legacy` and render it before installing; that's how a red/blue channel swap was caught before it reached the game.

The source photo was the game's own profile image (`S_Vettel_TN`): frontal and neutral, with the right beard. Wikimedia Commons had only one usable bearded frontal photo.

Caveats: `pack-raw` writes uncompressed (`pakchunk1_s3` goes from 632 MB to 1.5 GB), and Steam "Verify integrity of game files" reverts everything. A small standalone `_P` container would need a hand-written container header (chunk type 6) listing only the edited packages.
