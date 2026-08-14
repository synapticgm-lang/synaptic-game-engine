# Pack 8 — Authored faction-world intel brief (2026-08-14)

**Status:** Research request. Do not implement. Fill sub-packs 8a–8f as dumps arrive.  
**Goal:** Later-release authored world: original races, starting zones, quest lines, optional other players.  
**Rule:** Code owns Place / quest / loot / dungeon seed; LLM narrates. Do not LLM-generate continents.

Companion canvas: `authored-world-research-brief.canvas.tsx` (same briefing beside chat).

---

## IP lock (races and places)

**Our world content is original.** Research may use **public design knowledge** (quest graphs, hub-and-spoke, starting-zone size, instancing). It may **not** import another game’s licensed races, factions, place names, unique creatures, or lore.

| Allowed | Forbidden as our content |
|---------|--------------------------|
| Public-domain folklore types as **inspiration** (human, elf, dwarf, giant) with original cultures, names, and homelands | Blizzard / Warcraft names: races, factions, zones, cities, NPCs, creatures, artifacts |
| Original working names below (replace when John names the setting) | Copying another title’s unique toponyms or race kits (e.g. other MMO starter maps used as ours) |
| Published design talks as **method** (POI-first, empty log feels empty, newbie zone ≠ capital) | Dumping that talk’s setting as our map |
| Patterns: hub + breadcrumb, instanced dungeon vs shared street | Phasing, branded UI, or a clone of a licensed zone layout |

Dumps that name licensed places or races as SynapticGM content get rejected and rewritten.

### Working names (original placeholders — not final lore)

Use these in schemas and examples until the real setting is named. Do not map them 1:1 onto any licensed starter set.

| Role | Placeholder |
|------|-------------|
| Factions | **Ash Compact** · **Tide Covenant** |
| Races (2 / faction) | Compact: **Hearthborn**, **Lanternfolk** · Covenant: **Saltkin**, **Stonevein** |
| Starting zones | **Reedfen** · **Lampwood** · **Brinewatch** · **Granite Stair** |
| Zone hubs | **Millcross** · **Wickhaven** · **Coil Pier** · **Anvil Gate** |
| Capitals | **Ash Seat** · **Tidehold** |
| Shared mid-zone (later) | **The Divide** |

Folklore ancestry (if used) is a **trait note**, not a licensed kit. Example: Hearthborn may read as human-analog; they are not “the Human racial.”

---

## Do we need this now?

No for the live playtest loop. Packs 1–7 are enough to ship the solo game.

Yes as **intel gathering** so a later world-scale wave does not start from zero.

---

## Locked (do not re-open)

| Decision | Source |
|----------|--------|
| Code owns dice, HP, rarity, hidden dungeon truth, quest state | Pack 2 + master plan |
| LLM narrates; no invent tiers/stats/loot/quest titles | Pack 2 |
| Place is single authority for name + dangerTier + mapScale | Pack 5 |
| Outdoor = street pins; dungeon = node graph | Pack 4 |
| Hidden quests omitted from GM context | Pack 5 |
| Memory = structured + short prose, not raw chat | Pack 6 |
| F&F-style “LLM updates inventory/location” is a failure | Competitor note |
| Races and places are original / public-domain folklore only | This pack — IP lock |

---

## Already owned (extend, don’t replace)

| System | Today | World-scale extension |
|--------|--------|------------------------|
| `PlaceRecord` | name, aliases, dangerTier, mapScale, dungeonRef, arc | `parentPlaceId`, `zoneId`, hub flag, travel edges |
| `Quest` | main/side/faction + locationRef + turn gaps | `questLineId`, DAG edges, race/faction gates |
| `dungeonSeed` | per-enter hidden ledger | Stay **instanced**; never share seed across players |
| `worldLedger` | clock, caravans, actors, hostiles (on save) | Server copy only if presence ≥ async traces |
| Lore cards | npc/location/item/quest/**faction**/lore | Original race kits + zone bibles as typed cards |
| Pack 3 beat sheet | first-hour solo | Per-race starting-zone variants of the same beats |

---

## Product shape (research should confirm, not invent)

**Authored skeleton + LLM fill.** Large overworlds hold together when POIs and quests are hand-placed. Randomized or LLM-invented continents fight Place authority (see AI Dungeon drift).

**Place vs Setting (public pattern, Failbetter / StoryNexus):** Place = where you stand. Setting = which rules apply (street vs dungeon vs heist). Two players can share `place_millcross` without sharing a dungeon seed or NPC outcome. Do not copy Fallen London’s named districts.

**Presence is a ladder, not a boolean.** Research Pack 8d must recommend a cap.

| Tier | Name | Ship when |
|------|------|-----------|
| 0 | Solo authored world | Content wave (no other players) |
| 1 | Async traces | First “shared” release |
| 2 | Party 2–6, one scene | Co-op (F&F shape; our rules engine) |
| 3 | Shared hubs, instanced dungeons | Long bet |
| 4 | Contested MMO (PvP, market, tag) | Defer until 3 is cheap |

---

## MVP skeleton to stress-test in every dump

Use these counts. Argue them up/down with evidence; don’t ignore them. Examples use the working names above.

| Slice | Count | Rationale |
|-------|-------|-----------|
| Factions | 2 (Ash Compact / Tide Covenant) | Identity + reputation; not 12 splinters |
| Races | 4 (2 / faction) | Enough identity; more races multiply quest variants |
| Starting zones | 4 | One per race; merge at Ash Seat and Tidehold |
| POIs / starting zone | 6–10 | Public MMO practice: plan POIs first, then quest types |
| Authored quests / zone | 18–25 **beats** | Published alphas: a dozen unchained quests in a first zone felt empty; text is slower so fewer, longer chains |
| Hubs | 1 / zone + 2 capitals | Newbie zone is **not** the capital |
| Dungeons | 1 micro / start + 1 shared | Keep seeded instances |
| Shared mid-zone | The Divide (later) | First place factions can notice each other |

Public design talk (Pardo / AGC 2006, method only): the starting experience is not “find your way out of a huge city.”

---

## Sub-packs to fill

Dump each as `pack-NN-slug-YYYY-MM-DD.md` with: comparison table, copy/avoid, schema, failures, SynapticGM bar. **No licensed race or place names in schemas or examples.**

### Pack 8a — Zone graph + travel (P0)

**Questions**
1. Is `parentPlaceId` enough for continent → region → zone → hub → POI, or do we need a `Zone` record?
2. Travel = graph edge with cost (turns and/or world clock). What costs feel like travel in text?
3. Fast travel = unlocked edges. When does a route unlock?
4. How many named Places per starting zone before text feels empty vs noisy?
5. Evennia lesson: graph of rooms is flexible; spawning every tile is wrong for us. Confirm street-pin model stays the overworld.

**Sources:** public MMO design talks on newbie-zone scale (method, not maps); [Evennia XYZgrid](https://www.evennia.com/docs/1.x/Contribs/Contrib-XYZGrid.html); Pack 4.

**Schema to propose:** `Zone`, `TravelEdge { fromPlaceId, toPlaceId, costTurns, costClock, unlockQuestId? }`.  
**Example IDs:** `zone_reedfen`, `place_millcross`, `place_ash_seat`.

### Pack 8b — Race / faction kits (P0)

**Questions**
1. Race kit fields: `id, factionId, startingZoneId, traits[] (code), naming, voiceNotes (GM), tutorialBeatOverrides`.
2. How much quest content is race-gated vs faction-gated vs shared + voice overlay?
3. Minimum races before identity feels fake? Maximum before content explodes?
4. Racial traits: combat code, exploration flags, or lore-only?
5. Character create: race pick **sets starting Place ID** in code; LLM does not choose the spawn.
6. If folklore analogs are used (human/elf/dwarf), what original culture notes stop them being a licensed clone?

**Sources:** general “starter map + capital unlock” structure (FFXIV / GW2 as **flow**, not their cities); original kits in the working-name table. Do not list another game’s races as ours.

### Pack 8c — Quest-line DAGs (P0)

**Questions**
1. Hub-and-spoke + breadcrumb vs hunt-for-quests. For text, recommend hub + breadcrumb (player should not search empty rooms).
2. Zone story DAG: `questLine { id, zoneId, raceGate?, factionGate?, questIds[], breadcrumbToZoneId? }`.
3. Beats vs full dialogue: what is authored (objective, NPC id, Place ref, reward, next ids)? What may the LLM fill?
4. Dungeon quest as **instance gate** (code), not a GM teleport.
5. Repeatables: none / daily clock / per-player. Default for MVP?
6. Two players, same hub NPC, presence tier 3: who owns NPC state?

**Sources:** Pack 5; public commentary on quest density and hub flow as **method** (empty log = empty world → chains of beats, not thousands of unique prose quests). Do not import another game’s quest names or NPCs.

### Pack 8d — Presence ladder (P0, product cap)

**Questions**
1. Recommend cap: 1, 2, or 3 for first shared release.
2. Narration model: per-player GM reading shared Place facts vs one GM for the room.
3. LLM cost: N players in a hub × turns. What is affordable?
4. Place vs Setting: do we add `settingId`?
5. Combat: tagging, loot, flee — only if cap ≥ 2.
6. Chat vs shared prose. Griefing. Can a player delete a hub NPC for others?
7. F&F is **party**, not a massively shared overworld. Text MUDs are presence. StoryNexus-style games are **solo in a shared setting**.

**Sources:** [F&F How Franz works](https://fables.gg/blog/how-franz-works); [StoryNexus area vs setting](https://troygilbert.com/modeling-games/thoughts-on-storynexus/) (pattern only).

**Copy:** F&F Working Context idea (already our situation packet).  
**Avoid:** F&F LLM post-process for HP/inventory/location.

### Pack 8e — Content pipeline (P1)

**Questions**
1. Zone bible format: POI list, quest-type mix, hub NPCs, dungeon ref, breadcrumb — all original names.
2. Authoring tool: markdown/YAML in repo vs in-game builder vs creator-atlas style.
3. How much of a starting zone is hand-placed vs LLM-fill vs code? Target mix: **45 / 30 / 25**.
4. Cross-race reuse: same POI, different beat text vs same beats, different voice.
5. Who may add a Place at runtime? Recommend: designer graph is authority; LLM may only fill description on first visit inside an existing Place ID.
6. Prompt/GM bible: explicit ban-list of licensed names so the model does not “helpfully” drop them in.

### Pack 8f — Shared sim / economy (P2, only if cap ≥ 3)

**Questions**
1. Lift `worldLedger` to server? Who ticks the clock if no one is online?
2. Markets: per-player salvage (today) vs hub trader vs player market.
3. Resource nodes: code-owned, like dungeon loot, or shared deplete?
4. Skip entirely if Pack 8d caps at 1–2.

---

## Dump format (every sub-pack)

```
# Pack NN — title (date)
Status / scope
## 0) IP check  (no licensed races/places in this dump)
## 1) Comparison  (table: Pattern | Source | Copy/avoid)
## 2) One authority rule
## 3) Schema
## 4) Failures
## 5) SynapticGM bar
## 6) Open product decisions for John
```

Do not dump licensed lore bibles. Do not dump 3D pipeline notes. Do not propose replacing Place/Quest/dungeonSeed.

---

## Do not research

- Any licensed setting’s races, factions, or maps as ours
- Race models, transmog, instance-phasing clones
- Raid encounters
- LLM-generated continents
- True real-time massively-shared simulation as v1

---

## Gather order

1. 8a Zone graph  
2. 8b Race kits (original names)  
3. 8c Quest DAGs  
4. 8d Presence cap (stop or continue)  
5. 8e Pipeline + licensed-name ban in GM bible  
6. 8f Shared sim (only if cap ≥ 3)
