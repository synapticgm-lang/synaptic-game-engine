# WOF Pack 8 — Authored faction-world intel brief (2026-08-14)

**Project:** WOF (World of Fantasy) — **not live SynapticGM**. Do not implement into `src/` or `supabase/`.  
**Status:** Research request. Fill sub-packs 8a–8f as dumps arrive.  
**Goal:** Later-release authored world: original races, starting zones, quest lines.  
**Rule:** Code owns Place / quest / loot / dungeon seed; LLM narrates. Do not LLM-generate continents.

Multiplayer dungeons/raids: [pack-09](./pack-09-text-multiplayer-dungeons-raids-2026-08-14.md).  
Companion canvas: `authored-world-research-brief.canvas.tsx`.

---

## IP lock (races and places)

**WOF world content is original.** Research may use **public design knowledge** (quest graphs, hub-and-spoke, starting-zone size, instancing). It may **not** import another game’s licensed races, factions, place names, unique creatures, or lore.

| Allowed | Forbidden as WOF content |
|---------|--------------------------|
| Public-domain folklore types as **inspiration** (human, elf, dwarf, giant) with original cultures, names, and homelands | Blizzard / Warcraft names: races, factions, zones, cities, NPCs, creatures, artifacts |
| Original working names below (replace when John names the setting) | Copying another title’s unique toponyms or race kits |
| Published design talks as **method** (POI-first, empty log feels empty, newbie zone ≠ capital) | Dumping that talk’s setting as our map |
| Patterns: hub + breadcrumb, instanced dungeon vs shared street | Phasing, branded UI, or a clone of a licensed zone layout |

Dumps that name licensed places or races as WOF content get rejected and rewritten.

### Working names (original placeholders — not final lore)

| Role | Placeholder |
|------|-------------|
| Factions | **Ash Compact** · **Tide Covenant** |
| Races (2 / faction) | Compact: **Hearthborn**, **Lanternfolk** · Covenant: **Saltkin**, **Stonevein** |
| Starting zones | **Reedfen** · **Lampwood** · **Brinewatch** · **Granite Stair** |
| Zone hubs | **Millcross** · **Wickhaven** · **Coil Pier** · **Anvil Gate** |
| Capitals | **Ash Seat** · **Tidehold** |
| Shared mid-zone (later) | **The Divide** |

Folklore ancestry (if used) is a **trait note**, not a licensed kit.

---

## Locked (do not re-open)

| Decision | Source |
|----------|--------|
| Code owns dice, HP, rarity, hidden dungeon truth, quest state | Live Pack 2 (method only; do not patch live) |
| LLM narrates; no invent tiers/stats/loot/quest titles | Live Pack 2 |
| Place is single authority for name + dangerTier + mapScale | Live Pack 5 |
| Outdoor = street pins; dungeon = node graph | Live Pack 4 |
| Races and places are original / public-domain folklore only | This pack — IP lock |
| WOF never ships inside live SynapticGM | `.cursor/rules/wof-sandbox.mdc` |

---

## Product shape

**Authored skeleton + LLM fill.** Randomized continents fight Place authority.

**Place vs Setting:** Place = where you stand. Setting = which rules apply. Two players can share `place_millcross` without sharing a dungeon seed. Do not copy another game’s districts.

**Presence ladder** (overworld). Dungeon/raid instances are Pack 9.

| Tier | Name | Ship when |
|------|------|-----------|
| 0 | Solo authored world | Content wave |
| 1 | Async traces | First “shared” release |
| 2 | Party 2–5, one scene | Co-op |
| 3 | Shared hubs, instanced dungeons | After Pack 9 dungeon answers |
| 4 | Contested overworld | Defer |

---

## MVP skeleton

| Slice | Count |
|-------|-------|
| Factions | 2 (Ash Compact / Tide Covenant) |
| Races | 4 (2 / faction) |
| Starting zones | 4 → merge at Ash Seat and Tidehold |
| POIs / starting zone | 6–10 |
| Authored quests / zone | 18–25 beats |
| Hubs | 1 / zone + 2 capitals (newbie zone ≠ capital) |
| Micro-dungeons | 1 / start (solo seed until Pack 9 party instance) |

---

## Sub-packs to fill

Dump under `docs/research/wof/` with IP check. No licensed names in schemas.

- **8a** Zone graph + travel edges  
- **8b** Original race / faction kits  
- **8c** Quest-line DAGs  
- **8d** Overworld presence cap  
- **8e** Content pipeline + licensed-name ban in GM bible  
- **8f** Shared sim / economy (only if 8d cap ≥ 3)

See previous pack-08 body for questions. **Raids and party dungeons → Pack 9, not 8f.**

## Dump format

```
# WOF Pack NN — title (date)
## 0) IP check
## 1) Comparison (Pattern | Source | Copy/avoid)
## 2) One authority rule
## 3) Schema
## 4) Failures
## 5) WOF bar
## 6) Open decisions for John
```
