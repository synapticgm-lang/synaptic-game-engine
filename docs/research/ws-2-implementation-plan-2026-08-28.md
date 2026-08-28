# WS-2 NPC Lifecycle Implementation Plan

**Date:** 2026-08-28  
**Based on:** Manus WS-2 Complete Package  
**Pattern:** Path A wave structure (following 28a–30d precedent)  
**Scope:** 36 tasks across 3 priority tiers (15 P0, 13 P1, 8 P2)

## Executive Summary

This plan implements Manus WS-2 NPC Role and Memory System in three waves following the established Path A pattern. Wave 1 (P0) delivers the critical lifecycle core that fixes perpetual NPCs and identity reset. Wave 2 (P1) adds turnover, fallback, and knowledge sync. Wave 3 (P2) hardens retrieval, adds prose verification, and proves 300-turn stability.

**Timeline:** 4-5 weeks for full P0+P1+P2, or 3-4 weeks for P0-only MVP.

## Wave Structure

| Wave | Priority | Tasks | Days | Deliverable |
|------|----------|-------|------|-------------|
| **Wave 1** | P0 | 15 | 14-19 | Lifecycle core: roles, states, memory, deadlines, topic exhaustion |
| **Wave 2** | P1 | 13 | 12-15 | Turnover: revival, fallback, knowledge sync, relationships |
| **Wave 3** | P2 | 8 | 12-16 | Hardening: retrieval, verification, snapshots, regression |
| **Total** | | 36 | 38-50 | Production-ready NPC lifecycle system |

## Wave 1: Lifecycle Core (P0 Critical Path)

**Goal:** Prevent infinite NPC presence, identity reset, and canonical repetition  
**Duration:** 14-19 implementation days  
**Ship gate:** G1 (exit latency), G2 (no duplicate reveals), baseline G3-G5 fixtures

### Task Breakdown

#### Batch 1A: Role Registry (2-3 days)
**Tasks:** NPC-001, NPC-002

**Files to create:**
- `src/game/npcRoleRegistry.ts`
  - 24 typed `NpcRoleDefinition` records
  - `RoleObligationContract` interface
  - `getNpcRole()`, `validateRoleRegistry()` utilities
  - Genre variants (LitRPG/DnD/RPG/PYOA) per role

**Files to modify:**
- `src/game/types.ts`
  - Extend `NpcRole` from 8 to 24 types
  - Add `NpcRoleDefinition`, `RoleObligationContract` types
  - Extend GameState.arcDirector with role registry state

**Integration points:**
- Replaces limited 8-role enum in existing `npcTopicFsm.ts`
- Used by lifecycle FSM (Batch 1B)

**Tests:**
- Vitest: `playtest31aRoleRegistry.test.ts`
  - Validate all 24 roles present
  - Check entrance/timeline/exit/transform/genre fields
  - Verify obligation contracts have observable criteria

**Acceptance:**
- ✅ 24 roles with typed contracts
- ✅ All roles pass `assertRoleRegistryComplete()`
- ✅ Vitest green

#### Batch 1B: Lifecycle FSM (3-4 days)
**Tasks:** NPC-003, NPC-004, NPC-014

**Files to create:**
- `src/game/npcLifecycle.ts`
  - 6-state enum: `entering | functioning | debt_satisfied | exiting | transformed | absent`
  - `NpcLifecycleState` record type
  - `lifecycleReducer()` with guarded transitions
  - `transitionNpcLifecycle()` dispatcher
  - `isNpcAvailable()` gate check

**Files to modify:**
- `src/game/types.ts`
  - Add `NpcLifecycleState` to GameState.arcDirector
- `src/game/situationPacket.ts`
  - Add `filterUnavailableNpcs()` before prompt assembly
  - Exclude `absent | exiting | transformed` NPCs from speaker list

**Integration points:**
- Called by arcDirector pre-GM checks (Batch 1D)
- Filters used by choiceCompiler (existing)

**Tests:**
- Vitest: `playtest31bLifecycleFsm.test.ts`
  - Legal transitions pass (entering → functioning, functioning → debt_satisfied, etc.)
  - Illegal transitions rejected (debt_satisfied → entering, absent → functioning)
  - Absent actors excluded from speaker list

**Acceptance:**
- ✅ 6-state FSM with guarded reducer
- ✅ Unavailable actors filtered before prompt
- ✅ Vitest green

#### Batch 1C: Memory Ledger (4-5 days)
**Tasks:** NPC-008, NPC-009, NPC-010, NPC-011

**Files to create:**
- `src/game/npcMemories.ts`
  - `NpcKeyMoment` event schema (actor, witness, faction, topic, fact, relationship, provenance, visibility, retention)
  - `appendKeyMoment()` ledger writer
  - `getNpcMemories()` projection reader
  - `rebuildNpcProjections()` replay function
- `src/game/schemas/npc-key-moment.schema.json`
  - JSON Schema 2020-12 validator
- `supabase/migrations/XXX_npc_memory_ledger.sql`
  - Table: `npc_memory_ledger` (id, save_id, turn, event_type, actor_id, witness_ids, faction_id, data JSONB, created_at)
  - Indexes: save_id, actor_id, turn, event_type

**Files to modify:**
- `src/game/types.ts`
  - Add `NpcKeyMoment`, `NpcMemoryCategory`, `NpcProvenance`, `NpcVisibility` types
  - Extend GameState.arcDirector with `npcMemoryLedger: NpcKeyMoment[]`
- `src/game/persistence.ts`
  - Add ledger persistence on save
  - Add ledger load on continue
- `src/game/eventBus.ts`
  - Hook first_meet, quest_disposition, betrayal, deal, favor, revelation, role_change, death events

**Integration points:**
- Persistence layer (save/load)
- EventBus for automatic event capture
- Situation packet retrieval (Wave 2, Batch 2C)

**Tests:**
- Vitest: `playtest31cMemoryLedger.test.ts`
  - Append first_meet event, verify persistence
  - Append betrayal at T50, retrieve at T100
  - Replay projections from event log
  - JSON Schema validation passes for all categories

**Acceptance:**
- ✅ Append-only ledger with JSON Schema validation
- ✅ Permanent events (first_meet, betrayal, death) persist
- ✅ Projections rebuild deterministically
- ✅ Supabase migration applied
- ✅ Vitest green

#### Batch 1D: Lifecycle + Deadlines (3-4 days)
**Tasks:** NPC-005, NPC-006, NPC-007

**Files to modify:**
- `src/game/arcDirector.ts`
  - Add `checkNpcLifecycles()` pre-GM function
  - Evaluate deadlines: hard (turn offset), soft (warning → turnover), story-beat (milestone), quota (none with conditions)
  - Call `lifecycleReducer()` to commit transitions
  - Enforce 10-turn exit window after debt_satisfied
- `src/game/npcRoleRegistry.ts`
  - Add `evaluateObligation()` function (check success/failure criteria against GameState)
- `src/game/types.ts`
  - Extend `RoleObligationContract` with deadline union type

**Integration points:**
- Called before every `callGm()` (existing arcDirector pattern from 28a)
- Uses lifecycle FSM (Batch 1B)
- Uses role registry (Batch 1A)

**Tests:**
- Vitest: `playtest31dLifecycleDeadlines.test.ts`
  - Guide NPC: debt satisfied at T8 → debt_satisfied state → exiting by T18
  - Quest Patron: disposition recorded by T10 → satisfied → exit
  - Merchant: 3 transactions → satisfied → exit within 10 turns
  - Hard deadline miss: escalation committed
  - Soft deadline: warning → turnover at next beat

**Acceptance:**
- ✅ Lifecycle checks run before every GM commit
- ✅ Hard/soft/story-beat/quota deadlines enforced
- ✅ 10-turn exit window after debt_satisfied
- ✅ Vitest green

#### Batch 1E: Topic Exhaustion (2-3 days)
**Tasks:** NPC-012, NPC-013

**Files to modify:**
- `src/game/npcTopicFsm.ts`
  - Add `contentVersion` field to topic tracking
  - Add `revealCount` field
  - Enforce one canonical reveal per (npcId, topicId, contentVersion)
  - Add exhausted-topic response modes: cooldown_acknowledgement, exhausted_summary, exhausted_refusal
  - Extend `formatNpcTopicMandate()` with response mode

**Integration points:**
- Extends existing Wave 2 topic FSM (B022-B025)
- Used by arcDirector SNAPSHOT mandate (existing)

**Tests:**
- Vitest: `playtest31eTopicExhaustion.test.ts`
  - Aldous reveals identity v1 at T2 → exhausted
  - Ask "who are you" at T4 → cooldown_acknowledgement
  - Ask "who are you" at T8 → exhausted_summary
  - No duplicate canonical reveal

**Acceptance:**
- ✅ Topic versioning tracks reveal count
- ✅ Exhausted topics return acknowledgement/summary/refusal
- ✅ Duplicate reveal rate = 0
- ✅ Vitest green

#### Batch 1F: Baseline Eval (2-3 days)
**Tasks:** NPC-015

**Files to create:**
- `src/game/evalHarness.ts`
  - G1–G5 fixture definitions
  - `runNpcQualityGate()` runner
  - Telemetry hooks for lifecycle events
- `tests/fixtures/npc-g1-g5-fixtures.ts`
  - Aldous perpetual guide (G1 fail)
  - Aldous identity reset (G2 fail)
  - Oskar betrayal T50 → T100 (G3)
  - Quest Patron deadline (G4)
  - Faction Envoy ignored (G5)

**Files to modify:**
- `vitest.config.ts`
  - Add G1–G5 test suite

**Integration points:**
- Uses fate-autoplay harness (existing from 26q)
- Uses manifest validation (existing from 28c)

**Tests:**
- Vitest: `playtest31fBaselineEval.test.ts`
  - G1: Guide exits within 10 turns of debt satisfaction
  - G2: Aldous identity revealed once only
  - G3: Betrayal memory persists T50 → T100
  - G4: Quest Patron disposition by T10
  - G5: Ignored Envoy causes turnover by T21

**Acceptance:**
- ✅ G1–G5 fixtures reproduce Aldous/Oskar failures
- ✅ Baseline measurements captured
- ✅ Vitest green

### Wave 1 File Summary

**New files (7):**
- `src/game/npcRoleRegistry.ts`
- `src/game/npcLifecycle.ts`
- `src/game/npcMemories.ts`
- `src/game/schemas/npc-key-moment.schema.json`
- `src/game/evalHarness.ts`
- `tests/fixtures/npc-g1-g5-fixtures.ts`
- `supabase/migrations/XXX_npc_memory_ledger.sql`

**Modified files (7):**
- `src/game/types.ts`
- `src/game/arcDirector.ts`
- `src/game/npcTopicFsm.ts`
- `src/game/situationPacket.ts`
- `src/game/persistence.ts`
- `src/game/eventBus.ts`
- `vitest.config.ts`

**Tests (6):**
- `playtest31aRoleRegistry.test.ts`
- `playtest31bLifecycleFsm.test.ts`
- `playtest31cMemoryLedger.test.ts`
- `playtest31dLifecycleDeadlines.test.ts`
- `playtest31eTopicExhaustion.test.ts`
- `playtest31fBaselineEval.test.ts`

**Supabase:**
- One migration: `npc_memory_ledger` table
- No edge function redeploy required (client-only for Wave 1)

**HUD stamp:** `2026-08-31a` (assuming ship after 30d)

### Wave 1 Ship Gate

**Quality bar:**
- ✅ G1: p95 exit latency ≤ 10 turns, pass rate ≥ 98%
- ✅ G2: Duplicate reveal rate = 0
- ✅ G3-G5: Baseline fixtures pass (not full thresholds yet)
- ✅ All vitest green
- ✅ Supabase migration applied
- ✅ No regressions in existing 12×300 manifest suite (from 28c)

**Playtest validation:**
- Aldous no longer repeats introduction after first meet
- Oskar remembers betrayal across scenes
- Opening Herald exits within 10 turns of setup complete
- Quest Patron records disposition and exits

**Next gate:**
- Re-run alt-cells 4×300 under stamp 31a + Gemini re-score

---

## Wave 2: Turnover + Knowledge Sync (P1)

**Goal:** Enable topic evolution, deterministic exits, and bounded social propagation  
**Duration:** 12-15 implementation days  
**Ship gate:** G4 (obligation satisfaction ≥ 80%), G5 (turnover = 100%), full G3 (memory retrieval ≥ 95%)

### Task Breakdown

#### Batch 2A: Revival + Cooldown (2-3 days)
**Tasks:** NPC-016, NPC-017

**Files to modify:**
- `src/game/npcTopicFsm.ts`
  - Add `reviveTopicVersion()` function
  - Conditions: new evidence event, contradictory fact, configured story beat
  - Increment `contentVersion` on revival
  - Add cooldown ledger: default 8 turns after raise, 12 after exhaustion
  - Add `isTopicOnCooldown()` check

**Integration points:**
- Called by arcDirector when evidence/contradiction/beat triggers revival
- Used by choiceCompiler to filter cooldown topics

**Tests:**
- Vitest: `playtest32aTopicRevival.test.ts`
  - Reveal v1 exhausted at T10
  - New evidence at T30 → revival to v2 → reveal once
  - Cooldown blocks repeat questions within 8 turns

**Acceptance:**
- ✅ Revival increments version
- ✅ Revival requires evidence/contradiction/beat
- ✅ Cooldown enforced
- ✅ Vitest green

#### Batch 2B: Turnover Engine (3-4 days)
**Tasks:** NPC-018, NPC-019, NPC-020, NPC-021

**Files to create:**
- `src/game/npcTurnover.ts`
  - `decideTurnover()` function (completion, deadline, player, location, story triggers)
  - 7 actions: exit, relocate, transform, escalate, delegate, replace, remain
  - `selectFallback()` function (credible actor, Successor/Heir, world channel)
  - `spawnSuccessor()` NPC spawn with inherited debt
  - `appendDepartureEvent()` to memory ledger

**Files to modify:**
- `src/game/arcDirector.ts`
  - Call `decideTurnover()` after lifecycle checks
  - Apply turnover actions before GM commit
- `src/game/npcRoleRegistry.ts`
  - Add `onSuccess` and `onFailure` actions to contracts
- `src/game/types.ts`
  - Add `NpcTurnoverAction`, `NpcFallbackRule` types

**Integration points:**
- Uses lifecycle FSM (Wave 1)
- Uses role registry (Wave 1)
- Appends to memory ledger (Wave 1)

**Tests:**
- Vitest: `playtest32bTurnover.test.ts`
  - Guide completes → graceful exit
  - Quest Patron deadline missed → escalation
  - Captive rescue target killed → successor spawned
  - Turnover appends departure event

**Acceptance:**
- ✅ Turnover decisions deterministic
- ✅ 7 actions implemented
- ✅ Fallback selection for plot-critical roles
- ✅ Departure events persisted
- ✅ Vitest green

#### Batch 2C: Knowledge Sync (4-5 days)
**Tasks:** NPC-022, NPC-023, NPC-024, NPC-025

**Files to create:**
- `src/game/npcKnowledgeSync.ts`
  - `isWitnessEligible()` (present, conscious, perceptive, language)
  - `propagateFactionBroadcast()` (leadership → rank-and-file)
  - `propagateHubGossip()` (delay 5 turns, confidence 0.8x)
  - `checkAntiSync()` (deny faction list)
  - `NpcKnowledgeRecord` type (recipient, event, provenance, confidence)

**Files to modify:**
- `src/game/types.ts`
  - Add `NpcKnowledgeRecord` to GameState.arcDirector
- `src/game/eventBus.ts`
  - Hook events for automatic witness/faction/gossip propagation
- `src/game/factionState.ts`
  - Add `factionLeadershipBroadcast()` function

**Integration points:**
- Uses memory ledger (Wave 1)
- Uses faction standings (Wave 1, 26j/26k)
- Uses hub graph (Wave 1, 26k/29e)

**Tests:**
- Vitest: `playtest32cKnowledgeSync.test.ts`
  - Direct participant knows immediately
  - Witness present/conscious/perceptive learns event
  - Faction broadcast propagates to members
  - Hub gossip delayed 5 turns, confidence 0.8
  - Denied faction excluded

**Acceptance:**
- ✅ Witness eligibility checks
- ✅ Faction broadcast
- ✅ Hub gossip with delay/decay
- ✅ Anti-sync gates
- ✅ Vitest green

#### Batch 2D: Relationships + Packet (3-4 days)
**Tasks:** NPC-026, NPC-027, NPC-028

**Files to create:**
- `src/game/relationshipState.ts`
  - `NpcRelationship` type (actorA, actorB, trust, respect, fear, debt, affinity)
  - `updateRelationship()` function
  - `getRelationship()` directional lookup

**Files to modify:**
- `src/game/npcRoleRegistry.ts`
  - Add `traits` field (2-3 lightweight personality modifiers)
- `src/game/situationPacket.ts`
  - Add `buildNpcPacket()` function
  - Include: role, lifecycle state, active obligation, topic modes, up to 5 key memories, up to 3 recent memories, mandatory evidence IDs, forbidden event IDs
- `src/game/types.ts`
  - Add `NpcRelationship` to GameState

**Integration points:**
- Uses memory ledger (Wave 1)
- Uses lifecycle FSM (Wave 1)
- Used by GM prompt assembly (existing situationPacket)

**Tests:**
- Vitest: `playtest32dRelationshipsPacket.test.ts`
  - Directional relationships: Aldous trusts player, player distrusts Aldous
  - NPC packet includes role, lifecycle, obligations, topic modes, bounded memories
  - Mandatory evidence grounded in GM response

**Acceptance:**
- ✅ Directional relationship projections
- ✅ Role + 2-3 traits modulate tone
- ✅ NPC packet exposes bounded memories
- ✅ Vitest green

### Wave 2 File Summary

**New files (3):**
- `src/game/npcTurnover.ts`
- `src/game/npcKnowledgeSync.ts`
- `src/game/relationshipState.ts`

**Modified files (8):**
- `src/game/npcTopicFsm.ts`
- `src/game/arcDirector.ts`
- `src/game/npcRoleRegistry.ts`
- `src/game/types.ts`
- `src/game/eventBus.ts`
- `src/game/factionState.ts`
- `src/game/situationPacket.ts`
- (no new migrations)

**Tests (4):**
- `playtest32aTopicRevival.test.ts`
- `playtest32bTurnover.test.ts`
- `playtest32cKnowledgeSync.test.ts`
- `playtest32dRelationshipsPacket.test.ts`

**Supabase:**
- No new migrations
- No edge function redeploy required (client-only)

**HUD stamp:** `2026-09-Xxa` (TBD based on ship timing)

### Wave 2 Ship Gate

**Quality bar:**
- ✅ G1: p95 exit latency ≤ 10 turns, pass rate ≥ 98% (maintained)
- ✅ G2: Duplicate reveal rate = 0 (maintained)
- ✅ G3: Memory retrieval ≥ 95% at T50+
- ✅ G4: Obligation satisfaction ≥ 80%
- ✅ G5: Turnover on deadline miss = 100%
- ✅ All vitest green
- ✅ No regressions in 12×300 manifest suite

**Playtest validation:**
- Topics can reopen with new evidence (version increments)
- Missed deadlines cause deterministic turnover (not silent loops)
- Plot-critical NPCs transfer debt to fallback when they exit
- Witness/faction/gossip propagation works (no telepathy)
- NPCs remember relationships across scenes

**Next gate:**
- Re-run alt-cells 4×300 under stamp 32x + Gemini re-score

---

## Wave 3: Hardening + Regression (P2)

**Goal:** Deterministic retrieval, prose verification, performance, and 300-turn stability  
**Duration:** 12-16 implementation days  
**Ship gate:** Full G1–G5 at production thresholds, 300-turn multi-genre regression clean

### Task Breakdown

#### Batch 3A: Deterministic Retrieval (3-4 days)
**Tasks:** NPC-029, NPC-030

**Files to modify:**
- `src/game/situationPacket.ts`
  - Add `scoreMemoryRelevance()` function (pinned, unresolved, obligation, topic, actor, faction, recency signals)
  - Add stable tie-breaks (event ID, turn ascending)
  - Add `mandatoryMemoryIds` and `forbiddenEventIds` to packet
  - Enforce grounding: claims require evidence ID presence

**Integration points:**
- Uses memory ledger (Wave 1)
- Used by GM prompt assembly (existing)

**Tests:**
- Vitest: `playtest33aRetrievalRanking.test.ts`
  - Same situation → same packet (deterministic)
  - Pinned events ranked first
  - Ties stable (same order across runs)
  - Mandatory memory in packet
  - Forbidden events excluded

**Acceptance:**
- ✅ Deterministic relevance scoring
- ✅ Stable tie-breaks
- ✅ Mandatory/forbidden rails
- ✅ Vitest green

#### Batch 3B: Prose Verification (2-3 days)
**Tasks:** NPC-031, NPC-032

**Files to modify:**
- `src/game/proseWarden.ts`
  - Add `verifyMemoryGrounding()` (claims map to evidence IDs)
  - Add `verifyLifecycleOutput()` (no dialogue from absent actors, no uncommitted transforms)
  - Add violation telemetry (not blocking; repair banner + log)

**Integration points:**
- Uses memory ledger (Wave 1)
- Uses lifecycle FSM (Wave 1)
- Called post-GM in runWarden (existing)

**Tests:**
- Vitest: `playtest33bProseVerification.test.ts`
  - Memory leak detected: GM claims event not in packet
  - Absent speaker detected: NPC speaks after exiting
  - Lifecycle violation detected: transform mentioned before commit

**Acceptance:**
- ✅ Memory grounding verifier
- ✅ Lifecycle output verifier
- ✅ Violations logged + telemetry
- ✅ Vitest green

#### Batch 3C: Relationship Events (2 days)
**Tasks:** NPC-033

**Files to modify:**
- `src/game/relationshipState.ts`
  - Add `relationshipThresholds` config (trust <-3 → betrayal, trust >5 → ally, etc.)
  - Add `emitRelationshipChangeEvent()` (only when threshold crossed)
  - Append to memory ledger

**Integration points:**
- Uses memory ledger (Wave 1)
- Called by relationship update (Wave 2)

**Tests:**
- Vitest: `playtest33cRelationshipThresholds.test.ts`
  - Trust crosses +5 → ally event emitted once
  - Trust crosses -3 → betrayal event emitted once
  - No event on incremental change within band

**Acceptance:**
- ✅ Dynamic threshold events
- ✅ Max 1 event per threshold crossing
- ✅ Vitest green

#### Batch 3D: Snapshots + Telemetry (3-4 days)
**Tasks:** NPC-034, NPC-035

**Files to modify:**
- `src/game/npcMemories.ts`
  - Add `compactMemorySnapshot()` (snapshot at turn N caches projections)
  - Add `replayFromSnapshot()` (start from snapshot, replay newer events)
- `src/game/telemetry.ts`
  - Add G1–G5 metric exports (exit latency, reveal count, retrieval rate, obligation satisfaction, turnover rate)
  - Add dashboard JSON export

**Integration points:**
- Uses memory ledger (Wave 1)
- Uses evalHarness (Wave 1)

**Tests:**
- Vitest: `playtest33dSnapshotsTelemetry.test.ts`
  - Snapshot at T100 → replay from T100 matches full replay
  - Telemetry exports G1–G5 metrics
  - Dashboard JSON valid

**Acceptance:**
- ✅ Event snapshot compaction
- ✅ Replay audit passes
- ✅ G1–G5 telemetry exports
- ✅ Vitest green

#### Batch 3E: 300-Turn Regression (2-3 days)
**Tasks:** NPC-036

**Files to modify:**
- `tests/fixtures/npc-300t-regression.ts`
  - LitRPG fixtures (Summoned Pact, Hero Awakening)
  - DnD fixtures (Cursed Keep, Shattered Coast)
  - RPG fixtures (Salt Road, Cape District)
  - PYOA fixtures (Thornferry, Vesper Glass)
- `vitest.config.ts`
  - Add 300-turn suite

**Integration points:**
- Uses fate-autoplay (existing from 26q)
- Uses G1–G5 eval harness (Wave 1)

**Tests:**
- Vitest: `playtest33eRegression300t.test.ts`
  - LitRPG 300t: G1–G5 pass
  - DnD 300t: G1–G5 pass
  - RPG 300t: G1–G5 pass
  - PYOA 300t: G1–G5 pass

**Acceptance:**
- ✅ 300-turn fixtures pass G1–G5
- ✅ No silent deadline misses
- ✅ No memory leaks
- ✅ No absent speakers
- ✅ No duplicate reveals
- ✅ Vitest green

### Wave 3 File Summary

**New files (1):**
- `tests/fixtures/npc-300t-regression.ts`

**Modified files (6):**
- `src/game/situationPacket.ts`
- `src/game/proseWarden.ts`
- `src/game/relationshipState.ts`
- `src/game/npcMemories.ts`
- `src/game/telemetry.ts`
- `vitest.config.ts`

**Tests (5):**
- `playtest33aRetrievalRanking.test.ts`
- `playtest33bProseVerification.test.ts`
- `playtest33cRelationshipThresholds.test.ts`
- `playtest33dSnapshotsTelemetry.test.ts`
- `playtest33eRegression300t.test.ts`

**Supabase:**
- No new migrations
- No edge function redeploy required (client-only)

**HUD stamp:** `2026-09-Xxb` (TBD based on ship timing)

### Wave 3 Ship Gate

**Quality bar:**
- ✅ G1: p95 exit latency ≤ 10 turns, pass rate ≥ 98%
- ✅ G2: Duplicate reveal rate = 0
- ✅ G3: Memory retrieval ≥ 95% at T50+
- ✅ G4: Obligation satisfaction ≥ 80%, silent miss count = 0
- ✅ G5: Turnover on deadline miss = 100%
- ✅ All vitest green
- ✅ 300-turn multi-genre regression clean
- ✅ No regressions in 12×300 manifest suite

**Playtest validation:**
- Same situation yields same NPC packet (deterministic retrieval)
- Memory leaks caught by prose verifier
- Absent speaker violations caught
- Relationship threshold events fire correctly
- Snapshots accelerate reads without breaking replay
- Telemetry dashboard exports G1–G5 metrics

**Next gate:**
- Production release (remove feature flag, full cutover)
- User playtest validation
- Post-ship monitoring of G1–G5 metrics

---

## Dependencies and Prerequisites

### Wave 1 Prerequisites
- ✅ Wave 1 factions (26j/26k): `factionStandings` exists
- ✅ Wave 2 topic FSM (B022-B025): `npcTopicFsm.ts` exists
- ✅ Wave 3 manifest (28c/30d): `sealedManifest` can be extended with NPC fields
- ✅ ArcDirector (28a/29a): Pre-GM commit pattern established
- ✅ Memory keyword retrieve (25b): SNAPSHOT + keyword retrieval
- ✅ Fate autoplay (26q): Deterministic seed fixtures
- ⚠️ Supabase schema: Requires `npc_memory_ledger` table migration

### Wave 2 Prerequisites
- ✅ Wave 1 complete (lifecycle core)
- ✅ Faction standings (26j/26k): For faction broadcast (NPC-023)
- ✅ Hub graph (26k/29e): For hub gossip (NPC-024)

### Wave 3 Prerequisites
- ✅ Wave 1 complete (lifecycle core)
- ✅ Wave 2 complete (turnover + sync)
- ✅ Eval harness (Wave 1): For G1–G5 metrics
- ✅ 300-turn autoplay (26q): For regression suite

### No Conflicts With
- ✅ BIG CHANGES (27w–30d): Complementary; uses same ArcDirector pattern
- ✅ Premium themes (19t–19ac): Orthogonal
- ✅ Gemini calibration (29d): NPC lifecycle rails complement prose license
- ✅ World map overhaul (29e): NPC relocation uses existing settlement atlas

---

## Testing Strategy

### Unit Tests (Vitest)
- Each batch has 1-2 dedicated test files
- Tests verify deterministic behavior (same input → same output)
- Tests cover edge cases (illegal transitions, deadline misses, fallback spawning)
- Total: ~15 test files across 3 waves

### Integration Tests
- G1–G5 quality gates (fixtures from Manus spec)
- Aldous perpetual guide (G1 fail case)
- Aldous identity reset (G2 fail case)
- Oskar betrayal T50→T100 (G3 pass case)
- Quest Patron deadline (G4 pass/fail cases)
- Faction Envoy ignored (G5 pass case)

### Regression Tests
- 12×300 manifest suite (existing from 28c) must stay green
- 300-turn multi-genre suite (new in Wave 3)
- LitRPG, DnD, RPG, PYOA fixtures

### Playtest Validation
- Aldous no longer loops introduction
- Oskar remembers deals/betrayals
- Opening Herald exits after setup complete
- Missed deadlines cause turnover (not silent loops)
- Topics reopen with new evidence (version increments)
- Witness/faction/gossip propagation works

---

## Risk Mitigation

### High Risk: Memory Ledger Persistence
**Risk:** Supabase schema change, save format change, perf impact on long campaigns

**Mitigation:**
- Feature flag: `ENABLE_NPC_LIFECYCLE_V2` env var
- Gradual rollout: Test Lab only → Mid/High → Free
- Save migration: `saveMigration.applySaveRepair` handles old → new schema
- Perf: Snapshot compaction (Wave 3) keeps reads fast
- Monitoring: Add `npc_memory_ledger` row count + query latency telemetry

### Medium Risk: Lifecycle FSM Integration
**Risk:** Touches `useGame`, `fateAutoplay`, `qualityGovernance`, `situationPacket`; Wave 3 manifest may conflict

**Mitigation:**
- Coordinate with Wave 3 manifest (28c/30d): Add NPC lifecycle fields to sealed manifest
- Incremental integration: Wave 1 ships before Wave 3 manifest changes
- Test coverage: G1–G5 fixtures catch regressions before playtest

### Medium Risk: Topic Exhaustion Versioning
**Risk:** Current Wave 2 code has simple exhaustion; upgrading requires save migration

**Mitigation:**
- Backward compatible: Existing saves treat all topics as v1
- Save migration: Add `contentVersion: 1` to all existing topic records
- Soft cutover: Old saves continue working; new saves get versioning

### Low Risk: Cross-NPC Sync
**Risk:** Witness/faction/gossip needs faction data; older saves may lack it

**Mitigation:**
- Faction backfill: Use existing faction seed (26j/26k) to populate old saves
- Graceful degradation: If faction missing, fall back to direct knowledge only

---

## Timeline Estimate

### Conservative (upper bound)
- Wave 1 (P0): 19 days
- Wave 2 (P1): 15 days
- Wave 3 (P2): 16 days
- **Total: 50 days (~10 weeks, one engineer)**

### Optimistic (lower bound)
- Wave 1 (P0): 14 days
- Wave 2 (P1): 12 days
- Wave 3 (P2): 12 days
- **Total: 38 days (~7.5 weeks, one engineer)**

### Realistic (expected)
- Wave 1 (P0): 16-17 days (~3.5 weeks)
- Wave 2 (P1): 13-14 days (~3 weeks)
- Wave 3 (P2): 14-15 days (~3 weeks)
- **Total: 43-46 days (~9 weeks, one engineer)**

### P0-Only MVP (if deferring P1+P2)
- Wave 1 (P0): 16-17 days (~3.5 weeks)
- **Ship baseline lifecycle core, defer turnover/verification**

---

## Ship Decision Matrix

| Scope | Waves | Timeline | Quality Bar | Risk | Recommendation |
|-------|-------|----------|-------------|------|----------------|
| **P0 Only** | Wave 1 | 3.5 weeks | G1, G2 baseline | Low | ✅ MVP: Fix Aldous/Oskar fast |
| **P0+P1** | Wave 1-2 | 6.5 weeks | G1-G5 full | Medium | ✅ Core: Turnover + knowledge sync |
| **P0+P1+P2** | Wave 1-3 | 9 weeks | G1-G5 + 300t | Medium | ✅ Production: Full hardening |

**John's decision:** Pick ship scope based on:
1. **Timeline urgency** — Need Aldous/Oskar fix fast → P0 only
2. **Quality bar** — Need full G1–G5 → P0+P1
3. **Production readiness** — Need 300t stability → P0+P1+P2

---

## Integration with Existing Roadmap

### After BIG CHANGES (27w–30d)
- WS-2 uses same ArcDirector pre-GM commit pattern (28a)
- WS-2 extends existing Wave 2 topic FSM (B022-B025)
- No conflicts; complementary systems

### Coordinate with Wave 3 Manifest (28c/30d)
- Add NPC lifecycle fields to sealed manifest (B026-B028)
- Lifecycle state, role, obligation, topic versions
- Ship WS-2 Wave 1 before or after manifest changes (flexible)

### After Gemini Calibration (29d)
- NPC lifecycle rails complement PROSE LICENSE / AUTHORITY
- SNAPSHOT includes NPC availability filtering (NPC-014)
- Re-run alt-cells 4×300 under WS-2 stamp + Gemini re-score

### No Impact on Premium Themes (19t–19ac)
- Orthogonal concerns; no integration needed

### NPC Relocation Uses World Map (29e)
- Turnover `relocate` action (Wave 2) uses existing settlement atlas
- NPC can move between mapped hubs (existing premade settlements)

---

## Open Questions for John

1. **Ship scope?** P0 only (3.5 weeks), P0+P1 (6.5 weeks), or full P0+P1+P2 (9 weeks)?
2. **Quality bar?** G1-G2 baseline, or full G1-G5 at production thresholds?
3. **Feature flag?** Gradual rollout with `ENABLE_NPC_LIFECYCLE_V2`, or full cutover?
4. **Save migration?** Break old saves, or backfill NPC lifecycle state?
5. **Integration timing?** Ship before or after Wave 3 manifest changes (28c/30d)?
6. **Next playtest gate?** 12×300 manifest? 4×300 Gemini re-score? User playtest?
7. **Faction prereq?** Use existing faction standings (26j/26k), or defer faction sync to later?

---

## Next Steps

1. **John approval** — Review ingest + plan, pick ship scope
2. **Branch + HUD stamp** — Create `ws-2-wave-1-lifecycle-core` branch, pick stamp (e.g., `2026-08-31a`)
3. **Supabase migration** — Write + test `npc_memory_ledger` table migration
4. **Start Batch 1A** — Implement role registry (2-3 days)
5. **Daily checkpoint** — Share progress, blockers, and adjusted timeline estimates
6. **Wave 1 ship gate** — G1-G2 pass, vitest green, 12×300 clean
7. **Post-ship validation** — Re-run alt-cells 4×300 + Gemini re-score
8. **Wave 2 decision** — Ship P0 only, or continue to P1?

---

**Recommendation:** Start with Wave 1 (P0 critical path, 3.5 weeks) to fix perpetual NPCs and identity reset. Validate in playtest before committing to Wave 2 (turnover) and Wave 3 (hardening). This minimizes risk while delivering the core Aldous/Oskar fixes.
