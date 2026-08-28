# Manus Research Commission: WS-5 PYOA Branch Persistence (2026-08-28)

**Commission ID:** WS-5  
**Priority:** P0 (Path A Wave 2 support)  
**Commissioned by:** John  
**Research type:** Architecture specification + UX design  
**Estimated research timeline:** 4-6 days  
**Status:** Awaiting authorization

---

## Executive Summary

### The Problem

PYOA branching currently creates theater — crisis choices exist but don't lock branches or reach endings. Gemini PYOA review s188 shows Millstone Charter crisis appearing 288 times despite player choosing a fork, with zero endings reached in 300 turns. Players experience:

- **Infinite crisis loops** (Millstone Charter 288×)
- **Crisis receipts without persistence** (3 crisis receipts but no branch lock)
- **No endings reachable** (300 turns, still mid-story)
- **Transparent theater** (player sees through fake branching)
- **XP floor exploitation** (35 XP by T300 from repeated crisis XP, not story progress)

Current `pyoaBranchLedger` exists (29c) but lacks:
- **Branch lock enforcement** (sibling forks still accessible after choice)
- **Exclusive facts** (choosing A doesn't make B impossible)
- **Delayed payoffs** (crisis at T50 has no consequence at T150)
- **Convergence detection** (parallel branches can't merge when story-appropriate)
- **Ending gates** (no terminal branches after 100-150t)
- **Replay scaffolding** (no journal tree, no fog-of-war visualization)

### Target State

Full branch persistence architecture with deterministic lifecycle:

- **Crisis deck catalog** (5-8 crisis archetypes per PYOA bible)
- **Branch lock schema** (exclusive facts, sibling forks become unavailable)
- **Delayed consequence system** (T50 choice pays off at T150)
- **Convergence detection** (parallel branches merge when facts align)
- **Ending gates** (6-8 terminal endings per bible, reachable by T100-150)
- **Fog-of-war Journal UX** (shows locked branches without spoiling content)
- **Integration:** Wires into ArcDirector pre-GM commits + pyoaBranchLedger + qualityGovernance

### Success Metrics

|| Metric | Current (27w) | Target (Post-WS-5) |
|---|---|---|---|
| **Crisis repetition** | Millstone Charter 288× | Same crisis max 1× (branch locks after choice) |
| **Branch persistence** | Crisis receipts without lock | 100% crises lock sibling forks |
| **Endings reached** | 0 endings in 300t | 80%+ runs reach ending by T150 |
| **Delayed payoffs** | Crisis has immediate-only impact | 50%+ crises have T50→T150 payoff |
| **Gemini PYOA score** | ~2/10 (theater branching) | ~6-8/10 (real branching, endings) |

---

## Problem Statement

### Player Evidence (Strong)

**Gemini PYOA s188 (Thornferry Road worst cell):**
- Millstone Charter crisis: appeared 288× (same crisis, same choice labels)
- Crisis receipts: 3× crisis committed but no branch lock
- XP exploitation: 35 XP by T300 (repeated crisis XP, not story XP)
- Endings: 0 reached in 300 turns
- Meta-input: 5/450 (theater not confusion — player sees branching is fake)
- **Gemini verdict:** "Theater branching; player sees through fake forks; 2/10; Free retention NO"

**Design goals (from PYOA bible research):**
- **Exclusive facts:** Choosing "ally with lord" makes "ally with rebels" impossible
- **Branch locks:** Revisiting Millstone Charter shows "You already chose X; this path is closed"
- **Costs:** Crisis choices have resource/relationship/time penalties
- **Delayed payoffs:** "Trust the miller" at T50 pays off at T150 (miller reveals secret or betrays)
- **Reconvergence:** Parallel branches merge when story facts align (both paths lead to same crisis)

**No direct player feedback on:**
- Should branch tree be visible (Inkle-style) or fog-of-war (Telltale-style)?
- How much replay? One ending per 50t, 100t, or 150t?
- Should Journal show locked branches or hide them entirely?

### Current State (Partial Implementation)

**What exists (28a-29c):**
- `pyoaBranchLedger.ts`: Branch lock schema + crisis receipt commits (29c)
- `arcDirector.ts`: Crisis spawn + PYOA liveness gates (28a)
- `choiceCompiler.ts`: Branch lock pads (don't re-offer locked crisis) (28a)
- `beatContract.ts`: Crisis contracts (thin) in beat registry (28a)

**What's missing:**
- ❌ **Crisis deck catalog** (5-8 crisis archetypes per bible with full specs)
- ❌ **Exclusive facts** (A makes B impossible, tracked on ledger)
- ❌ **Delayed consequences** (crisis at T50 commits payoff due at T150)
- ❌ **Convergence detection** (when parallel branches reach same state)
- ❌ **Ending gates** (6-8 terminal branches per bible)
- ❌ **Fog-of-war Journal** (branch visualization without spoilers)
- ❌ **Replay scaffolding** (seed-stable branching for multiple playthroughs)

### Why Now (Urgency)

- **Path A Wave 2:** PYOA branch persistence is B025 in implementation backlog (after exhaustion systems)
- **Player pain:** Gemini explicitly scores PYOA ~2/10 (theater branching, no endings)
- **Genre expectations:** PYOA needs real branching (not Choice-of-Games-lite)
- **Retention risk:** Theater branching breaks trust ("choices don't matter")

---

## Target State Vision

### 1. Crisis Deck Catalog (5-8 per Bible)

Each PYOA bible has a curated crisis deck with full lifecycle specs:

| Crisis | Fork Labels | Exclusive Facts | Delayed Payoff | Ending Path |
|--------|-------------|-----------------|----------------|-------------|
| **Millstone Charter** | "Sign alliance" / "Reject lord" | `lordAlly=true` XOR `rebelAlly=true` | T100: lord rewards or punishes | Ending A (lord) or B (rebel) |
| **Trust Miller** | "Trust offer" / "Doubt miller" | `millerTrusted=true` XOR `millerDoubt=true` | T150: miller reveals secret or betrays | Converges if secret known by other path |
| **Bandits or Villagers** | "Side with bandits" / "Side with villagers" | `banditAlly=true` XOR `villagerAlly=true` | T80: faction support in final crisis | Ending C (chaos) or D (order) |
| **Reveal Secret** | "Tell truth" / "Conceal secret" | `secretRevealed=true` XOR `secretHidden=true` | T120: NPC ally or enemy | Converges if secret exposed by other event |
| **Alliance Proposal** | "Join faction" / "Stay solo" | `factionMember=true` XOR `soloPath=true` | T100: faction resources or freedom | Ending E (faction) or F (solo) |

**Per-crisis spec includes:**
- Telegraph (when crisis becomes available, e.g., T30-50 window)
- Fork labels (2-4 mutually exclusive choices)
- Exclusive facts (what becomes impossible after choice)
- Delayed payoff (turn N when consequence manifests)
- Ending path (which terminal branch this opens/closes)
- Convergence conditions (when parallel branches merge)

### 2. Branch Lock Schema (Exclusive Facts)

```typescript
interface PyoaBranchLock {
  crisisId: string; // "millstone-charter"
  chosenFork: string; // "sign-alliance"
  lockedForks: string[]; // ["reject-lord"]
  exclusiveFacts: BranchFact[];
  lockedAtTurn: number;
}

interface BranchFact {
  key: string; // "lordAlly"
  value: boolean | string; // true
  exclusiveWith: BranchFact[]; // [{key: "rebelAlly", value: true}]
}
```

**Exclusive fact rules:**
- Choosing "ally with lord" writes `{key: "lordAlly", value: true, exclusiveWith: [{key: "rebelAlly", value: true}]}`
- Re-encountering Millstone Charter checks ledger: if `lordAlly=true`, show "You already allied with the lord. The rebel path is closed."
- ArcDirector never spawns "ally with rebels" crisis if `lordAlly=true` on ledger
- Journal shows "🔒 Rejected lord's offer" or "🔒 Allied with rebels" (fog-of-war)

### 3. Delayed Consequence System

```typescript
interface DelayedConsequence {
  crisisId: string; // "trust-miller"
  chosenFork: string; // "trust-offer"
  dueAtTurn: number; // 150
  consequenceType: 'reveal' | 'betrayal' | 'reward' | 'penalty' | 'crisis_unlock';
  payload: any; // {npcId: "miller", secret: "nobles_plan", ally: true}
}
```

**Lifecycle:**
1. **T50:** Player chooses "Trust the miller" → writes `DelayedConsequence{dueAtTurn: 150, consequenceType: 'reveal'}`
2. **T50-149:** Miller acts trustworthy, no betrayal signs
3. **T150:** ArcDirector checks `delayedConsequences[].dueAtTurn <= 150` → commits consequence before GM
4. **T150 outcome A (trusted correctly):** Miller reveals nobles' plan + becomes ally + quest stage advance
5. **T150 outcome B (trusted incorrectly):** Miller betrays + steals item + becomes enemy

**Payoff types:**

| Type | Example | Ledger Impact |
|------|---------|---------------|
| **Reveal** | Miller tells secret | Add lorebook entry, quest tick, NPC ally |
| **Betrayal** | Miller steals item | Remove item, NPC becomes enemy, faction penalty |
| **Reward** | Lord grants resources | Add gold/items, faction boost, access unlock |
| **Penalty** | Lord punishes delay | Faction penalty, resource loss, quest fail |
| **Crisis unlock** | New crisis becomes available | Spawn follow-up crisis (only accessible on this branch) |

### 4. Convergence Detection

Parallel branches can merge when **story facts align**:

**Example:**
- **Branch A:** Player trusts miller → miller reveals nobles' plan at T150
- **Branch B:** Player doubts miller → player discovers nobles' plan at dungeon T140
- **Convergence:** Both branches have `noblesplanKnown=true` → crisis "Confront nobles" becomes available on both paths at T160

```typescript
interface ConvergenceCondition {
  requiredFacts: BranchFact[]; // [{key: "noblesPlanKnown", value: true}]
  convergenceCrisisId: string; // "confront-nobles"
  convergesAtTurn: number; // 160
}

function detectConvergence(ledger: PyoaBranchLedger, conditions: ConvergenceCondition[]): string[] {
  return conditions
    .filter(c => c.requiredFacts.every(f => ledger.facts.includes(f)))
    .map(c => c.convergenceCrisisId);
}
```

**Why convergence matters:**
- Prevents "fake branching" (parallel branches that never affect story)
- Allows **story spine** to funnel branches toward key crises
- Reduces content explosion (don't need 100% unique content per branch)
- Player trusts choices matter even when branches merge

### 5. Ending Gates (6-8 per Bible)

Each PYOA bible has **typed terminal endings** reachable by T100-150:

**Thornferry Road endings:**

| Ending | Prerequisites | Turn Window | Outcome |
|--------|---------------|-------------|---------|
| **A: Lord's Champion** | `lordAlly=true`, quest complete | T100-120 | Rewarded by lord, settles in town, peaceful ending |
| **B: Rebel Hero** | `rebelAlly=true`, quest complete | T100-120 | Lead rebellion, overthrow lord, chaotic ending |
| **C: Lone Wanderer** | `soloPath=true`, quest failed | T80-100 | Leave town, no allies, bittersweet ending |
| **D: Miller's Betrayal** | `millerTrusted=true`, betrayal payoff | T150-170 | Betrayed by miller, lose resources, revenge path or forgive |
| **E: Noble Exposure** | `noblesPlanKnown=true`, confrontation | T160-180 | Expose nobles, political upheaval, justice or chaos |
| **F: Tragic Sacrifice** | Allied faction, final crisis | T180-200 | Sacrifice for faction, heroic death, legacy ending |

**Ending gate mechanics:**

```typescript
interface EndingGate {
  endingId: string; // "lords-champion"
  prerequisites: BranchFact[]; // [{key: "lordAlly", value: true}, {key: "questComplete", value: true}]
  turnWindow: [number, number]; // [100, 120]
  triggerCrisis: string; // "final-confrontation-lord"
  terminalReceipt: string; // "Ending: Lord's Champion"
}

function checkEndingGates(state: GameState, gates: EndingGate[]): EndingGate | null {
  const turn = state.turn;
  return gates.find(g =>
    turn >= g.turnWindow[0] && turn <= g.turnWindow[1] &&
    g.prerequisites.every(f => state.pyoaBranchLedger.facts.includes(f))
  ) ?? null;
}
```

**When ending gate triggers:**
1. ArcDirector commits `triggerCrisis` (final confrontation)
2. GM narrates ending beat (lord rewards, town celebrates, player settles)
3. `playPhase` transitions to `'ended'`
4. EpitaphBar shows "Ending: Lord's Champion"
5. Journal unlocks "True Ending A of 6"

### 6. Fog-of-War Journal UX

**Goal:** Show player what branches they locked **without spoiling** what other branches would contain.

**Journal sections:**

| Section | Content | Example |
|---------|---------|---------|
| **Active Crises** | Current available forks | "Millstone Charter: Sign alliance or Reject lord" |
| **Locked Branches** | Crises chosen + forks locked | "🔒 Rejected lord's offer (chose rebel path)" |
| **Delayed Payoffs** | Upcoming consequences (vague) | "Miller's loyalty will be tested soon..." |
| **Convergence Hints** | Parallel branches merging | "Your rebel path and solo path both lead to noble exposure" |
| **Endings Unlocked** | Terminal branches available | "Ending: Rebel Hero (available at T100+)" |

**Anti-patterns (avoid):**
- ❌ Full tree spoiler (Inkle-style) — shows all branches + content (removes surprise)
- ❌ No visualization — player confused about what choices did
- ❌ Reveal locked content — "You could have allied with lord and gotten X reward" (FOMO, not fog-of-war)

**Recommended UX:**
- ✅ Show crisis name + chosen fork + locked forks (no content spoilers)
- ✅ Show delayed payoffs as vague hints ("Miller will reveal his true nature")
- ✅ Show endings unlocked (name only, no content preview)
- ✅ Replay value: Journal shows "5 of 6 endings discovered" after multiple playthroughs

### 7. Replay Scaffolding

**Goal:** Encourage players to replay PYOA bibles to discover different endings.

**Seed-stable branching:**
- Crisis deck order is seeded from `runManifest.seed`
- Player choices override seed (not RNG-driven branching)
- Same seed + same choices = identical story
- Same seed + different choices = different branch path

**Replay incentives:**

| Incentive | Mechanic | Example |
|-----------|----------|---------|
| **Ending count** | Journal shows "3 of 6 endings discovered" | Encourages replaying to find all endings |
| **Branch preview** | Locked branches show vague hint | "You could have trusted the miller..." |
| **Speedrun mode** | Skip opening covers on replay | Start at T5 with kit + memory intact |
| **Achievement badges** | Unlock badges per ending | "Rebel Hero", "Lone Wanderer", "Betrayed by Miller" |

---

## Design Questions

### 1. Branch Visualization Style

**Question:** Should Journal show full tree (Inkle-style) or fog-of-war (Telltale-style)?

**Options:**
- **A. Full tree spoiler (Inkle-style):** Journal shows all branches + crisis names + fork labels (removes surprise, clear structure)
- **B. Fog-of-war (Telltale-style):** Journal shows locked branches without content spoilers (surprise intact, may confuse)
- **C. No visualization:** No journal tree, only active crisis (player blind to branches)

**Recommendation:** **Option B (fog-of-war)** — shows locked branches ("You rejected the lord") without spoiling alternate content, preserves surprise + replay value.

### 2. Ending Density

**Question:** How many endings per bible? How many turns to reach ending?

**Options:**
- **A. Sparse (3-4 endings, T150-200):** Fewer endings, longer stories, more content per branch
- **B. Standard (6-8 endings, T100-150):** Enough variety for replay, manageable content authoring
- **C. Dense (10-12 endings, T80-120):** High replay value, content explosion risk

**Recommendation:** **Option B (6-8 endings, T100-150)** — enough to feel like real branching, not so many that content authoring explodes.

### 3. Convergence Frequency

**Question:** How often should parallel branches merge?

**Options:**
- **A. Frequent (every 30-50t):** Branches funnel toward spine, reduces content explosion
- **B. Rare (1-2 per bible):** Branches stay divergent, high content cost
- **C. Never:** Fully divergent branches (maximum content explosion)

**Recommendation:** **Option A (frequent convergence)** — allows **story spine** to funnel branches, reduces content cost, still feels branchy if exclusive facts persist.

### 4. Delayed Payoff Timing

**Question:** How long should delayed consequences take to manifest?

**Options:**
- **A. Short (20-30 turns):** Payoff visible within same session
- **B. Medium (50-80 turns):** Payoff delayed enough to surprise player
- **C. Long (100-150 turns):** Payoff near ending (high impact, may be forgotten)

**Recommendation:** **Option B (50-80 turns)** — delayed enough to surprise, not so long that player forgot the choice.

### 5. Crisis Lock Permanence

**Question:** Can locked branches ever reopen?

**Options:**
- **A. Permanent lock:** Once locked, never reopens (true branching)
- **B. Conditional reopen:** New evidence can reopen locked crisis (convergence-lite)
- **C. Time-gated reopen:** Crisis reopens after N turns (soft lock)

**Recommendation:** **Option A (permanent lock)** — true branching requires irreversible choices, reopening undermines branch persistence.

### 6. Replay Incentive Design

**Question:** How to encourage replay without forcing it?

**Options:**
- **A. Ending count only:** Journal shows "3 of 6 endings" (completionist hook)
- **B. Unlockable content:** Discovering all endings unlocks bonus content (achievement system)
- **C. Speedrun mode:** Replay skips opening, starts at first crisis (convenience)
- **D. No replay incentives:** One playthrough is complete experience

**Recommendation:** **Option A+C (ending count + speedrun)** — encourages replay without gating core content behind multiple playthroughs.

---

## Deliverable Specification (10 Items)

### Deliverable 1: Branch Persistence Constitution

**Format:** Markdown specification + design principles

**Contents:**
- Branch lifecycle (crisis → fork → lock → payoff → ending)
- Exclusive facts rules (what makes branches mutually exclusive)
- Delayed consequence patterns (T50 choice → T150 payoff)
- Convergence conditions (when parallel branches merge)
- Ending gate mechanics (prerequisites, turn windows, terminal receipts)
- Fog-of-war Journal principles (show locks without spoiling content)
- Replay scaffolding (seed-stable branching, speedrun mode)

**Integration:** Feeds into all subsequent deliverables (D2-D10)

---

### Deliverable 2: Crisis Deck Catalog (Per-Bible)

**Format:** 3-5 PYOA bible crisis decks (5-8 crises each)

**Contents (example: Thornferry Road):**

| Crisis | Forks | Exclusive Facts | Delayed Payoff | Ending Path |
|--------|-------|-----------------|----------------|-------------|
| **Millstone Charter** | Sign / Reject | `lordAlly` XOR `rebelAlly` | T100 lord reward/punish | A (lord) or B (rebel) |
| **Trust Miller** | Trust / Doubt | `millerTrusted` XOR `millerDoubt` | T150 reveal/betray | Converges if secret known |
| **Bandits or Villagers** | Bandits / Villagers | `banditAlly` XOR `villagerAlly` | T80 faction support | C (chaos) or D (order) |
| **Reveal Secret** | Truth / Conceal | `secretRevealed` XOR `secretHidden` | T120 ally/enemy | Converges if exposed |
| **Alliance Proposal** | Join / Solo | `factionMember` XOR `soloPath` | T100 resources/freedom | E (faction) or F (solo) |
| **Final Confrontation** | Various by branch | Terminal facts | Immediate | Ending A-F based on facts |

**Per-crisis spec:**
- Telegraph turn window (e.g., T30-50)
- Fork labels (2-4 choices)
- Exclusive facts (what locks)
- Delayed payoff (turn + consequence type)
- Ending path (which ending this opens/closes)
- Convergence condition (when merges with other branch)

**Integration:** `src/game/bibles/thornferry-road/crises.json` (also Vesper Glass, Erebus-9, etc.)

---

### Deliverable 3: Branch Lock Schema + Enforcement

**Format:** TypeScript interfaces + lock enforcement algorithm

**Contents:**
- `PyoaBranchLock` schema (crisis ID, chosen fork, locked forks, exclusive facts)
- `BranchFact` schema (key, value, exclusive-with list)
- Lock enforcement logic (ArcDirector checks ledger before spawning crisis)
- Lock display logic (Journal shows "🔒 Rejected lord" when `lordAlly=true`)

**Integration:** Extends `src/game/pyoaBranchLedger.ts` + ArcDirector crisis spawn picker

---

### Deliverable 4: Exclusive Facts System

**Format:** Fact registry + conflict detection algorithm

**Contents:**
- Exclusive fact pairs (lordAlly XOR rebelAlly, millerTrusted XOR millerDoubt)
- Conflict detection (prevent writing exclusive facts)
- Fact retrieval (check if branch locked by querying exclusive facts)
- Fact display (Journal shows active facts + locked facts)

**Integration:** `src/game/pyoaExclusiveFacts.ts` + branch lock enforcement

---

### Deliverable 5: Delayed Consequence System

**Format:** TypeScript schema + payoff scheduler

**Contents:**
- `DelayedConsequence` schema (crisis ID, fork, due turn, consequence type, payload)
- Consequence scheduler (ArcDirector checks `dueAtTurn <= currentTurn` every commit)
- Consequence types (reveal, betrayal, reward, penalty, crisis_unlock)
- Ledger writer (atomic commits for payoffs before GM prose)

**Integration:** `src/game/pyoaDelayedConsequences.ts` + ArcDirector pre-GM scheduler

---

### Deliverable 6: Convergence Detection Logic

**Format:** Convergence condition table + detection algorithm

**Contents:**
- Per-crisis convergence conditions (required facts, convergence crisis ID, turn)
- Detection algorithm (check if all required facts present on ledger)
- Convergence crisis spawn (ArcDirector spawns convergence crisis when conditions met)
- Journal display (show "Your paths converge at [crisis name]")

**Integration:** `src/game/pyoaConvergence.ts` + ArcDirector convergence picker

---

### Deliverable 7: Ending Gate Catalog (Per-Bible)

**Format:** 6-8 ending gates per PYOA bible

**Contents (example: Thornferry Road):**

| Ending | Prerequisites | Turn Window | Trigger Crisis | Terminal Receipt |
|--------|---------------|-------------|----------------|------------------|
| **Lord's Champion** | `lordAlly`, `questComplete` | T100-120 | "final-confrontation-lord" | "Ending: Lord's Champion" |
| **Rebel Hero** | `rebelAlly`, `questComplete` | T100-120 | "final-confrontation-rebel" | "Ending: Rebel Hero" |
| **Lone Wanderer** | `soloPath`, `questFailed` | T80-100 | "leave-town" | "Ending: Lone Wanderer" |
| **Betrayed by Miller** | `millerTrusted`, betrayal payoff | T150-170 | "millers-betrayal" | "Ending: Betrayed" |
| **Noble Exposure** | `noblesPlanKnown`, confrontation | T160-180 | "expose-nobles" | "Ending: Justice or Chaos" |
| **Tragic Sacrifice** | Allied faction, final crisis | T180-200 | "final-stand" | "Ending: Heroic Death" |

**Per-ending spec:**
- Ending ID + name
- Prerequisites (branch facts required)
- Turn window (earliest/latest turn)
- Trigger crisis (final beat)
- Terminal receipt (playPhase → 'ended', epitaph message)

**Integration:** `src/game/bibles/thornferry-road/endings.json` + ArcDirector ending gate checker

---

### Deliverable 8: Fog-of-War Journal UX Spec

**Format:** UI mockup + interaction design + prose templates

**Contents:**
- Journal sections (Active Crises, Locked Branches, Delayed Payoffs, Endings Unlocked)
- Lock display ("🔒 Rejected lord's offer" without spoiling alternate content)
- Payoff hints ("Miller's loyalty will be tested soon...")
- Ending count ("3 of 6 endings discovered")
- Convergence hints ("Your paths converge at noble exposure")

**Integration:** `src/components/PlayAreaComponents/QuestJournal.tsx` + PYOA branch section

---

### Deliverable 9: Replay Scaffolding Design

**Format:** Replay mechanics spec + incentive design

**Contents:**
- Seed-stable branching (crisis deck order from manifest seed)
- Player choice overrides (not RNG branching)
- Speedrun mode (skip opening covers on replay, start at T5)
- Ending count incentive (Journal shows "N of 6 endings")
- Achievement badges (unlock per ending)
- Branch preview hints (locked branches show vague teaser)

**Integration:** `src/game/replayMode.ts` + Journal ending counter + New Game speedrun option

---

### Deliverable 10: Implementation Backlog + Eval Harness

**Format:** CSV backlog (30-40 tasks) + JSON eval gates

**Contents:**

**Implementation tasks:**
- P0: Branch lock schema, exclusive facts, delayed consequences, ending gates
- P1: Convergence detection, fog-of-war Journal, crisis deck authoring (5-8 per bible)
- P2: Replay scaffolding (speedrun mode, achievement badges)

**Eval gates:**
- **G1:** 0 crisis repetition (same crisis max 1× per run)
- **G2:** 100% crises lock sibling forks (branch persistence works)
- **G3:** 80%+ runs reach ending by T150 (endings reachable)
- **G4:** 50%+ crises have delayed payoffs (T50→T150 consequences manifest)
- **G5:** Exclusive facts prevent contradictions (no `lordAlly` + `rebelAlly` simultaneously)

**Integration:** `docs/research/manus-pyoa-implementation-backlog-2026-08-28.md` + `evalHarness/pyoa-quality-gates.json`

---

## Success Metrics

### Gameplay Metrics (Measurable)

|| Metric | Current (27w) | Target (Post-WS-5) | Measurement |
|---|---|---|---|---|
| **Crisis repetition** | Millstone Charter 288× | Same crisis max 1× | Count crisis spawns per run |
| **Branch persistence** | Crisis receipts without lock | 100% crises lock forks | Count locked branches per run |
| **Endings reached** | 0 in 300t | 80%+ by T150 | Count `playPhase === 'ended'` before T150 |
| **Delayed payoffs** | Immediate-only impact | 50%+ crises have T50→T150 payoff | Count `delayedConsequences[].dueAtTurn > turn+50` |
| **Exclusive facts** | No contradictions tracked | 0 runs with contradictory facts | Audit `lordAlly` + `rebelAlly` simultaneously |
| **Gemini PYOA score** | ~2/10 | ~6-8/10 | Gemini eval after rerun |

### Quality Gates (Pass/Fail)

| Gate | Criteria | How to Measure |
|------|----------|----------------|
| **G1: No repetition** | Same crisis max 1× per run | `crisisSpawnCounts[crisisId] <= 1` |
| **G2: Branch locks** | 100% crises lock sibling forks | `branchLocks.length === crisisChoices.length` |
| **G3: Endings reached** | 80%+ runs reach ending by T150 | `endedRuns / totalRuns >= 0.8` where `turn <= 150` |
| **G4: Delayed payoffs** | 50%+ crises have payoffs | `delayedConsequences.length / crisisChoices.length >= 0.5` |
| **G5: No contradictions** | 0 exclusive fact conflicts | `exclusiveFactConflicts === 0` per run |

---

## Integration Checklist

### Code Integration Points

- [ ] **1. PyoaBranchLedger** (`src/game/pyoaBranchLedger.ts` extension)
  - Branch lock schema (crisis ID, chosen fork, locked forks, exclusive facts)
  - Exclusive facts system (conflict detection, retrieval, display)
  
- [ ] **2. PyoaDelayedConsequences** (`src/game/pyoaDelayedConsequences.ts`)
  - Delayed consequence schema (due turn, consequence type, payload)
  - Consequence scheduler (ArcDirector checks every commit)
  - Ledger writer (atomic commits for payoffs)
  
- [ ] **3. PyoaConvergence** (`src/game/pyoaConvergence.ts`)
  - Convergence condition table (required facts, convergence crisis)
  - Detection algorithm (check facts on ledger)
  - Convergence crisis spawn
  
- [ ] **4. PyoaEndingGates** (`src/game/pyoaEndingGates.ts`)
  - Ending gate catalog (6-8 per bible)
  - Gate checker (prerequisites + turn window)
  - Terminal receipt (playPhase → 'ended')
  
- [ ] **5. CrisisDeckRegistry** (`src/game/bibles/*/crises.json`)
  - 5-8 crisis specs per PYOA bible
  - Per-crisis: telegraph, forks, exclusive facts, payoff, ending path
  
- [ ] **6. ArcDirector** (`src/game/arcDirector.ts` extension)
  - Crisis spawn picker (check branch locks before spawning)
  - Delayed consequence scheduler (commit payoffs before GM)
  - Convergence crisis spawn (detect conditions, spawn convergence)
  - Ending gate checker (trigger terminal crisis when prerequisites met)
  
- [ ] **7. SituationPacket** (`src/game/situationPacket.ts` extension)
  - Include branch ledger (locked forks, exclusive facts, delayed payoffs)
  - Include ending hints (available endings based on facts)
  - Bind GM to branch locks (don't re-offer locked crisis)
  
- [ ] **8. ProseWarden** (`src/game/proseWarden.ts` extension)
  - Verify GM honors branch locks (don't mention locked crisis)
  - Verify GM honors exclusive facts (no contradictions)
  - Verify GM honors delayed payoffs (manifest at due turn)
  
- [ ] **9. QuestJournal** (`src/components/PlayAreaComponents/QuestJournal.tsx` extension)
  - Add PYOA branch section (Active Crises, Locked Branches, Delayed Payoffs, Endings)
  - Fog-of-war display (show locks without spoiling content)
  - Ending counter ("3 of 6 endings discovered")
  
- [ ] **10. ReplayScaffolding** (`src/game/replayMode.ts`)
  - Seed-stable branching (crisis deck order from manifest)
  - Speedrun mode (skip opening on replay)
  - Ending count tracking (across multiple runs)
  
- [ ] **11. EvalHarness** (`scripts/fate-autoplay/evalHarness.ts`)
  - PYOA quality gates (repetition, locks, endings, payoffs, contradictions)
  - Per-run PYOA metrics (crisis count, branch count, ending reached, payoff count)

---

## Timeline Estimate

### Research Phase (4-6 days)

| Day | Deliverable | Effort |
|-----|-------------|--------|
| **1** | D1 (Constitution) + D3 (Branch lock schema) | Design principles + lock enforcement |
| **2** | D2 (Crisis deck catalog: Thornferry + Vesper Glass) | 5-8 crises × 2 bibles |
| **3** | D4 (Exclusive facts) + D5 (Delayed consequences) | Fact registry + payoff scheduler |
| **4** | D6 (Convergence) + D7 (Ending gates) | Detection logic + 6-8 endings per bible |
| **5** | D8 (Fog-of-war Journal) + D9 (Replay scaffolding) | UX spec + replay mechanics |
| **6** | D10 (Backlog + Eval) + polish | 30-40 tasks + quality gates |

### Implementation Phase (After Research)

| Wave | Tasks | Effort | Integration |
|------|-------|--------|-------------|
| **Wave 1** | Branch lock + exclusive facts + delayed consequences | 3-4 days | `pyoaBranchLedger.ts`, `pyoaDelayedConsequences.ts`, `pyoaExclusiveFacts.ts` |
| **Wave 2** | Convergence + ending gates + ArcDirector integration | 2-3 days | `pyoaConvergence.ts`, `pyoaEndingGates.ts`, `arcDirector.ts` |
| **Wave 3** | Crisis deck authoring (5-8 × 3-5 bibles = 15-40 crises) | 3-4 days | `bibles/*/crises.json` content authoring |
| **Wave 4** | Fog-of-war Journal + replay scaffolding | 2-3 days | `QuestJournal.tsx`, `replayMode.ts` |
| **Wave 5** | Eval harness + quality gates + validation | 1-2 days | `evalHarness.ts`, 12×300 autoplay rerun |

**Total Implementation:** 11-16 days after research complete

---

## Dependencies

### Depends On (Must Exist First)

- ✅ **Path A Wave 1** (ArcDirector + BeatContract) — WS-5 needs pre-GM commit flow
- ✅ **pyoaBranchLedger** (29c) — WS-5 extends existing branch lock schema
- ✅ **StateTx** (28a) — WS-5 uses atomic event commits
- ⚠️ **beatContract registry** (28a partial) — WS-5 needs beat contracts for crisis specs

### Blocks (Cannot Proceed Until WS-5 Complete)

- ❌ **Path A Wave 2 complete** (B025 PYOA branch persistence) — needs WS-5 spec
- ❌ **PYOA content depth** — needs crisis deck catalog + ending gates
- ❌ **Gemini quality uplift** — PYOA stays ~2/10 without branch fixes

### Parallel (Can Research Concurrently)

- ✅ **WS-2 (NPC Role + Memory)** — independent research track
- ⚠️ **WS-4 (Encounter Bible)** — partial overlap (PYOA crisis templates in D5 of WS-4)

---

## Unknowns & Assumptions

### Unknowns (Need Evidence)

1. **Do PYOA players want full tree reveal or fog-of-war?**
   - **Study:** Show branch visualization prototypes (Inkle vs Telltale vs hidden); measure engagement
   - **Impact:** Affects Journal UX (full tree vs fog-of-war vs no visualization)

2. **How many endings are optimal? 3-4, 6-8, or 10-12?**
   - **Study:** A/B test ending density; measure replay rate
   - **Impact:** Affects content authoring effort (more endings = more content)

3. **Do players notice delayed payoffs or do they forget the T50 choice by T150?**
   - **Study:** Track player memory; ask "did you remember trusting the miller 100 turns ago?"
   - **Impact:** Affects delayed payoff timing (50-80 turns vs 100-150 turns)

4. **Do players replay PYOA bibles or one-shot them?**
   - **Study:** Track replay rate; measure ending discovery count
   - **Impact:** Affects replay incentive design (ending count vs unlockable content)

### Assumptions (Treating as True Unless Proven False)

1. **Gemini complaints are player-aligned** — theater branching frustrates real players
2. **Branch locks are necessary** — crisis repetition breaks trust
3. **Delayed payoffs add value** — T50 choice with T150 consequence feels meaningful
4. **Convergence reduces content explosion** — parallel branches can merge without feeling fake
5. **6-8 endings are enough** — variety for replay without content explosion

---

## Honest Outlook

### What WS-5 Will Fix

- ✅ **Crisis repetition** (Millstone Charter 288×) — branch locks prevent re-offering
- ✅ **Theater branching** (choices don't matter) — exclusive facts make branches real
- ✅ **No endings** (300t, still mid-story) — ending gates reachable by T100-150
- ✅ **Delayed payoffs** (crisis has immediate-only impact) — T50→T150 consequences
- ✅ **Journal clarity** (player confused about branches) — fog-of-war shows locks

### What WS-5 Won't Fix

- ❌ **Crisis prose quality** (generic dialogue) — needs better writer or content banks
- ❌ **Convergence feel** (branches merge but feel railroady) — needs careful convergence design
- ❌ **Ending prose depth** (thin endings) — needs rich ending content authoring
- ❌ **Replay motivation** (one-shot enough?) — needs extrinsic incentives (achievements, unlocks)

### Honest Score Ceiling

| Implementation | Gemini PYOA Score | Player Impact |
|----------------|-------------------|---------------|
| **Pre-WS-5** (28a-29c) | ~2/10 | Theater branching, no endings, crisis loops |
| **Post-WS-5 Wave 1-2** | ~4-5/10 | Branches lock but may feel mechanical |
| **Post-WS-5 Wave 5** | ~6-8/10 | Real branching, endings reachable, replay value |
| **Aspirational 9-10** | Needs rich crisis content + convergence finesse + extrinsic replay incentives |

---

## Recommended Next Steps

### For John (Authorization)

1. **Authorize WS-5 research commission** (4-6 days)
2. Pick design options:
   - Branch visualization: **Fog-of-war** recommended
   - Ending density: **6-8 endings per bible** recommended
   - Convergence frequency: **Frequent (every 30-50t)** recommended
   - Delayed payoff timing: **Medium (50-80 turns)** recommended
3. Optionally: run 5-10 PYOA alpha testers to validate branch UX before full implementation

### For Manus (Research Execution)

1. Deliver 10 deliverables (D1-D10) within 4-6 days
2. Focus on **Thornferry Road crisis deck + ending gates** first (flagship PYOA bible)
3. Coordinate D2 (crisis deck) with WS-4 D5 (PYOA crisis templates) to avoid duplication

### For Engineering (After Research Complete)

1. Implement Wave 1 (branch lock + exclusive facts + delayed consequences) — 3-4 days
2. Implement Wave 2 (convergence + ending gates + ArcDirector integration) — 2-3 days
3. Author Wave 3 (15-40 crisis specs across 3-5 bibles) — 3-4 days
4. Wire into ArcDirector pre-GM commit flow (crisis locks, payoffs, endings)
5. Add fog-of-war Journal UX (locked branches, delayed hints, ending counter)
6. Add eval harness gates (repetition, locks, endings, payoffs, contradictions)

---

## References

### Prior Art

- **Inkle Engine (80 Days, Heaven's Vault):** Full tree spoiler, complex branching, convergence
- **Telltale Games (The Walking Dead):** Fog-of-war branching, delayed payoffs, terminal endings
- **Life is Strange:** Branch locks, rewind mechanic, delayed consequences
- **Choice of Games:** Text-based PYOA, stat-driven branching, multiple endings
- **Until Dawn:** Butterfly effect, delayed payoffs, terminal deaths

### Research Sources

- Gemini PYOA s188 review (`docs/bugs/gemini-reviews-2026-08-27/gemini-24-pyoa-vesper-glass-29b-300t.md`)
- Player-driven decisions (`docs/research/player-driven-decisions-2026-08-28.md`)
- Manus BIG CHANGES (`docs/research/manus-big-changes-ingest-2026-08-27.md`)
- Implementation status (`docs/research/implementation-status-2026-08-28.md`)
- PYOA bible research (`src/game/bibles/thornferry-road/`, `vesper-glass-cipher/`, etc.)

---

**Document Status:** Draft research brief awaiting authorization  
**Next Step:** John authorizes commission → Manus delivers 10 deliverables within 4-6 days
