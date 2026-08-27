# Pack 24 — PART_0 Executive ingest (WOF / multi-title, not live)

**Source:** John’s Downloads `PART_0_—_Executive.docx` (2026-08-17 21:24).  
**Verbatim extract:** `docs/research/pasted/memory-consistency-zip-2026-08-17/PART_0_Executive.docx.md`  
**Gloamwild dump from the same zip:** `docs/research/wof/pasted/gloamwild-zip-2026-08-17/`  
**Status:** research only. **Not a live SynapticGM change.** Do not import into `src/`, `supabase/`, prompts, settings, or saves.

The Word file is **not** the memory/consistency executive. It is a quarantined operating model for later online titles.

## Keep (agrees with existing WOF locks)

- Do not touch live SynapticGM source, stores, prompts, credentials, or player histories.  
- Shared services mean **protocol**, not shared balance or cross-title inventory.  
- Honest copy: do not call it an MMO until the capability is live and supported. Describe “solo,” “private co-op,” or “limited online region.”  
- SP first, then invite-only 1–4 co-op; auction / housing / public chat / live PvP are late gates.  
- Premium never buys combat power, catch rate, raid clears, quest completion, or ranked advantage.  
- Child mode: no public DMs, trade, or voice.  
- Kill switches for instances, chat, trade, auction, reward grant, title.readonly.

## Dump errors (do not adopt)

1. **Race/faction names used as regions.** Ember Crown’s 12 “regions” include Ash Compact, Tide Covenant, Stonevein, Hearthborn, Lanternfolk. Those are **factions / races**, not places. Places stay Reedfen, Lampwood, Brinewatch, Granite Stair (plus later authored zones).  
2. **New title family is not the current WOF build.** Ember Crown, Pactbeasts of the Lanternwild, Deepgate Accord, Salt Ledger, Sunloom Circuit, Lantern Run Company are dump inventions. Frozen working names: Ash Compact + Tide Covenant (factions); Hearthborn, Lanternfolk, Saltkin, Stonevein (races); Reedfen, Lampwood, Brinewatch, Granite Stair (starts).  
3. **Gloamwild** JSON in the zip is another invented shard. Quarantine only. Do not replace Ash Compact.  
4. **Pactbeasts collector MMO** is not the isolated `wof/` engine (HP-check, instanced 5-mans, no creature-collect combat).  
5. **`platform/` beside `wof/`** must not become a live-app import path. If a shared engine is ever built, it stays outside SynapticGM live trees.  
6. **Saltkin as a creature season** / Reedfen–Lampwood as collector biomes — dump remap. Saltkin is a **race**.  
7. Tide Covenant is a **faction**, not a region and not a race.

## What `wof/` already is

Ash Compact pack: four race starts, 36 local quests, four solo 5-mans. Capitals Ash Seat / Tidehold exist with no walk yet. Check: `npm run wof:check`.

Do **not** rebuild that pack as Ember Crown or Pactbeasts unless John explicitly retires the frozen names.

## If this brief is used later

Use it as an **ops / honesty / anti-P2W** checklist for a future WOF online slice. Do not use it as a world bible, region list, or creature-collect design. Current WOF MP research still wins: Tier 3 shared hubs + instanced combat; lockstep rounds; raid 10; friends-first finder; personal loot.
