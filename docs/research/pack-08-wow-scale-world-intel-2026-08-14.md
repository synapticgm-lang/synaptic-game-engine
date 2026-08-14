# Pack 8 — WoW-scale text world intel brief (2026-08-14)

**Status:** Research request. Do not implement. Fill sub-packs 8–13 as dumps arrive.  
**Goal:** Later-release authored world: races, starting zones, quest lines, optional other players.  
**Rule:** Code owns Place / quest / loot / dungeon seed; LLM narrates. Do not LLM-generate continents.

Companion canvas: later-release briefing beside chat.

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

---

## Already owned (extend, don’t replace)

| System | Today | World-scale extension |
|--------|--------|------------------------|
| `PlaceRecord` | name, aliases, dangerTier, mapScale, dungeonRef, arc | `parentPlaceId`, `zoneId`, hub flag, travel edges |
| `Quest` | main/side/faction + locationRef + turn gaps | `questLineId`, DAG edges, race/faction gates |
| `dungeonSeed` | per-enter hidden ledger | Stay **instanced**; never share seed across players |
| `worldLedger` | clock, caravans, actors, hostiles (on save) | Server copy only if presence ≥ async traces |
| Lore cards | npc/location/item/quest/**faction**/lore | Race kits + zone bibles as typed cards |
| Pack 3 beat sheet | first-hour solo | Per-race starting-zone variants of the same beats |

---

## Product shape (research should confirm, not invent)

**Authored skeleton + LLM fill.** WoW shipped because POIs and quests were hand-placed (Kaplan: they were not going to ship user-gen or randomized overworld). AI Dungeon-style world-gen will fight Place authority.

**Fallen London split to evaluate:** Place = where you stand. Setting = which rules apply (city vs dungeon vs heist). Two players can share a Place ID without sharing a Setting.

**Presence is a ladder, not a boolean.** Research Pack 11 must recommend a cap.

| Tier | Name | Ship when |
|------|------|-----------|
| 0 | Solo authored world | Content wave (no other players) |
| 1 | Async traces | First “shared” release |
| 2 | Party 2–6, one scene | Co-op (F&F shape; our rules engine) |
| 3 | Shared hubs, instanced dungeons | Long bet |
| 4 | Contested MMO (PvP, AH, tag) | Defer until 3 is cheap |

---

## MVP skeleton to stress-test in every dump

Use these counts. Argue them up/down with evidence; don’t ignore them.

| Slice | Count | Rationale |
|-------|-------|-----------|
| Factions | 2 | Identity + reputation; not 12 splinters |
| Races | 4 (2 / faction) | Vanilla WoW launched 8; text identity is cheaper, quest variants multiply |
| Starting zones | 4 | One per race; merge at 2 capitals |
| POIs / starting zone | 6–10 | Pardo: plan POIs first, then quest types |
| Authored quests / zone | 18–25 **beats** | Kaplan: ~12 Elwynn quests felt empty; text is slower so fewer, longer |
| Hubs | 1 / zone + 2 capitals | Newbie zone is **not** the capital |
| Dungeons | 1 micro / start + 1 shared | Keep seeded instances |
| Shared mid-zone | 1 later | First place factions can notice each other |

Pardo (AGC 2006): starting experience is not “find your way out of a huge city.”

---

## Sub-packs to fill

Dump each as `pack-NN-slug-YYYY-MM-DD.md` with: comparison table, copy/avoid, schema, failures, SynapticGM bar.

### Pack 8a — Zone graph + travel (P0)

**Questions**
1. Is `parentPlaceId` enough for continent → region → zone → hub → POI, or do we need a `Zone` record?
2. Travel = graph edge with cost (turns and/or world clock). What costs feel like travel in text?
3. Fast travel = unlocked edges, not flight models. When does a flight path unlock?
4. How many named Places per starting zone before text feels empty vs noisy?
5. Evennia lesson: graph of rooms is flexible; spawning every tile is wrong for us. Confirm street-pin model stays the overworld.

**Sources:** [Pardo AGC](https://www.raphkoster.com/2006/09/06/agc-rob-pardos-keynote/), [Evennia XYZgrid](https://www.evennia.com/docs/1.x/Contribs/Contrib-XYZGrid.html), Pack 4.

**Schema to propose:** `Zone`, `TravelEdge { fromPlaceId, toPlaceId, costTurns, costClock, unlockQuestId? }`.

### Pack 8b — Race / faction kits (P0)

**Questions**
1. Race kit fields: `id, factionId, startingZoneId, traits[] (code), naming, voiceNotes (GM), tutorialBeatOverrides`.
2. How much quest content is race-gated vs faction-gated vs shared + voice overlay?
3. Minimum races before identity feels fake? Maximum before content explodes?
4. Racial traits: combat code, exploration flags, or lore-only?
5. Character create: race pick **sets starting Place ID** in code; LLM does not choose the spawn.

**Sources:** vanilla race/starting-zone pairs (Elwynn, Durotar, Teldrassil, Mulgore as **structure**, not IP), FFXIV starting cities, GW2 personal story vs starter maps.

### Pack 8c — Quest-line DAGs (P0)

**Questions**
1. Hub-and-spoke (TBC+) vs vanilla hunt-for-quests. For text, recommend hub + breadcrumb (player should not search empty rooms).
2. Zone story DAG: `questLine { id, zoneId, raceGate?, factionGate?, questIds[], breadcrumbToZoneId? }`.
3. Beats vs full dialogue: what is authored (objective, NPC id, Place ref, reward, next ids)? What may the LLM fill?
4. Dungeon quest as **instance gate** (code), not a GM teleport.
5. Repeatables: none / daily clock / per-player. Default for MVP?
6. Two players, same hub NPC, presence tier 3: who owns NPC state?

**Sources:** [Kaplan / Kotaku on chains](https://kotaku.com/how-world-of-warcrafts-quests-came-to-be-1826372544), [Kaplan GDC cruise director](https://www.engadget.com/2009-03-27-kaplan-on-being-the-cruise-director-of-azeroth-at-gdc-09.html), [vanilla vs TBC flow](https://massivelyop.com/2025/09/12/casually-classic-the-quest-design-that-world-of-warcraft-kind-of-forgot/), Pack 5.

**Failure to copy:** empty quest log = empty world (they 4×’d quest count vs EverQuest target). For us that means **chains of beats**, not 2600 unique prose quests.

### Pack 8d — Presence ladder (P0, product cap)

**Questions**
1. Recommend cap: 1, 2, or 3 for first shared release.
2. Narration model: per-player GM reading shared Place facts vs one GM for the room.
3. LLM cost: N players in a hub × turns. What is affordable?
4. Place vs Setting: do we add `settingId`?
5. Combat: tagging, loot, flee — only if cap ≥ 2.
6. Chat vs shared prose. Griefing. Can a player delete a hub NPC for others?
7. F&F is **party**, not MMO. Iron Realms / Gemstone are text presence. Fallen London is **solo in a shared setting**.

**Sources:** [F&F How Franz works](https://fables.gg/blog/how-franz-works), [Fallen London Settings](https://fallenlondon.wiki/wiki/Settings), [StoryNexus area vs setting](https://troygilbert.com/modeling-games/thoughts-on-storynexus/).

**Copy:** F&F Working Context idea (already our situation packet).  
**Avoid:** F&F LLM post-process for HP/inventory/location.

### Pack 8e — Content pipeline (P1)

**Questions**
1. Zone bible format: POI list, quest-type mix, hub NPCs, dungeon ref, breadcrumb.
2. Authoring tool: markdown/YAML in repo vs in-game builder vs Hidden Door Atlas-like.
3. How much of a starting zone is hand-placed vs LLM-fill vs code? Target mix: **45 / 30 / 25**.
4. Cross-race reuse: same POI, different beat text vs same beats, different voice.
5. Who may add a Place at runtime? (Player naming a street vs designer graph.) Recommend: designer graph is authority; LLM may only fill description on first visit inside an existing Place ID.

### Pack 8f — Shared sim / economy (P2, only if cap ≥ 3)

**Questions**
1. Lift `worldLedger` to server? Who ticks the clock if no one is online?
2. Markets: per-player salvage (today) vs hub trader vs auction.
3. Resource nodes: code-owned, like dungeon loot, or shared deplete?
4. Skip entirely if Pack 8d caps at 1–2.

---

## Dump format (every sub-pack)

```
# Pack NN — title (date)
Status / scope
## 1) Comparison  (table: Pattern | Source | Copy/avoid)
## 2) One authority rule
## 3) Schema
## 4) Failures
## 5) SynapticGM bar
## 6) Open product decisions for John
```

Do not dump raw Azeroth lore. Do not dump 3D pipeline notes. Do not propose replacing Place/Quest/dungeonSeed.

---

## Do not research

- Warcraft IP / full lore bible
- Race models, transmog, retail phasing
- Raid encounters
- LLM-generated continents
- True real-time MMO simulation as v1

---

## Gather order

1. 8a Zone graph  
2. 8b Race kits  
3. 8c Quest DAGs  
4. 8d Presence cap (stop or continue)  
5. 8e Pipeline  
6. 8f Shared sim (only if cap ≥ 3)
