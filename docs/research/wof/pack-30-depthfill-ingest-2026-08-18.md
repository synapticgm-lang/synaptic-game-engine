# Pack 30 — Depth-fill 28 worlds ingest (2026-08-18)

**Source:** `c:\Users\littl\Downloads\WOF (1).zip`  
**Verbatim:** `docs/research/wof/pasted/wof-depthfill-2026-08-18/`  
**Status:** Research ingest. **Not live SynapticGM.** Do not import into `src/` or auto-replace `wof/src/packs/`.

Better than the previous template zip: unique kits, YAML sidecars, PressBills that name real hubs, art briefs ≥80 words. Still a generator (`wof_depthfill_generate.py`). Treat as **typed catalogs**, not hand-authored novels.

---

## What landed (use this folder)

`depthfill/wof_depthfill/` — 28 worlds × (Pack + data.yaml + PressBill + ArtBriefs), plus:

- `WOF_Rules_Modules_NEW.yaml` — grit_wound, civic_rep, build_tick, depth_gauge, hide_voice, bond_mount, colossus_part, show_pose, heat_cover, lap_time, atelier_score, hospitality_tick, veil_glamour, liminal_steadfast
- `WOF_Homestead_Ring_Deed_Tables.yaml`
- `WOF_Shared_Interactable_Verbs.yaml` (12 verbs only — thin)
- `WOF_Eval_Probe_Book.md`
- `WOF_Art_Audio_MASTER_INDEX.md`

The nested `wof_release_bundle.zip` is the older shell dump. Ignore it.

---

## Quality

**Keep:** worldIds, kit names (Mail-Rigger / Boiler-Hand / etc.), hub names, instance names, wallet chrome, place graphs in YAML, module ledger fields, Homestead plot/deed tables, honest solo/private-co-op copy, no Hearth Ruin, Kite Isle inside Brasswake.

**Still generated:** every pack is ~4,200 words / 83 tables. NPC greet lines are the same sentence with the world name swapped. Ban-lists cycle ten IP titles through five suffixes. Art briefs repeat one paragraph with place/kit swapped. Click-tests share one expected sentence. Unique **labels**, shared **prose skeleton**.

Do not lock NPC dialogue as final VO. Do not generate store screenshots from these briefs without a human pass.

---

## Do we need more Manus?

**No more genre / world dumps.** 23 old skins + 28 new = family coverage is enough. Further Manus novels will not make a playable MMO.

What is still missing is **code and later production**, not research:

| Still needed | Kind | Manus? |
|--------------|------|--------|
| Pack loader + rules modules in `wof/` | CODE | No |
| Ash Compact id-merge (locked quests stay) | CODE | No |
| Instance server, lockstep, presence, mail, clock | CODE | No |
| Talk-tree runner, vendors, deeds | CODE | No |
| Store stills from briefs | ART later | Optional image model, not world-gen |
| Convert pack-26’s original 23 into the same YAML | CODE/data when shipping those DLC | Not now |
| AH, guild bank, contested PvP, ads, comic | SIDE | Hold |

Friends-alpha remains Reedfen + solo 5-man + presence. New worlds are buy-and-own catalogs on disk.

---

## Integrity (this dump)

- 28/28 filesets present. Courier/Maker/Scout/Warden gone.
- Compact frozen names not used as new-world kits.
- Dump titles unused. No live import.
