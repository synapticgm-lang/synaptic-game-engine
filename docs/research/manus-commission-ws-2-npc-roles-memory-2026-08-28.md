# Manus Research Commission: WS-2 NPC Role + Memory System (2026-08-28)

**Commission ID:** WS-2  
**Priority:** P0 (Path A Wave 2 support)  
**Commissioned by:** John  
**Research type:** Design specification + implementation blueprint  
**Estimated research timeline:** 4-6 days  
**Status:** Awaiting authorization

---

## Executive Summary

### The Problem

NPCs currently lack lifecycle governance, creating infinite exposition loops that players recognize as artificial. Gemini DnD review s69 shows Aldous/Oskar recycling identical dialogue ~300 times with zero topic exhaustion or exit conditions. Players experience:

- **Infinite NPC availability** (Guide stays 300 turns)
- **Repeated revelations** (NPC reveals same secret multiple times)
- **No relationship memory** (NPC forgets previous betrayals, deals, favors)
- **Role confusion** (Guide becomes merchant becomes antagonist with no causal transition)

Current `npcTopicFsm` provides topic-level exhaustion but lacks:
- **Role obligation contracts** (what function this NPC must serve)
- **Memory persistence** (what key interactions to remember/reference)
- **Lifecycle patterns** (entrance → function → exit/transform timing)
- **Actor turnover** (when NPC exits if debt unsatisfied)

### Target State

A typed NPC role catalog (20-30 archetypes) with deterministic lifecycle patterns:

- **Role contracts:** Reveal clue by T15, oppose hero by T25, exit by T40
- **Memory ledger:** Key moments (first meet, quest-critical dialogue, faction changes, betrayals)
- **Lifecycle FSM:** Entrance → function → debt-satisfied → exit/transform
- **Topic exhaustion:** Topics move `unraised → hinted → contested → revealed → exhausted`
- **Integration:** Wires into ArcDirector pre-GM commits + npcTopicFsm + qualityGovernance

### Success Metrics

|| Metric | Current (27w) | Target (Post-WS-2) |
|---|---|---|---|
| **NPC recycle** | Aldous/Oskar same dialogue 300× | NPC exits after function served |
| **Topic repetition** | Same revelation multiple times | Topics exhaust after reveal |
| **Role clarity** | Guide → merchant → antagonist (no transition) | Typed roles with obligation timelines |
| **Memory persistence** | NPC forgets betrayal after scene change | Key moments persist across scenes |
| **Gemini NPC score** | ~2-3/10 (mechanical loops) | ~6-8/10 (functional NPCs with exits) |

---

## Problem Statement

### Player Evidence (Strong)

**Gemini DnD s69 (Shattered Coast):**
- Aldous dialogue loop: introduced self 8×, gave same exposition ~40×
- Oskar recycle: met 6×, forgot previous interactions
- No topic exhaustion: player asks "who are you" → same answer every time
- Zero exit conditions: NPCs stay available 300 turns despite function complete

**Gemini RPG s137 (Cape District):**
- Social NPCs have no relationship memory
- Leverage topics don't exhaust (same threat works forever)
- NPCs don't reference previous deals, betrayals, or favors
- No role obligations (NPCs loop exposition without advancing plot)

**Playtest evidence:**
- Jax E4: "Why is this person still here after I completed their quest?"
- Pattern: Guide NPC gives clue, player acts on clue, Guide still offers same clue

### Current State (Partial Implementation)

**What exists (28a-29c):**
- `npcTopicFsm.ts`: Topic states (`unraised → hinted → contested → revealed → exhausted`)
- `sceneFacts.present[]`: Tracks who's in the scene
- `npcMemories` ledger: Basic memory structure (thin)
- Opening NPC pin: First NPC persists across scenes

**What's missing:**
- ❌ Role obligation contracts (what this NPC owes to the story)
- ❌ Turn deadlines (exit by T40 if debt not satisfied)
- ❌ Key moments ledger (betrayal, deal, quest-critical dialogue)
- ❌ Actor turnover logic (if ignored, NPC transforms or exits)
- ❌ Role catalog (20-30 typed archetypes)
- ❌ Cross-scene memory sync (does faction know you betrayed NPC in town?)

### Why Now (Urgency)

- **Path A Wave 2:** NPC role obligations are B023 in implementation backlog (after exhaustion systems)
- **Player pain:** Gemini explicitly scores DnD/RPG low on NPC quality (~2-3/10)
- **Genre expectations:** Story RPG needs functional NPCs that serve plot then exit
- **Retention risk:** Infinite NPCs break immersion ("why is this person still here?")

---

## Target State Vision

### 1. Typed Role Catalog (20-30 Archetypes)

Each role has:
- **Function:** What story debt this NPC owes (reveal, oppose, bargain, misdirect, accompany)
- **Entrance pattern:** When this NPC appears (opening, quest trigger, hub arrival)
- **Obligation timeline:** By what turn must function be served
- **Exit condition:** How this NPC leaves (debt satisfied, deadline missed, player choice)
- **Transform pattern:** How role can evolve (ally → betrayer, merchant → quest-giver)

**Example roles:**

| Role | Function | Timeline | Exit |
|------|----------|----------|------|
| **Mysterious Guide** | Reveal first clue | By T15 | Exit after clue revealed + player acts |
| **Faction Ambassador** | Offer alliance | By T20 | Exit after deal accepted/rejected |
| **Recurring Merchant** | Sell 3× | No deadline | Exits after 3 transactions or player leaves hub |
| **Hidden Traitor** | Plant false clue | By T30 | Betrayal reveal forces exit/transform |
| **Quest-Giver** | Assign objective | By T10 | Exit after quest accepted |
| **Companion** | Accompany PC | No deadline | Player choice or story beat separation |
| **Boss Antagonist** | Oppose hero | By T50 | Combat/confrontation or escape |

### 2. Memory Ledger (Key Moments Only)

Store **event-based snapshots**, not full dialogue transcripts:

```typescript
interface NpcMemoryLedger {
  npcId: string;
  keyMoments: NpcKeyMoment[];
}

interface NpcKeyMoment {
  turn: number;
  category: 'first_meet' | 'quest_critical' | 'faction_change' | 'betrayal' | 'deal' | 'favor' | 'revelation';
  summary: string; // "Player betrayed me at the dock"
  impact: 'trust_gained' | 'trust_lost' | 'alliance' | 'enemy' | 'obligation_created';
  referenceable: boolean; // Can NPC mention this in future dialogue?
}
```

**What to remember:**
- ✅ First meeting
- ✅ Quest-critical interactions (gave clue, assigned quest, revealed secret)
- ✅ Faction-changing moments (alliance, betrayal, exile)
- ✅ Relationship deltas (trust gained/lost, favor owed)
- ❌ NOT: every casual dialogue line, minor observations, redundant exchanges

### 3. Lifecycle FSM (Entrance → Function → Exit)

```typescript
interface NpcLifecycle {
  state: 'entering' | 'functioning' | 'debt_satisfied' | 'exiting' | 'transformed' | 'absent';
  role: NpcRole; // from catalog
  enteredAtTurn: number;
  obligationDeadline: number | null; // T40 or null if no deadline
  debtSatisfied: boolean;
  exitReason?: 'function_complete' | 'deadline_missed' | 'player_choice' | 'story_beat';
}
```

**Lifecycle transitions:**

1. **Entering:** NPC spawns (opening, quest trigger, hub arrival)
2. **Functioning:** NPC serves role obligation (reveal clue, oppose hero, bargain)
3. **Debt Satisfied:** Obligation complete (clue revealed, opposition resolved, deal made)
4. **Exiting:** NPC leaves (function complete, ignored past deadline, player choice)
5. **Transformed:** NPC role changes (ally → betrayer, merchant → quest-giver)
6. **Absent:** NPC gone from game (unless story beat brings back)

### 4. Topic Exhaustion (Already Partial)

Extend existing `npcTopicFsm` with:
- ✅ `unraised → hinted → contested → revealed → exhausted` (already exists)
- 📝 **NEW:** Topic revival conditions (new evidence can reopen exhausted topic)
- 📝 **NEW:** Cross-NPC topic sync (if one NPC reveals secret, other NPCs know faction version)

### 5. Actor Turnover Logic

If NPC obligation not satisfied by deadline:

| Miss Type | Consequence | Example |
|-----------|-------------|---------|
| **Ignored Guide** | Exits, leaves cryptic warning | "You ignored my warning. Good luck." |
| **Deadline Merchant** | Closes shop, moves to another hub | "Sold out. Try the next town." |
| **Betrayed Ally** | Transforms to enemy or neutral | "After what you did? We're done." |
| **Failed Quest-Giver** | Assigns quest to someone else | "I found another hero. You're too late." |

---

## Design Questions

### 1. Role Catalog Depth

**Question:** How many role archetypes are enough?

**Options:**
- **A. Minimal (10 roles):** Cover core functions only (guide, merchant, ally, antagonist, quest-giver, companion, traitor, faction-rep, boss, civilian)
- **B. Standard (20-25 roles):** Add variants (mysterious guide, trusted mentor, recurring merchant, one-time vendor, hidden traitor, obvious enemy, etc.)
- **C. Comprehensive (30-50 roles):** Full taxonomy with sub-roles (quest-giver → main-quest-giver vs side-quest-giver)

**Recommendation:** **Option B (20-25 roles)** — enough variety to feel authored, not so many that content authoring explodes.

### 2. Memory Scope

**Question:** How much NPC interaction history to persist?

**Options:**
- **A. Key moments only (5-10 per NPC):** First meet, quest-critical, faction changes, betrayals
- **B. Full ledger (every interaction):** Store every dialogue line, every scene presence
- **C. Hybrid (key moments + recent):** Last 5 interactions + all key moments

**Recommendation:** **Option A (key moments only)** — solves Gemini complaint (NPCs forget betrayals) without over-engineering full dialogue history.

### 3. Cross-Scene Memory Sync

**Question:** If player betrays NPC in town, does faction know in city?

**Options:**
- **A. Local memory (no sync):** Each NPC remembers only their own interactions
- **B. Faction-wide sync:** Betrayal in town spreads to all faction NPCs
- **C. Witness-based sync:** Only NPCs present or faction leadership know

**Recommendation:** **Option C (witness-based)** — realistic + content-manageable. If betrayal happens in front of faction leader or witnesses, it spreads. Otherwise local.

### 4. Role Obligation Timelines

**Question:** How strict are NPC deadlines?

**Options:**
- **A. Hard deadlines (always exit):** Miss T15 clue reveal → NPC exits with warning
- **B. Soft deadlines (transform only):** Miss deadline → NPC gets frustrated but stays
- **C. Player-choice deadlines:** NPC stays until player explicitly dismisses

**Recommendation:** **Option A (hard deadlines)** for core-function NPCs (guide, quest-giver), **Option B (soft deadlines)** for companions and merchants.

### 5. Topic Revival Conditions

**Question:** Can exhausted topics reopen?

**Options:**
- **A. Permanent exhaustion:** Once revealed, never rehash
- **B. Evidence-based revival:** New evidence can reopen topic with new angle
- **C. Turn-cooldown revival:** Topic reopens after N turns

**Recommendation:** **Option B (evidence-based revival)** — prevents staleness while avoiding infinite loops. Example: "You said the Circle was safe. This letter proves otherwise."

### 6. NPC Personality vs Role

**Question:** Do NPCs need personality models beyond role obligations?

**Options:**
- **A. Role-only (mechanical):** NPC is pure function (reveal clue, then exit)
- **B. Role + personality traits:** Add 2-3 traits (cautious, aggressive, honest, deceptive)
- **C. Full personality model:** Goals, fears, secrets, dynamic relationship graph

**Recommendation:** **Option B (role + light traits)** — enough to feel human, not so complex that authoring explodes.

---

## Deliverable Specification (10 Items)

### Deliverable 1: NPC Role Catalog Constitution

**Format:** Markdown table + prose specification

**Contents:**
- 20-25 typed role archetypes with function, timeline, exit, transform patterns
- Per-role entrance conditions (opening, quest trigger, hub arrival, story beat)
- Per-role obligation timelines (by T10, by T20, by T50, or no deadline)
- Per-role exit conditions (function complete, deadline missed, player choice)
- Per-role transform patterns (ally → betrayer, merchant → quest-giver)
- Genre-specific variants (LitRPG System Herald, DnD Quest Patron, RPG Faction Envoy, PYOA Crisis Catalyst)

**Integration:** Feeds into `npcRoleRegistry.ts` schema + ArcDirector NPC spawn logic

---

### Deliverable 2: Memory Ledger Schema

**Format:** TypeScript interface + JSON schema + example ledger

**Contents:**
- `NpcKeyMoment` event schema (category, summary, impact, referenceable)
- Key moment categories (first_meet, quest_critical, faction_change, betrayal, deal, favor, revelation)
- Memory persistence rules (what to store, what to discard)
- Cross-scene memory sync rules (witness-based, faction-wide for leadership)
- Memory retrieval patterns (how GM situation packet includes recent + key moments)

**Integration:** Extends `npcMemories` ledger + situation packet builder

---

### Deliverable 3: Lifecycle FSM Specification

**Format:** State diagram + transition table + TypeScript enum

**Contents:**
- Six lifecycle states (entering, functioning, debt_satisfied, exiting, transformed, absent)
- Transition conditions (obligation met, deadline missed, player choice, story beat)
- Per-role lifecycle patterns (guide exits after clue, merchant stays until 3 sales)
- Turn deadline enforcement (ArcDirector checks deadline every commit)
- Exit prose patterns (cryptic warning, graceful departure, abrupt vanish, transform reveal)

**Integration:** `npcLifecycle.ts` + ArcDirector pre-GM NPC turnover logic

---

### Deliverable 4: Topic Exhaustion Extensions

**Format:** FSM extension + revival condition table

**Contents:**
- Existing FSM extended: `unraised → hinted → contested → revealed → exhausted → [revival] → contested`
- Revival conditions (new evidence, contradictory fact, time-gated reopen)
- Cross-NPC topic sync (faction version of secret spreads to other NPCs)
- Topic cooldown (can't rehash same topic within N turns even with revival)

**Integration:** Extends `npcTopicFsm.ts` with revival edge + cooldown ledger

---

### Deliverable 5: Actor Turnover Logic

**Format:** Decision tree + consequence table + example beats

**Contents:**
- Turnover triggers (deadline missed, obligation ignored, player action forces exit)
- Per-role turnover consequences (guide leaves warning, merchant moves, ally transforms to enemy)
- Fallback patterns (if primary NPC exits, secondary NPC can step in for same role)
- Story-beat forced turnover (main quest advances, NPC must exit to avoid blocking spine)

**Integration:** `npcTurnover.ts` + ArcDirector pre-GM commit check

---

### Deliverable 6: Role Obligation Contract Templates

**Format:** 20-25 contract templates (one per role)

**Contents:**
- Per-role function debt (reveal clue, assign quest, oppose hero, bargain, accompany)
- Turn timeline (by T10, by T20, by T50, or no deadline)
- Success criteria (debt satisfied when player acts on clue, accepts quest, confronts opposition)
- Failure criteria (deadline missed, player ignores, player kills NPC)
- Exit prose (graceful, abrupt, warning, transform)

**Integration:** `npcRoleContracts/` JSON directory + ArcDirector NPC spawn picker

---

### Deliverable 7: Memory Retrieval Patterns

**Format:** Situation packet extension + prose rail examples

**Contents:**
- How to include NPC memory in GM situation packet (recent + key moments)
- Memory reference prose patterns ("You betrayed me at the dock", "We made a deal last week")
- Memory grounding rules (GM must reference key moment when relevant)
- Memory leak prevention (don't mention events NPC wasn't present for)

**Integration:** `situationPacket.ts` NPC memory builder + prose warden verification

---

### Deliverable 8: Cross-NPC Integration Rules

**Format:** Sync table + witness logic + faction propagation matrix

**Contents:**
- Witness-based sync (NPCs present at betrayal remember it)
- Faction leadership sync (betray faction leader → all faction NPCs know)
- Hub-local sync (merchant A knows merchant B gossip if same hub)
- Anti-sync (secret revealed to one NPC doesn't leak to enemy faction)

**Integration:** `npcMemorySyncEngine.ts` + ArcDirector cross-NPC ledger update

---

### Deliverable 9: Implementation Backlog

**Format:** CSV table (like Manus T9) with priority, ID, complexity, integration points

**Contents:**
- 30-40 implementation tasks (schema, lifecycle FSM, turnover logic, role catalog, memory ledger)
- P0 tasks (lifecycle FSM, role catalog, basic memory)
- P1 tasks (topic revival, cross-NPC sync, personality traits)
- P2 tasks (advanced memory retrieval, dynamic relationship graph)

**Integration:** Feeds into `docs/research/manus-npc-implementation-backlog-2026-08-28.md`

---

### Deliverable 10: Eval Harness (NPC Quality Gates)

**Format:** JSON eval spec + pass/fail criteria

**Contents:**
- **Gate 1:** NPC exits within N turns of debt satisfied (T15 clue → exit by T20)
- **Gate 2:** No topic repetition (same revelation max 1× per NPC)
- **Gate 3:** Key moments persist (betrayal at T50 referenced at T100)
- **Gate 4:** Role obligations met (quest-giver assigns quest by T10)
- **Gate 5:** Turnover fires (deadline missed → NPC exits with warning)

**Integration:** `evalHarness/npc-quality-gates.json` + fate-autoplay measurement

---

## Success Metrics

### Gameplay Metrics (Measurable)

|| Metric | Current (27w) | Target (Post-WS-2) | Measurement |
|---|---|---|---|---|
| **NPC exit rate** | 0% (NPCs stay 300t) | 80%+ (NPCs exit after function) | Track lifecycle state transitions |
| **Topic repetition** | Same revelation 5-10× | Same revelation max 1× | Count exhausted topic hits |
| **Memory reference** | 0 (NPCs forget) | 3-5 key moments/NPC | Count GM memory references in prose |
| **Role clarity** | Guide→merchant→enemy (no transition) | Typed role + lifecycle FSM | ArcDirector tracks role contracts |
| **Gemini NPC score** | ~2-3/10 (mechanical loops) | ~6-8/10 (functional NPCs) | Gemini eval after rerun |

### Quality Gates (Pass/Fail)

| Gate | Criteria | How to Measure |
|------|----------|----------------|
| **G1: NPC exits** | NPC exits within 10 turns of debt satisfied | `lifecycle.state === 'exiting'` by `obligationDeadline + 10` |
| **G2: Topic exhaust** | Same topic revelation max 1× per NPC | `topicFsm[topic].state === 'exhausted'` after reveal |
| **G3: Memory persist** | Key moments persist across 50+ turns | `npcMemories.keyMoments.length >= 3` at T100 |
| **G4: Role obligations** | 80%+ NPCs satisfy obligation by deadline | `debtSatisfied === true` by `obligationDeadline` |
| **G5: Turnover fires** | Deadline missed → NPC exits with warning | `exitReason === 'deadline_missed'` + warning prose |

---

## Integration Checklist

### Code Integration Points

- [ ] **1. NpcRoleRegistry** (`src/game/npcRoleRegistry.ts`)
  - Role catalog with 20-25 archetypes
  - Per-role obligation contracts (function, timeline, exit, transform)
  
- [ ] **2. NpcLifecycleFsm** (`src/game/npcLifecycle.ts`)
  - Six-state FSM (entering → functioning → debt_satisfied → exiting → transformed → absent)
  - Turn deadline enforcement
  - Exit/transform logic
  
- [ ] **3. NpcMemoryLedger** (`src/game/npcMemories.ts` extension)
  - Key moments schema (first_meet, quest_critical, betrayal, deal, etc.)
  - Memory persistence rules
  - Cross-scene sync (witness-based)
  
- [ ] **4. NpcTopicFsm** (`src/game/npcTopicFsm.ts` extension)
  - Topic revival conditions (evidence-based)
  - Cross-NPC topic sync
  - Topic cooldown ledger
  
- [ ] **5. NpcTurnover** (`src/game/npcTurnover.ts`)
  - Actor turnover triggers (deadline missed, player action)
  - Per-role turnover consequences
  - Fallback NPC spawn if primary exits
  
- [ ] **6. ArcDirector** (`src/game/arcDirector.ts` extension)
  - Pre-GM NPC lifecycle check (debt satisfied? deadline missed?)
  - NPC spawn picker (from role catalog)
  - NPC exit/transform commits
  
- [ ] **7. SituationPacket** (`src/game/situationPacket.ts` extension)
  - Include NPC memory (recent + key moments)
  - Include NPC role obligations (what debt is owed)
  - Include NPC lifecycle state (functioning, exiting, etc.)
  
- [ ] **8. ProseWarden** (`src/game/proseWarden.ts` extension)
  - Verify GM references NPC memory when relevant
  - Verify GM honors NPC exit (don't mention exited NPC)
  - Verify GM doesn't repeat exhausted topics
  
- [ ] **9. EvalHarness** (`scripts/fate-autoplay/evalHarness.ts`)
  - NPC quality gates (exits, topic exhaust, memory persist, obligations met, turnover fires)
  - Per-run NPC metrics (lifecycle transitions, memory count, exit reasons)

---

## Timeline Estimate

### Research Phase (4-6 days)

| Day | Deliverable | Effort |
|-----|-------------|--------|
| **1** | D1 (Role catalog) + D6 (Contract templates) | Taxonomy design + 20-25 role specs |
| **2** | D2 (Memory ledger) + D7 (Memory retrieval) | Schema design + example ledgers |
| **3** | D3 (Lifecycle FSM) + D5 (Turnover logic) | State diagram + transition rules |
| **4** | D4 (Topic exhaustion) + D8 (Cross-NPC sync) | FSM extension + sync matrix |
| **5** | D9 (Implementation backlog) | 30-40 tasks prioritized |
| **6** | D10 (Eval harness) + polish | Quality gates + final review |

### Implementation Phase (After Research)

| Wave | Tasks | Effort | Integration |
|------|-------|--------|-------------|
| **Wave 1** | Role catalog + lifecycle FSM + basic memory | 3-4 days | `npcRoleRegistry.ts`, `npcLifecycle.ts`, `npcMemories.ts` |
| **Wave 2** | Topic revival + turnover logic + ArcDirector integration | 2-3 days | `npcTopicFsm.ts`, `npcTurnover.ts`, `arcDirector.ts` |
| **Wave 3** | Cross-NPC sync + memory retrieval + prose warden | 2-3 days | `npcMemorySyncEngine.ts`, `situationPacket.ts`, `proseWarden.ts` |
| **Wave 4** | Eval harness + quality gates + validation | 1-2 days | `evalHarness.ts`, 12×300 autoplay rerun |

**Total Implementation:** 8-12 days after research complete

---

## Dependencies

### Depends On (Must Exist First)

- ✅ **Path A Wave 1** (ArcDirector + BeatContract) — WS-2 needs pre-GM commit flow
- ✅ **npcTopicFsm** (28a) — WS-2 extends existing topic exhaustion
- ✅ **StateTx** (28a) — WS-2 uses atomic event commits
- ⚠️ **BeatContract registry** (28a partial) — WS-2 needs beat contracts for role obligations

### Blocks (Cannot Proceed Until WS-2 Complete)

- ❌ **Path A Wave 2 complete** (B023 NPC role obligations) — needs WS-2 spec
- ❌ **DnD content depth** — needs role catalog for Aldous/Oskar exits
- ❌ **RPG social stakes** — needs memory ledger for relationship tracking
- ❌ **Gemini quality uplift** — DnD/RPG stay ~2-3/10 without NPC fixes

### Parallel (Can Research Concurrently)

- ✅ **WS-4 (Encounter Bible)** — independent research track
- ✅ **WS-5 (PYOA Branch Persistence)** — independent research track

---

## Unknowns & Assumptions

### Unknowns (Need Evidence)

1. **Do players notice NPC recycle or is it just Gemini's critic eye?**
   - **Study:** Run 5-10 human playtesters; ask "did any NPCs feel repetitive?"
   - **Impact:** If players don't notice, WS-2 may be over-engineering

2. **Do players want NPCs to exit or stay available?**
   - **Study:** A/B test hard deadlines vs soft deadlines; measure player confusion vs immersion
   - **Impact:** Affects role obligation strictness (Option A vs B from Design Questions)

3. **How much memory depth do players expect?**
   - **Study:** Instrument memory reference count; ask "did NPCs remember your choices?"
   - **Impact:** Affects memory ledger scope (key moments only vs full ledger)

4. **Do players care about cross-scene memory sync?**
   - **Study:** Test witness-based sync vs faction-wide; measure player confusion
   - **Impact:** Affects sync complexity (local vs faction-wide vs witness-based)

### Assumptions (Treating as True Unless Proven False)

1. **Gemini complaints are player-aligned** — Aldous/Oskar loops would frustrate real players
2. **Role obligations are genre-appropriate** — Story RPG needs functional NPCs that serve plot then exit
3. **Key moments are enough** — Don't need full dialogue history, just pivotal interactions
4. **20-25 roles are sufficient** — Covers core functions without content explosion
5. **ArcDirector can enforce deadlines** — Pre-GM commit flow supports NPC turnover logic

---

## Honest Outlook

### What WS-2 Will Fix

- ✅ **NPC recycle** (Aldous/Oskar loops) — lifecycle FSM forces exits
- ✅ **Topic repetition** (same revelation 5×) — topic exhaustion prevents rehash
- ✅ **Memory gaps** (NPCs forget betrayals) — key moments persist across scenes
- ✅ **Role clarity** (Guide→merchant→enemy) — typed roles with obligations

### What WS-2 Won't Fix

- ❌ **NPC prose quality** (generic dialogue) — needs better writer or content banks
- ❌ **NPC personality depth** (flat characters) — light traits help but not full psychology
- ❌ **Dynamic relationships** (who knows whom, who trusts whom) — deferred to P2
- ❌ **Procedural NPC generation** (ChatNPC-style) — orthogonal to repetition fix

### Honest Score Ceiling

| Implementation | Gemini NPC Score | Player Impact |
|----------------|------------------|---------------|
| **Pre-WS-2** (28a) | ~2-3/10 | NPCs loop forever, forget interactions |
| **Post-WS-2 Wave 1** | ~4-5/10 | NPCs exit but may feel mechanical |
| **Post-WS-2 Wave 3** | ~6-8/10 | Functional NPCs with memory + exits |
| **Aspirational 9-10** | Needs human content + personality models + dynamic relationships |

---

## Recommended Next Steps

### For John (Authorization)

1. **Authorize WS-2 research commission** (4-6 days)
2. Pick design options:
   - Role catalog depth: **Standard (20-25 roles)** recommended
   - Memory scope: **Key moments only** recommended
   - Cross-scene sync: **Witness-based** recommended
   - Deadlines: **Hard for core-function NPCs, soft for companions** recommended
3. Optionally: run 5-10 human playtesters to validate assumptions before full implementation

### For Manus (Research Execution)

1. Deliver 10 deliverables (D1-D10) within 4-6 days
2. Focus on **role catalog + lifecycle FSM + memory ledger** (Wave 1 priorities)
3. Defer **personality models + dynamic relationships** to P2 (avoid over-engineering)

### For Engineering (After Research Complete)

1. Implement Wave 1 (role catalog + lifecycle FSM + basic memory) — 3-4 days
2. Integrate with ArcDirector pre-GM commit flow (NPC turnover checks)
3. Wire into situation packet (NPC memory + role obligations + lifecycle state)
4. Extend prose warden (verify GM honors exits, references memory)
5. Add eval harness gates (exits, topic exhaust, memory persist, obligations met)

---

## References

### Prior Art

- **Inkle Narrative Engine:** NPC state tracking + relationship memory
- **Telltale Games:** NPC remembers player choices across episodes
- **Disco Elysium:** Skill-based NPC interactions with memory persistence
- **AI Dungeon:** Stateless NPCs (negative example — what not to do)
- **Facade:** NPC lifecycle with entrance/function/exit patterns

### Research Sources

- Gemini DnD s69 review (`docs/bugs/gemini-reviews-2026-08-27/gemini-10-dnd-storyfollower-27w-300t.md`)
- Gemini RPG s137 review (`docs/bugs/gemini-reviews-2026-08-27/gemini-11-rpg-completionist-27w-300t.md`)
- Player-driven decisions (`docs/research/player-driven-decisions-2026-08-28.md`)
- Manus BIG CHANGES (`docs/research/manus-big-changes-ingest-2026-08-27.md`)
- Implementation status (`docs/research/implementation-status-2026-08-28.md`)

---

**Document Status:** Draft research brief awaiting authorization  
**Next Step:** John authorizes commission → Manus delivers 10 deliverables within 4-6 days

