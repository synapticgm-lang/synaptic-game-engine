# Pack 26 — All-worlds Manus dump ingest (2026-08-17)

**Source:** Downloads `How Can SynapticGM Outperform Rivals in Memory and Consistency_ (branch) (4).zip`  
**Verbatim packs:** `docs/research/wof/pasted/all-worlds-manus-2026-08-17/`  
**Status:** Research ingest only. **Not live SynapticGM.** Do not copy into `src/` or `supabase/`. Do not auto-replace `wof/src/packs/` until John commissions a coding pass.

Manus delivered **23 world pack markdown files** + index + Theme Kits. HVAC cassette and live-game research in the same zip are ignored here.

## What we got

| Item | Result |
|------|--------|
| Worlds | All 23 requested slugs present |
| Dump titles | Ember Crown / Pactbeasts / Gloamwild **not** used as canon titles |
| Ash Compact locks | Factions, 4 races, 4 starts, 4 named 5-mans, Millstone Hollow 10-man kept |
| Reedfen beats | 18 authored (Pack 8 bar) |
| Bonded Menagerie fauna | 64 original creatures, 8-type chart, no P2P trade |
| Isekai Gate | Floors 1–8 named; Floor 1 full start |
| First-Song | 4 original peoples (not Compact relabels) |
| YAML companions | **None** — markdown tables only |
| Live import | None |

## Keep

- Frozen working names and one-engine / code-owns-dice rules.  
- Theme Kit table in `WOF_Shared_Engine_And_ThemeKits.md`.  
- Premade talk trees, choice decks, numeric quest rewards.  
- Anti-P2W two-wallet copy.  
- Cozy/idol/sport/romance use non-raid “big nights.”

## Dump / quality flags (do not lock)

1. **Ash Compact vs existing `wof/` code.** Pack rewrote first-hour titles (Lanternfolk first hour is now “The First Wick”; “Keep the Path Lit” is a Lampwood zone beat). Keep existing `quest_lanternfolk_race_1` ids in code until a merge pass.  
2. **First-Song “Gloam Court Siege”** — `Gloam` echoes quarantined Gloamwild. Rename before bible lock.  
3. **Bonded Menagerie `saltwind_keeper`** — too close to Saltkin (a Compact **race**). Rename kit.  
4. **Index vs pack mismatches:** Isekai module `hp_check_floor` vs `hp_check_floor_flags`; Bonded Menagerie big instance 5-person Fair vs 10-person Migration Night. Pack file wins until reconciled.  
5. **Cross-world “Lantern …” POIs** (Isekai Lantern Ward, Veil Watch Lantern Quay, Hearth Season Lantern Lane). Fine if namespaced by `worldId`; do not merge maps.  
6. **Badge Circuit** is the thinnest pack (~23KB). Treat as outline-plus until a fill pass.  
7. **Isekai ban-list** forbids “trapped MMO” / “The System” as slogans — good for IP; keep original diegetic OS name (`Gateglass` / Waymark), not live SynapticGM System chrome.  
8. No `WOF_*_data.yaml`. Ingest to `wof/` will need a typed conversion, not a copy.

## Do not do yet

- Do not replace `wof/src/packs/ashCompact.ts` from this dump without an id-merge.  
- Do not add these worlds to live New Game.  
- No second Manus prompt required unless John wants YAML/json schemas or Badge Circuit filled to Ash Compact depth.

## Next coding (when asked)

1. Diff Ash Compact pack vs `wof/src/packs/zones/` (keep locked ids, add missing beats / Divide walk / capitals).  
2. Add `bond_type` module stub + Bonded Menagerie fauna table (rename saltwind kit).  
3. Rename Gloam Court.  
4. Convert one world to `ZoneSlice` TypeScript as a template.
