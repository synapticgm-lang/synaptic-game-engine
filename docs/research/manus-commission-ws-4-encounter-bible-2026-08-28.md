# Manus Research Commission: WS-4 Encounter Bible Design (2026-08-28)

**Commission ID:** WS-4  
**Priority:** P0 (Path A Wave 2 support)  
**Commissioned by:** John  
**Research type:** Content design specification + template library  
**Estimated research timeline:** 5-7 days  
**Status:** Awaiting authorization

---

## Executive Summary

### The Problem

Combat and encounters currently feel generic and never resolve properly, creating 290-turn combat purgatory that players cannot escape. Gemini LitRPG review s18 shows combat spawning at T9 but player stuck in Try to flee ×364 / Parley ×337 loops with zero resolution receipts in 300 turns. Players experience:

- **Generic encounters** ("a skirmisher appears" with no context)
- **No telegraph** (enemy intent unclear before engagement)
- **Missing resolution** (flee doesn't flee, combat doesn't end, parley doesn't work)
- **No aftermath** (encounter just stops, no consequence or loot)
- **Wrong-bible spawns** (Keep Wraith on Shattered Coast, drought uses wrong tables)

Current `encounterResolution` exists but downstream of GM passivity — can spawn encounter but cannot force resolution. No **encounter bible** with genre-appropriate templates (LitRPG boss, DnD trap, RPG standoff, PYOA crisis).

### Target State

Per-bible encounter libraries (5-8 templates per mode) with full lifecycle governance:

- **Telegraph phase:** Warning signs, STATUS alerts, NPC hints before engagement
- **Stakes phase:** Clear win/lose/flee/negotiate outcomes with consequences
- **Resolution phase:** Deterministic mechanics (HP ledger, skill checks, leverage commits)
- **Aftermath phase:** Receipts (XP, loot, faction delta, quest stage, NPC reaction)
- **Integration:** Wires into ArcDirector pre-GM commits + encounterTerminalFsm + qualityGovernance

### Success Metrics

|| Metric | Current (27w) | Target (Post-WS-4) |
|---|---|---|---|
| **Encounter resolution** | 0 receipts in 300t all modes | 100% encounters resolve with receipt |
| **Telegraph presence** | Generic "a foe" spawn | 80%+ encounters show telegraph (warning, STATUS, NPC hint) |
| **Aftermath receipts** | Combat just ends | XP + loot + faction delta + quest tick |
| **Wrong-bible spawns** | Keep Wraith on Saltmar | 0 wrong-bible spawns (biome-appropriate only) |
| **Gemini encounter score** | ~1-2/10 (combat purgatory) | ~6-8/10 (genre-appropriate, resolves) |

---

## Problem Statement

### Player Evidence (Strong)

**Gemini LitRPG s18 (Summoned Pact worst cell):**
- Combat spawns T9 but never resolves
- Try to flee ×364 (flee choice present but doesn't flee)
- Parley ×337 (negotiate choice present but doesn't negotiate)
- Combat runs T9–T300 (290 turns stuck)
- Zero resolution receipts: no HP ledger persist, no flee succeed, no parley resolve
- **Gemini verdict:** "Combat purgatory; Free retention NO"

**Gemini DnD s69 (Cursed Keep):**
- Zero combat in 300 turns (no encounters spawn despite dungeon setting)
- No trap hazards (Keep exploration feels empty)
- No skill checks (DnD dice/risk feel missing)
- **Gemini verdict:** "Passive GM; no encounter mechanics; 2/10"

**Gemini RPG s137 (Cape District):**
- Walk Away pads 240-260× (no non-combat crisis resolution)
- Leverage topics loop (same threat works forever, no consequence)
- No social standoffs (confrontation → pad loop, not consequence)
- **Gemini verdict:** "Pad loops; leverage broken; 1/10"

**Gemini PYOA s188 (Thornferry):**
- Millstone Charter crisis 288× (no fork locks, no endings)
- Crisis receipts exist (3×) but no branch persistence
- **Gemini verdict:** "Theater branching; no endings; 2/10"

### Current State (Partial Implementation)

**What exists (28a-29b):**
- `encounterTerminalFsm.ts`: Encounter spawn + cooldown (28a-29b)
- `encounterResolution.ts`: Ledger-first combat HP tracking (29b)
- `dungeonMobLedger.ts`: Dungeon mob counts + cleared nodes (29e)
- `arcDirector.ts`: Drought pressure (spawn encounter at T15 if no combat)
- `choiceCompiler.ts`: Legal choice edges from current state

**What's missing:**
- ❌ **Encounter bible** (genre-appropriate templates per mode)
- ❌ **Telegraph patterns** (warning signs before engagement)
- ❌ **Stakes clarity** (what happens if you win/lose/flee/negotiate)
- ❌ **Aftermath receipts** (XP + loot tables + faction delta + quest tick)
- ❌ **Biome-appropriate spawns** (no Keep Wraith on Shattered Coast)
- ❌ **Density targets** (how many trash/elite/boss per 100t or per dungeon)

### Why Now (Urgency)

- **Path A Wave 2:** Encounter bible feeds BeatContract registry (B008) for pre-GM commits
- **Player pain:** Gemini explicitly scores combat ~1/10 across all modes (combat purgatory, passive GM)
- **Genre expectations:** LitRPG needs boss fights, DnD needs traps/hazards, RPG needs standoffs
- **Retention risk:** Combat that never ends or never spawns = immediate churn

---

## Target State Vision

### 1. Encounter Templates (5-8 per Mode)

Each template has **four phases**:

| Phase | Purpose | Example (LitRPG Hub Ambush) |
|-------|---------|------------------------------|
| **Telegraph** | Warning signs before engagement | STATUS: "Pact-Hunter nearby"; NPC: "Watch your back"; Scene: "shadows move" |
| **Stakes** | Clear outcomes + consequences | Win = XP/loot; Flee = wounded; Lose = respawn; Negotiate = faction deal |
| **Resolution** | Deterministic mechanics | HP ledger: enemy HP, PC damage, flee check, leverage cost |
| **Aftermath** | Receipts + world change | XP +25, loot drop, faction delta -10, quest tick, NPC reaction |

**Template categories:**

| Mode | Template Types (5-8 each) |
|------|---------------------------|
| **LitRPG** | Hub ambush, dungeon trash, miniboss, boss, arena duel, faction raid, patrol encounter, wandering elite |
| **DnD** | Combat (tactical fight), trap hazard, skill check, environmental hazard, NPC duel, dungeon puzzle, boss fight, random encounter |
| **RPG** | Social standoff, betrayal crisis, deadline pressure, faction confrontation, moral dilemma, exposure threat, leverage negotiation, ambush |
| **PYOA** | Crisis fork (ally/betray, trust/doubt, fight/flee, reveal/conceal, etc.) with 5-8 crisis archetypes per bible |

### 2. Telegraph Patterns (Before Engagement)

**Goal:** Player sees encounter coming and can prepare, avoid, or choose engagement.

| Telegraph Type | Example | Timing |
|----------------|---------|--------|
| **STATUS alert** | "Pact-Hunter nearby" | 1-2 turns before spawn |
| **NPC warning** | "They're looking for you" | During hub arrival or quest reveal |
| **Scene cue** | "Shadows move in the alley" | Same turn as spawn (descriptive) |
| **Item hint** | "Worn tracks lead deeper" | Dungeon room before boss |
| **Faction intel** | "Calamity Mark sent assassins" | Quest stage commit |

**Anti-patterns (avoid):**
- ❌ Instant spawn with no warning ("a foe appears" out of nowhere)
- ❌ Generic "danger" without specificity ("something bad will happen")
- ❌ Telegraph that lies (warning with no follow-through)

### 3. Stakes Clarity (Outcomes + Consequences)

**Before engagement starts, player must understand:**

| Outcome | Stakes | Example (LitRPG Boss) |
|---------|--------|------------------------|
| **Win** | Reward + progress | +45 XP, rare loot, boss key, quest stage advance |
| **Flee** | Penalty + escape | -10 HP, lose initiative, can retry later |
| **Lose** | Harsh penalty | Respawn at last hub, lose progress, faction penalty |
| **Negotiate** | Conditional escape | Trade item/favor, faction delta, NPC remembers deal |

**DnD-specific:**
- **Skill check:** Pass = clue/passage, Fail = HP loss / alert
- **Trap:** Disarm = loot, Trigger = damage, Avoid = bypass

**RPG-specific:**
- **Leverage:** Succeed = alliance/access, Fail = enemy/exile, Partial = debt owed
- **Betrayal:** Irreversible faction change + NPC turnover

**PYOA-specific:**
- **Crisis fork:** Choose A = lock B + delayed payoff, Choose B = lock A + different ending

### 4. Resolution Mechanics (Deterministic)

**LitRPG combat resolution (already partial in 29b):**

```typescript
interface CombatResolution {
  enemyHp: number; // Tracked on ledger, persists turn-to-turn
  pcDamage: number; // Seeded roll from character stats
  fleeCheck: boolean; // Success if PC speed > enemy speed or lucky roll
  parleyCheck: boolean; // Success if leverage exists or faction neutral
  outcome: 'win' | 'flee' | 'lose' | 'negotiate';
}
```

**DnD skill check resolution:**

```typescript
interface SkillCheckResolution {
  skill: 'stealth' | 'investigation' | 'athletics' | 'persuasion';
  dc: number; // Difficulty class (10 easy, 15 medium, 20 hard)
  roll: number; // d20 + modifier (seeded)
  outcome: 'success' | 'partial' | 'failure';
  consequence: string; // "Find secret door", "Alert guards", "Lose HP"
}
```

**RPG leverage resolution:**

```typescript
interface LeverageResolution {
  leverageTopic: string; // "I know your secret", "I have proof"
  npcVulnerable: boolean; // Does NPC have this weakness?
  cost: 'trust' | 'favor' | 'item' | 'faction';
  outcome: 'alliance' | 'enemy' | 'debt_owed' | 'exile';
}
```

**PYOA crisis resolution:**

```typescript
interface CrisisResolution {
  crisisId: string; // "millstone-charter-fork"
  choiceA: { label, exclusiveFacts, delayedPayoff };
  choiceB: { label, exclusiveFacts, delayedPayoff };
  branchLock: boolean; // Sibling choice becomes unavailable
  convergenceCheck: boolean; // Can parallel branches merge later?
}
```

### 5. Aftermath Receipts (World Change)

Every encounter resolution writes **atomic receipts** to ledger before GM prose:

| Receipt Type | Example | Ledger Location |
|--------------|---------|-----------------|
| **XP award** | +25 XP (combat), +15 XP (skill check) | `character.xp` |
| **Loot drop** | Iron Shortsword, Health Potion | `inventory.carried[]` |
| **Faction delta** | Calamity Mark -10, Circle +5 | `worldLedger.factionStandings[]` |
| **Quest tick** | Circle's Price stage-2 complete | `quests[].currentStage` |
| **NPC reaction** | Aldous: "Impressive" | `npcMemories.keyMoments[]` |
| **Dungeon clear** | Boss killed → dungeon neutralized | `clearedNodeIds[]` |

**Anti-patterns (avoid):**
- ❌ Aftermath is GM prose only (no ledger receipt)
- ❌ Generic "you win" with no XP/loot/consequence
- ❌ Resolution without world change (nothing persists)

### 6. Biome-Appropriate Spawns (No Wrong-Bible Encounters)

**Drought tables per bible:**

| Bible | Biome | Appropriate Spawns | Wrong Spawns (Avoid) |
|-------|-------|-------------------|----------------------|
| **Summoned Pact** | Urban ruins, hubs | Pact-Hunter, skirmisher, patrol | Keep Wraith (wrong bible) |
| **Cursed Keep** | Dungeon, crypts | Keep Wraith, skeleton, guardian | Hub patrol (wrong setting) |
| **Shattered Coast** | Coastal, saltmarsh | Saltmar raider, smuggler, brine creature | Keep Wraith (wrong bible), urban patrol |
| **Salt Road Heist** | Road, towns | Bandit, merchant guard, rival thief | Dungeon monsters |

**Drought picker logic:**

```typescript
function pickDroughtEncounter(bible: string, location: string, biome: string): EncounterTemplate {
  const bibleTable = ENCOUNTER_BIBLE[bible]; // Per-bible encounter library
  const biomeFiltered = bibleTable.filter(t => t.biomes.includes(biome));
  const locationFiltered = biomeFiltered.filter(t => t.locations.includes(location));
  return seededPick(locationFiltered); // Deterministic from seed
}
```

### 7. Density Targets (FO3-like, Not MMO)

**LitRPG dungeon density (per 10-room dungeon):**
- 4-6 trash mobs (skirmisher, patrol, wandering elite)
- 1-2 minibosses (elite with unique mechanic)
- 1 boss (final room, unique loot, quest-critical)

**DnD Keep density (per act):**
- 3-5 combat encounters (tactical fights with terrain)
- 2-3 trap hazards (skill checks with consequences)
- 1-2 boss fights (act-ending confrontation)

**RPG social density (per hub):**
- 2-4 leverage topics (NPCs with vulnerabilities)
- 1-2 crisis standoffs (confrontation with stakes)
- 1 betrayal opportunity (irreversible faction choice)

**PYOA crisis density (per 50t act):**
- 2-3 crisis forks (branching choices with locks)
- 1 convergence point (parallel branches merge if appropriate)
- 1 ending gate (terminal branch after 100-150t)

---

## Design Questions

### 1. Template Depth per Mode

**Question:** How many encounter templates are enough?

**Options:**
- **A. Minimal (3-5 per mode):** Cover core functions only (basic combat, basic trap, basic crisis)
- **B. Standard (5-8 per mode):** Enough variety for 100-turn campaigns (hub ambush, dungeon trash, miniboss, boss, etc.)
- **C. Comprehensive (10-15 per mode):** Full library for 300+ turns without repetition

**Recommendation:** **Option B (5-8 per mode)** — enough to feel authored, can expand later if players complain about repetition.

### 2. Telegraph Strictness

**Question:** Must every encounter have telegraph?

**Options:**
- **A. Always telegraph:** 100% encounters show warning (no surprises)
- **B. Most telegraph:** 80% show warning, 20% ambush/surprise allowed
- **C. Optional telegraph:** Some encounters surprise, some warn

**Recommendation:** **Option B (most telegraph)** — genre-appropriate for most encounters, but occasional ambush adds tension.

### 3. Resolution Complexity

**Question:** How deterministic should encounter mechanics be?

**Options:**
- **A. Fully deterministic:** All outcomes seeded, no GM discretion
- **B. Hybrid:** Core mechanics seeded (HP, DC, leverage), GM narrates flavor
- **C. GM-narrated:** Mechanics suggest outcome, GM decides

**Recommendation:** **Option B (hybrid)** — core mechanics deterministic (receipts guaranteed), GM narrates flavor (prose variety).

### 4. Aftermath Granularity

**Question:** How detailed should loot tables be?

**Options:**
- **A. Generic loot:** "Some gold and a weapon" (GM decides specifics)
- **B. Typed loot:** "25 gold, Iron Shortsword, Health Potion" (pre-specified)
- **C. Procedural loot:** "Roll loot table tier-2" (generated from tables)

**Recommendation:** **Option B (typed loot)** for boss/elite encounters, **Option C (procedural)** for trash mobs.

### 5. Wrong-Bible Prevention

**Question:** How to prevent Keep Wraith on Shattered Coast?

**Options:**
- **A. Hard filter:** Code blocks spawns outside bible's biome list
- **B. Soft filter:** GM rail says "only spawn X enemies" + prose warden scrub
- **C. No filter:** Trust GM to follow bible (current state = fails)

**Recommendation:** **Option A (hard filter)** — code-enforced biome matching in `pickDroughtEncounter`, GM cannot override.

### 6. Density Enforcement

**Question:** How to guarantee encounter density (no 0-combat DnD runs)?

**Options:**
- **A. Turn-based pressure:** Spawn encounter every N turns if drought
- **B. Location-based pressure:** Dungeons must spawn X encounters per floor
- **C. Quest-based pressure:** Quest stages trigger encounters (already partial in 28a)

**Recommendation:** **Option A+B combined** — turn-based drought (T15 no combat = spawn) + location-based minimums (dungeon floor = 2-3 encounters).

---

## Deliverable Specification (12 Items)

### Deliverable 1: Encounter Bible Constitution

**Format:** Markdown specification + design principles

**Contents:**
- Four-phase encounter lifecycle (telegraph → stakes → resolution → aftermath)
- Per-mode genre expectations (LitRPG boss fight, DnD trap, RPG standoff, PYOA crisis)
- Telegraph patterns catalog (STATUS, NPC, scene, item, faction)
- Stakes clarity rules (win/lose/flee/negotiate outcomes)
- Resolution mechanics principles (deterministic core, GM narrates flavor)
- Aftermath receipt types (XP, loot, faction, quest, NPC, dungeon)
- Biome-appropriate spawn rules (no wrong-bible encounters)
- Density targets (FO3-like, not MMO)

**Integration:** Feeds into all subsequent deliverables (D2-D12)

---

### Deliverable 2: LitRPG Encounter Library (8 Templates)

**Format:** 8 encounter templates (JSON schema + prose example for each)

**Contents:**

| Template | Telegraph | Stakes | Resolution | Aftermath |
|----------|-----------|--------|------------|-----------|
| **Hub Ambush** | STATUS "Pact-Hunter nearby" | Win = XP/loot, Flee = wounded | HP ledger combat | +25 XP, loot drop, faction -10 |
| **Dungeon Trash** | Scene "scratching sounds" | Win = XP/loot, Flee = ok | HP ledger combat | +15 XP, consumable |
| **Miniboss** | Item "tracks lead deeper" | Win = rare loot, Flee = wounded | HP ledger + mechanic | +35 XP, rare item, quest tick |
| **Boss** | NPC "final guardian awaits" | Win = boss key, Flee = fail, Lose = respawn | HP ledger + unique mechanic | +45 XP, boss loot, dungeon clear |
| **Arena Duel** | Quest stage triggers | Win = rank up, Lose = retry | HP ledger + audience reaction | +30 XP, title, faction +15 |
| **Faction Raid** | Faction intel "they're coming" | Win = defend, Lose = hub damaged | HP ledger + NPC allies | +40 XP, faction reward |
| **Patrol Encounter** | Scene "guards approach" | Win = pass, Flee = ok, Fight = enemy | Leverage or combat | Variable outcome |
| **Wandering Elite** | Random spawn (20% chance) | Win = rare loot, Flee = ok | HP ledger + unique drop | +30 XP, elite loot |

**Integration:** `src/game/bibles/summoned-pact/encounters.json` + ArcDirector drought picker

---

### Deliverable 3: DnD Encounter Library (8 Templates)

**Format:** 8 encounter templates (JSON schema + prose example for each)

**Contents:**

| Template | Telegraph | Stakes | Resolution | Aftermath |
|----------|-----------|--------|------------|-----------|
| **Combat** | Scene "enemy ahead" | Win = passage, Flee = wounded, Lose = retreat | HP ledger + tactics | +20 XP, loot |
| **Trap Hazard** | Item "pressure plate" | Disarm = loot, Trigger = damage, Avoid = bypass | Skill check (Investigation/Dexterity) | +15 XP, loot or HP loss |
| **Skill Check** | NPC "locked door" | Pass = clue/passage, Fail = alert/HP loss | d20 + modifier vs DC | +10 XP, secret reveal |
| **Environmental Hazard** | Scene "crumbling floor" | Pass = cross, Fail = fall damage | Skill check (Athletics) | +10 XP or -15 HP |
| **NPC Duel** | NPC "I challenge you" | Win = respect, Lose = exile, Negotiate = deal | HP ledger or leverage | Faction delta, NPC memory |
| **Dungeon Puzzle** | Scene "ancient mechanism" | Solve = passage, Fail = trap triggers | Investigation check | +20 XP, secret room |
| **Boss Fight** | NPC "final guardian" | Win = boss key, Lose = retreat | HP ledger + unique mechanic | +40 XP, boss loot, dungeon clear |
| **Random Encounter** | Random spawn (30% on travel) | Win = XP, Flee = ok | HP ledger | +15 XP |

**Integration:** `src/game/bibles/cursed-keep/encounters.json` + ArcDirector drought picker

---

### Deliverable 4: RPG Encounter Library (8 Templates)

**Format:** 8 encounter templates (JSON schema + prose example for each)

**Contents:**

| Template | Telegraph | Stakes | Resolution | Aftermath |
|----------|-----------|--------|------------|-----------|
| **Social Standoff** | NPC "we need to talk" | Alliance, Enemy, Debt, Exile | Leverage check | Faction delta, NPC memory |
| **Betrayal Crisis** | NPC "I know your secret" | Irreversible faction change | Leverage or confession | NPC transforms, quest fail/advance |
| **Deadline Pressure** | STATUS "Time running out" | Meet deadline = reward, Miss = fail | Turn countdown | Quest stage or fail |
| **Faction Confrontation** | Faction intel "they're onto you" | Smooth talk, Fight, Flee | Leverage or combat | Faction standing change |
| **Moral Dilemma** | NPC "choose: save X or Y" | Choice locks opposite | Player input only | Exclusive facts, NPC memory |
| **Exposure Threat** | NPC "reveal or pay" | Pay = debt, Refuse = enemy, Reveal = faction change | Leverage or resource cost | Faction delta, quest impact |
| **Leverage Negotiation** | NPC "I have leverage" | Deal, Refuse, Counter-leverage | Leverage check | Faction delta, NPC memory, quest access |
| **Ambush** | Scene "trap!" | Fight, Flee, Negotiate | HP ledger or leverage | XP, loot, or faction penalty |

**Integration:** `src/game/bibles/cape-district-vigil/encounters.json` + ArcDirector drought picker

---

### Deliverable 5: PYOA Crisis Library (Per-Bible, 5-8 Each)

**Format:** Crisis templates for 3-5 PYOA bibles (Thornferry, Vesper Glass, Erebus-9, etc.)

**Contents (example: Thornferry Road):**

| Crisis | Telegraph | Stakes | Resolution | Aftermath |
|--------|-----------|--------|------------|-----------|
| **Millstone Charter** | NPC "sign or reject" | Sign = ally lord, Reject = rebel | Fork lock | Exclusive facts, quest branch |
| **Bandits or Villagers** | Scene "conflict escalates" | Side with bandits, Side with villagers | Fork lock | Faction delta, quest branch |
| **Trust the Miller** | NPC "miller's offer" | Trust = reveal, Doubt = hide | Fork lock | Delayed payoff at T100 |
| **Reveal Secret** | NPC "tell truth or lie" | Truth = ally, Lie = enemy later | Fork lock | Convergence or divergence |
| **Fight or Flee** | Combat opportunity | Fight = XP/loot, Flee = no reward | Combat or avoidance | XP or resource save |
| **Alliance Proposal** | NPC "join us" | Accept = faction ally, Refuse = solo path | Fork lock | Exclusive facts |
| **Moral Choice** | NPC "save X or Y" | Choice locks opposite | Player input | Delayed consequence |
| **Ending Gate** | Turn 100-150 | Choose ending path | Terminal branch | One of 6 endings |

**Integration:** `src/game/bibles/thornferry-road/crises.json` + PYOA branch ledger

---

### Deliverable 6: Telegraph Pattern Catalog

**Format:** JSON catalog + prose examples

**Contents:**
- STATUS alert patterns ("Pact-Hunter nearby", "Trap detected", "Time running out")
- NPC warning patterns ("Watch your back", "They're looking for you", "Be careful")
- Scene cue patterns ("Shadows move", "Tracks lead deeper", "Floor creaks")
- Item hint patterns ("Worn tracks", "Pressure plate", "Ancient mechanism")
- Faction intel patterns ("Calamity Mark sent assassins", "They're onto you")

**Integration:** `src/game/encounterTelegraph.ts` + situation packet builder

---

### Deliverable 7: Stakes Clarity Templates

**Format:** JSON stakes schema + prose templates

**Contents:**
- Win outcomes (XP, loot, passage, quest tick, faction gain)
- Lose outcomes (HP loss, respawn, faction penalty, quest fail)
- Flee outcomes (wounded, escape, cooldown, can retry)
- Negotiate outcomes (trade, debt, faction delta, conditional escape)
- Partial outcomes (DnD partial success, RPG compromise)

**Integration:** `src/game/encounterStakes.ts` + situation packet ENCOUNTER STAKES section

---

### Deliverable 8: Resolution Mechanics Spec

**Format:** TypeScript interfaces + resolution algorithms

**Contents:**
- Combat resolution (HP ledger, damage calc, flee check, parley check)
- Skill check resolution (d20 + modifier vs DC, partial success rules)
- Leverage resolution (topic match, NPC vulnerable, cost/outcome matrix)
- Crisis resolution (fork lock, exclusive facts, convergence check)

**Integration:** `src/game/encounterResolution.ts` extension + mode-specific resolvers

---

### Deliverable 9: Loot Table Design

**Format:** Tiered loot tables (trash, elite, boss) per mode

**Contents:**

| Tier | LitRPG Loot | DnD Loot | RPG Loot |
|------|-------------|----------|----------|
| **Trash** | 5-10 gold, consumable | 3-8 gold, potion | Minor favor, intel |
| **Elite** | 15-25 gold, uncommon weapon | 10-20 gold, magic item | Leverage intel, NPC contact |
| **Boss** | 50-100 gold, rare weapon, boss key | 30-60 gold, rare magic item, quest item | Faction access, critical intel |

**Integration:** `src/game/lootTables.ts` + aftermath receipt generator

---

### Deliverable 10: Biome-Appropriate Spawn Matrix

**Format:** CSV matrix (bible × biome × encounter types)

**Contents:**
- Per-bible encounter lists (Summoned Pact, Cursed Keep, Shattered Coast, etc.)
- Per-biome encounter filters (urban, dungeon, coastal, road, wilderness)
- Wrong-bible exclusions (no Keep Wraith on Shattered Coast)
- Drought picker logic (seeded selection from filtered list)

**Integration:** `src/game/encounterBiomeMatrix.ts` + ArcDirector drought spawn

---

### Deliverable 11: Density Targets & Enforcement

**Format:** Density rules table + enforcement logic

**Contents:**
- LitRPG dungeon density (4-6 trash, 1-2 miniboss, 1 boss per 10-room dungeon)
- DnD Keep density (3-5 combat, 2-3 traps, 1-2 boss per act)
- RPG hub density (2-4 leverage, 1-2 standoffs, 1 betrayal per hub)
- PYOA crisis density (2-3 forks, 1 convergence, 1 ending per 50t act)
- Turn-based drought pressure (spawn if T15 no combat)
- Location-based minimums (dungeon floor must spawn 2-3 encounters)

**Integration:** `src/game/encounterDensity.ts` + ArcDirector drought + location spawn

---

### Deliverable 12: Implementation Backlog + Eval Harness

**Format:** CSV backlog (30-40 tasks) + JSON eval gates

**Contents:**

**Implementation tasks:**
- P0: Template schemas, biome matrix, telegraph builder, aftermath receipts
- P1: Per-bible encounter libraries (8 per mode), loot tables, density enforcement
- P2: Advanced resolution (tactics, partial success, convergence), procedural loot

**Eval gates:**
- **G1:** 100% encounters resolve with receipt (no 0-receipt runs)
- **G2:** 80%+ encounters show telegraph (STATUS, NPC, or scene)
- **G3:** 0 wrong-bible spawns (biome filter works)
- **G4:** Density targets met (dungeon has 4-6 trash, 1 boss)
- **G5:** Aftermath receipts present (XP + loot + faction + quest)

**Integration:** `docs/research/manus-encounter-implementation-backlog-2026-08-28.md` + `evalHarness/encounter-quality-gates.json`

---

## Success Metrics

### Gameplay Metrics (Measurable)

|| Metric | Current (27w) | Target (Post-WS-4) | Measurement |
|---|---|---|---|---|
| **Encounter resolution** | 0 receipts in 300t | 100% encounters resolve | Count `encounterTerminalFsm` transitions to `cleared` |
| **Telegraph presence** | Generic "a foe" | 80%+ telegraph before engagement | Count STATUS/NPC/scene cues pre-spawn |
| **Wrong-bible spawns** | Keep Wraith on Saltmar | 0 wrong-bible spawns | Biome filter audit per run |
| **Density targets** | 0 combat DnD, 290t combat LitRPG | Targets met (4-6 trash, 1 boss per dungeon) | Count encounters per location/turn band |
| **Aftermath receipts** | Combat just ends | XP + loot + faction + quest | Count receipt types per encounter |
| **Gemini encounter score** | ~1-2/10 | ~6-8/10 | Gemini eval after rerun |

### Quality Gates (Pass/Fail)

| Gate | Criteria | How to Measure |
|------|----------|----------------|
| **G1: Resolution** | 100% encounters resolve with receipt | `encounterClearedCount === encounterSpawnCount` |
| **G2: Telegraph** | 80%+ show warning pre-spawn | `telegraphCount / encounterCount >= 0.8` |
| **G3: Biome match** | 0 wrong-bible spawns | `wrongBiomeCount === 0` per run |
| **G4: Density** | Dungeons meet minimums | `trashCount >= 4 && bossCount >= 1` per dungeon |
| **G5: Aftermath** | Every encounter has >=2 receipt types | `receiptTypes.length >= 2` per encounter |

---

## Integration Checklist

### Code Integration Points

- [ ] **1. EncounterBibleRegistry** (`src/game/encounterBible.ts`)
  - Per-bible encounter libraries (5-8 templates per mode)
  - Template schemas (telegraph, stakes, resolution, aftermath)
  
- [ ] **2. EncounterTelegraph** (`src/game/encounterTelegraph.ts`)
  - Telegraph pattern catalog (STATUS, NPC, scene, item, faction)
  - Situation packet ENCOUNTER TELEGRAPH section
  
- [ ] **3. EncounterStakes** (`src/game/encounterStakes.ts`)
  - Stakes clarity templates (win/lose/flee/negotiate outcomes)
  - Situation packet ENCOUNTER STAKES section
  
- [ ] **4. EncounterResolution** (`src/game/encounterResolution.ts` extension)
  - Mode-specific resolution mechanics (combat, skill check, leverage, crisis)
  - Deterministic seeded outcomes
  
- [ ] **5. EncounterAftermath** (`src/game/encounterAftermath.ts`)
  - Receipt generator (XP, loot, faction, quest, NPC, dungeon)
  - Ledger writers (atomic commits pre-GM)
  
- [ ] **6. LootTables** (`src/game/lootTables.ts`)
  - Tiered loot (trash, elite, boss) per mode
  - Procedural loot picker (seeded)
  
- [ ] **7. EncounterBiomeMatrix** (`src/game/encounterBiomeMatrix.ts`)
  - Biome-appropriate spawn filters
  - Wrong-bible exclusions (hard filter)
  
- [ ] **8. EncounterDensity** (`src/game/encounterDensity.ts`)
  - Density targets (trash/elite/boss per dungeon)
  - Turn-based drought + location-based minimums
  
- [ ] **9. ArcDirector** (`src/game/arcDirector.ts` extension)
  - Pre-GM encounter commit (telegraph → stakes → resolution → aftermath)
  - Drought picker (biome-filtered, seeded)
  
- [ ] **10. SituationPacket** (`src/game/situationPacket.ts` extension)
  - Include encounter telegraph, stakes, resolution mechanics
  - Bind GM to aftermath receipts (must honor ledger)
  
- [ ] **11. ProseWarden** (`src/game/proseWarden.ts` extension)
  - Verify GM honors resolution (flee succeeds, combat ends, aftermath receipts present)
  - Scrub wrong-bible spawns if GM invents
  
- [ ] **12. EvalHarness** (`scripts/fate-autoplay/evalHarness.ts`)
  - Encounter quality gates (resolution, telegraph, biome, density, aftermath)
  - Per-run encounter metrics

---

## Timeline Estimate

### Research Phase (5-7 days)

| Day | Deliverable | Effort |
|-----|-------------|--------|
| **1** | D1 (Constitution) + D6 (Telegraph catalog) | Design principles + pattern library |
| **2** | D2 (LitRPG library 8 templates) | Full lifecycle per template |
| **3** | D3 (DnD library 8 templates) | Full lifecycle per template |
| **4** | D4 (RPG library 8 templates) + D5 (PYOA crises) | Full lifecycle + crisis forks |
| **5** | D7 (Stakes) + D8 (Resolution) + D9 (Loot tables) | Mechanics specs + tables |
| **6** | D10 (Biome matrix) + D11 (Density) | Spawn filters + density rules |
| **7** | D12 (Backlog + Eval) + polish | 30-40 tasks + quality gates |

### Implementation Phase (After Research)

| Wave | Tasks | Effort | Integration |
|------|-------|--------|-------------|
| **Wave 1** | Template schemas + biome matrix + telegraph | 3-4 days | `encounterBible.ts`, `encounterBiomeMatrix.ts`, `encounterTelegraph.ts` |
| **Wave 2** | Resolution mechanics + aftermath + loot tables | 2-3 days | `encounterResolution.ts`, `encounterAftermath.ts`, `lootTables.ts` |
| **Wave 3** | Per-bible libraries (8 × 4 modes = 32 templates) | 3-4 days | `bibles/*/encounters.json` authoring |
| **Wave 4** | Density enforcement + ArcDirector integration | 2-3 days | `encounterDensity.ts`, `arcDirector.ts` |
| **Wave 5** | Eval harness + quality gates + validation | 1-2 days | `evalHarness.ts`, 12×300 autoplay rerun |

**Total Implementation:** 11-16 days after research complete

---

## Dependencies

### Depends On (Must Exist First)

- ✅ **Path A Wave 1** (ArcDirector + BeatContract) — WS-4 feeds beat contract registry
- ✅ **encounterTerminalFsm** (29b) — WS-4 extends terminal FSM with resolution
- ✅ **StateTx** (28a) — WS-4 uses atomic commits for aftermath receipts
- ⚠️ **dungeonLifecycle** (29e) — WS-4 needs dungeon open/clear for density enforcement

### Blocks (Cannot Proceed Until WS-4 Complete)

- ❌ **Path A Wave 2 complete** (B014-B017 mode resolvers) — needs WS-4 encounter templates
- ❌ **LitRPG content depth** — needs boss fight + loot table specs
- ❌ **DnD content depth** — needs trap/hazard/check templates
- ❌ **RPG content depth** — needs standoff/leverage/crisis templates
- ❌ **PYOA crisis depth** — needs crisis fork specs (overlaps with WS-5)
- ❌ **Gemini quality uplift** — combat stays ~1/10 without encounter fixes

### Parallel (Can Research Concurrently)

- ✅ **WS-2 (NPC Role + Memory)** — independent research track
- ⚠️ **WS-5 (PYOA Branch Persistence)** — partial overlap (PYOA crisis templates D5)

---

## Unknowns & Assumptions

### Unknowns (Need Evidence)

1. **Do players notice "same boss 10 times" or is resolution more important than variety?**
   - **Study:** Run 100+ turn playtest; ask "did encounters feel repetitive?"
   - **Impact:** Affects template depth (5-8 vs 10-15 per mode)

2. **Do players want every encounter telegraphed or are surprises OK?**
   - **Study:** A/B test 100% telegraph vs 80% telegraph + 20% ambush
   - **Impact:** Affects telegraph strictness (always vs most vs optional)

3. **How much loot granularity do players expect?**
   - **Study:** Compare "generic loot" vs "typed loot" vs "procedural loot"
   - **Impact:** Affects loot table complexity (simple vs detailed)

4. **Do players care about biome-appropriate spawns?**
   - **Study:** A/B test wrong-bible spawns vs biome-filtered spawns; measure immersion
   - **Impact:** If players don't notice, biome filter may be over-engineering

### Assumptions (Treating as True Unless Proven False)

1. **Gemini complaints are player-aligned** — combat purgatory frustrates real players
2. **Resolution is more important than variety** — 5-8 templates OK if they resolve properly
3. **Telegraph improves player agency** — warning before encounter lets player prepare/avoid
4. **Aftermath receipts matter** — XP/loot/faction delta make encounters feel meaningful
5. **Biome-appropriate spawns improve immersion** — no Keep Wraith on Shattered Coast

---

## Honest Outlook

### What WS-4 Will Fix

- ✅ **Combat purgatory** (290-turn loops) — encounter resolution forces terminal state
- ✅ **Generic encounters** ("a foe") — 5-8 templates per mode with lifecycle
- ✅ **Wrong-bible spawns** (Keep Wraith on Saltmar) — biome filter hard blocks
- ✅ **Missing resolution** (flee doesn't flee) — deterministic mechanics pre-GM
- ✅ **No aftermath** (combat just ends) — XP + loot + faction + quest receipts

### What WS-4 Won't Fix

- ❌ **Combat prose quality** (generic narration) — needs better writer or content banks
- ❌ **Encounter variety at 300+ turns** (5-8 templates may feel repetitive) — needs radiant system (P2)
- ❌ **Tactical depth** (positioning, terrain, combos) — advanced combat deferred (P2)
- ❌ **Dynamic difficulty** (adaptive challenge) — needs player skill modeling (P2)

### Honest Score Ceiling

| Implementation | Gemini Encounter Score | Player Impact |
|----------------|-------------------------|---------------|
| **Pre-WS-4** (28a-29b) | ~1-2/10 | Combat purgatory, generic spawns, no resolution |
| **Post-WS-4 Wave 1-2** | ~4-5/10 | Encounters resolve but may feel mechanical |
| **Post-WS-4 Wave 5** | ~6-8/10 | Genre-appropriate encounters with lifecycle |
| **Aspirational 9-10** | Needs tactical depth + dynamic difficulty + radiant content |

---

## Recommended Next Steps

### For John (Authorization)

1. **Authorize WS-4 research commission** (5-7 days)
2. Pick design options:
   - Template depth: **Standard (5-8 per mode)** recommended
   - Telegraph strictness: **Most (80% warn, 20% ambush)** recommended
   - Resolution complexity: **Hybrid (deterministic core, GM flavor)** recommended
   - Loot granularity: **Typed for boss/elite, procedural for trash** recommended
3. Optionally: run 5-10 human playtesters to validate density targets before full implementation

### For Manus (Research Execution)

1. Deliver 12 deliverables (D1-D12) within 5-7 days
2. Focus on **LitRPG + DnD templates** first (highest player pain)
3. Coordinate D5 (PYOA crises) with WS-5 (branch persistence) to avoid duplication

### For Engineering (After Research Complete)

1. Implement Wave 1 (schemas + biome matrix + telegraph) — 3-4 days
2. Implement Wave 2 (resolution + aftermath + loot) — 2-3 days
3. Author Wave 3 (32 encounter templates across 4 modes) — 3-4 days
4. Wire into ArcDirector pre-GM commit flow (telegraph → resolution → aftermath)
5. Add eval harness gates (resolution, telegraph, biome, density, aftermath)

---

## References

### Prior Art

- **Fallout 3/New Vegas:** Encounter density + loot tables + aftermath receipts
- **D&D 5e:** Skill check mechanics (d20 + modifier vs DC)
- **Baldur's Gate 3:** Telegraph + stakes + tactical resolution + aftermath
- **Into the Breach:** Perfect information + clear stakes before engagement
- **Hades:** Encounter variety + deterministic loot tables

### Research Sources

- Gemini LitRPG s18 review (`docs/bugs/gemini-reviews-2026-08-27/gemini-13-litrpg-storyfollower-28c-worst-300t.md`)
- Gemini DnD s69 review (`docs/bugs/gemini-reviews-2026-08-27/gemini-10-dnd-storyfollower-27w-300t.md`)
- Gemini RPG s137 review (`docs/bugs/gemini-reviews-2026-08-27/gemini-11-rpg-completionist-27w-300t.md`)
- Player-driven decisions (`docs/research/player-driven-decisions-2026-08-28.md`)
- Manus BIG CHANGES (`docs/research/manus-big-changes-ingest-2026-08-27.md`)
- Implementation status (`docs/research/implementation-status-2026-08-28.md`)

---

**Document Status:** Draft research brief awaiting authorization  
**Next Step:** John authorizes commission → Manus delivers 12 deliverables within 5-7 days
