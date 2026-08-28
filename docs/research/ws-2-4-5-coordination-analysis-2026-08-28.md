# WS-2, WS-4, WS-5 Coordination Analysis

**Date:** 2026-08-28  
**Scope:** Three Manus research packages (NPC Lifecycle, Encounter Bible, PYOA Persistence)  
**Purpose:** Identify integration points, shared contracts, transaction boundaries, and migration requirements

---

## Executive Summary

The three Manus packages share a common architectural foundation:
- **Receipt-led ledger commits** before GM narration
- **Atomic transaction boundaries** with idempotency
- **Quality gates (G1-G5)** for deterministic validation
- **Pre-GM orchestration** in ArcDirector

**Key Finding:** The packages are **highly coordinated** but **loosely coupled**. They share contracts but don't depend on each other's implementation details. This means they can be implemented in parallel with minimal blocking.

**Critical Path:** 
1. Define shared contracts first (Phase 2)
2. Implement in coordinated waves (Phase 3)
3. Each package can progress independently within a wave

---

## Integration Points

### 1. WS-2 → WS-4: NPC Triggers Encounters

**Scenario:** Quest-giver NPC obligation requires combat resolution

**Flow:**
```
NPC obligation "clear the bandits" 
  → ArcDirector detects unfulfilled obligation + deadline approaching
  → Encounter Bible selects appropriate encounter (biome-filtered)
  → Combat resolves
  → Receipt records completion
  → NPC obligation satisfied → debt_satisfied state → exit window
```

**Contract Needed:**
```typescript
interface NpcEncounterTrigger {
  npcId: string;
  obligationId: string;
  encounterRole: 'ambush' | 'patrol' | 'guard' | 'boss' | 'rescue';
  biomeConstraints: BiomeFilter;
  tierRange: [number, number];
  successCriteria: 'victory' | 'flee' | 'parley';
  urgency: 'soft' | 'hard' | 'story-beat';
}
```

**Data Flow:**
- **WS-2 → WS-4:** NPC obligation context → encounter selection parameters
- **WS-4 → WS-2:** Encounter receipt → NPC obligation satisfaction check

**Implementation:**
- **WS-2 Wave 1 (NPC-006):** Defines obligation success criteria
- **WS-4 Wave 1 (B002, B021):** Accepts external spawn triggers
- **Coordination:** `arcDirector.ts` calls both systems in sequence

---

### 2. WS-4 → WS-5: Encounter Receipts Unlock Branches

**Scenario:** PYOA crisis fork requires boss defeated

**Flow:**
```
Encounter terminates with victory receipt
  → Receipt writes exclusive fact "boss_defeated"
  → PYOA crisis becomes eligible (prerequisite satisfied)
  → Fork displays "Confront the patron now that threat is gone"
```

**Contract Needed:**
```typescript
interface EncounterReceipt {
  kind: 'encounter';
  receiptId: string;
  runId: string;
  encounterId: string;
  templateId: string;
  terminal: 'victory' | 'defeat' | 'fled' | 'parleyResolved';
  exclusiveFacts: readonly FactWrite[]; // e.g., "boss_defeated"
  resourceDeltas: readonly ResourceDelta[];
  relationshipDeltas: readonly RelationshipDelta[];
  committedAtTurn: number;
  idempotencyKey: string;
}
```

**Data Flow:**
- **WS-4 → WS-5:** Encounter receipt → PYOA fact ledger
- **WS-5:** Checks prerequisites against fact ledger → enables fork

**Implementation:**
- **WS-4 Wave 2 (B017):** Emits typed receipts with exclusive facts
- **WS-5 Wave 1 (WS5-009):** Checks fork prerequisites against fact ledger
- **Coordination:** Both write to shared `exclusiveFacts` registry

---

### 3. WS-2 → WS-5: NPC Deals Trigger Crises

**Scenario:** Betray merchant NPC → crisis appears 50 turns later

**Flow:**
```
Player betrays Npc-Merchant-047 at T30
  → WS-2 appends betrayal key moment to memory ledger
  → NPC role transitions: functioning → exiting (turnover)
  → WS-2 schedules delayed consequence "merchant_revenge"
  → At T80, WS-5 delivers consequence
  → PYOA crisis "The Reckoning" becomes eligible
  → Crisis fork locks sibling "continue unchallenged"
```

**Contract Needed:**
```typescript
interface NpcCrisisTrigger {
  sourceNpcId: string;
  sourceEvent: 'betrayal' | 'favor' | 'deal' | 'revelation';
  crisisId: CrisisId;
  delayTurns: number;
  prerequisites: PredicateGroup;
  urgency: 'echo' | 'return' | 'reckoning';
}
```

**Data Flow:**
- **WS-2 → WS-5:** NPC betrayal event → delayed consequence scheduler
- **WS-5:** Consequence delivers → crisis eligible → fork locks

**Implementation:**
- **WS-2 Wave 2 (NPC-011, NPC-021):** Appends betrayal events
- **WS-5 Wave 2 (WS5-010, WS5-011):** Schedules and delivers consequences
- **Coordination:** Both use `delayedConsequences` ledger

---

### 4. WS-4 → WS-2: Encounter Outcomes Affect NPCs

**Scenario:** Save NPC in combat → they remember and relationship changes

**Flow:**
```
Encounter: "Rescue Captive" (NPC-Witness-023)
  → Combat victory receipt
  → Receipt includes NPC effect "saved_from_bandits"
  → WS-2 memory ledger appends key moment
  → Relationship delta: neutral → grateful (+25)
  → NPC role: captive → companion (transformation)
```

**Contract Needed:**
```typescript
interface EncounterNpcEffect {
  encounterId: string;
  receiptId: string;
  affectedNpcId: string;
  memoryCategory: 'rescue' | 'betrayal' | 'witness' | 'favor';
  relationshipDelta: number;
  roleTransition?: { from: NpcRole; to: NpcRole };
  keyMomentData: Partial<NpcKeyMoment>;
}
```

**Data Flow:**
- **WS-4 → WS-2:** Encounter receipt → NPC memory append
- **WS-2:** Updates relationship projection, checks role transformation

**Implementation:**
- **WS-4 Wave 2 (B017, B019):** Emits NPC-targeted receipts
- **WS-2 Wave 1 (NPC-010):** Accepts external memory events
- **Coordination:** Both write to `npcMemoryLedger`

---

## Cross-Cutting Concerns

### 1. Receipt Schema and Idempotency

**Problem:** All three systems emit receipts. Need unified schema.

**Shared Contract:**
```typescript
type Receipt = 
  | EncounterReceipt
  | CrisisReceipt
  | NpcTurnoverReceipt
  | DelayedConsequenceReceipt
  | EndingReceipt;

interface BaseReceipt {
  kind: string;
  receiptId: string;
  runId: string;
  committedAtTurn: number;
  idempotencyKey: string;
  schemaVersion: number;
}
```

**Idempotency Key Format:**
- WS-2: `${runId}:npc:${npcId}:${event}`
- WS-4: `${runId}:encounter:${encounterId}:${terminal}`
- WS-5: `${runId}:crisis:${crisisId}`

**Implementation:**
- **Coordination File:** `src/game/types/crossPackageContracts.ts`
- **Owner:** Create during Phase 2

---

### 2. Ledger Transaction Boundaries

**Problem:** Multiple systems mutate shared state (facts, resources, relationships). Need atomic commits.

**Transaction Order (ArcDirector Pre-GM Sequence):**
```typescript
function preGmCommit(state: GameState): GameState {
  // Phase 1: Deliver scheduled consequences
  state = deliverDueConsequences(state);
  
  // Phase 2: Update NPC lifecycles and deadlines
  state = checkNpcLifecycles(state);
  
  // Phase 3: Select and commit encounter (if needed)
  state = maybeSpawnEncounter(state);
  
  // Phase 4: Select and commit crisis (if needed)
  state = maybeSpawnCrisis(state);
  
  // Phase 5: Check ending gates
  state = checkPyoaEndingGates(state);
  
  // Phase 6: Rebuild materialized views
  state = rebuildProjections(state);
  
  return state;
}
```

**Atomicity Guarantee:**
- Each phase commits OR rolls back entirely
- No partial writes
- Failed commit logs error but doesn't break GM call

**Implementation:**
- **Coordination File:** `src/game/packageCoordination.ts`
- **Owner:** Create during Phase 2

---

### 3. Exclusive Facts Registry

**Problem:** All three systems write facts. Need mutex enforcement.

**Shared Registry:**
```typescript
interface ExclusiveFactGroup {
  id: string;
  mode: 'at-most-one' | 'exactly-one-after-crisis';
  members: readonly FactId[];
  ownerPackage: 'ws2' | 'ws4' | 'ws5';
  ownerCrisisId?: CrisisId;
  description: string;
}

const SHARED_FACT_GROUPS: ExclusiveFactGroup[] = [
  {
    id: 'terminal_outcome',
    mode: 'at-most-one',
    members: ['victory', 'defeat', 'fled', 'ending_triumph', 'ending_failure'],
    ownerPackage: 'ws4', // WS-4 owns encounter terminals, WS-5 owns ending terminals
    description: 'Only one terminal outcome per run',
  },
  {
    id: 'primary_allegiance',
    mode: 'exactly-one-after-crisis',
    members: ['faction_A', 'faction_B', 'independent'],
    ownerPackage: 'ws5',
    ownerCrisisId: 'alliance-fork',
    description: 'Must choose allegiance after fork crisis',
  },
];
```

**Validation:**
- `assertExclusiveFacts()` runs before every fact write
- Throws `FACT_CONFLICT` if mutex violated
- All three packages call same validator

**Implementation:**
- **Coordination File:** `src/game/exclusiveFactsRegistry.ts`
- **Owner:** Create during Phase 2

---

### 4. Quality Gates (G1-G5)

**Problem:** Each package has G1-G5 gates. Need unified harness.

**Shared Harness Structure:**
```typescript
interface QualityGate {
  id: string;
  package: 'ws2' | 'ws4' | 'ws5';
  question: string;
  threshold: string;
  validator: (run: GameplayRun) => GateResult;
}

const ALL_QUALITY_GATES: QualityGate[] = [
  // WS-2 gates
  { id: 'ws2-g1', package: 'ws2', question: 'NPCs exit within 10 turns of debt satisfaction?', threshold: 'p95 ≤ 10, pass ≥ 98%', validator: validateNpcExitLatency },
  { id: 'ws2-g2', package: 'ws2', question: 'No duplicate topic reveals?', threshold: '100%, zero violations', validator: validateTopicUniqueness },
  
  // WS-4 gates
  { id: 'ws4-g1', package: 'ws4', question: 'All encounters terminal within maxTurns?', threshold: '100%, zero violations', validator: validateEncounterTerminality },
  { id: 'ws4-g3', package: 'ws4', question: 'No wrong-bible spawns?', threshold: '100%, zero violations', validator: validateBiomeFilter },
  
  // WS-5 gates
  { id: 'ws5-g1', package: 'ws5', question: 'Zero crisis repetition?', threshold: '100%, zero duplicate receipts', validator: validateCrisisUniqueness },
  { id: 'ws5-g3', package: 'ws5', question: 'All runs end by T150?', threshold: '≥80% normal endings, 0% no-ending', validator: validateEndingLiveness },
];
```

**Implementation:**
- **Coordination File:** `src/game/evalHarness.ts` (extend existing)
- **Owner:** Each package implements its own validators, harness orchestrates

---

### 5. Save Schema Changes

**Problem:** All three packages add new fields to GameState. Need migration.

**Schema Additions:**

**WS-2 (NPC Lifecycle):**
```typescript
interface GameState {
  arcDirector: {
    // ... existing ...
    npcLifecycleStates: Record<npcId, NpcLifecycleState>;
    npcMemoryLedger: NpcKeyMoment[];
    npcTopicVersions: Record<npcId, Record<topicId, TopicVersion>>;
    npcKnowledgeRecords: NpcKnowledgeRecord[];
  };
}
```

**WS-4 (Encounter Bible):**
```typescript
interface GameState {
  encounters: {
    // ... existing ...
    activeEncounterContract?: {
      templateId: string;
      templateVersion: string;
      contentHash: string;
      telegraph: TelegraphSection;
      stakes: StakesSection;
      seed: number;
      maxTurns: number;
      forcedTerminal: ForcedTerminalSpec;
    };
    encounterReceipts: EncounterReceipt[];
    densityState: {
      locationQuotas: Record<locationId, RoleQuota>;
      droughtTimers: Record<profileId, number>;
      recentEncounters: string[];
    };
  };
}
```

**WS-5 (PYOA Persistence):**
```typescript
interface GameState {
  pyoa: {
    // ... existing ...
    crisisReceipts: CrisisReceipt[];
    delayedConsequences: DelayedConsequence[];
    endingState: {
      eligibleEndingIds: EndingId[];
      terminalEndingId?: EndingId;
      terminalTurn?: number;
    };
    convergenceState: {
      activeConvergenceIds: ConvergenceId[];
      convergenceReceipts: ConvergenceReceipt[];
    };
  };
}
```

**Migration Strategy:**
- **Supabase Table:** `package_receipts` (shared by all three)
  - Columns: `id`, `save_id`, `package`, `kind`, `receipt_id`, `idempotency_key`, `data` (JSONB), `committed_at_turn`, `created_at`
  - Indexes: `(save_id, package, kind)`, `(save_id, idempotency_key UNIQUE)`
- **Save Repair:** `saveMigration.applyWs245Repair()` (extends existing pattern from 19ae/26n)
- **Backward Compat:** Mid-campaign saves enter compatibility route (no retroactive XP)

**Implementation:**
- **SQL Migration:** `supabase/migrations/XXX_ws_245_receipts.sql`
- **Save Repair:** `src/game/saveMigration.ts`

---

## Dependency Analysis

### Hard Dependencies (Blocking)

**None.** All three packages can be implemented in parallel.

**Why?** 
- Integration happens via shared contracts, not implementation coupling
- Contracts can be defined upfront (Phase 2)
- Each package implements its side of the contract independently

### Soft Dependencies (Coordination)

**WS-4 and WS-5:**
- Both write exclusive facts
- Both emit receipts with idempotency keys
- **Coordination:** Define shared fact groups in Phase 2

**WS-2 and WS-4:**
- Both update NPC state (memory vs relationships)
- **Coordination:** Define `NpcKeyMoment` append contract in Phase 2

**WS-2 and WS-5:**
- Both schedule delayed consequences
- **Coordination:** Define `DelayedConsequence` schema in Phase 2

### Integration Order Recommendation

**Best Order:**
1. **Phase 1 (Analysis):** Complete coordination analysis ✅
2. **Phase 2 (Contracts):** Define all shared interfaces
3. **Phase 3 (Parallel Implementation):**
   - **Wave A:** WS-2 Wave 1, WS-4 Wave 1, WS-5 Wave 1 (foundations)
   - **Wave B:** WS-2 Wave 2, WS-4 Wave 2, WS-5 Wave 2 (core systems)
   - **Wave C:** WS-2 Wave 3, WS-4 Wave 3-4, WS-5 Wave 3-4 (integration/content)
   - **Wave D:** WS-4 Wave 5, WS-5 Wave 5 (evaluation/polish)

**Why This Order:**
- Foundations (Wave A) establish ledgers and state authority
- Core systems (Wave B) implement resolution and turnover
- Integration (Wave C) wires up cross-package contracts
- Polish (Wave D) proves 300-turn stability

---

## Coordination Files to Create (Phase 2)

### 1. `src/game/types/crossPackageContracts.ts`

**Purpose:** Shared type definitions

**Contents:**
- `Receipt` union type
- `NpcEncounterTrigger`
- `EncounterReceipt`
- `NpcCrisisTrigger`
- `EncounterNpcEffect`
- `ExclusiveFactGroup`
- `DelayedConsequence`

**Owner:** Create in Phase 2, all three packages import

---

### 2. `src/game/packageCoordination.ts`

**Purpose:** ArcDirector pre-GM orchestration

**Contents:**
```typescript
export function preGmCommitSequence(state: GameState): GameState {
  // 1. Deliver due consequences (WS-5)
  state = deliverDueConsequences(state);
  
  // 2. Update NPC lifecycles (WS-2)
  state = checkNpcLifecycles(state);
  
  // 3. Spawn encounter if needed (WS-4)
  state = maybeSpawnEncounter(state);
  
  // 4. Spawn crisis if needed (WS-5)
  state = maybeSpawnCrisis(state);
  
  // 5. Check ending gates (WS-5)
  state = checkPyoaEndingGates(state);
  
  // 6. Rebuild projections
  state = rebuildProjections(state);
  
  return state;
}
```

**Owner:** Create in Phase 2, `arcDirector.ts` calls this

---

### 3. `src/game/exclusiveFactsRegistry.ts`

**Purpose:** Mutex validation for facts

**Contents:**
```typescript
export const SHARED_FACT_GROUPS: ExclusiveFactGroup[] = [...];

export function assertExclusiveFacts(
  currentFacts: readonly FactId[],
  proposedWrites: readonly FactWrite[]
): void {
  // Validate mutex groups
  // Throw FACT_CONFLICT if violated
}
```

**Owner:** Create in Phase 2, all three packages call this

---

### 4. `src/game/receiptLedger.ts`

**Purpose:** Unified receipt persistence

**Contents:**
```typescript
export function appendReceipt(receipt: Receipt): void {
  // Write to package_receipts table
  // Enforce idempotency
}

export function getReceipts(
  saveId: string,
  filters?: { package?: string; kind?: string }
): Receipt[] {
  // Query package_receipts table
}
```

**Owner:** Create in Phase 2, all three packages use this

---

### 5. `supabase/migrations/XXX_ws_245_receipts.sql`

**Purpose:** Shared receipt table

**Contents:**
```sql
CREATE TABLE package_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  save_id UUID NOT NULL REFERENCES saves(id) ON DELETE CASCADE,
  package TEXT NOT NULL CHECK (package IN ('ws2', 'ws4', 'ws5')),
  kind TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  data JSONB NOT NULL,
  committed_at_turn INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_package_receipts_save_package_kind 
  ON package_receipts(save_id, package, kind);

CREATE UNIQUE INDEX idx_package_receipts_idempotency 
  ON package_receipts(save_id, idempotency_key);
```

**Owner:** Create in Phase 2

---

## Risk Assessment

### High Risk

**1. ArcDirector Pre-GM Sequence Complexity**
- **Problem:** Ordering matters; wrong order breaks invariants
- **Mitigation:** Define sequence in Phase 2, test with fixtures in each wave

**2. Receipt Idempotency Key Collisions**
- **Problem:** Different packages might generate same key
- **Mitigation:** Prefix with package ID: `ws2:`, `ws4:`, `ws5:`

**3. Exclusive Facts Mutex Violations**
- **Problem:** Three systems writing facts; hard to debug conflicts
- **Mitigation:** Centralized validator with clear error messages

### Medium Risk

**1. Save Migration for Mid-Campaign Saves**
- **Problem:** Existing saves lack new ledger fields
- **Mitigation:** Compatibility route (no retroactive receipts/XP)

**2. Supabase Schema Changes**
- **Problem:** New table + indexes; deploy coordination
- **Mitigation:** Migration tested on staging first

### Low Risk

**1. Parallel Implementation Conflicts**
- **Problem:** Three developers might edit same file
- **Mitigation:** Clear file ownership (see below)

---

## File Ownership Matrix

To avoid merge conflicts, assign clear ownership:

| File | Primary Owner | Coordination Needed |
|------|---------------|---------------------|
| `crossPackageContracts.ts` | **Coordination Lead** | All review before merge |
| `packageCoordination.ts` | **Coordination Lead** | All review before merge |
| `exclusiveFactsRegistry.ts` | **Coordination Lead** | All review before merge |
| `receiptLedger.ts` | **Coordination Lead** | All review before merge |
| `arcDirector.ts` | **Coordination Lead** | All call pre-GM sequence |
| `npcLifecycle.ts` | **WS-2 Owner** | WS-4/WS-5 import types only |
| `encounterBible.ts` | **WS-4 Owner** | WS-2/WS-5 import types only |
| `pyoaBranchLedger.ts` | **WS-5 Owner** | WS-2/WS-4 import types only |
| `situationPacket.ts` | **All** | Coordinate extensions |
| `proseWarden.ts` | **All** | Coordinate contradiction checks |
| `types.ts` | **All** | Coordinate GameState extensions |

---

## Timeline Projection

### Phase 1: Coordination Analysis ✅ **COMPLETE**

**Duration:** 1 day  
**Deliverable:** This document

---

### Phase 2: Coordination Layer (4-5 days)

**Tasks:**
1. Create `crossPackageContracts.ts` (1 day)
2. Create `packageCoordination.ts` (1 day)
3. Create `exclusiveFactsRegistry.ts` (1 day)
4. Create `receiptLedger.ts` (1 day)
5. Create Supabase migration `XXX_ws_245_receipts.sql` (0.5 day)
6. Write coordination layer tests (0.5 day)

**Deliverable:** Coordination contracts ready for import

---

### Phase 3: Parallel Implementation (38-50 days across waves)

**Wave A: Foundations (14-19 days per package, parallel)**
- WS-2 Wave 1 (lifecycle core)
- WS-4 Wave 1 (contracts/selection)
- WS-5 Wave 1 (state authority)

**Wave B: Core Systems (12-15 days per package, parallel)**
- WS-2 Wave 2 (turnover)
- WS-4 Wave 2 (resolution/receipts)
- WS-5 Wave 2 (causal debt)

**Wave C: Integration (varies by package, parallel)**
- WS-2 Wave 3 (hardening)
- WS-4 Waves 3-4 (director integration + content)
- WS-5 Waves 3-4 (convergence/catalogs + GM integration)

**Wave D: Polish (varies by package, parallel)**
- WS-4 Wave 5 (evaluation)
- WS-5 Wave 5 (replay)

**Total Calendar Time:** ~6-7 weeks if truly parallel (1 agent = sequential; 3 agents = parallel)

---

## Recommended Next Steps

### For John (Authorization)

1. ✅ **Review this coordination analysis**
2. ✅ **Authorize Phase 2 (coordination layer implementation)**
3. ✅ **Authorize Phase 3 (parallel implementation)**
4. ⏸️ **Pick implementation model:**
   - Option A: One agent, waves A→B→C→D sequentially (38-50 weeks calendar)
   - Option B: Three agents, true parallel (6-7 weeks calendar)
   - Option C: One agent, coordinated waves (agent implements A for all three, then B for all three, etc.) ✅ **RECOMMENDED**

### For Implementation (After Authorization)

1. **Phase 2 Start:** Implement coordination layer (4-5 days)
2. **Phase 2 Ship:** Coordination contracts ready
3. **Phase 3 Wave A Start:** All three packages foundations in parallel
4. **Phase 3 Wave B Start:** All three packages core systems in parallel
5. **Phase 3 Wave C Start:** Integration and content
6. **Phase 3 Wave D Start:** Evaluation and polish

---

## Success Criteria

### Phase 2 (Coordination Layer) Complete When:

- ✅ All coordination files created and tests pass
- ✅ Supabase migration applied to staging
- ✅ Pre-GM sequence order defined and documented
- ✅ Fact mutex groups registered
- ✅ Receipt schemas unified
- ✅ Idempotency key format standardized

### Phase 3 (Full Implementation) Complete When:

- ✅ All three packages pass their G1-G5 quality gates
- ✅ 12×300 manifest suite green
- ✅ Gemini re-score shows uplift (target ≥6.5/10)
- ✅ Mid-campaign save migration works
- ✅ No regressions in existing functionality
- ✅ All vitest suites green

---

## Appendix: Coordination Contracts Summary

### Contract 1: `NpcEncounterTrigger`
**Direction:** WS-2 → WS-4  
**Purpose:** NPC obligations trigger encounters  
**Owner:** Both implement their side

### Contract 2: `EncounterReceipt`
**Direction:** WS-4 → WS-5  
**Purpose:** Encounter outcomes unlock PYOA branches  
**Owner:** WS-4 emits, WS-5 consumes

### Contract 3: `NpcCrisisTrigger`
**Direction:** WS-2 → WS-5  
**Purpose:** NPC betrayals/deals trigger delayed crises  
**Owner:** WS-2 schedules, WS-5 delivers

### Contract 4: `EncounterNpcEffect`
**Direction:** WS-4 → WS-2  
**Purpose:** Combat outcomes affect NPC memory/relationships  
**Owner:** WS-4 emits, WS-2 consumes

### Contract 5: `ExclusiveFactGroup`
**Direction:** All ↔ All  
**Purpose:** Mutex validation for shared facts  
**Owner:** Coordination layer validates, all packages call

### Contract 6: `DelayedConsequence`
**Direction:** WS-2 + WS-5 → Shared Ledger  
**Purpose:** Scheduled payoffs (NPC revenge, crisis echoes)  
**Owner:** Both write to shared ledger

### Contract 7: `Receipt` (Base)
**Direction:** All → Shared Ledger  
**Purpose:** Unified idempotent event log  
**Owner:** All packages emit, coordination layer persists

---

**Status:** Ready for Phase 2 implementation  
**Next Action:** John authorizes coordination layer + parallel implementation
