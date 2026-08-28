# WS-4 Encounter Bible — Ingest Document

**Package:** Complete WS4 Task.zip  
**Date extracted:** 2026-08-28  
**Location:** `docs/research/pasted/manus-ws-4-encounter-bible-2026-08-28/`  
**Status:** Implementation-ready

---

## Executive Summary

WS-4 solves the 290-turn combat purgatory and theater-choice failures through a single non-negotiable lifecycle: **telegraph → stakes → resolution → aftermath**. The package contains **48 authored encounter templates** across four modes (LitRPG, DnD, RPG, PYOA) with:

- **Bounded duration:** Every encounter declares `maxTurns` and a forced terminal fallback
- **Ledger-first resolution:** Code commits HP, resources, facts, and receipts BEFORE the GM writes prose
- **Hard biome filtering:** Wrong-bible spawns (Keep Wraith on Shattered Coast) are impossible
- **Density enforcement:** Location quotas + drought timers prevent empty dungeons and combat-free chapters
- **Receipt completeness:** Every terminal emits ≥2 reconciled receipt types (XP, loot, faction, quest, NPC, dungeon)

### Problem Statement

**Gemini LitRPG s18 evidence (300 turns):**
- T9–T300: stuck in combat purgatory
- Try to flee ×364 with no resolution
- Keep Wraith spawning on Saltmar/Shattered Coast (wrong bible)
- Zero encounter receipts (XP/loot/faction/quest)
- Gemini encounter scores ~1–2/10

**Target outcomes:**
- 5–8 encounter templates per mode
- Four-phase lifecycle with forced terminals
- Biome-appropriate spawns only
- FO3-like density (4–6 trash, 1–2 miniboss, 1 boss per dungeon)
- 100% resolution with reconciled receipts

---

## Deliverable Inventory

| ID | Deliverable | Files | Status |
|----|-------------|-------|--------|
| **D1** | Encounter Bible Constitution | `WS-4 Encounter Bible Constitution.md` | ✅ Complete |
| **D2** | LitRPG Encounter Library (8 templates) | `D2_litrpg_encounter_library.json` | ✅ Complete |
| **D3** | DnD Encounter Library (8 templates) | `D3_dnd_encounter_library.json` | ✅ Complete |
| **D4** | RPG Encounter Library (8 templates) | `D4_rpg_encounter_library.json` | ✅ Complete |
| **D5** | PYOA Crisis Library (24 crises, 6 per bible) | `D5_pyoa_crisis_library.json` | ✅ Complete |
| **D6** | Telegraph Pattern Catalog | `D6_telegraph_catalog.json`, `D6_telegraph_catalog.md` | ✅ Complete |
| **D7** | Stakes Clarity Templates | `D7_stakes_templates.json`, `D7_stakes_templates.md` | ✅ Complete |
| **D8** | Resolution Mechanics | `D8_resolution_mechanics.ts`, `D8_resolution_mechanics.md` | ✅ Complete |
| **D9** | Loot Table Design | `D9_loot_tables.json`, `D9_loot_tables.md` | ✅ Complete |
| **D10** | Biome-Appropriate Spawn Matrix | `D10_biome_spawn_matrix.csv`, `D10_biome_spawn_matrix.md` | ✅ Complete |
| **D11** | Density Targets and Enforcement | `D11_encounter_density.ts`, `D11_density_targets.md` | ✅ Complete |
| **D12** | Implementation Backlog + Eval Harness | `D12_implementation_backlog.csv`, `D12_eval_gates.json`, `D12_implementation_and_eval.md` | ✅ Complete |

**Supporting artifacts:**
- `encounter-template.schema.json` — Shared JSON schema for all templates
- `WS-4 Validation Report.md` — 462/462 checks passed
- `validation_results.json` — Machine-readable validation evidence
- `research_notes.md` — Research basis and design decisions
- `build_libraries.py` — Library build scripts
- `validate_package.py` — Package validation scripts

---

## Key Findings

### 1. Constitutional Invariants (C-01 through C-12)

| ID | Invariant | Enforced Rule | Failure Prevented |
|----|-----------|---------------|-------------------|
| **C-01** | Bounded duration | Every encounter declares `maxTurns` and forced terminal fallback | 290-turn combat purgatory |
| **C-02** | Single terminality | Exactly one terminal state committed once | Reopening resolved conflicts |
| **C-03** | Action honesty | Every displayed action has prerequisites, resolver, and state-changing result | Decorative flee/parley choices |
| **C-04** | Monotonic progress | Repeated action must advance success, danger, consume resource, or change position | Pad loops and leverage spam |
| **C-05** | Declared stakes | Player sees win/lose/flee/negotiate consequences before commitment | Invisible or arbitrary fallout |
| **C-06** | Receipt completeness | Terminal emits ≥2 material receipt types | Combat that "just ends" |
| **C-07** | Ledger authority | HP, clocks, resources, flags mutate in code before prose | Narrated but unpersisted progress |
| **C-08** | Biome hard filter | Candidates pass bible, biome, site, faction, tier, exclusion checks | Wrong-bible spawns |
| **C-09** | No success erasure | Partial success preserves promised effect; costs are separate mutations | "Success, but nothing happens" |
| **C-10** | No unchanged retry | Same approach cannot be offered from identical state after fail/partial | Infinite negotiation loops |
| **C-11** | Branch memory | PYOA forks write exclusive facts and ending eligibility before convergence | Theater branching |
| **C-12** | Idempotent aftermath | Receipt carries unique commit key and cannot apply twice | Duplicate XP, loot, or quest ticks |

### 2. Four-Phase Lifecycle

```
TELEGRAPH → STAKES → RESOLUTION → AFTERMATH
    ↓           ↓           ↓            ↓
  Warning    Legal      Atomic       Receipts
   Cues     Actions     Ledger       ≥2 types
            + Stakes    Commits
```

**Telegraph (≥80% pre-engagement):**
- Channel: STATUS, NPC, SCENE, ITEM, FACTION
- Signal + inference + action hook
- Surprise ambushes capped at moderate opening severity

**Stakes:**
- Label, requirements, method, chance, onSuccess, onPartial, onFailure, lockout
- Combat templates SHOULD expose win/lose/flee/negotiate
- No action without resolver and state delta

**Resolution:**
- Ledger first (HP, clocks, resources, faction, quest, NPC, dungeon)
- One step, one proof (persisted event with before/after)
- Forced terminal at `maxTurns`
- GM can flavor but cannot add damage, revoke rewards, resurrect enemies, or invent incompatible biome/faction facts

**Aftermath:**
- Receipt types: XP, LOOT, FACTION, QUEST, NPC, DUNGEON
- At least 2 nonempty types
- Idempotency key (encounter ID + terminal state + template version)

### 3. Template Structure

**Example (Summoned Pact Hub Ambush):**
```json
{
  "id": "summoned-pact.hub-ambush.ashknife-cell",
  "mode": "litrpg",
  "bibleId": "summoned-pact",
  "role": "ambush",
  "telegraph": {
    "channels": ["scene"],
    "cues": [{ "channel": "scene", "signal": "...", "inference": "...", "actionHook": "flee" }],
    "responseWindowTurns": 0,
    "surpriseEligible": true,
    "openingSeverityCap": "moderate"
  },
  "stakes": {
    "approaches": [
      {
        "id": "fight",
        "method": "combat",
        "check": { "clock": { "successSegments": 4, "dangerSegments": 4 } },
        "onSuccess": { "terminal": true, "stateChanges": [...], "terminalState": "victory" },
        "onPartial": { "terminal": false, "stateChanges": [...] },
        "onFailure": { "terminal": false, "stateChanges": [...] }
      }
    ]
  },
  "maxTurns": 8,
  "forcedTerminal": { "outcome": "victory", "reason": "...", "receipts": [...] }
}
```

### 4. Biome Spawn Matrix (Hard Filters)

**23 rows covering all modes:**
- Mode + Bible + Biome + Site Tags → Allowed encounter types + actors
- Excluded actors (e.g., no Keep Wraith on Shattered Coast)
- Min/Max tier
- Drought fallback (when no legal candidate exists)

**Filtering order:**
```
legal = bibleMatch
     && modeMatch
     && biomeAllowed
     && siteTagAllowed
     && tierWithinRange
     && factionPresentOrGeneric
     && prerequisiteFlagsSatisfied
     && exclusionTagsDisjoint
     && cooldownExpired
     && densityRoleAvailable
```

**Key rows:**
- LitRPG Summoned Pact: urban-hub, arcane-market, crypt-dungeon, contract-vault, badlands-road, broken-highlands, arena
- DnD Cursed Keep: servants-wing, chapel, cistern, ancestral-wing, keep-heart
- RPG Cape District: harbor, market, civic
- PYOA: thornferry-mill, thornferry-river, vesper-civic-glass, vesper-canals, erebus-life-support, erebus-command, ashwinter-whitewood, ashwinter-palace

### 5. Density Targets

| Profile | Scope | Target mix | Drought trigger | Saturation guard |
|---------|-------|------------|-----------------|------------------|
| **LitRPG dungeon** | 10 rooms | 4–6 trash; 1–2 elite; exactly 1 boss; 2–4 discoveries | Interactive at 8 turns; hostile at 15 | Max 2 in 5 turns; recovery after elite/boss |
| **DnD Keep** | 10 areas | 3–5 combats; 1–2 traps; 1–2 hazards; 2–4 checks; 1–2 puzzles; exactly 1 boss | Challenge at 8 turns; combat/hazard at 15 | Max 3 in 8 turns; max 2 same-role consecutive |
| **RPG hub** | 100 turns | 3–5 social pressures; 1–2 major crises; 0–1 ambush | Pressure at 12 turns; hostile no sooner than 30 | Max 2 major in 15 turns; major cooldown 15 |
| **PYOA chapter** | 60 turns | 2–4 crises; 1–3 discovery/callback; at least 1 fork | Fork at 12 turns | Max 1 crisis in 12 turns; crisis IDs one-shot |

**Enforcement order:**
1. Hard legality (mode, bible, biome, site, faction, tier, prerequisites, exclusions)
2. Terminal availability (valid bound, forced terminal, receipt contract)
3. Cooldown and one-shot locks
4. Saturation and required recovery beat
5. Location quota deficits
6. Interactive or hostile drought preference
7. Variety score and recent-role penalty
8. Seeded selection among best legal score band

### 6. Loot Tables

**Typed rewards by tier:**
- **LitRPG:** Elite/boss guarantee build/campaign relevance; trash rewards contextual and light; third eligible miss guarantees rare; duplicate uniques convert
- **DnD:** Treasure, quest items, route keys; filter by tier, biome, site, attunement, campaign relevance
- **RPG:** Favors, intel, access as typed assets; persist provenance, scope, value, consumption, expiry, source
- **PYOA:** Callback and ending reward records; story-state rewards as receipts; convergence reads them

### 7. Telegraph Patterns

**Channels and coverage:**
- Normal encounter: ≥1 channel
- Elite encounter: ≥2 channels
- Boss encounter: ≥3 channels

**Pattern catalog:**
- Status: threat meter, countdown, combat banner, faction alert
- NPC: warning, rumor, plea, boast, ultimatum
- Scene: tracks, bodies, scorch marks, silence, geometry
- Item: broken seal, keyed ward, spent casing, poisoned ration
- Faction: patrol schedule, wanted notice, intercepted orders

**Surprise eligibility:**
- Only when template marked `surpriseEligible: true`
- Opening severity capped (moderate max)
- Player receives suspicion cue or reaction window immediately after reveal

### 8. Stakes Templates

**Approach structure:**
- `id`: Unique approach identifier
- `label`: Player-facing verb and target (e.g., "Break the ward and fight")
- `requirements`: Items, skills, leverage, position, or flags
- `method`: deterministic, d20, combat, clock, or fork
- `chance`: Exact target and modifier source when random
- `onSuccess`, `onPartial`, `onFailure`: Concrete state changes
- `lockout`: State change preventing unchanged retry

**Legal actions:**
- Combat templates expose win, lose, flee, negotiate (if fictionally plausible)
- If flee/negotiation impossible, UI must state why (not hide behind prose)

### 9. Resolution Mechanics

**Resolution principles:**
1. **Ledger first:** Compute and commit HP, clocks, resources, faction, quest, NPC, dungeon deltas before narration
2. **One step, one proof:** Each action produces persisted event with before/after values
3. **Bounded retries:** Failed approach changes position, consumes leverage, advances danger, or locks itself
4. **Terminal priority:** Terminal conditions win when they occur with ordinary progress
5. **Forced closure:** At `maxTurns`, declared fallback resolves (combat → defeat/costly escape; crisis → deadline ending)
6. **GM flavor boundary:** Narration explains outcome but cannot add damage, revoke rewards, resurrect defeated actors, or invent incompatible biome/faction facts

**Resolution methods:**
- **Deterministic:** Guaranteed outcome based on state
- **d20:** d20 + modifier vs DC/AC; advantage/disadvantage; seeded RNG
- **Combat:** HP tracking, damage rolls, active/defeated states
- **Clock:** Progress vs danger clocks; both-full tie becomes success with cost; filled clocks cannot remain active
- **Fork:** Exclusive facts, delayed callbacks, ending eligibility (PYOA)

---

## Integration Points

### With Existing Code

**Already exists:**
- `encounterTerminalFsm.ts` — FSM for encounter lifecycle (engaged → resolving → terminal)
  - **Overlap:** WS-4 formalizes terminal states and forced closure
  - **Gap:** WS-4 adds telegraph, stakes, and aftermath phases
- `encounterResolution.ts` — P1.2 spec for encounter resolution
  - **Overlap:** Both define encounter types, triggers, phases, outcomes
  - **Gap:** WS-4 is more comprehensive (hard filters, receipts, templated approaches)
- `arcDirector.ts` — Beat contracts and drought tables
  - **Overlap:** Already has `droughtSkirmishTable` and beat selection
  - **Gap:** WS-4 formalizes density profiles, biome filters, and forced encounters
- `dungeonMobLedger.ts` — Tracks defeated mobs
  - **Overlap:** WS-4 `encounterAftermath` includes dungeon receipts
  - **Gap:** Need to connect cleared-node spawn locks to biome matrix

**Need to create:**
- `encounterBible.ts` — Load and index 48 templates; version/hash management
- `encounterTelegraph.ts` — Select cues and build telegraph section of situation packet
- `encounterStakes.ts` — Materialize legal approaches from current state
- `encounterBiomeMatrix.ts` — Hard filter candidates by mode, bible, biome, site, faction, tier, exclusions
- `encounterDensity.ts` — Location quotas, drought timers, saturation/recovery guards
- `encounterAftermath.ts` — Reconcile deltas and emit idempotent receipts
- `lootTables.ts` — Resolve typed, tiered rewards under deterministic seed and pity/uniqueness rules

**Need to extend:**
- `situationPacket.ts` — Add immutable encounter contract (template, telegraph, stakes, mechanics, seed, maxTurns, fallback)
- `proseWarden.ts` — Reject prose contradicting committed outcome, HP, item, faction, quest, actor, biome, terminality
- `arcDirector.ts` — Wire in pre-GM encounter commit from `encounterBible` selection
- `BeatContract` registry — Register 48 templates with beat roles and terminal expectations

### Architecture Flow

```
world map + active ledgers + density state
    → encounterBiomeMatrix.ts (hard legal candidates)
    → encounterBible.ts (template snapshot/version/hash)
    → encounterTelegraph.ts + encounterStakes.ts
    → arcDirector.ts pre-GM commit
    → situationPacket.ts immutable contract
    → encounterResolution.ts authoritative mutation
    → encounterAftermath.ts idempotent receipt
    → proseWarden.ts contradiction check
    → evalHarness.ts G1–G5 evidence
```

---

## Implementation Complexity Assessment

### Complexity Breakdown

| Component | Complexity | Reason |
|-----------|------------|--------|
| **Schema/Library Loading** | **S** (Simple) | JSON parsing, validation, indexing |
| **Biome Matrix Filtering** | **M** (Medium) | Multi-predicate filtering, fallback logic |
| **Telegraph Catalog** | **M** | Channel selection, cue rendering, actionable hook generation |
| **Stakes Materialization** | **L** (Large) | Current state → legal approaches; requirements validation; outcome projection |
| **Combat Resolution** | **L** | HP ledger, damage calculation, seeded RNG, progress/danger clocks, terminal evaluation |
| **d20 Resolution** | **M** | Official d20 procedure, advantage/disadvantage, deterministic seed |
| **Clock Resolution** | **M** | Progress/danger racing clocks, tie handling, lockout |
| **PYOA Fork Resolution** | **L** | Exclusive facts, delayed callbacks, ending eligibility, convergence with variation |
| **Forced Terminal** | **M** | Template bound enforcement, fallback resolution, action rejection after terminal |
| **Aftermath Receipts** | **L** | ≥2 receipt types, idempotency keys, ledger reconciliation, transaction atomicity |
| **Loot Tables** | **M** | Typed elite/boss rewards, pity counters, duplicate conversion, procedural trash |
| **Density Enforcement** | **L** | Location quotas, drought timers, saturation/recovery guards, role budgets, variety scoring |
| **Prose Warden Extension** | **L** | Contradiction detection (outcome, HP, item, faction, quest, actor, biome, terminality) |
| **ArcDirector Integration** | **XL** (Extra Large) | Pre-GM commit, situation packet freeze, template selection, seed management, BeatContract registry |
| **Eval Harness** | **L** | Five quality gates (G1–G5), historical regressions, property tests, evidence retention |

**Total estimated complexity:** **~40 tasks** (28 P0, 10 P1, 2 P2)

### Risk Factors

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Integration with existing encounter code** | High | Refactor `encounterResolution.ts` and `encounterTerminalFsm.ts` to align with WS-4 phases; deprecate old P1.2 spec gradually |
| **ArcDirector pre-GM commit timing** | High | Ensure beat selection, template freeze, and seed management happen atomically before `callGm` |
| **Prose warden contradiction checks** | Medium | Start with high-confidence contradictions (HP, terminality, actor identity); iterate on edge cases |
| **Density enforcement complexity** | Medium | Implement location quotas first (simpler); add drought timers second; saturation guards last |
| **PYOA exclusive facts and convergence** | High | PYOA crises are most complex; defer to Wave 4 after combat/d20/clock resolution is stable |
| **Receipt idempotency and transaction atomicity** | Medium | Use commit keys (encounter ID + terminal + version); test duplicate application guard thoroughly |
| **Biome matrix coverage gaps** | Low | Matrix has 23 rows covering all known bibles; content-gap receipt handles missing rows gracefully |
| **Template version/hash management** | Low | Snapshot templates on encounter spawn; active encounters retain exact version even if template updates |

---

## Recommended Implementation Order

### Wave 1 — Contracts and Selection (B001–B007, B020–B022)

**Objective:** Load/version schemas, libraries, telegraphs, stakes, and hard biome authority.

**Tasks:**
- B001: Register encounter template schema and semantic version policy
- B002: Implement per-bible library loader and immutable index
- B003: Compute and verify template content hashes
- B004: Implement telegraph catalog loader and selector
- B005: Build telegraph situation-packet section
- B006: Implement stakes materializer from current state
- B007: Add action-honesty validator
- B020: Parse and version biome spawn matrix
- B021: Implement hard biome and bible candidate filter
- B022: Add wrong-bible spawn regression suite

**Exit condition:** One legal template can be selected and rendered with no unresolvable action or wrong-bible substitution.

**Files changed:**
- Create: `src/game/encounterBible.ts`, `src/game/encounterTelegraph.ts`, `src/game/encounterStakes.ts`, `src/game/encounterBiomeMatrix.ts`
- Create: `src/game/schemas/encounter-template.schema.json`
- Extend: `src/game/situationPacket.ts` (telegraph section)
- Test: `src/game/encounterBible.test.ts`, `src/game/encounterBiomeMatrix.test.ts`

### Wave 2 — Resolution and Receipts (B008–B019)

**Objective:** Complete combat, d20, flee, parley, clocks, crisis commits, forced terminal, and aftermath.

**Tasks:**
- B008: Make encounter HP ledger atomic and authoritative
- B009: Implement seeded damage calculation and replay tests
- B010: Implement bounded combat terminal evaluation
- B011: Implement real flee progress and danger clocks
- B012: Implement parley thresholds and one-use leverage
- B013: Implement official-style d20 resolver
- B014: Implement progress danger and racing clocks
- B015: Implement PYOA exclusive-fact commit
- B016: Implement forced terminal at maxTurns
- B017: Implement typed aftermath receipt generator
- B018: Add receipt idempotency keys and duplicate guard
- B019: Reconcile aftermath against all authoritative ledgers

**Exit condition:** Adversarial runs cannot keep an encounter active beyond its bound; every terminal has one receipt.

**Files changed:**
- Extend: `src/game/encounterResolution.ts` (upgrade to WS-4 resolution mechanics)
- Extend: `src/game/encounterTerminalFsm.ts` (forced terminal at maxTurns)
- Create: `src/game/encounterAftermath.ts`
- Extend: `src/game/types.ts` (receipt types)
- Test: `src/game/encounterResolution.test.ts`, `src/game/encounterAftermath.test.ts`

### Wave 3 — Director Integration (B023–B028)

**Objective:** Add density governance, pre-GM commit, situation packets, prose validation, and telemetry.

**Tasks:**
- B023: Implement density profiles and role budgets
- B024: Implement interactive and hostile drought timers
- B025: Integrate pre-GM encounter commit in ArcDirector
- B026: Extend situation packet with immutable encounter contract
- B027: Extend prose warden with contradiction checks
- B028: Emit encounter lifecycle telemetry events

**Exit condition:** GM output cannot contradict committed mechanics; drought remains biome-safe.

**Files changed:**
- Create: `src/game/encounterDensity.ts`
- Extend: `src/game/arcDirector.ts` (pre-GM encounter commit, density checks)
- Extend: `src/game/situationPacket.ts` (immutable encounter contract)
- Extend: `src/game/proseWarden.ts` (contradiction checks)
- Extend: `src/game/telemetry.ts` (encounter lifecycle events)
- Test: `src/game/encounterDensity.test.ts`, `src/game/arcDirector.test.ts`

### Wave 4 — Content and Rewards (B029–B035)

**Objective:** Integrate loot and register all 48 templates/callbacks.

**Tasks:**
- B029: Implement tiered LitRPG loot tables and pity counters
- B030: Implement DnD treasure quest-item and route-key tables
- B031: Implement RPG favors intel and access as typed assets
- B032: Implement PYOA callback and ending reward records
- B033: Connect dungeon mob ledger to cleared-node spawn locks
- B034: Register 24 combat social and hazard templates in BeatContract
- B035: Register 24 PYOA crises and delayed callbacks

**Exit condition:** All libraries load, all PYOA links resolve, and rewards reconcile.

**Files changed:**
- Create: `src/game/lootTables.ts`
- Extend: `src/game/dungeonMobLedger.ts` (connect to biome matrix)
- Extend: `src/game/beatContract.ts` (register 48 templates)
- Data: Copy `D2_litrpg_encounter_library.json`, `D3_dnd_encounter_library.json`, `D4_rpg_encounter_library.json`, `D5_pyoa_crisis_library.json`, `D9_loot_tables.json`, `D10_biome_spawn_matrix.csv` to `src/game/data/encounters/`
- Test: `src/game/lootTables.test.ts`, `src/game/beatContract.test.ts`

### Wave 5 — Evaluation and Operations (B036–B040)

**Objective:** Run historical regressions, property tests, linting, and promotion gates.

**Tasks:**
- B036: Build five-gate evaluation harness and fixtures
- B037: Add four 300-turn historical regression scenarios
- B038: Add property tests for no unchanged accepted action
- B039: Build authoring linter and content-gap report
- B040: Add shadow canary stable promotion dashboard

**Exit condition:** G1–G5 pass at the required sample and stable-promotion standard.

**Files changed:**
- Create: `src/game/evalHarness.ts`
- Create: `src/game/evalHarness.test.ts` (four historical regressions)
- Create: `scripts/encounter-linter.ts` (authoring linter)
- Create: `scripts/encounter-promotion-dashboard.ts` (promotion dashboard)
- Test: Property tests in `src/game/encounterResolution.test.ts`

---

## Timeline Estimate

| Wave | Tasks | P0 | P1 | P2 | Est. Days | Risk |
|------|-------|----|----|----|-----------|----|
| **Wave 1** | 10 | 10 | 0 | 0 | 5–7 days | Medium (new files, schema loading) |
| **Wave 2** | 12 | 12 | 0 | 0 | 7–10 days | High (resolution mechanics, PYOA forks) |
| **Wave 3** | 6 | 6 | 0 | 0 | 5–7 days | High (ArcDirector integration) |
| **Wave 4** | 7 | 0 | 7 | 0 | 4–6 days | Medium (loot tables, template registration) |
| **Wave 5** | 5 | 0 | 3 | 2 | 3–5 days | Low (eval harness, tests) |
| **Total** | **40** | **28** | **10** | **2** | **24–35 days** | |

**Assumptions:**
- One developer working full-time
- Waves 1–3 are sequential (dependencies)
- Wave 4 can partially overlap with Wave 3 (loot tables independent)
- Wave 5 can partially overlap with Wave 4 (tests independent)

**Critical path:** Wave 1 → Wave 2 → Wave 3 (17–24 days)

---

## Quality Gates (G1–G5)

| Gate | Question | Threshold |
|------|----------|-----------|
| **G1 — Resolution** | Did every spawn reach exactly one terminal within `maxTurns` and receive exactly one applied receipt? | **100%**, zero violations |
| **G2 — Telegraph** | Was warning shown before engagement, and did every cue have real counterplay? | **≥80%** pre-engagement coverage; zero unactionable cues or unfair surprises |
| **G3 — Biome** | Did every encounter and actor pass mode, bible, biome, site, faction, tier, exclusion, cooldown, and density checks? | **100%**, zero wrong-bible spawns |
| **G4 — Density** | Did every closed location/chapter meet its role bands without saturation or repeats? | 95% in canary; **100% before stable**; exact boss count |
| **G5 — Aftermath** | Did every terminal produce at least two reconciled receipt types with no duplicate application? | **100%**, zero reconciliation or idempotency failures |

**Historical regression fixtures:**
- R1: Summoned Pact combat purgatory (290 turns) → Terminal ≤ template bound; state-changing flee/parley; one receipt
- R2: Cursed Keep passive GM (no encounters in 300 turns) → Keep profile includes combat, hazard/trap, checks/puzzles, boss
- R3: Cape District pad loop (Walk Away repetition) → Walk Away terminates; leverage consumed/discredited; unchanged retry rejected
- R4: Thornferry theater branching (crisis repeats, flags disappear) → Exclusive facts, delayed callback, ending difference, one-shot crisis lock persist

---

## Next Steps

### Immediate Actions

1. **John review and authorization:**
   - Confirm Wave 1–5 scope aligns with product priorities
   - Approve 24–35 day timeline
   - Choose integration strategy (refactor existing `encounterResolution.ts` or build parallel then deprecate)

2. **Code archaeology:**
   - Audit `encounterResolution.ts` and `encounterTerminalFsm.ts` for reusable pieces
   - Identify conflicts between P1.2 spec and WS-4 constitution

3. **Data migration:**
   - Copy D2–D5 JSON libraries to `src/game/data/encounters/`
   - Copy D10 biome matrix CSV to `src/game/data/encounters/`
   - Copy D9 loot tables JSON to `src/game/data/encounters/`
   - Copy `encounter-template.schema.json` to `src/game/schemas/`

4. **Start Wave 1:**
   - Create `src/game/encounterBible.ts` skeleton
   - Write schema loader and version policy tests
   - Build immutable template index with content hashes

### Coordination with Other Workstreams

**WS-2 (NPC Role, Memory, Lifecycle):**
- Integration point: NPC receipts in encounter aftermath
- Dependency: NPC topic FSM already exists (`npcTopicFsm.ts`)
- Timing: WS-4 Wave 2 needs NPC ledger mutations; WS-2 can proceed in parallel

**WS-5 (PYOA Persistence):**
- Integration point: PYOA exclusive facts and ending eligibility
- Dependency: WS-4 Wave 2 B015 implements PYOA fork commits
- Timing: WS-5 can proceed in parallel; WS-4 B015 defines the contract

**Path A Architecture (Manifest, BeatContract, ArcDirector):**
- Already shipped: `runManifest.ts`, `beatContract.ts`, `arcDirector.ts`
- WS-4 extends: Pre-GM encounter commit, template registry, density checks
- Timing: WS-4 Wave 3 B025 is the critical integration point

**Quality Governance (27w modules):**
- Already shipped: `qualityGovernance.ts`, `forwardProgressGovernor.ts`, etc.
- WS-4 complements: Encounter-specific gates (G1–G5) sit alongside existing quality modules
- Timing: WS-4 eval harness (Wave 5) measures encounter-specific quality

---

## Open Questions

1. **Refactor or parallel build?**
   - Option A: Refactor existing `encounterResolution.ts` to WS-4 spec (faster but riskier)
   - Option B: Build parallel `encounterBible.ts` + `encounterStakes.ts` + etc., then deprecate old code (safer but slower)
   - **Recommendation:** Option B (parallel build) to avoid breaking existing encounter logic during transition

2. **Mid-campaign save migration?**
   - Active encounters in old format (P1.2 `EncounterSpec`) need migration to WS-4 `ActiveEncounter` with template snapshot
   - **Recommendation:** Add `saveMigration.applyWs4EncounterRepair` to convert old encounters to WS-4 format on load

3. **Content authoring pipeline?**
   - 48 templates are authored; future templates need linting, validation, promotion gates
   - **Recommendation:** Wave 5 B039 builds authoring linter; content ops team can commission new templates using WS-4 schema

4. **Gemini scoring re-run?**
   - After WS-4 ships, re-run Gemini 12×300 worst-cell evals to measure uplift
   - **Recommendation:** Ship Wave 1–3, then gate Wave 4–5 on Gemini re-score showing ≥6/10 encounter quality

5. **Free model compatibility?**
   - WS-4 situation packet is longer (telegraph + stakes + mechanics)
   - Free (Gemini Flash Lite) may struggle with complex encounter contracts
   - **Recommendation:** Test Free compatibility in Wave 3; may need separate simplified packet for Free tier

---

## Summary

WS-4 provides an implementation-ready encounter system that eliminates combat purgatory and theater choices through:
- **48 authored templates** across LitRPG, DnD, RPG, PYOA
- **Four-phase lifecycle** (telegraph → stakes → resolution → aftermath) with forced terminals
- **Hard biome filtering** that prevents wrong-bible spawns
- **Density enforcement** that prevents empty dungeons and combat-free chapters
- **Receipt completeness** that ensures every terminal produces measurable consequences

**Critical path:** 17–24 days across Waves 1–3 (contracts, resolution, director integration).  
**Total estimate:** 24–35 days for full implementation including content and eval harness.  
**Next action:** John approval + start Wave 1 (schema loading and biome filtering).
