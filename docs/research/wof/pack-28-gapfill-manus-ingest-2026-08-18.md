# Pack 28 — Manus branch (5) gap-fill ingest (2026-08-18)

**Source:** `How Can SynapticGM Outperform Rivals in Memory and Consistency_ (branch) (5).zip`  
**Verbatim:** `docs/research/wof/pasted/manus-branch5-2026-08-18/`  
**Status:** Research ingest only. **Not live SynapticGM.** Do not copy into `src/` or `supabase/`. Do not replace `wof/src/packs/` from this dump.

This zip is mixed. **Use the gap-fill library.** Ignore HVAC. Do not treat nested world packs as a bible refresh.

---

## What’s in the zip

| Bundle | Path | Use |
|--------|------|-----|
| Gap-fill library (this prompt’s deliverable) | `gap-fill/WOF_GapFill_Library/` | **Yes** — 19 files, all requested names present including optionals |
| World packs (re-dump of branch 4) | `world-packs/WOF_Content_Packs/` | **No overwrite** of pack 26. Still has `Gloam Court Siege` in the index |
| Live SynapticGM archive | `_IGNORE_live-app-archive/` | Already ingested earlier. Not WOF. |
| HVAC / cassette | `raw/` CAD, `.ino`, patent docs, `README.md` for the cassette | **Ignore.** Not this game. |

---

## Keep (after merge rules)

- Engine schema **names** (Account through SupportMacro) — useful as a checklist for later TypeScript types.
- Interactable verbs + prop templates + housing interiors as a **shared catalog** (text Place + props, not 3D).
- Vendor / gathering / recipe **shape** (personal stock copies, no power packs).
- Social / mail / error-copy / kill-switch / telemetry **lists**.
- Travel graph **idea**: `poi_the_divide` + ferry/coach edges. Additive; capitals stay `poi_ash_seat` / `poi_tidehold`.
- Locked **race quest ids 1–3** exist; titles for hour-one race quests match code (`The Hearthborn's Request`, `Keep the Path Lit`, `The Flats Are Wrong`, `The Stair Has a Crack`).
- Badge Circuit **fill file** (Morrowglass civic patrol) — deeper than the thin pack 26 file. Merge as WOF-only; do not put into live.
- Optional: lore readables, memorable text plates, audio cue **ids**.

**Canonical rename (until John picks otherwise):** use `WOF_Rename_Table.md` only:

| Old | Locked new |
|-----|------------|
| Gloam Court Siege | `first_song_courtfall` / **Courtfall at Vespermere** |
| saltwind_keeper | `brineveil_curator` / **Brineveil Curator** |
| hp_check_floor | `hp_check_floor_flags` |
| The First Wick | rejected; keep **Keep the Path Lit** |

---

## Dump flags — do not lock

1. **Three Gloam replacements in one dump.** Rename table = Courtfall at Vespermere. Ash Compact yaml = Lantern Court Breach. Skin deltas = The Cinder-Court Break **and** treats First-Song as a music/house skin (wrong genre). Lock the rename table; discard the other two names.

2. **Three saltwind replacements.** Rename table = `brineveil_curator`. Ash Compact yaml = `brineward_keeper`. Lock the rename table.

3. **Ash Compact typed YAML rewrote locked quests.** Code `quest_hearthborn_race_1` is visit marsh + kill 3 hatchlings + deliver scale to `npc_hearthborn_elder` (gold 100). Dump is talk `elder_mara` + deliver `seed_pouch` (gold 12). **Do not overwrite `wof/src/packs`.**

4. **Locked profession/zone ids missing.** Dump invented `quest_zone_1`, `quest_lanternfolk_miller_*`, `quest_saltkin_miller_*`, `quest_stonevein_miller_*`. Code still owns `quest_reedfen_zone_*`, `quest_wick_*`, `quest_lampwood_zone_*`, `quest_fisher_*`, `quest_brinewatch_zone_*`, `quest_smith_*`, `quest_granite_zone_*`. INDEX’s “72 locked quest records” is false (~36 dump rows, many wrong ids).

5. **NPC / item id drift.** `elder_mara` vs `npc_hearthborn_elder`; `hearthborn_starter_weapon` vs `item_hearthborn_knife`. Merge by locked code ids.

6. **Badge Circuit two maps.** Pack 26: Cinder Block / Bridge Ward / Beacon Market / Drift Park. Fill file: Morrowglass / northline_market / civic_hall_north. Pick fill-or-old before coding; do not ship both.

7. **Skin deltas raid column is wrong for several combat worlds** (Starwake / Lanceyard / First-Song marked “no raid 10” while pack 26 still has 10-man instances). Housing labels for First-Song (chorus house) are Stage Light contamination.

8. **Engine schemas are wide but shallow** — many entities share the same generic field anchors. Use as a name list, not as drop-in validators.

9. Nested `WOF_AllWorlds_INDEX.md` still lists `hp_check_floor` and Gloam Court Siege. Ignore that index; pack 26 + this rename table win.

---

## Do not do yet

- Do not replace `wof/src/packs/ashCompact.ts` or zone files from `WOF_AshCompact_LockedIds_Typed.yaml`.
- Do not import HVAC, live continuity briefs, or comic-mode files from this zip.
- No second world-novel prompt. No live New Game worlds.

---

## Next coding (when asked)

1. Keep locked ids in `wof/`. Add `poi_the_divide` + exits only.  
2. Import interactable/housing **catalogs** as new `wof/` types — remap NPC/item ids to code.  
3. Apply rename table (Courtfall / brineveil / floor_flags).  
4. Badge Circuit: one map, then typed pack.  
5. Friends alpha remains Reedfen loop + solo 5-man + presence. Housing/AH data exists; still later gates.
