# Manus WS-5: PYOA Branch Persistence Research Ingest

**Author:** Agent  
**Date:** 2026-08-28  
**Package:** Complete WS5 Task.zip  
**Extracted to:** `docs/research/pasted/manus-ws-5-pyoa-persistence-2026-08-28/`

## Executive Summary

WS-5 replaces theater branching with a **receipt-led, deterministic branch architecture**. This is a comprehensive upgrade that solves the Millstone Charter failure pattern: 288× crisis loops, zero endings in 300 turns, partial commits without locks, and exploitable XP from repetition. The architecture makes those outcomes invariant violations rather than content-quality risks.

**The Core Problem:** PYOA currently permits presentation without durable resolution, rewards presentation rather than unique completion, and treats endings as optional content rather than required terminal states.

**The Solution:** Move authority from generated prose to a deterministic ledger. Every crisis may resolve once per run. The selected fork, sibling locks, exclusive facts, costs, delayed consequences, and one-time rewards commit atomically *before* the GM narrates the result.

**Impact:** This is not a patch to B025. This is a complete replacement architecture with database-style guarantees, three full bible catalogs, fog-of-war journal UX, replay scaffolding, and an evaluation harness with five pass/fail quality gates.

## Deliverable Inventory

### Primary Documents (6)
1. **WS-5_ PYOA Branch Persistence Research Commission.md** — Executive overview, coverage, architectural decisions, quality gates
2. **WS-5 Branch Persistence Constitution and Architecture.md** — Constitutional principles, lifecycle, transaction boundaries, D1/D3-D6 specs
3. **WS-5 Crisis Decks and Ending Gates.md** — 3 bibles, 18 crises, 42 forks, 6 convergence contracts, 18 ending gates
4. **WS-5 Fog-of-War Journal and Replay Scaffolding.md** — Journal UX, replay mode, spoiler-safe view models
5. **WS-5 Implementation Backlog and Evaluation Plan.md** — 36 tasks (P0/P1/P2), 5 waves, evaluation strategy
6. **WS-5 Validation Certificate.md** — Package validation status

### TypeScript Implementation (9 files)
- **pyoaTypes.ts** — Core types (CrisisReceipt, ForkSpec, ExclusiveFactGroup, etc.)
- **pyoaBranchLedger.ts** — Atomic commits, lock enforcement, mutex validation (236 lines)
- **pyoaDelayedConsequences.ts** — Causal debt scheduler, idempotent delivery
- **pyoaConvergence.ts** — Named convergence contracts, provenance preservation
- **pyoaEndingGates.ts** — Priority-based gate selection, T150 deadline enforcer
- **branchJournalModel.ts** — Fog-of-war view model
- **crisisDeckRegistry.ts** — Crisis catalog loading
- **evalHarness.ts** — Five quality gates (G1-G5)
- **replayMode.ts** — Deterministic replay with seed contracts

### Bible Catalogs (3 JSON files)
- **thornferry-road.json** — Rural-gothic road journey (6 crises, 6 endings)
- **vesper-glass-cipher.json** — Occult urban espionage (6 crises, 6 endings)
- **erebus-9.json** — Deep-space station horror (6 crises, 6 endings)

### Validation & Build Scripts (4)
- **validatePackage.mjs** — Package integrity validator
- **validateCatalogs.mjs** — Catalog completeness checks
- **curateCatalogs.mjs** — Catalog curation tools
- **renderCatalogMarkdown.mjs** — Catalog rendering

### Data Files (4)
- **implementation_backlog.csv** — 36 tasks with priority/complexity/integration
- **eval_gates.json** — Machine-readable gate definitions
- **catalog_report.json** — Validation results
- **author_pyoa_bible_catalogs.json** — Authoring template

### Documentation (4)
- **research_notes.md** — Research methodology notes
- **SKILL.md** — Agent skill for WS-5 work
- **branch_lifecycle.mmd** — Mermaid diagram of lifecycle
- **pasted_content.txt** — Original commission text

### Config (1)
- **tsconfig.json** — TypeScript configuration

## Quantitative Inventory

| Item | Delivered |
|---|---:|
| PYOA bibles | 3 |
| Crisis specifications | 18 (6 per bible) |
| Fork specifications | 42 (14 per bible) |
| Crises with delayed payoffs | 15 of 18 (83.3%) |
| Named convergence contracts | 6 (2 per bible) |
| Ending gates | 18 (6 per bible) |
| Exclusive fact groups | 18 (6 per bible) |
| Implementation backlog tasks | 36 (18 P0, 16 P1, 2 P2) |
| Pass/fail quality gates | 5 (G1-G5) |

## Key Findings

### 1. Constitutional Principles (12 Principles)

**P1. Pre-narration authority** — All state-changing crisis outcomes are committed before the GM receives the situation packet.

**P2. Atomic forks** — Choice, sibling locks, fact writes, costs, schedules, and one-time reward receipt succeed or fail as one transaction.

**P3. Once per run** — A crisis ID may create at most one crisis receipt in a run.

**P4. Mutual exclusion** — Fact registry mutex groups are validated on every transaction.

**P5. Causal debt** — At least half of authored crises schedule one or more later consequences.

**P6. Costed alternatives** — Every fork changes a resource, relationship, time budget, risk posture, or future availability.

**P7. Provenance-preserving convergence** — Convergence compares an explicit state projection and records a receipt; it never deletes branch facts.

**P8. Terminal liveness** — Ending checks begin by turn 80; a deadline resolver must emit exactly one terminal receipt by turn 150.

**P9. Idempotent rewards** — XP and rewards are keyed to unique receipt IDs, never scene render counts.

**P10. Honest fog of war** — The Journal confirms known commitments and closures but does not name or explain unseen branches.

**P11. Reproducible runs** — Crisis ordering uses a versioned manifest and isolated seed stream.

**P12. Auditability** — Every mutation records source, turn, idempotency key, and receipt kind.

### 2. Canonical Branch Lifecycle

**Telegraph → Offer → Commit → Lock → Manifest → Converge → Gate → Terminate**

"Offer" is deliberately not a state transition: no branch exists merely because options were rendered.

### 3. Transaction Boundary (Atomic)

```text
BEGIN
  assert run is not terminal
  assert crisis has no prior lock or receipt
  assert crisis and fork prerequisites pass
  assert the player can pay the declared costs
  assert proposed facts do not violate a mutex group
  create crisis receipt
  lock every sibling fork
  write selected facts
  reserve resource and relationship deltas
  create deterministic delayed-consequence rows
  award XP by crisis receipt idempotency key
COMMIT

build situation packet from committed state
ask GM to narrate the committed outcome
```

### 4. Delayed Consequence Timing Patterns

| Pattern | Delay | Use |
|---|---:|---|
| Echo | 12–20 turns | Short callback proves the world noticed |
| Return | 35–60 turns | Trusted/harmed actor repays the player |
| Reckoning | 60–85 turns | Hidden cost changes convergence/ending gate |
| Chain unlock | Variable | One payoff makes a later crisis eligible |
| Deadline pressure | Fixed absolute | A cost escalates if unresolved |

### 5. Five Quality Gates (G1-G5)

**G1 — Zero crisis repetition:** Max one crisis receipt per crisis and run; zero duplicate reward receipts.

**G2 — Complete sibling locks:** 100% of crisis receipts lock exactly every unchosen sibling; zero post-lock offers.

**G3 — Ending liveness:** At least 80% normal endings by T150; 0% runs without any ending; zero multiple-ending runs.

**G4 — Delayed payoff coverage:** At least 50% crisis coverage; zero overdue, duplicate, or silently cancelled due consequences.

**G5 — No exclusive fact conflicts:** Zero persisted mutex conflicts and zero missing exactly-one selections after owner crises.

## Integration Points with Existing Code

### What B025 Already Has (Lightweight)

**Current `src/game/pyoaBranchLedger.ts` (B025):**
- Basic branch tracking (`millstone-charter`, `solo-road`, `ally-path`)
- Simple convergence detection (state hash)
- Pattern-matching based on player input strings
- Limited exclusive facts (`branchLocked` field)
- Convergence points array

**Coverage:** ~100 lines, string-pattern matching, no atomic commits

### What WS-5 Brings (Comprehensive)

**New `pyoaBranchLedger.ts` (WS-5):**
- Receipt-led architecture with idempotency keys
- Atomic commits with transaction boundaries
- Exclusive fact group registry with mutex validation
- Sibling lock enforcement
- Resource/relationship cost assertions
- Delayed consequence scheduling
- Crisis spawn eligibility checks
- Fact predicate engine

**Coverage:** ~236 lines, database-style guarantees, full audit trail

### What WS-5 Adds Beyond B025

1. **pyoaDelayedConsequences.ts** — Scheduler for causal debt (echo/return/reckoning patterns)
2. **pyoaConvergence.ts** — Named convergence contracts with provenance preservation
3. **pyoaEndingGates.ts** — Priority-based gate selection with T150 deadline
4. **branchJournalModel.ts** — Fog-of-war journal UX (known/veiled/hidden disclosure)
5. **crisisDeckRegistry.ts** — Crisis catalog loading and validation
6. **evalHarness.ts** — Five quality gates (G1-G5) with 10,000-seed suite
7. **replayMode.ts** — Deterministic replay with seed contracts

### Comparison: B025 vs WS-5

| Feature | B025 (Current) | WS-5 (Manus) |
|---|---|---|
| Branch tracking | String paths | Atomic receipts |
| Idempotency | None | `{runId}:{crisisId}` |
| Sibling locks | None | All siblings locked at commit |
| Exclusive facts | `branchLocked` string | Mutex groups with registry |
| Delayed consequences | None | Scheduled payoffs with due turn |
| Convergence | Hash-based detection | Named contracts with projections |
| Ending gates | None | Priority resolver + T150 deadline |
| Catalogs | None | 3 bibles, 18 crises, 42 forks |
| XP rewards | Untracked | Receipt-keyed, idempotent |
| Journal UX | None | Fog-of-war disclosure |
| Replay | None | Seed contracts with versioning |
| Evaluation | None | 5 quality gates + 10k-seed suite |

## Implementation Complexity Assessment

### Wave Breakdown

| Wave | Tasks | Complexity | Duration Estimate |
|---|---|---|---|
| Wave 1 — State authority | WS5-001 to WS5-009 | Core ledger | 3–4 engineering days |
| Wave 2 — Causal debt and liveness | WS5-010 to WS5-018 | Scheduler + endings | 3–4 days |
| Wave 3 — Convergence and catalogs | WS5-019 to WS5-026 | Convergence + 3 bibles | 3–4 days |
| Wave 4 — GM and Journal integration | WS5-027 to WS5-031 | Situation packet + UX | 2–3 days |
| Wave 5 — Replay and validation | WS5-032 to WS5-036 | Replay + 10k-seed suite | 2–3 days |

**Total Estimate:** 13–18 engineering days (focused implementation time)

### Complexity by Task Priority

| Priority | Count | Complexity | Coverage |
|---|---:|---|---|
| **P0** | 18 | Core state authority + liveness | Theater branching structurally impossible |
| **P1** | 16 | Convergence + catalogs + Journal | Catalogs, UX, replay integrated |
| **P2** | 2 | Accessibility + validation polish | 10k-seed suite passes |

### File Changes Required

**New Files (10):**
1. `src/game/pyoaTypes.ts` — Core types
2. `src/game/pyoaDelayedConsequences.ts` — Scheduler
3. `src/game/pyoaConvergence.ts` — Convergence contracts
4. `src/game/pyoaEndingGates.ts` — Ending gates
5. `src/game/branchJournalModel.ts` — Journal view model
6. `src/game/crisisDeckRegistry.ts` — Catalog loader
7. `src/game/evalHarness.ts` — Quality gates
8. `src/game/replayMode.ts` — Replay scaffolding
9. `data/pyoa/thornferry-road.json` — Catalog
10. `data/pyoa/vesper-glass-cipher.json` — Catalog
11. `data/pyoa/erebus-9.json` — Catalog

**Modified Files (9):**
1. `src/game/pyoaBranchLedger.ts` — **Complete replacement** with WS-5 implementation
2. `src/game/arcDirector.ts` — Pre-GM sequence (deliver consequences → convergence → endings → crisis)
3. `src/game/choiceCompiler.ts` — Filter locked/illegal forks
4. `src/game/beatContract.ts` — Crisis metadata + fallback beats
5. `src/game/situationPacket.ts` — Branch ledger projection
6. `src/game/proseWarden.ts` — Branch contradiction checks
7. `src/components/QuestJournal.tsx` — Branch Journal cards
8. `src/game/types.ts` — New GameState fields
9. `supabase/functions/_shared/gm/types.ts` — Edge type sync

**Total:** 11 new files, 9 modified files

### Dependencies and Prerequisites

**Hard Dependencies:**
- WS-5 requires **sealed manifests** (Wave 3) before catalogs can ship
- Ending gates require **ledger rebuild** from receipts (Wave 1)
- Convergence requires **provenance tracking** (Wave 1)
- Journal UX requires **spoiler-safe view models** (Wave 4)

**Soft Dependencies:**
- WS-5 can integrate with **B026-B028** (sealed manifests from BIG CHANGES)
- WS-5 can integrate with **WS-2** (NPC role catalog) for NPC-triggered crises
- WS-5 can integrate with **WS-4** (encounter bible) for combat-gated crises

**Integration Order:**
1. `pyoaBranchLedger.ts` is the root dependency (all other modules consume it)
2. `arcDirector.ts` orchestrates ledger modules in fixed order
3. `choiceCompiler.ts`, `situationPacket.ts`, `proseWarden.ts` consume validated projections
4. `QuestJournal.tsx` receives spoiler-safe view model from server

## Recommended Implementation Order

### Phase 1: Foundation (Wave 1)
**Goal:** Crisis receipts are atomic, exclusive facts are enforceable, rewards are idempotent

**Tasks:** WS5-001 to WS5-009 (9 P0 tasks)

**Exit Criterion:** A crisis can create one atomic receipt, lock siblings, write compatible facts, and grant one reward.

**Files:**
- `src/game/pyoaTypes.ts` (NEW)
- `src/game/pyoaBranchLedger.ts` (REPLACE)
- `src/game/arcDirector.ts` (MODIFY)
- `src/game/choiceCompiler.ts` (MODIFY)

### Phase 2: Liveness (Wave 2)
**Goal:** Due payoffs deliver exactly once, every run terminates by T150

**Tasks:** WS5-010 to WS5-018 (9 P0 tasks)

**Exit Criterion:** Core G1, G2, and G5 tests pass

**Files:**
- `src/game/pyoaDelayedConsequences.ts` (NEW)
- `src/game/pyoaEndingGates.ts` (NEW)
- `src/game/evalHarness.ts` (NEW)
- `src/game/arcDirector.ts` (MODIFY)

### Phase 3: Content (Wave 3)
**Goal:** Three validated catalogs load, convergence preserves provenance

**Tasks:** WS5-019 to WS5-026 (8 P1 tasks)

**Exit Criterion:** Catalog CI is green

**Files:**
- `src/game/pyoaConvergence.ts` (NEW)
- `src/game/crisisDeckRegistry.ts` (NEW)
- `src/game/beatContract.ts` (MODIFY)
- `data/pyoa/*.json` (NEW)

### Phase 4: Integration (Wave 4)
**Goal:** Situation packets and prose honor ledger truth, Journal is usable

**Tasks:** WS5-027 to WS5-031 (5 P1 tasks)

**Exit Criterion:** Spoiler-safe Journal shows branch state

**Files:**
- `src/game/branchJournalModel.ts` (NEW)
- `src/game/situationPacket.ts` (MODIFY)
- `src/game/proseWarden.ts` (MODIFY)
- `src/components/QuestJournal.tsx` (MODIFY)

### Phase 5: Validation (Wave 5)
**Goal:** Seed contracts are reproducible, 10,000-seed suite passes

**Tasks:** WS5-032 to WS5-036 (5 P1/P2 tasks)

**Exit Criterion:** All five quality gates (G1-G5) pass for all three bibles

**Files:**
- `src/game/replayMode.ts` (NEW)
- `src/game/evalHarness.ts` (EXTEND)

## Risk Assessment

### High Risk
- **B025 replacement:** Existing PYOA saves may not migrate cleanly
- **Catalog authoring:** Three bibles need continuity pass against actual source bibles
- **Ending liveness:** T150 deadline may feel forced if player isn't ready

### Medium Risk
- **Delayed consequence timing:** 50-80 turn delays may feel disconnected
- **Convergence detection:** Hash-based may miss some semantic convergences
- **Prose enforcement:** `proseWarden` may reject valid GM outputs

### Low Risk
- **XP idempotency:** Receipt-keyed rewards prevent exploits
- **Sibling locks:** Atomic commits prevent partial failures
- **Quality gates:** Five pass/fail gates catch invariant violations

### Mitigation Strategies

**B025 Migration:**
- Shadow mode: Run WS-5 ledger without altering player behavior, compare states
- Legacy adapter: Ambiguous histories enter compatibility route
- No retroactive XP: Migration writes audit receipt but no rewards

**Catalog Authoring:**
- Continuity pass: Cross-reference all named anchors against source bibles
- Validation suite: Catalog CI checks references, locks, costs, delays
- Manual narrative pass: Journal spoiler review, convergence callbacks, ending tone

**Ending Liveness:**
- Priority gates: Normal endings selected before failure endings
- Fallback only at T150: Gives 70 turns after first gate check (T80)
- Preserved facts: Fallback reflects branch history, not generic collapse

## Timeline Estimate

### Best Case (13 days)
- Wave 1: 3 days
- Wave 2: 3 days
- Wave 3: 3 days
- Wave 4: 2 days
- Wave 5: 2 days

### Expected Case (16 days)
- Wave 1: 4 days (foundation complexity)
- Wave 2: 4 days (ending gates tricky)
- Wave 3: 4 days (catalog continuity pass)
- Wave 4: 2 days (Journal UX straightforward)
- Wave 5: 2 days (replay simple)

### Worst Case (22 days)
- Wave 1: 5 days (migration issues)
- Wave 2: 5 days (ending gate edge cases)
- Wave 3: 6 days (catalog authoring delays)
- Wave 4: 3 days (Journal spoiler logic)
- Wave 5: 3 days (10k-seed suite debugging)

**Recommendation:** Plan for 16 days, buffer to 20 days

## Recommended Next Action

### Option A: Start Wave 1 (Receipt-Led Architecture)
**Pros:**
- Solves Millstone Charter 288× loop immediately
- Foundation for all other waves
- Can shadow-mode test without breaking existing saves

**Cons:**
- B025 replacement risk
- No visible player impact until Wave 4 (Journal UX)

### Option B: Coordinate with WS-2/4 (NPC Roles + Encounter Bible)
**Pros:**
- WS-5 crises can trigger from NPC obligations (WS-2)
- WS-5 crises can gate on combat receipts (WS-4)
- Unified implementation batch

**Cons:**
- Longer wait for any PYOA fixes
- More complex integration

### Option C: Commission Catalog Continuity Pass First
**Pros:**
- Thornferry Road, Vesper Glass Cipher, Erebus-9 validated against source bibles
- No risk of shipping wrong lore
- Catalog CI can validate before code ships

**Cons:**
- Delays implementation start
- May discover catalog gaps requiring Manus re-engagement

## Recommendation

**Start Wave 1 in shadow mode** while commissioning catalog continuity pass in parallel.

**Rationale:**
1. Wave 1 (receipt-led architecture) can run alongside B025 without breaking saves
2. Wave 1 solves Millstone Charter 288× loop structurally
3. Catalog continuity pass can happen while Wave 1/2 build
4. Reduces critical path by 4-6 days (parallel work)

**Next Steps:**
1. John authorizes Wave 1 implementation
2. Commission catalog continuity pass (Thornferry Road vs actual source bible)
3. Start WS5-001 (receipt types) in shadow mode
4. Plan Wave 2 (causal debt + liveness) for after Wave 1 ships

## Quality Projection

**Before WS-5:** ~5.5-6.5/10 (29e world map + 30a Wave 2)

**After WS-5 Wave 1:** ~6.0-7.0/10 (crisis loops structurally impossible)

**After WS-5 Complete:** ~7.0-8.5/10 (Manus three-batch target)

**PYOA-Specific Impact:**
- Zero Millstone Charter loops (G1 enforcement)
- 100% endings by T150 (G3 enforcement)
- Delayed payoffs in 83% of crises (G4 target exceeded)
- Convergence without provenance loss (P7 guarantee)

## Related Documents

- **Source Package:** `docs/research/pasted/manus-ws-5-pyoa-persistence-2026-08-28/`
- **Commission Prompt:** `docs/research/MANUS-PROMPT-WS-5.txt`
- **Implementation Plan:** `docs/research/ws-5-implementation-plan-2026-08-28.md`
- **Current B025:** `src/game/pyoaBranchLedger.ts`
- **Wave 2 Ship:** `docs/research/path-a-wave-2-ship-2026-08-28.md`
- **BIG CHANGES Backlog:** `docs/research/manus-big-changes-implementation-backlog-2026-08-27.md`

## Validation Status

✅ Package extracted successfully  
✅ TypeScript files parse successfully  
✅ JSON artifacts valid  
✅ Every fork locks exactly all siblings  
✅ Catalog references resolve  
✅ All convergence projections are non-empty  
✅ No scheduled payoff extends beyond T150 deadline

**Package Status:** Implementation-ready
