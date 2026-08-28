# WS-5 Implementation Plan (PYOA Branch Persistence)

**Author:** Agent  
**Date:** 2026-08-28  
**Based on:** Manus WS-5 Complete Package  
**Status:** Ready for authorization

## Overview

This plan implements the WS-5 PYOA Branch Persistence architecture in 5 waves over 13-18 engineering days. Each wave has clear exit criteria, test coverage, and deployment requirements.

**Critical Constraint:** State authority must be correct before new content or UI depends on it.

## Wave Structure

| Wave | Tasks | P0 | P1 | P2 | Duration | Exit Criterion |
|---|---|---:|---:|---:|---|---|
| **Wave 1** | WS5-001 to WS5-009 | 9 | 0 | 0 | 3-4 days | Atomic crisis receipts with sibling locks |
| **Wave 2** | WS5-010 to WS5-018 | 9 | 0 | 0 | 3-4 days | Due payoffs deliver once, all runs end by T150 |
| **Wave 3** | WS5-019 to WS5-026 | 0 | 8 | 0 | 3-4 days | Three catalogs validated, convergence wired |
| **Wave 4** | WS5-027 to WS5-031 | 0 | 5 | 0 | 2-3 days | Situation packets honor ledger, Journal usable |
| **Wave 5** | WS5-032 to WS5-036 | 0 | 3 | 2 | 2-3 days | Replay reproducible, 10k-seed suite passes |

**Total:** 18 P0, 16 P1, 2 P2 tasks

## Wave 1: State Authority

**Goal:** Crisis receipts are atomic, exclusive facts are enforceable, rewards are idempotent

**Duration:** 3-4 days

### Tasks

#### WS5-001: Add Immutable Crisis and Consequence Receipt Types
**Complexity:** M  
**File:** `src/game/pyoaTypes.ts` (NEW)

**What to Build:**
```typescript
interface CrisisReceipt {
  kind: 'crisis';
  schemaVersion: 1;
  receiptId: string;
  runId: string;
  bibleId: string;
  crisisId: CrisisId;
  chosenForkId: ForkId;
  lockedForkIds: readonly ForkId[];
  factWrites: readonly FactWrite[];
  scheduledConsequenceIds: readonly ConsequenceId[];
  resourceDeltas: readonly ResourceDelta[];
  relationshipDeltas: readonly RelationshipDelta[];
  committedAtTurn: number;
  idempotencyKey: string;
}
```

**Reference:** `docs/research/pasted/manus-ws-5-pyoa-persistence-2026-08-28/pyoaTypes.ts`

---

#### WS5-002: Enforce Unique Run-Plus-Crisis Idempotency Key
**Complexity:** M  
**File:** `src/game/pyoaBranchLedger.ts`

**What to Build:**
- Unique constraint on `(runId, crisisId)` at storage layer
- Retry with same key returns existing receipt
- Prevents duplicate XP and sibling re-locks

---

#### WS5-003: Commit Chosen Fork and All Sibling Locks Atomically
**Complexity:** L  
**File:** `src/game/pyoaBranchLedger.ts`

**What to Build:**
- `commitCrisisFork()` wraps all mutations in one transaction
- Rollback on any failed assertion
- Lock all sibling forks in same receipt

**Reference:** Lines 136-233 in Manus `pyoaBranchLedger.ts`

---

#### WS5-004: Rebuild Materialized Locks and Facts from Receipts
**Complexity:** M  
**File:** `src/game/pyoaBranchLedger.ts`

**What to Build:**
- `rebuildLedgerFromReceipts()` function
- Replay receipts in commit order
- Materialized views are query optimizations (receipts are source of truth)
- Recovery on startup if views disagree with receipts

---

#### WS5-005: Implement Exclusive Fact Group Registry
**Complexity:** M  
**File:** `src/game/pyoaBranchLedger.ts`

**What to Build:**
```typescript
interface ExclusiveFactGroup {
  id: string;
  mode: 'at-most-one' | 'exactly-one-after-crisis';
  members: readonly FactId[];
  ownerCrisisId?: CrisisId;
  description: string;
}
```

**Fact Groups per Bible:**
- Primary allegiance (exactly-one-after-crisis)
- Trust verdict (at-most-one)
- Truth disposition (at-most-one)
- Final method (at-most-one)
- Terminal outcome (at-most-one)

**Reference:** WS-5 Constitution lines 143-159

---

#### WS5-006: Reject Mutex Conflicts on Every Fact-Writing Transaction
**Complexity:** M  
**File:** `src/game/pyoaBranchLedger.ts`

**What to Build:**
- `assertExclusiveFacts()` validates mutex groups before commit
- Cover crisis, consequence, ending, import, migration writes
- Throw `FACT_CONFLICT` with group ID and conflicting facts

**Reference:** Lines 94-117 in Manus `pyoaBranchLedger.ts`

---

#### WS5-007: Move Crisis XP Awards Behind Receipt Idempotency
**Complexity:** S  
**File:** `src/game/evalHarness.ts` (integrate with existing XP system)

**What to Build:**
- `awardStoryXP(receiptId, amount)` with uniqueness constraint
- Rendering, retries, save/load, journal review = non-rewarding
- Separate crisis XP from mechanical XP in metrics

---

#### WS5-008: Block Resolved Crises in ArcDirector Spawn Selection
**Complexity:** M  
**File:** `src/game/arcDirector.ts`

**What to Build:**
- `canSpawnCrisis()` checks lock view and receipt idempotency key
- Never regenerate a resolved crisis under same ID
- Filter eligible deck by locks

**Reference:** Lines 46-51 in Manus `pyoaBranchLedger.ts`

---

#### WS5-009: Filter Locked and Illegal Forks in ChoiceCompiler
**Complexity:** M  
**File:** `src/game/choiceCompiler.ts`

**What to Build:**
- Never display an actionable sibling after receipt
- Check `predicateGroupMatches()` for fork prerequisites
- Display locked choice as history only, not button

**Reference:** Lines 26-44 in Manus `pyoaBranchLedger.ts`

---

### Wave 1 Exit Criteria

✅ A crisis can create one atomic receipt  
✅ Sibling locks are recorded with receipt  
✅ Exclusive facts are validated before commit  
✅ One reward per receipt (idempotent)  
✅ Locked crises never respawn  
✅ Locked forks never re-appear as choices  

### Wave 1 Test Coverage

**Test File:** `src/game/playtest30bWave1.test.ts` (NEW)

**Required Tests (12):**
1. Crisis receipt idempotency (same key returns same receipt)
2. Sibling locks recorded atomically
3. Mutex conflict rejection (FACT_CONFLICT thrown)
4. Resource cost assertion (INSUFFICIENT_RESOURCE thrown)
5. Fork prerequisite check (FORK_PREREQUISITE_FAILED thrown)
6. Terminal run blocks new crises
7. Receipt rebuild from storage
8. XP awarded once per receipt
9. Locked crisis filtered from spawn
10. Locked fork filtered from choices
11. Save/load preserves ledger state
12. Wave 1 does not break existing saves

### Wave 1 Deployment

**Type:** Client-only (shadow mode)

**Strategy:**
1. New ledger runs alongside B025 without breaking saves
2. Compare B025 state with WS-5 state in metrics
3. No player-visible changes until Wave 4 (Journal)

**Redeploy Required:** None (Wave 1 is state tracking only)

---

## Wave 2: Causal Debt and Liveness

**Goal:** Due payoffs deliver exactly once, every run terminates by T150

**Duration:** 3-4 days

### Tasks

#### WS5-010: Add Delayed Consequence Persistence Schema
**Complexity:** M  
**File:** `src/game/pyoaDelayedConsequences.ts` (NEW)

**What to Build:**
```typescript
interface DelayedConsequence {
  id: ConsequenceId;
  sourceCrisisId: CrisisId;
  sourceForkId: ForkId;
  committedAtTurn: number;
  dueAtTurn: number;
  status: 'pending' | 'delivered' | 'cancelled';
  type: 'reveal' | 'betrayal' | 'reward' | 'penalty' |
        'crisis_unlock' | 'relationship_shift' | 'world_state' |
        'ending_unlock';
  payload: {
    writes?: readonly FactWrite[];
    resourceDeltas?: readonly ResourceDelta[];
    relationshipDeltas?: readonly RelationshipDelta[];
    unlockCrisisId?: CrisisId;
    unlockEndingId?: EndingId;
    narrativeBeat: string;
    journalHint: string;
  };
}
```

**Reference:** WS-5 Constitution lines 176-199

---

#### WS5-011: Deliver Due Consequences in Deterministic Order
**Complexity:** L  
**File:** `src/game/pyoaDelayedConsequences.ts`

**What to Build:**
- `deliverDueConsequences(ledger, currentTurn)` function
- Sort by due turn then consequence ID
- Apply payload atomically
- Record delivery receipt
- Idempotent (duplicate delivery returns existing receipt)

**Reference:** Lines 219-222 in WS-5 Constitution

---

#### WS5-012: Run Consequence Scheduler Before Crisis and Ending Selection
**Complexity:** M  
**File:** `src/game/arcDirector.ts`

**What to Build:**
- Fixed sequence in `ArcDirector`:
  1. Deliver all pending consequences with `dueAtTurn <= currentTurn`
  2. Rebuild or incrementally update fact/relationship/resource views
  3. Evaluate convergence conditions
  4. Evaluate ending gates
  5. Select one new crisis from eligible deck

**Reference:** WS-5 Constitution lines 84-95

---

#### WS5-013: Implement Ending Gate Registry and Priority Resolver
**Complexity:** L  
**File:** `src/game/pyoaEndingGates.ts` (NEW)

**What to Build:**
```typescript
interface EndingGate {
  id: EndingId;
  priority: number;
  class: 'secret' | 'triumph' | 'transformation' | 'costly-victory' | 'escape' | 'failure';
  window: { earliest: number; target: number; latest: number };
  prerequisites: PredicateGroup;
  triggerCrisisId?: CrisisId;
  terminalFacts: readonly FactWrite[];
  fogOfWarTeaser: string;
}
```

- Select by priority, then closest target turn, then stable ending ID
- Secret endings only qualify when prerequisites strictly stronger

**Reference:** WS-5 Constitution lines 262-269

---

#### WS5-014: Guarantee One Terminal Receipt by Turn 150
**Complexity:** M  
**File:** `src/game/pyoaEndingGates.ts`

**What to Build:**
- Ending checks begin at turn 80
- At turn 150, select:
  1. Normally eligible ending (priority resolver)
  2. Qualifying failure ending
  3. Unconditional fallback (bible-specific, reflects branch history)
- Exactly one terminal receipt per run

---

#### WS5-015: Stop All Crisis Spawning and Reward Accrual After Ending
**Complexity:** S  
**File:** `src/game/arcDirector.ts`

**What to Build:**
- Check `ledger.endingReceipt` before crisis spawn
- Terminal means no new crises, no new XP
- Journal shows ending receipt and replay options only

---

#### WS5-016: Add G1 Crisis Repetition Property Test
**Complexity:** M  
**File:** `src/game/evalHarness.ts` (NEW)

**What to Build:**
- Assert max one crisis receipt per `(runId, crisisId)`
- Zero duplicate reward receipts
- Simulate save/load/retry scenarios

---

#### WS5-017: Add G2 Sibling Lock Completeness Property Test
**Complexity:** M  
**File:** `src/game/evalHarness.ts`

**What to Build:**
- Every receipt must lock exactly `crisis.forks.length - 1` siblings
- Catalog scan: every fork lists all siblings in `lockedSiblings` array
- Runtime trace: no post-lock offers

---

#### WS5-018: Add G5 Exclusive Fact Contradiction Test
**Complexity:** M  
**File:** `src/game/evalHarness.ts`

**What to Build:**
- Test runtime transactions, save import, delayed payload paths
- Zero persisted mutex conflicts
- Zero missing exactly-one selections after owner crises

---

### Wave 2 Exit Criteria

✅ Due consequences deliver exactly once  
✅ Consequences delivered before crisis selection  
✅ Ending gates evaluated from turn 80  
✅ One terminal receipt by turn 150 (guaranteed)  
✅ Terminal run blocks new crises and XP  
✅ G1 (crisis repetition) test passes  
✅ G2 (sibling locks) test passes  
✅ G5 (mutex conflicts) test passes  

### Wave 2 Test Coverage

**Test File:** `src/game/playtest30cWave2.test.ts` (NEW)

**Required Tests (14):**
1. Consequence scheduled at commit
2. Consequence delivered at due turn
3. Consequence delivery is idempotent
4. Overdue consequences trigger P0 metric
5. Ending gate selected by priority
6. Ending gate selected by target turn
7. Fallback ending at T150
8. Terminal receipt stops crisis spawning
9. Terminal receipt stops XP accrual
10. G1 property test (crisis repetition)
11. G2 property test (sibling locks)
12. G5 property test (mutex conflicts)
13. Seed-based replay (same seed = same crisis order)
14. Wave 2 integrates with Wave 1

### Wave 2 Deployment

**Type:** Client-only

**Redeploy Required:** None (state tracking + pre-GM checks)

---

## Wave 3: Convergence and Catalogs

**Goal:** Three validated catalogs load, convergence preserves provenance

**Duration:** 3-4 days

### Tasks

#### WS5-019: Implement Convergence Registry and State Projection Hashing
**Complexity:** M  
**File:** `src/game/pyoaConvergence.ts` (NEW)

**What to Build:**
```typescript
interface ConvergenceContract {
  id: ConvergenceId;
  window: { earliest: number; target: number; latest: number };
  eligibleWhen: PredicateGroup;
  equivalentOn: readonly FactId[];
  preserveProvenanceFacts: readonly FactId[];
  spawnCrisisId: CrisisId;
}
```

- Hash `equivalentOn` fact values into stable projection
- Named projections only (no inference from prose)

**Reference:** WS-5 Constitution lines 228-246

---

#### WS5-020: Commit Convergence Receipts Without Deleting Provenance
**Complexity:** M  
**File:** `src/game/pyoaConvergence.ts`

**What to Build:**
- `detectBranchConvergence()` checks turn window + `eligibleWhen`
- Compute stable serialization of `equivalentOn` fact values
- Record `ConvergenceReceipt` with state hash
- Preserved facts remain queryable for callbacks and endings

---

#### WS5-021: Spawn Convergence Crises Ahead of Ordinary Deck Picks
**Complexity:** M  
**File:** `src/game/arcDirector.ts`

**What to Build:**
- After consequence delivery and fact rebuild, evaluate convergence
- Commit at most one convergence receipt per turn
- Convergence crisis spawns before ordinary deck selection

---

#### WS5-022: Extend BeatContract with Crisis Locks, Schedules, and Convergence
**Complexity:** M  
**File:** `src/game/beatContract.ts`

**What to Build:**
- Add crisis metadata to beat contracts
- Validate stable IDs at build time
- Fallback narrative beats for GM timeouts
- Sibling lock arrays

---

#### WS5-023: Load and Validate Thornferry Road Catalog
**Complexity:** M  
**File:** `src/game/crisisDeckRegistry.ts` (NEW)

**What to Build:**
- Load `data/pyoa/thornferry-road.json`
- 6 crises, 14 forks, 2 convergences, 6 endings
- Validate references, locks, costs, delays
- Fact registry: allegiance, miller_verdict, village_fate, truth_disposition, final_method

**Reference:** `docs/research/pasted/manus-ws-5-pyoa-persistence-2026-08-28/thornferry-road.json`

---

#### WS5-024: Load and Validate Vesper Glass Cipher Catalog
**Complexity:** M  
**File:** `src/game/crisisDeckRegistry.ts`

**What to Build:**
- Load `data/pyoa/vesper-glass-cipher.json`
- 6 crises, 14 forks, 2 convergences, 6 endings
- Fact registry: primary-allegiance, trust-verdict, truth-disposition, final-method

**Reference:** `docs/research/pasted/manus-ws-5-pyoa-persistence-2026-08-28/vesper-glass-cipher.json`

---

#### WS5-025: Load and Validate Erebus-9 Catalog
**Complexity:** M  
**File:** `src/game/crisisDeckRegistry.ts`

**What to Build:**
- Load `data/pyoa/erebus-9.json`
- 6 crises, 14 forks, 2 convergences, 6 endings
- Extend resource enum for `oxygen` and `power`
- Fact registry: primary-allegiance, trust-verdict, truth-disposition, synthetic-identity, quarantine-verdict, final-method

**Reference:** `docs/research/pasted/manus-ws-5-pyoa-persistence-2026-08-28/erebus-9.json`

---

#### WS5-026: Add Catalog Sealing Validator to CI
**Complexity:** M  
**File:** `src/game/evalHarness.ts`

**What to Build:**
- Reject bad references (crisisId in fork doesn't exist)
- Reject missing locks (fork doesn't list all siblings)
- Reject empty projections (convergence `equivalentOn` is empty)
- Reject late payoffs (consequence due turn > T150)
- CI fails if any catalog invalid

---

### Wave 3 Exit Criteria

✅ Three catalogs load and validate  
✅ Convergence contracts preserve provenance  
✅ Convergence receipts unlock shared crises  
✅ BeatContract carries crisis metadata  
✅ Catalog CI is green  

### Wave 3 Test Coverage

**Test File:** `src/game/playtest30dWave3.test.ts` (NEW)

**Required Tests (12):**
1. Thornferry Road catalog loads
2. Vesper Glass Cipher catalog loads
3. Erebus-9 catalog loads
4. Convergence detected at equivalence point
5. Convergence preserves provenance facts
6. Convergence unlocks shared crisis
7. Catalog validator rejects bad references
8. Catalog validator rejects missing locks
9. Catalog validator rejects empty projections
10. Catalog validator rejects late payoffs
11. Catalog CI integrates with test suite
12. Wave 3 integrates with Wave 1+2

### Wave 3 Deployment

**Type:** Client + Data

**New Files:**
- `data/pyoa/thornferry-road.json`
- `data/pyoa/vesper-glass-cipher.json`
- `data/pyoa/erebus-9.json`

**Redeploy Required:** None (catalogs bundled in client build)

---

## Wave 4: GM and Journal Integration

**Goal:** Situation packets honor ledger truth, Journal is usable

**Duration:** 2-3 days

### Tasks

#### WS5-027: Extend SituationPacket with Branch Ledger Projection
**Complexity:** M  
**File:** `src/game/situationPacket.ts`

**What to Build:**
```typescript
interface PyoaSituationPacket {
  activeCrisis?: {
    crisisId: CrisisId;
    selectedForkId?: ForkId;
    legalForkIds: readonly ForkId[];
    lockedForkIds: readonly ForkId[];
  };
  knownFacts: readonly FactRecord[];
  veiledFacts: readonly Pick<FactRecord, 'factId' | 'journalText'>[];
  dueConsequences: readonly {
    id: ConsequenceId;
    type: ConsequenceType;
    narrativeBeat: string;
  }[];
  preservedProvenanceFacts: readonly FactId[];
  eligibleEndingIds: readonly EndingId[];
  forbiddenClaims: readonly string[];
}
```

- Known facts: Player has seen this fact committed
- Veiled facts: Player knows something is scheduled but not details
- Forbidden claims: Locked offers, mutex contradictions, premature payoffs

**Reference:** WS-5 Constitution lines 274-296

---

#### WS5-028: Add ProseWarden Branch Contradiction Checks
**Complexity:** L  
**File:** `src/game/proseWarden.ts`

**What to Build:**
- Reject prose that offers a locked fork
- Reject prose that asserts mutually exclusive facts
- Reject prose that narrates an undelivered consequence as complete
- Reject prose that promises an unavailable ending
- Reject prose that re-opens a resolved crisis
- Repair or flag, but ledger remains authoritative

---

#### WS5-029: Implement Branch Journal Server View Model
**Complexity:** M  
**File:** `src/game/branchJournalModel.ts` (NEW)

**What to Build:**
```typescript
interface BranchJournalViewModel {
  activeCrisis?: {
    name: string;
    telegraph: string;
    legalForks: readonly { id: ForkId; label: string; stakes: string }[];
  };
  lockedBranches: readonly {
    crisisName: string;
    chosenLabel: string;
    closedCount: number;
    turn: number;
  }[];
  delayedConsequences: readonly {
    type: ConsequenceType;
    hint: string;
    timingBand: 'soon' | 'later' | 'much later';
  }[];
  endings: readonly {
    id: EndingId;
    disclosed: boolean;
    name?: string;
    teaser?: string;
  }[];
}
```

- Client must not receive hidden facts or raw ending prerequisites
- Spoiler-safe disclosure levels: known, veiled, hidden

**Reference:** WS-5 Fog-of-War Journal document

---

#### WS5-030: Build Active Crisis and Locked Branches Journal Cards
**Complexity:** M  
**File:** `src/components/QuestJournal.tsx`

**What to Build:**
- Active Crisis card: name, telegraph, legal forks with stakes
- Locked Branches card: crisis name, chosen label, closed count, turn
- Deterministic labels from registry (not GM prose)
- Receipt links for audit

---

#### WS5-031: Build Delayed Consequences and Endings Journal Cards
**Complexity:** M  
**File:** `src/components/QuestJournal.tsx`

**What to Build:**
- Delayed Consequences card: type, hint, timing band
- Endings card: disclosed endings (name + teaser), undiscovered slots (count only)
- Timing bands: soon (< 15t), later (15-50t), much later (50t+)
- No spoilers (raw ending prerequisites stay server-side)

---

### Wave 4 Exit Criteria

✅ Situation packet projects known/veiled/hidden facts  
✅ ProseWarden detects ledger contradictions  
✅ Branch Journal view model is spoiler-safe  
✅ Journal shows active crisis and legal forks  
✅ Journal shows locked branches with chosen labels  
✅ Journal shows delayed consequences with timing bands  
✅ Journal shows endings (disclosed only)  

### Wave 4 Test Coverage

**Test File:** `src/game/playtest30eWave4.test.ts` (NEW)

**Required Tests (10):**
1. Situation packet projects known facts
2. Situation packet veils scheduled consequences
3. Situation packet hides ending prerequisites
4. ProseWarden rejects locked fork offers
5. ProseWarden rejects mutex contradictions
6. Branch Journal view model is spoiler-safe
7. Journal displays active crisis
8. Journal displays locked branches
9. Journal displays delayed consequences
10. Journal displays disclosed endings only

### Wave 4 Deployment

**Type:** Client + UI

**Redeploy Required:** 
- Optional: `npx supabase functions deploy gm-turn` if SNAPSHOT needs branch mandates

---

## Wave 5: Replay and Validation

**Goal:** Seed contracts are reproducible, 10,000-seed suite passes

**Duration:** 2-3 days

### Tasks

#### WS5-032: Implement Seed Manifest and Isolated Random Streams
**Complexity:** L  
**File:** `src/game/replayMode.ts` (NEW)

**What to Build:**
```typescript
interface ReplaySeedContract {
  version: number;
  bibleId: string;
  seed: string;
  manifestVersion: string;
  streams: {
    crisisOrder: string;
    presentationVariants: string;
    ambientEvents: string;
  };
}
```

- Crisis ordering uses isolated seed stream
- Presentation variants use separate stream
- Ambient events use separate stream
- Versioned manifest tracks catalog changes

---

#### WS5-033: Implement Replay Completion Screen and Seed Copy
**Complexity:** M  
**File:** `src/game/replayMode.ts`

**What to Build:**
- Replay completion screen shows ending name, turn count, branches taken
- Copy seed contract to clipboard
- No account or save identifiers in seed (reproducible without auth)

---

#### WS5-034: Implement Speedrun Opening-Skip Receipt
**Complexity:** M  
**File:** `src/game/replayMode.ts`

**What to Build:**
- Start at T5 with no XP, locks, facts, or branch rewards
- Skip opening content for rapid replay testing
- Opening XP not awarded in speedrun mode

---

#### WS5-035: Add Accessibility Controls for Exact Timing and Reduced Motion
**Complexity:** S  
**File:** `src/components/QuestJournal.tsx`

**What to Build:**
- Exact timing toggle (shows exact due turn vs timing band)
- Reduced motion toggle (disables card animations)
- Accessibility controls are presentation-only (no gameplay impact)

---

#### WS5-036: Run 10,000-Seed Liveness and Coverage Suite per Bible
**Complexity:** L  
**File:** `src/game/evalHarness.ts`

**What to Build:**
- 10,000 seeded runs per bible (Thornferry, Vesper, Erebus)
- Archive failing seed contracts, choice traces, terminal turns
- All five quality gates (G1-G5) must pass independently for all three bibles
- G3 (ending liveness): At least 80% normal endings by T150, 0% runs without ending
- G4 (delayed payoff coverage): At least 50% crisis coverage, zero overdue consequences

---

### Wave 5 Exit Criteria

✅ Seed contracts are reproducible  
✅ Replay completion screen usable  
✅ Speedrun mode skips opening  
✅ Accessibility controls wired  
✅ 10,000-seed suite passes for all three bibles  
✅ All five quality gates (G1-G5) pass  

### Wave 5 Test Coverage

**Test File:** `src/game/playtest30fWave5.test.ts` (NEW)

**Required Tests (8):**
1. Same seed produces same crisis order
2. Replay completion screen displays correctly
3. Speedrun mode starts at T5 with clean state
4. Accessibility controls toggle without breaking
5. G3 property test (ending liveness)
6. G4 property test (delayed payoff coverage)
7. 100-seed mini-suite (smoke test)
8. Wave 5 integrates with Wave 1-4

### Wave 5 Deployment

**Type:** Client + Evaluation Harness

**Redeploy Required:** None (replay is client-side)

---

## Cross-Wave Integration Points

### ArcDirector Fixed Sequence (Wave 1-2 Integration)

```typescript
// At each turn commit, ArcDirector performs this fixed sequence:
function commitTurn(ledger: PyoaBranchLedger, currentTurn: number) {
  // 1. Wave 2: Deliver all pending consequences
  deliverDueConsequences(ledger, currentTurn);
  
  // 2. Wave 1: Rebuild or incrementally update fact views
  rebuildLedgerFromReceipts(ledger);
  
  // 3. Wave 3: Evaluate convergence conditions
  detectBranchConvergence(ledger, currentTurn);
  
  // 4. Wave 2: Evaluate ending gates
  selectEndingGate(ledger, currentTurn);
  
  // 5. Wave 1: Select one new crisis from eligible deck
  selectCrisis(ledger, currentTurn);
  
  // 6. Wave 4: Build situation packet from post-commit state
  buildSituationPacket(ledger);
  
  // 7. Call GM with situation packet
  callGm(situationPacket);
}
```

### Wave 3-4 Integration (Catalog to Journal)

```
Catalog JSON → CrisisDeckRegistry (Wave 3)
           → BeatContract (Wave 3)
           → PyoaSituationPacket (Wave 4)
           → BranchJournalViewModel (Wave 4)
           → QuestJournal.tsx (Wave 4)
```

### Wave 4-5 Integration (Journal to Replay)

```
BranchJournalViewModel (Wave 4) → Replay Completion Screen (Wave 5)
CrisisReceipt (Wave 1) → Seed Contract (Wave 5)
Choice Trace (Wave 1) → Replay Archive (Wave 5)
```

---

## Test Strategy

### Layer 1: Unit Invariants (Every Commit)
- Predicate semantics
- Mutex checks
- Sibling-set equality
- Scheduler ordering
- Priority resolution

### Layer 2: Catalog Validation (Every Catalog Change)
- Counts (18 crises, 42 forks, 6 convergences, 18 endings)
- Stable IDs
- References (crisis → fork, fork → crisis)
- Locks (every fork lists all siblings)
- Costs (every fork has resource/relationship/time cost)
- Delayed coverage (at least 50% crises have scheduled consequences)
- Convergence projections (no empty `equivalentOn`)
- Ending fallback (each bible has unconditional fallback)

### Layer 3: Property Tests (Every Pull Request)
- Retry idempotency
- Arbitrary legal fork commits
- Save/load rebuild equivalence
- No post-terminal mutation

### Layer 4: Reduced Simulation (Every Pull Request)
- Hundreds of seeds per bible
- Uniform and coverage-biased strategies

### Layer 5: Full Sealing Suite (Release Candidate)
- 10,000 seeds per bible
- All strategies
- Retained failure traces

### Layer 6: Manual Narrative Pass (Release Candidate)
- Journal spoiler review
- Convergence callbacks
- Ending tone
- GM fallback prose

---

## Rollout Strategy

### Phase 1: Shadow Mode (Wave 1)
- New ledger runs alongside B025 without breaking saves
- Compare B025 state with WS-5 state in metrics
- No player-visible changes
- Mismatch rate must reach zero on fixed regression suite

### Phase 2: Enable Atomic Commits (Wave 1-2)
- Enable atomic crisis commits and sibling locks
- Crisis XP becomes idempotent
- Millstone Charter 288× loop structurally impossible

### Phase 3: Enable Delayed Consequences and Ending Enforcement (Wave 2)
- Feature flag: `PYOA_CAUSAL_DEBT_ENABLED=true`
- Payoffs deliver at due turn
- Ending gates enforce T150 deadline

### Phase 4: Ship Journal and Catalogs (Wave 3-4)
- Three bibles available in New Game picker
- Branch Journal shows known/veiled/hidden state
- Replay mode available in Settings

### Phase 5: Enable Full Validation (Wave 5)
- 10,000-seed suite runs in CI
- Catalog changes gated on pass/fail
- Manual narrative pass required for new bibles

---

## Migration Strategy

### Legacy Save Compatibility

**Current B025 State:**
```typescript
interface PyoaBranchLedger {
  activeBranch?: 'millstone-charter' | 'solo-road' | 'ally-path' | 'none';
  committedPaths?: string[];
  charterUses?: number;
  branchClosed?: boolean;
  branchLocked?: string | false;
  convergencePoints?: Array<{
    turn: number;
    branches: string[];
    stateHash: string;
  }>;
}
```

**Migration Rules:**
1. **Unambiguous Crisis Receipts:** Reconstruct lock only when unique chosen fork can be proven
2. **Ambiguous Histories:** Quarantine into compatibility ending path (no guess)
3. **Audit Receipt:** Migration writes audit receipt, never awards retroactive XP
4. **Compatibility Ending:** Branch-neutral fallback for ambiguous saves

**Migration Function:**
```typescript
function migrateB025ToWS5(oldLedger: OldPyoaBranchLedger): PyoaBranchLedger {
  // Reconstruct unambiguous receipts from committedPaths
  // Quarantine ambiguous histories
  // Write audit receipt
  // Return new ledger
}
```

---

## Metrics and Observability

### Required Metrics

| Metric | Dimensions | Alert Threshold |
|---|---|---|
| `pyoa_crisis_receipts_total` | bible, crisis, fork | Duplicate `(run, crisis)` is impossible |
| `pyoa_crisis_render_total` | bible, crisis | Render-to-receipt ratio > 2 indicates retry loop |
| `pyoa_fact_conflicts_total` | bible, mutex group | Any non-zero production value is P0 |
| `pyoa_consequence_overdue_total` | bible, consequence type | Any item > 1 turn overdue is P0 |
| `pyoa_ending_turn` | bible, ending | > 20% runs without ending by T150 fails G3 |
| `pyoa_branch_callback_coverage` | bible, fact | Any preserved fact with zero later reference fails catalog validation |
| `pyoa_xp_per_receipt` | reward type | > 1 award per receipt fails G1/G2 support |

### Dashboards

**Dashboard 1: Crisis Lifecycle**
- Crisis spawn rate by bible
- Crisis resolution rate by crisis
- Sibling lock completeness by crisis
- Crisis render-to-receipt ratio

**Dashboard 2: Causal Debt**
- Consequence delivery latency (actual - due turn)
- Overdue consequence count
- Cancelled consequence count
- Consequence type distribution

**Dashboard 3: Ending Liveness**
- Ending turn distribution by bible
- Ending gate hit rate by ending
- Runs without ending by T150
- Fallback ending rate

**Dashboard 4: Fact Integrity**
- Mutex conflict rate by group
- Exactly-one-after-crisis violations
- Provenance fact callback coverage

---

## Risk Mitigation

### Risk 1: B025 Migration Failures
**Probability:** Medium  
**Impact:** High  
**Mitigation:**
- Shadow mode in Wave 1 (compare states without breaking saves)
- Legacy adapter for ambiguous histories
- Audit receipts (no retroactive XP)
- Compatibility ending for quarantined saves

### Risk 2: Catalog Continuity Gaps
**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- Commission catalog continuity pass in parallel with Wave 1
- Cross-reference all named anchors against source bibles
- Manual narrative review before sealing
- Catalog CI validation

### Risk 3: Delayed Consequence Disconnection
**Probability:** Low  
**Impact:** Medium  
**Mitigation:**
- Echo pattern (12-20t) provides early callback
- Journal hints show timing bands
- Payoff prose references original choice

### Risk 4: Ending Liveness Feels Forced
**Probability:** Low  
**Impact:** Medium  
**Mitigation:**
- Gates evaluated from T80 (70 turns before deadline)
- Priority resolver selects best available gate
- Fallback reflects branch history (not generic collapse)

### Risk 5: Prose Enforcement Over-Rejects
**Probability:** Low  
**Impact:** Low  
**Mitigation:**
- Prose warden is defense in depth (ledger authoritative)
- Repair instead of reject when possible
- Catalog authors can mark valid exceptions

---

## Success Criteria

### Wave 1 Success
✅ Crisis receipts are atomic  
✅ Sibling locks recorded with receipt  
✅ Exclusive facts validated before commit  
✅ One reward per receipt (idempotent)  
✅ Locked crises never respawn  
✅ Locked forks never re-appear as choices  
✅ 12 tests pass  

### Wave 2 Success
✅ Due consequences deliver exactly once  
✅ Consequences delivered before crisis selection  
✅ Ending gates evaluated from turn 80  
✅ One terminal receipt by turn 150 (guaranteed)  
✅ Terminal run blocks new crises and XP  
✅ G1, G2, G5 tests pass  
✅ 14 tests pass  

### Wave 3 Success
✅ Three catalogs load and validate  
✅ Convergence contracts preserve provenance  
✅ Convergence receipts unlock shared crises  
✅ Catalog CI is green  
✅ 12 tests pass  

### Wave 4 Success
✅ Situation packet projects known/veiled/hidden facts  
✅ ProseWarden detects ledger contradictions  
✅ Branch Journal is spoiler-safe  
✅ Journal shows active crisis, locked branches, delayed consequences, endings  
✅ 10 tests pass  

### Wave 5 Success
✅ Seed contracts are reproducible  
✅ 10,000-seed suite passes for all three bibles  
✅ All five quality gates (G1-G5) pass  
✅ 8 tests pass  

### Overall Success
✅ All 36 tasks closed  
✅ All 56 tests pass  
✅ All five quality gates pass independently for all three bibles  
✅ Each catalog receives continuity sign-off  
✅ Journal passes spoiler review  
✅ Identical seed contracts reproduce identical crisis orders and branch receipts  

---

## Authorization Checklist

Before starting Wave 1:
- [ ] John authorizes Wave 1 implementation
- [ ] Catalog continuity pass commissioned (Thornferry Road vs source bible)
- [ ] Shadow mode strategy approved
- [ ] Test suite structure approved
- [ ] Migration strategy approved

Before starting Wave 2:
- [ ] Wave 1 ships and shadow mode metrics are green
- [ ] John authorizes Wave 2 implementation

Before starting Wave 3:
- [ ] Wave 2 ships and liveness metrics are green
- [ ] Catalog continuity pass complete (at least one bible)
- [ ] John authorizes Wave 3 implementation

Before starting Wave 4:
- [ ] Wave 3 ships and catalog CI is green
- [ ] John authorizes Wave 4 implementation

Before starting Wave 5:
- [ ] Wave 4 ships and Journal is usable
- [ ] John authorizes Wave 5 implementation

---

## Related Documents

- **Ingest:** `docs/research/manus-ws-5-pyoa-persistence-ingest-2026-08-28.md`
- **Source Package:** `docs/research/pasted/manus-ws-5-pyoa-persistence-2026-08-28/`
- **Commission Prompt:** `docs/research/MANUS-PROMPT-WS-5.txt`
- **Current B025:** `src/game/pyoaBranchLedger.ts`
- **Wave 2 Ship:** `docs/research/path-a-wave-2-ship-2026-08-28.md`
- **BIG CHANGES Backlog:** `docs/research/manus-big-changes-implementation-backlog-2026-08-27.md`

---

## Timeline

| Wave | Start | Duration | Complete |
|---|---|---|---|
| Wave 1 | Day 1 | 3-4 days | Day 4 |
| Wave 2 | Day 5 | 3-4 days | Day 8 |
| Wave 3 | Day 9 | 3-4 days | Day 12 |
| Wave 4 | Day 13 | 2-3 days | Day 15 |
| Wave 5 | Day 16 | 2-3 days | Day 18 |

**Total:** 13-18 engineering days (focused implementation time)

**Expected:** 16 days

**Buffer:** 20 days (includes catalog continuity pass, manual narrative review, 10k-seed debugging)
