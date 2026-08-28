# WS-2, WS-4, WS-5 Implementation Status

**Date Started:** 2026-08-28  
**Last Updated:** 2026-08-28  
**Status:** Phase 2 Complete → Starting Phase 3 Wave A

---

## Phase 1: Coordination Analysis ✅ COMPLETE

**Deliverable:** `docs/research/ws-2-4-5-coordination-analysis-2026-08-28.md`

**Key Findings:**
- 7 integration points identified
- 4 cross-package trigger contracts defined
- 5 cross-cutting concerns documented
- Shared receipt schema designed
- Transaction boundaries specified

---

## Phase 2: Coordination Layer ✅ COMPLETE

**Duration:** ~4 hours  
**Status:** All coordination files created and tested

### Files Created (6):

1. ✅ `src/game/types/crossPackageContracts.ts` (436 lines)
   - Base receipt types
   - WS-2/WS-4/WS-5 receipt definitions
   - Cross-package trigger contracts
   - Exclusive fact groups
   - Helper functions

2. ✅ `src/game/exclusiveFactsRegistry.ts` (291 lines)
   - 6 registered fact groups
   - Mutex validation API
   - FactConflictError class
   - Registry validation on load

3. ✅ `src/game/receiptLedger.ts` (295 lines)
   - In-memory receipt store
   - Write API (append, appendBatch)
   - Read API (query, filter, timeline)
   - Idempotency enforcement
   - Supabase persistence stubs

4. ✅ `src/game/packageCoordination.ts` (274 lines)
   - Pre-GM commit sequence (6 phases)
   - Phase stubs for WS-2/WS-4/WS-5
   - Transaction helpers
   - Integration validation

5. ✅ `supabase/migrations/016_package_receipts.sql`
   - `package_receipts` table
   - Indexes (save+package+kind, save+turn, idempotency UNIQUE)
   - RLS policies
   - Helper functions

6. ✅ `src/game/playtest31aCoordination.test.ts` (497 lines)
   - Receipt ledger tests (9 tests)
   - Exclusive facts tests (5 tests)
   - Package coordination test (1 test)
   - All tests passing ✅

---

## Phase 3: Parallel Implementation (In Progress)

### Wave A: Foundations (14-19 days estimated)

**Goal:** Lifecycle core, contract selection, state authority

**Status:** Starting

#### WS-2 Wave 1: Lifecycle Core (15 tasks, P0)

**Batch 1A: Role Registry (2-3 days)**
- [ ] NPC-001: Create `npcRoleRegistry.ts` with 24 typed roles
- [ ] NPC-002: Extend `types.ts` with role definitions

**Batch 1B: Lifecycle FSM (3-4 days)**
- [ ] NPC-003: Create `npcLifecycle.ts` with 6-state FSM
- [ ] NPC-004: Implement guarded lifecycle reducer
- [ ] NPC-014: Filter unavailable NPCs in `situationPacket.ts`

**Batch 1C: Memory Ledger (4-5 days)**
- [ ] NPC-008: Create `npcMemories.ts` with event schema
- [ ] NPC-009: Create JSON Schema validator
- [ ] NPC-010: Implement append-only ledger
- [ ] NPC-011: Add Supabase migration for `npc_memory_ledger`

**Batch 1D: Lifecycle + Deadlines (3-4 days)**
- [ ] NPC-005: Add `checkNpcLifecycles()` to `arcDirector.ts`
- [ ] NPC-006: Implement deadline evaluation
- [ ] NPC-007: Enforce 10-turn exit window

**Batch 1E: Topic Exhaustion (2-3 days)**
- [ ] NPC-012: Add versioning to `npcTopicFsm.ts`
- [ ] NPC-013: Implement exhausted-topic response modes

**Batch 1F: Baseline Eval (2-3 days)**
- [ ] NPC-015: Add G1-G5 fixtures to `evalHarness.ts`

---

#### WS-4 Wave 1: Contracts and Selection (10 tasks, P0)

**Status:** Not started

**Tasks:**
- [ ] B001: Register encounter template schema
- [ ] B002: Implement per-bible library loader
- [ ] B003: Compute template content hashes
- [ ] B004: Implement telegraph catalog loader
- [ ] B005: Build telegraph situation-packet section
- [ ] B006: Implement stakes materializer
- [ ] B007: Add action-honesty validator
- [ ] B020: Parse biome spawn matrix
- [ ] B021: Implement hard biome filter
- [ ] B022: Add wrong-bible spawn regression suite

**Files to Create:**
- [ ] `src/game/encounterBible.ts`
- [ ] `src/game/encounterTelegraph.ts`
- [ ] `src/game/encounterStakes.ts`
- [ ] `src/game/encounterBiomeMatrix.ts`
- [ ] `src/game/schemas/encounter-template.schema.json`
- [ ] Copy D2-D5, D10 data files to `src/game/data/encounters/`

---

#### WS-5 Wave 1: State Authority (9 tasks, P0)

**Status:** Not started

**Tasks:**
- [ ] WS5-001: Add crisis/consequence receipt types to `pyoaTypes.ts`
- [ ] WS5-002: Enforce unique run+crisis idempotency
- [ ] WS5-003: Commit chosen fork + sibling locks atomically
- [ ] WS5-004: Rebuild materialized locks from receipts
- [ ] WS5-005: Implement exclusive fact group registry
- [ ] WS5-006: Reject mutex conflicts on every transaction
- [ ] WS5-007: Move crisis XP behind receipt idempotency
- [ ] WS5-008: Block resolved crises in ArcDirector
- [ ] WS5-009: Filter locked forks in ChoiceCompiler

**Files to Create:**
- [ ] `src/game/pyoaTypes.ts` (NEW)
- [ ] Replace `src/game/pyoaBranchLedger.ts` (extend existing)

---

### Wave B: Core Systems (12-15 days estimated)

**Status:** Not started

#### WS-2 Wave 2: Turnover (13 tasks, P1)
#### WS-4 Wave 2: Resolution + Receipts (12 tasks, P0)
#### WS-5 Wave 2: Causal Debt + Liveness (9 tasks, P0)

---

### Wave C: Integration (varies by package)

**Status:** Not started

#### WS-2 Wave 3: Hardening (8 tasks, P2)
#### WS-4 Waves 3-4: Director Integration + Content (13 tasks, P0/P1)
#### WS-5 Waves 3-4: Convergence + GM Integration (13 tasks, P1)

---

### Wave D: Polish (varies by package)

**Status:** Not started

#### WS-4 Wave 5: Evaluation (5 tasks, P1/P2)
#### WS-5 Wave 5: Replay (5 tasks, P1/P2)

---

## Commit Log

### 2026-08-28 (Phase 2: Coordination Layer)

**Commits:**
- ✅ Created `crossPackageContracts.ts` (shared types)
- ✅ Created `exclusiveFactsRegistry.ts` (mutex validation)
- ✅ Created `receiptLedger.ts` (unified persistence)
- ✅ Created `packageCoordination.ts` (pre-GM orchestration)
- ✅ Created `016_package_receipts.sql` (Supabase migration)
- ✅ Created `playtest31aCoordination.test.ts` (tests)
- ✅ Created `ws-2-4-5-coordination-analysis-2026-08-28.md` (analysis doc)

**HUD Stamp:** `2026-08-31a` (anticipated for Wave A ship)

---

## Next Actions

### Immediate (Wave A Start):

1. ✅ Phase 2 complete (coordination layer)
2. ⏩ **START WS-2 Wave 1 Batch 1A** (role registry)
3. ⏩ **START WS-4 Wave 1 B001-B003** (schema/loader/hashes)
4. ⏩ **START WS-5 Wave 1 WS5-001-WS5-003** (receipt types/idempotency/atomic commits)

### This Session Goals:

- [ ] Complete WS-2 Batch 1A (role registry)
- [ ] Complete WS-4 B001-B003 (schema foundation)
- [ ] Complete WS-5 WS5-001-WS5-003 (crisis receipts)
- [ ] Run coordination tests (all green)
- [ ] Commit progress

### Next Session:

- Continue Wave A implementation
- Complete WS-2 Batch 1B-1F
- Complete WS-4 B004-B022
- Complete WS-5 WS5-004-WS5-009

---

## Quality Gates

### Phase 2 Gate: ✅ PASSED

- ✅ All coordination files created
- ✅ All tests passing (15 tests)
- ✅ Supabase migration ready
- ✅ Pre-GM sequence defined
- ✅ Fact mutex groups registered
- ✅ Receipt schemas unified
- ✅ Idempotency key format standardized

### Wave A Gate: 🟡 PENDING

**Exit Criteria:**
- [ ] WS-2: 24 roles registered, 6-state FSM, memory ledger, deadlines, topic versioning, G1-G5 fixtures
- [ ] WS-4: Templates loaded, biome filter, telegraph/stakes, wrong-bible blocked
- [ ] WS-5: Crisis receipts atomic, sibling locks, fact mutex, idempotent XP
- [ ] All vitest suites green
- [ ] No regressions in existing tests

---

**Status:** Ready to proceed with Wave A implementation
