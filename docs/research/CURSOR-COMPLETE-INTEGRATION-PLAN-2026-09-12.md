# 🎯 SynapticGM Complete Status & Cursor Implementation Plan

**Date:** 2026-09-12  
**Status:** Manus inventory kept for reference. **Live ship lock is below — do not run the 5-week prompt.**

---

## WHAT CAN BE DONE (live lock — 2026-09-12e)

Default is **A: keep playtesting 12d**. No new Manus integration until a live save names the miss.

HUD/BUILD in this tree is `2026-09-12d` (uncommitted / no client deploy / no `gm-turn` unless John asks). If synapticgm.com is still 12c or older, grain-ship talk will still fail in live.

### Can do (only if John names the slice)

| Slice | What | When |
|---|---|---|
| **A** | Playtest 12d. Collect gaps. | **Now (default)** |
| **Ops** | Commit / client deploy / `gm-turn` so live matches 12d | Only if John asks |
| **B** | A few unique named foes / bible NPCs into existing catalog + roster (12b/12d pattern) | Only after a taped miss. 12d already added +10/+4/+4/+2 |
| **C** | Thin drought tweak on existing `turnsSinceCombatReceipt` + verb counts | Only if a tape shows combat too often or too late |
| **D** | Wren/Dain beats as `completedTopics` on `npcMemories[]` | Later. Not a new dialogue UI |

### Must not do

- Run the 5-week Cursor prompt / Week 1 content-library dump
- Copy Pillar 1 JSON into `src/data/content/`
- Paste Ultimate `aiDirector.ts` next to live `arcDirector.ts`
- Dump 100 encounter templates or 200 location essays into stitch / GM packet
- New dialogue-tree UI, new combat FSM, SNAPSHOT/CRAFT, Playwright
- Commission Pillar 2 (training pipeline) or Pillar 3 (live-ops calendar) for the live game
- Mid writer ON; new GM prompt rules

### Research-only (do not copy wholesale)

| Dump | Path | Why |
|---|---|---|
| Pillar 1 libraries | `docs/research/manus-next-stage/` | Generic tropes. 656KB locations undo 09b page-1 lock |
| Ultimate package | `docs/research/manus-ultimate-transformation/` | Separate Manus app (Drizzle / tRPC / Aether Vanguard). Different `GameState` |
| 4K plan | `docs/research/manus-4k-plan-guide/` (not `manus-4k-plan/`) | Specs + JSON. Dialogue UI fights hall-talk stitch |

### Already live — do not rebuild

`npcMemories[]` (12a/12c) · encounter catalog + `encounterTerminalFsm` (12b/12d) · 24 SP hooks + preview (12c) · `arcDirector` drought · `pyoaBranchLedger` · `fateAutoplay` · `useVoice` · `telemetry_logs`

---

## ✅ WHAT'S BEEN DELIVERED (Complete!)

### **Phase 1: Early Deliveries (August-September)**

1. **NPC Role Obligations & Memory System (WS-2)**
   - Status: ✅ Phase 1 shipped (12a)
   - Location: Integrated into `npcMemories[]`
   - Features: `introSpoken`, `knownPlayerName`, `meetCount`, `completedTopics`
   - Additional: 12c shipped merchant/quest-giver/disposition extras

2. **Combat & Crisis Encounter Bible (WS-4)**
   - Status: ✅ Shipped (12b)
   - Location: `src/data/encounters/encounterBible.ts`
   - Features: Catalog-based encounter system, `encounterTerminalFsm`

3. **Opening Hooks**
   - Status: ✅ Shipped
   - Location: Seed-varied opening scenarios system
   - Features: Multiple starting points per campaign

4. **PYOA Branch Persistence (WS-5)**
   - Status: ✅ Already existed
   - Location: `pyoaBranchLedger` V2
   - Features: Branch tracking, persistence

5. **AI Player Behavior**
   - Status: ✅ Already existed
   - Location: `fateAutoplay` (headless testing)
   - Features: AI-driven testing personas

6. **Quest Design Bible**
   - Status: ✅ Already existed
   - Location: Phase 3 with 16 starter quests + registry

7. **Social Gameplay (WS-7)**
   - Status: ✅ Oaths & Ashes prototype delivered + 12c integration
   - Location: Babylon.js prototype + SynapticGM 12c leftover social

---

### **Phase 2: 4K Plan (September)**

8. **Economy & Progression**
   - Status: ✅ DELIVERED
   - Location: `docs/research/manus-4k-plan-guide/` (research; not live)
   - Features: Currency, vendors, crafting, salvage, progression curves

9. **Tutorial & Onboarding**
   - Status: ✅ DELIVERED
   - Location: `docs/research/manus-4k-plan-guide/` (research; not live)
   - Features: Onboarding flows, tooltips, guided experiences

10. **Dialogue Trees**
    - Status: ✅ DELIVERED
    - Location: `docs/research/manus-4k-plan-guide/` (research; not live)
    - Features: Branching dialogue, relationship tracking

11. **Biome & Environment**
    - Status: ✅ DELIVERED
    - Location: `docs/research/manus-4k-plan-guide/` (research; not live)
    - Features: Environment generation, weather, atmosphere

12. **Art Prompt Library**
    - Status: ✅ DELIVERED
    - Location: `docs/research/manus-4k-plan-guide/` (research; not live)
    - Features: Consistent visual prompt templates

---

### **Phase 3: Ultimate Transformation Package (September)**

13. **AI Director (Phase A)**
    - Status: ✅ DELIVERED
    - Location: `docs/research/manus-ultimate-transformation/client/src/game/aiDirector.ts`
    - Features:
      - Archetype detection (6 types: fighter, talker, explorer, min-maxer, storyfollower, completionist)
      - Dynamic pacing (4 states: rest → rising_tension → climax → resolution)
      - Content weighting based on player archetype
      - Emotional beat handling

14. **Multiplayer (Phase B)**
    - Status: ✅ DELIVERED
    - Location: `docs/research/manus-ultimate-transformation/client/src/game/multiplayer.ts`
    - Features:
      - Party system (max 4 players, turn sync)
      - PvP with ELO rating
      - Trading system (anti-exploit checks)
      - Guild system (roles, upgrades, vault)

15. **Creator Tools (Phase C)**
    - Status: ✅ DELIVERED (Types only)
    - Location: `docs/research/manus-ultimate-transformation/client/src/game/types.ts`
    - Features: Complete TypeScript type system for modding

16. **Audio System (Phase D - Stubs)**
    - Status: ✅ DELIVERED (Integration stubs)
    - Location: `docs/research/manus-ultimate-transformation/`
    - Note: **John already has full TTS/STT** in `src/game/useVoice.ts`

17. **Analytics (Phase D - Stubs)**
    - Status: ✅ DELIVERED (Integration stubs)
    - Location: `docs/research/manus-ultimate-transformation/`
    - Features: Telemetry hooks, event tracking interfaces

---

### **Phase 4: Content Production Libraries (TODAY!)**

18. **Pillar 1: Content Production Libraries**
    - Status: ✅ DELIVERED TODAY
    - Location: `docs/research/manus-next-stage/`
    - Features:
      - ✅ 50 NPC personality archetypes (144 KB JSON)
      - ✅ 100 encounter templates (216 KB JSON)
      - ✅ 200 location descriptions (656 KB JSON)
      - ✅ 500+ dialogue snippets (276 KB JSON)
      - ✅ Integration examples
      - ✅ Generation/validation scripts

---

## ⏳ WHAT'S PENDING (Not Yet Commissioned)

### **Pillar 2: AI Training Data Pipeline (1,200 tokens)**
- Status: ❌ NOT COMMISSIONED YET
- Budget: 1,200 tokens
- What it would include:
  - Data collection spec (logging, anonymization, storage)
  - Curation tools (CLI scripts + web UI)
  - Fine-tuning guides (OpenAI, Anthropic, Llama)
  - Evaluation harness (A/B testing, metrics)
  - Continuous learning loop

### **Pillar 3: Live Service Content (800 tokens)**
- Status: ❌ NOT COMMISSIONED YET
- Budget: 800 tokens
- What it would include:
  - 12-month event calendar (monthly themed events)
  - 52 weekly challenges
  - 365 daily objectives
  - Event quest scripts
  - Battle pass track design

**Remaining Budget:** 2,000 tokens (1,200 + 800)

---

## 🎯 WHAT NEEDS INTEGRATION BY CURSOR

### **Priority 1: Content Libraries (Pillar 1) - READY NOW**

**Location:** `docs/research/manus-next-stage/`

**Integration Points:**

1. **NPC Dialogue System**
   - File: `npc-personalities.json` (50 archetypes)
   - Integration: Feed into `npcMemories[]` and dialogue generation
   - Example: When NPC talks, pull archetype + dialogue samples
   
2. **Encounter Generation**
   - File: `encounter-templates.json` (100 templates)
   - Integration: Feed into `encounterBible.ts` and `arcDirector.ts`
   - Example: When combat spawns, pull template instead of generating from scratch
   
3. **Location Descriptions**
   - File: `location-descriptions.json` (200 locations)
   - Integration: Feed into opening stitch and travel descriptions
   - Example: When player enters tavern, pull description + sensory details
   
4. **Dialogue Enhancement**
   - File: `dialogue-snippets.json` (500+ lines)
   - Integration: Feed into GM prompt as dialogue options
   - Example: When NPC greets player, pull appropriate greeting snippet

**Integration Guide:** `SynapticGM Pillar 1 Integration Examples.md` (detailed!)

---

### **Priority 2: Ultimate Transformation Systems**

**Location:** `docs/research/manus-ultimate-transformation/`

#### **2.1: AI Director**

**What:** Archetype detection + dynamic pacing + content weighting

**Integration Steps:**

1. **Add AI Director State to GameState:**
   ```typescript
   export interface GameState {
     // ... existing fields ...
     aiDirector?: {
       currentPacing: 'rest' | 'rising_tension' | 'climax' | 'resolution';
       detectedArchetype: 'fighter' | 'talker' | 'explorer' | 'min_maxer' | 'storyfollower' | 'completionist';
       tensionLevel: 0 | 1 | 2;
       turnsInState: number;
     };
   }
   ```

2. **Import AI Director Module:**
   - Copy `aiDirector.ts` from Ultimate package
   - Wire into `useGame.ts` after each turn
   - Update `arcDirector.ts` to respect pacing state

3. **Update GM Prompt:**
   - Add pacing context to situation packet
   - Add archetype context (e.g., "Player is a fighter - prioritize combat")

**File Locations:**
- Source: `docs/research/manus-ultimate-transformation/client/src/game/aiDirector.ts`
- Target: `src/game/aiDirector.ts` (new file)
- Integration: `src/game/useGame.ts`, `src/game/arcDirector.ts`

---

#### **2.2: Multiplayer System**

**What:** Party system, PvP, trading, guilds

**Integration Steps:**

1. **Add Multiplayer State to GameState:**
   ```typescript
   export interface GameState {
     // ... existing fields ...
     partyState?: {
       id: string;
       hostId: string;
       members: PartyMember[];
       turnPhase: 'waiting' | 'acting' | 'resolving';
       turnDeadline?: number;
     };
     guildMembership?: {
       guildId: string;
       role: 'leader' | 'officer' | 'member';
       joinedAt: number;
     };
   }
   ```

2. **Import Multiplayer Module:**
   - Copy `multiplayer.ts` from Ultimate package
   - Wire into `useGame.ts` for party turns
   - Add trade validation before item transfers

3. **Add Multiplayer UI:**
   - Party invite modal
   - Turn sync indicator
   - Trade UI
   - Guild hall UI

**File Locations:**
- Source: `docs/research/manus-ultimate-transformation/client/src/game/multiplayer.ts`
- Target: `src/game/multiplayer.ts` (new file)
- Integration: `src/game/useGame.ts`, `src/components/` (new UI components)

**Note:** Multiplayer requires server infrastructure (not just client code).

---

#### **2.3: Analytics Integration**

**What:** Telemetry hooks, event tracking

**Integration Steps:**

1. **Add Analytics State to GameState:**
   ```typescript
   export interface GameState {
     // ... existing fields ...
     analyticsSession?: {
       sessionId: string;
       startTime: number;
       eventsRecorded: number;
     };
   }
   ```

2. **Import Analytics Module:**
   - Copy analytics types from Ultimate package
   - Wire into `useGame.ts` to log events
   - Send to Supabase `telemetry_logs` table

**File Locations:**
- Source: `docs/research/manus-ultimate-transformation/client/src/game/types.ts` (analytics types)
- Target: `src/game/analytics.ts` (new file)
- Integration: `src/game/useGame.ts`

---

### **Priority 3: 4K Plan Systems**

**Location:** `docs/research/manus-4k-plan/`

These are **complete specs** but need to be **implemented as code**:

#### **3.1: Economy & Progression**

**What:** Currency conversions, vendor items, crafting recipes, salvage values

**Integration Steps:**

1. **Create Economy Data Files:**
   - `src/data/economy/currency.json`
   - `src/data/economy/vendors.json`
   - `src/data/economy/craftingRecipes.json`

2. **Add Economy Logic:**
   - `src/game/economySystem.ts` (new file)
   - Wire into `useGame.ts` for purchases, crafting, salvage

**File Locations:**
- Source: `docs/research/manus-4k-plan/economy-progression.json`
- Target: `src/data/economy/` (new directory + files)

---

#### **3.2: Tutorial & Onboarding**

**What:** Step-by-step guides, tooltips, first-time user experience

**Integration Steps:**

1. **Create Tutorial Flow:**
   - `src/game/tutorialSystem.ts` (new file)
   - Track completion state per tutorial step

2. **Add Tutorial UI:**
   - `src/components/TutorialOverlay.tsx` (new file)
   - Highlight relevant UI elements
   - Show progression indicator

**File Locations:**
- Source: `docs/research/manus-4k-plan/tutorial-onboarding.json`
- Target: `src/game/tutorialSystem.ts`, `src/components/TutorialOverlay.tsx`

---

#### **3.3: Dialogue Trees**

**What:** Branching conversation system with relationship tracking

**Integration Steps:**

1. **Create Dialogue Tree System:**
   - `src/game/dialogueTreeSystem.ts` (new file)
   - Track conversation state, choices made, relationship changes

2. **Add Dialogue UI:**
   - `src/components/DialogueTree.tsx` (new file)
   - Show conversation options
   - Display relationship changes

**File Locations:**
- Source: `docs/research/manus-4k-plan/dialogue-trees.json`
- Target: `src/game/dialogueTreeSystem.ts`, `src/components/DialogueTree.tsx`

---

#### **3.4: Biome & Environment**

**What:** Weather, time-of-day, seasonal effects

**Integration Steps:**

1. **Create Environment System:**
   - `src/game/environmentSystem.ts` (new file)
   - Track weather, time, season
   - Apply effects to gameplay (e.g., rain = reduced visibility)

2. **Add Environment to GM Prompt:**
   - Include current weather/time/season in situation packet
   - Use location descriptions from Pillar 1 with environment modifiers

**File Locations:**
- Source: `docs/research/manus-4k-plan/biome-environment.json`
- Target: `src/game/environmentSystem.ts`

---

#### **3.5: Art Prompt Library**

**What:** Consistent visual generation prompts

**Integration Steps:**

1. **Create Art Prompt System:**
   - `src/game/artPromptLibrary.ts` (new file)
   - Store prompts by category (character, location, item, etc.)

2. **Wire into Image Generation:**
   - `src/game/imageGeneration.ts` (existing)
   - Pull prompts from library before calling `generate-image`

**File Locations:**
- Source: `docs/research/manus-4k-plan/art-prompt-library.json`
- Target: `src/game/artPromptLibrary.ts`

---

## 🗓️ CURSOR IMPLEMENTATION PLAN

### **Week 1: Content Libraries (Priority 1)**

**Goal:** Integrate Pillar 1 content libraries into AI Director + GM system

**Tasks:**

1. **Day 1-2: NPC Personality Integration**
   - Copy `npc-personalities.json` to `src/data/content/`
   - Create `src/game/contentLibrary.ts` with query functions
   - Wire into `npcMemories[]` system
   - Test: NPC dialogue pulls from archetypes

2. **Day 3-4: Encounter Template Integration**
   - Copy `encounter-templates.json` to `src/data/content/`
   - Wire into `encounterBible.ts` and `arcDirector.ts`
   - Test: Combat encounters use templates instead of pure generation

3. **Day 5: Location Description Integration**
   - Copy `location-descriptions.json` to `src/data/content/`
   - Wire into opening stitch and travel system
   - Test: Locations use rich sensory descriptions

4. **Day 6: Dialogue Snippet Integration**
   - Copy `dialogue-snippets.json` to `src/data/content/`
   - Wire into GM prompt as dialogue options
   - Test: NPC greetings/threats/bargains use snippets

5. **Day 7: Integration Testing**
   - Run 4×T50 tests (all modes)
   - Compare quality vs. pre-integration baseline
   - Fix any issues

**Deliverables:**
- Content libraries integrated
- Quality improvement measured
- HUD stamp: `2026-09-XX` (week 1 completion)

---

### **Week 2: AI Director + Analytics (Priority 2.1 + 2.3)**

**Goal:** Add dynamic pacing and telemetry

**Tasks:**

1. **Day 1-2: AI Director Implementation**
   - Copy `aiDirector.ts` to `src/game/`
   - Add `aiDirector` field to `GameState`
   - Wire into `useGame.ts` after each turn
   - Update `arcDirector.ts` to respect pacing

2. **Day 3: AI Director Testing**
   - Test archetype detection (play as fighter, talker, explorer)
   - Verify pacing transitions (rest → tension → climax → resolution)
   - Verify content weighting (fighter gets more combat)

3. **Day 4-5: Analytics Integration**
   - Copy analytics types from Ultimate package
   - Create `src/game/analytics.ts`
   - Wire into `useGame.ts` to log events
   - Send to Supabase `telemetry_logs`

4. **Day 6-7: Combined Testing**
   - Verify AI Director + Analytics work together
   - Check telemetry data in Supabase
   - Fix any issues

**Deliverables:**
- AI Director active
- Analytics logging to Supabase
- HUD stamp: `2026-09-XX` (week 2 completion)

---

### **Week 3: Economy + Tutorial (Priority 3.1 + 3.2)**

**Goal:** Add economy system and tutorial flows

**Tasks:**

1. **Day 1-3: Economy System**
   - Create `src/data/economy/` directory
   - Convert 4K plan economy JSON to data files
   - Create `src/game/economySystem.ts`
   - Wire into `useGame.ts` for purchases/crafting/salvage

2. **Day 4-5: Tutorial System**
   - Create `src/game/tutorialSystem.ts`
   - Create `src/components/TutorialOverlay.tsx`
   - Define tutorial steps (first game, combat, quests, etc.)

3. **Day 6-7: Economy + Tutorial Testing**
   - Test buying/selling/crafting
   - Test tutorial flow for new players
   - Fix any issues

**Deliverables:**
- Economy system active
- Tutorial system active
- HUD stamp: `2026-09-XX` (week 3 completion)

---

### **Week 4: Dialogue Trees + Environment (Priority 3.3 + 3.4)**

**Goal:** Add branching dialogue and environment effects

**Tasks:**

1. **Day 1-3: Dialogue Tree System**
   - Create `src/game/dialogueTreeSystem.ts`
   - Create `src/components/DialogueTree.tsx`
   - Define dialogue trees for key NPCs

2. **Day 4-5: Environment System**
   - Create `src/game/environmentSystem.ts`
   - Track weather/time/season
   - Wire into GM prompt with location descriptions

3. **Day 6-7: Final Integration Testing**
   - Test dialogue trees with relationship tracking
   - Test environment effects (rain, night, winter)
   - Run full 4×T50 regression test

**Deliverables:**
- Dialogue trees active
- Environment system active
- HUD stamp: `2026-09-XX` (week 4 completion)

---

### **Week 5 (Optional): Multiplayer (Priority 2.2)**

**Goal:** Add party system (if desired)

**Tasks:**

1. **Day 1-3: Multiplayer Backend**
   - Set up Supabase real-time subscriptions
   - Create party/guild tables
   - Implement party sync logic

2. **Day 4-5: Multiplayer Frontend**
   - Create party invite UI
   - Create turn sync indicator
   - Create trade UI

3. **Day 6-7: Multiplayer Testing**
   - Test party play with 2-4 players
   - Test trading between players
   - Fix any issues

**Deliverables:**
- Party system active (if desired)
- HUD stamp: `2026-09-XX` (week 5 completion)

**Note:** Multiplayer is optional and requires significant infrastructure.

---

## 📊 IMPLEMENTATION PRIORITY MATRIX

| Priority | System | Impact | Effort | Status |
|----------|--------|--------|--------|--------|
| **P0** | Content Libraries | ⭐⭐⭐⭐⭐ | Low | Ready |
| **P0** | AI Director | ⭐⭐⭐⭐⭐ | Medium | Ready |
| **P1** | Analytics | ⭐⭐⭐⭐ | Low | Ready |
| **P1** | Economy | ⭐⭐⭐⭐ | Medium | Needs code |
| **P1** | Tutorial | ⭐⭐⭐ | Medium | Needs code |
| **P2** | Dialogue Trees | ⭐⭐⭐ | High | Needs code |
| **P2** | Environment | ⭐⭐⭐ | Low | Needs code |
| **P2** | Art Prompts | ⭐⭐ | Low | Ready |
| **P3** | Multiplayer | ⭐⭐⭐⭐ | Very High | Ready (optional) |

---

## 🎯 RECOMMENDED CURSOR PROMPT

```markdown
# Cursor: Integrate Manus Deliverables

## Context
SynapticGM has received multiple deliveries from Manus (external AI research service). All deliverables are production-ready and need to be integrated into the existing game.

## Phase 1: Content Libraries (Week 1)

**Goal:** Integrate 4 content libraries (NPCs, encounters, locations, dialogue) into AI Director + GM system

**Files to integrate:**
- `docs/research/manus-next-stage/npc-personalities.json` (50 archetypes)
- `docs/research/manus-next-stage/encounter-templates.json` (100 templates)
- `docs/research/manus-next-stage/location-descriptions.json` (200 locations)
- `docs/research/manus-next-stage/dialogue-snippets.json` (500+ lines)

**Integration guide:**
- `docs/research/manus-next-stage/SynapticGM Pillar 1 Integration Examples.md`

**Steps:**
1. Copy JSON files to `src/data/content/`
2. Create `src/game/contentLibrary.ts` with query functions
3. Wire into:
   - `npcMemories[]` (NPC dialogue)
   - `encounterBible.ts` (combat encounters)
   - Opening stitch (location descriptions)
   - GM prompt (dialogue snippets)
4. Test with 4×T50 (all modes)

**Ship with:**
- HUD stamp: `2026-09-XX`
- BUILD stamp: `2026-09-XX`
- Vitest tests: `playtest-content-libraries.test.ts`

## Phase 2: AI Director (Week 2)

**Goal:** Add dynamic pacing + archetype detection

**Files to integrate:**
- `docs/research/manus-ultimate-transformation/client/src/game/aiDirector.ts`

**Steps:**
1. Copy `aiDirector.ts` to `src/game/`
2. Add `aiDirector` field to `GameState` type
3. Wire into `useGame.ts` after each turn
4. Update `arcDirector.ts` to respect pacing state
5. Add pacing/archetype to GM prompt (situation packet)

**Test:**
- Play as fighter (expect more combat)
- Play as talker (expect more dialogue)
- Verify pacing transitions (rest → tension → climax → resolution)

## Phase 3: Economy + Tutorial (Week 3)

**Goal:** Add currency/vendors/crafting + onboarding flows

**Files to integrate:**
- `docs/research/manus-4k-plan/economy-progression.json`
- `docs/research/manus-4k-plan/tutorial-onboarding.json`

**Steps:**
1. Create `src/data/economy/` directory
2. Convert JSON to TypeScript data files
3. Create `src/game/economySystem.ts`
4. Create `src/game/tutorialSystem.ts`
5. Create `src/components/TutorialOverlay.tsx`

**Test:**
- Buy/sell/craft items
- Run new player tutorial flow

## Phase 4: Dialogue + Environment (Week 4)

**Goal:** Add branching dialogue + weather/time/season

**Files to integrate:**
- `docs/research/manus-4k-plan/dialogue-trees.json`
- `docs/research/manus-4k-plan/biome-environment.json`

**Steps:**
1. Create `src/game/dialogueTreeSystem.ts`
2. Create `src/game/environmentSystem.ts`
3. Wire environment into GM prompt with location descriptions

**Test:**
- Play through dialogue tree
- Verify environment effects (rain, night, etc.)

## Constraints:
- Mid writer stays OFF
- Do not break existing playtest notes (12a/12b/12c)
- Keep all existing systems (encounterTerminalFsm, questBible, npcMemories[])
- No new combat FSM, no SNAPSHOT/CRAFT

## Ship each phase:
- Commit + push after each week
- Deploy `gm-turn` if edge changes
- Run 4×T50 regression test
- Update HUD/BUILD stamps
```

---

## 📋 FILES FOR CURSOR

**Provide these to Cursor:**

1. **Status Document (This File):**
   - `docs/research/CURSOR-COMPLETE-INTEGRATION-PLAN-2026-09-12.md`

2. **Content Libraries:**
   - `docs/research/manus-next-stage/` (entire directory)

3. **Ultimate Transformation:**
   - `docs/research/manus-ultimate-transformation/` (entire directory)

4. **4K Plan (research only):**
   - `docs/research/manus-4k-plan-guide/` (not `manus-4k-plan/`)

5. **Playtest Notes:**
   - `.cursor/rules/playtest-notes.mdc` (to avoid breaking existing systems)

---

## 🚀 IMMEDIATE NEXT STEP

**Superseded.** Do not start Week 1, do not commission Pillar 2/3, do not hybrid-integrate.

**Live default:** keep playtesting 12d (A). Optional ops: commit/deploy 12d if John wants the live site on this stamp.

**Later slices (B/C/D)** wait for a taped miss. See **WHAT CAN BE DONE** at the top of this file.
