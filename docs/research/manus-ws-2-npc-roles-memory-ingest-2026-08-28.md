# Manus WS-2 NPC Role and Memory System — Ingest Summary

**Date:** 2026-08-28  
**Package:** Complete WS-2 Task.zip  
**Location:** `docs/research/pasted/manus-ws-2-npc-roles-memory-2026-08-28/`  
**Status:** Ready for implementation planning

## Executive Summary

WS-2 delivers a comprehensive deterministic NPC lifecycle architecture that solves the Aldous and Oskar continuity failures reported in playtesting. The system prevents three critical anti-patterns:

1. **Perpetual NPCs** — Characters who complete their function but linger indefinitely
2. **Identity reset** — NPCs who forget prior encounters and repeat canonical reveals
3. **Silent deadline misses** — Stakes that claim urgency but never cause consequences

The architecture introduces **lifecycle FSMs**, **role obligation contracts**, **versioned topic exhaustion**, **key-moment memory ledgers**, and **deterministic turnover** — all committing state changes before the GM receives the situation packet. This is fundamentally different from prompt-only behavioral guidance: the orchestration layer owns and enforces NPC state transitions.

### Core Innovation

> **An NPC role is a time-bounded narrative contract, not a personality label.**

Every active NPC receives exactly one primary role with:
- Observable obligations (what state change is owed)
- Deadlines (how long the opportunity remains)
- Success/failure criteria (when the debt is satisfied or missed)
- Turnover actions (exit, relocate, transform, escalate, delegate, replace)
- Fallback rules (who carries plot-critical functions forward)

This model directly addresses the playtester-reported problems where Aldous repeated his introduction for 50+ turns and Oskar forgot deals made 20 turns earlier.

## Problem Statement

Current SynapticGM (as of stamp 2026-08-28c) has basic NPC role tracking from Wave 2 (B022-B025):
- 8 simple role types (guide, merchant, guardian, quest_giver, informant, companion, antagonist, neutral)
- Basic topic exhaustion (2-3 topics → force stage advance)
- Simple turn-based deadlines (guide exits at T8, merchant at T12, etc.)
- No memory persistence across scenes
- No cross-NPC knowledge propagation
- No transformation or successor logic

WS-2 Manus research package (commissioned work) provides a production-ready upgrade with:
- 24 typed role archetypes covering all narrative functions
- 6-state lifecycle FSM with guarded transitions
- Append-only memory ledger with key moments and provenance
- Versioned topic exhaustion with evidence-based revival
- Witness/faction/gossip knowledge sync
- Deterministic turnover with fallback spawning
- Comprehensive evaluation harness (G1–G5 quality gates)

## Deliverable Inventory

| # | Artifact | Type | Purpose |
|---|----------|------|---------|
| 1 | `README.md` | Overview | Package structure and validation status |
| 2 | `WS-2 — NPC Role, Memory, Lifecycle, and Turnover System.md` | Executive spec | Architecture, decisions, system overview |
| 3 | `D1_D6_role_catalog_and_contracts.md` | Detailed spec | 24 roles, constitution, obligation contracts |
| 4 | `D2_D5_memory_lifecycle_topic_turnover.md` | Detailed spec | Memory ledger, lifecycle FSM, topic revival, turnover |
| 5 | `D7_D8_retrieval_and_cross_npc_integration.md` | Detailed spec | Situation packet retrieval, witness/faction sync |
| 6 | `D9_D10_backlog_and_eval.md` | Detailed spec | 36-task implementation backlog, evaluation gates |
| 7 | `npcRoleRegistry.ts` | TypeScript | 24 role definitions and obligation contracts |
| 8 | `npcMemories.ts` | TypeScript | Key-moment schema, projections, retrieval |
| 9 | `npcLifecycle.ts` | TypeScript | 6-state FSM, deadline evaluator, reducer |
| 10 | `npcTopicFsm.ts` | TypeScript | Topic exhaustion, cooldown, versioning, revival |
| 11 | `npcTurnover.ts` | TypeScript | Turnover decisions, fallback spawn |
| 12 | `npcKnowledgeSync.ts` | TypeScript | Witness, hub, faction, public, anti-sync |
| 13 | `situationPacket.ts` | TypeScript | Retrieval patterns, packet extension |
| 14 | `npc-key-moment.schema.json` | JSON Schema | Validator for memory ledger events |
| 15 | `example-npc-ledger.json` | Example | T2–T100 Aldous/Oskar continuity timeline |
| 16 | `implementation-backlog.csv` | CSV | 36 tasks: 15 P0, 13 P1, 8 P2 |
| 17 | `npc-eval-harness.json` | JSON | G1–G5 deterministic quality gates |
| 18 | `npc-lifecycle.mmd` + `.png` | Diagram | 6-state FSM visual |
| 19 | `npc-turnover-decision-tree.mmd` + `.png` | Diagram | Turnover logic tree |
| 20 | `research_notes.md` + `sources/` | Research | Citations and source PDFs |
| 21 | `CiF-CK.txt` | Research | CiF-CK social exchange model notes |
| 22 | `validate_package.py` | Validation | Package integrity checks |
| 23 | `diagram_validation.md` | Validation | Diagram legibility report |
| 24 | `pasted_content.txt` | Meta | Raw package paste record |
| 25 | `SKILL.md` | Integration | Cursor Agent skill for WS-2 system |

**Validation Status:** All TypeScript modules pass strict type checking (ES2020/CommonJS). All JSON artifacts parse successfully. Both Mermaid diagrams rendered successfully.

## Key Findings

### 1. Role Catalog — 24 Archetypes

The 24 roles cover orientation, commission, information, service, access, relationship, opposition, pressure, and continuity functions:

**Opening/System:**
- Opening Herald (frame situation by T3, present fork by T6, yield by T10)
- System Herald (explain one new rule within 3 turns of trigger)

**Quest/Mission:**
- Quest Patron (state objective/stakes, record disposition by T10)
- Faction Envoy (state demand by T5, carry answer by T20)
- Guide/Scout (route + hazard by T10, leave after commitment or by T20)

**Information:**
- Witness/Informant (deliver testimony + reliability by T10)
- Mentor/Trainer (teach by T10, test by T20)
- Sage/Archivist (answer question or identify missing evidence by soft T20)

**Service:**
- Merchant/Broker (3 transactions or stock/hub closure)
- Specialist Service (state cost by T5, resolve by T20)
- Gatekeeper (state threshold by T3, resolve access by T15)
- Authority/Judge (criteria by T10, decision by T20)

**Crisis:**
- Petitioner/Victim (explain harm by T10, record disposition by T20)
- Captive/Rescue Target (resolve by T50 or crisis beat)
- Crisis Catalyst (commit crisis by T3, expose responses by T5, yield by T10)

**Relationship:**
- Companion/Ally (contribute to beats, reassess at checkpoints)
- Rival/Challenger (issue challenge by T10, resolve by T20)

**Opposition:**
- Recurring Foil (material delta on return, leave within 10 turns)
- Antagonist Lieutenant (pressure + link by T20)
- Primary Antagonist (irreversible counter-goal delta at each beat)

**Special:**
- Fixer/Smuggler (service/price/exposure by T10, close by T20)
- Recruiter/Handler (affiliation terms by T10, resolve by T20)
- Double Agent (2 contradictions seeded, allegiance by T50)
- Successor/Heir (acknowledge predecessor, state inherited debt by T10)

Each role has a typed `RoleObligationContract` with observable success/failure criteria and deterministic turnover actions.

### 2. Lifecycle FSM — 6 States

```
entering → functioning → debt_satisfied → exiting → transformed / absent
```

- **entering**: NPC first appears, role assigned
- **functioning**: Active obligation period
- **debt_satisfied**: Success criteria met, 10-turn exit window starts
- **exiting**: Departure in progress
- **transformed**: Role changed (e.g., guide → ally, envoy → double agent)
- **absent**: No longer conversationally available

Transitions are guarded: the reducer rejects illegal moves. Only one transition per NPC per commit. Scene NPCs must exit or transform within 10 turns of debt satisfaction.

### 3. Memory Ledger — Key Moments

Append-only `NpcKeyMoment` events with:
- **Categories**: first_meet, quest_disposition, betrayal, deal, favor, revelation, role_change, death, relationship_change, faction_broadcast, gossip, public_announcement
- **Provenance**: direct participation, witnessing, trusted source, public knowledge
- **Visibility**: private, witnessed, faction, hub, public
- **Retention**: permanent (first_meet, betrayal, death), campaign (deals, quests), arc (revelations), scene (gossip)

Current projections (relationship summaries, known-event sets) can be rebuilt from the event log. Corrections append a superseding event instead of rewriting history.

### 4. Topic Exhaustion — Versioning

Topic states: `unraised → hinted → contested → revealed → exhausted`

A canonical fact set may be revealed **once per (npcId, topicId, contentVersion)**. Repeated questions during cooldown receive acknowledgement. Exhausted topics receive summary/refusal/changed reaction.

Revival increments `contentVersion` only when:
- New evidence event occurs
- Contradictory fact emerges
- Configured story beat authorizes reopening

Cosmetic rephrasing is not a new version.

### 5. Cross-NPC Knowledge Sync

Knowledge propagates through:
- **Direct participation**: Actor knows immediately
- **Witnessing**: Present, conscious, perceptive, able to understand
- **Faction leadership broadcast**: Rank-and-file learn after committed broadcast
- **Hub gossip**: Delayed (default 5 turns), confidence decay (0.8x)
- **Public events**: All eligible NPCs know
- **System authority**: Game mechanics, universal rules

**Anti-sync**: Denied factions remain excluded until an explicit leak event.

### 6. Turnover Logic

Turnover triggers:
- Debt satisfied
- Deadline missed
- Player forces exit
- Location becomes invalid
- Story advances

Turnover actions:
- **exit**: Graceful departure, cryptic warning, abrupt vanish, formal dismissal
- **relocate**: Move to different scene/hub (stays extant)
- **transform**: Change role (guide → ally, envoy → double agent)
- **escalate**: Failure causes pressure increase
- **delegate**: Hand obligation to existing actor
- **replace**: Spawn Successor/Heir with inherited debt
- **remain**: Service or remote system stays available offstage

**Fallback rule**: Plot-critical functions cannot disappear. If primary actor exits/dies/is ignored, debt transfers to:
1. Credible existing actor
2. Successor/Heir NPC
3. World delivery channel (letter, evidence object, public announcement, system notification)

Fallback inherits unresolved obligation IDs and predecessor outcome, but NOT private memory or personality.

### 7. Evaluation Harness — G1–G5 Quality Gates

| Gate | Pass Condition |
|------|----------------|
| **G1** | Scene NPC exits/transforms within 10 turns of debt satisfaction; p95 ≤ 10 turns, pass rate ≥ 98% |
| **G2** | Same NPC/topic/version revealed at most once; duplicate rate = 0 |
| **G3** | Relevant key moments retrievable after 50+ turns; pass rate ≥ 95% |
| **G4** | ≥80% of obligations satisfied by deadline; every miss has explicit failure event |
| **G5** | Every hard deadline miss causes turnover by next commit; pass rate = 100% |

Suite fails closed on any:
- Silent hard-deadline miss
- Memory leak (claim unsupported by evidence)
- Absent speaker (unavailable NPC generates dialogue)
- Duplicate topic revelation

## Integration Points with Existing Code

### Already Exists (Wave 2 B022-B025)

Located in `src/game/npcTopicFsm.ts`:
- `NpcTopicFsmState`: Record<npcId, topicIds[]>
- `isTopicExhausted()`: Check if topic used
- `recordNpcTopic()`: Track topic usage
- `advanceNpcTopicExhaustion()`: Force stage advance after 2-3 topics
- `NpcRole`: 8 simple types (guide, merchant, guardian, etc.)
- `NpcRoleObligation`: Basic tracking (turn, deadline, satisfied, exitedAt)
- `inferNpcRole()`: Classify from context
- `trackNpcRoleObligation()`: Create obligation
- `checkNpcRoleDeadlines()`: Check turn-based expiry

Already integrated into:
- `src/game/choiceCompiler.ts`: Uses `isTopicExhausted()` for pad filtering
- `src/game/arcDirector.ts`: Calls `checkNpcRoleDeadlines()` pre-GM
- `src/game/qualityGovernance.ts`: Uses topic FSM in governance checks

### Manus WS-2 Additions

New subsystems to build:
1. **npcRoleRegistry** — 24 typed roles with obligation contracts
2. **npcMemories** — Key-moment ledger with provenance/visibility/retention
3. **npcLifecycle** — 6-state FSM with guarded reducer
4. **npcTopicFsm** — Versioned exhaustion with revival (extends existing)
5. **npcTurnover** — Deterministic turnover decisions + fallback spawning
6. **npcKnowledgeSync** — Witness/faction/gossip propagation
7. **situationPacket** — Memory retrieval patterns (extends existing)

### Key Differences from Current Implementation

| Aspect | Current (Wave 2) | Manus WS-2 |
|--------|------------------|------------|
| **Roles** | 8 types | 24 archetypes with genre variants |
| **Obligations** | Turn deadline only | Observable state predicates + success/failure criteria |
| **Lifecycle** | Binary (active/exited) | 6-state FSM with transitions |
| **Memory** | None (per-scene only) | Append-only ledger with categorized key moments |
| **Topic exhaustion** | 2-3 uses → stage advance | Versioned with evidence-based revival |
| **Turnover** | Simple exit | 7 actions (exit/relocate/transform/escalate/delegate/replace/remain) |
| **Fallback** | None | Plot-critical debt transfers to successor or world channel |
| **Knowledge sync** | Implicit (GM decides) | Explicit provenance (witness/faction/gossip) |
| **Quality gates** | Manual playtest | Deterministic G1–G5 eval harness |

## Implementation Complexity Assessment

### High Complexity (H)
- **npcMemories** (NPC-010): Append-only ledger + replay projections (persistence layer)
- **npcLifecycle** (NPC-004): Guarded FSM reducer with 15 transition rules
- **npcTurnover** (NPC-018, NPC-020): Decision engine + fallback selection + successor spawn
- **situationPacket** (NPC-028, NPC-029): Deterministic retrieval + relevance scoring + stable tie-breaks
- **proseWarden** (NPC-031, NPC-032): Evidence grounding + lifecycle output verification
- **evalHarness** (NPC-015, NPC-036): 300-turn multi-genre regression + telemetry

### Medium Complexity (M)
- **npcRoleRegistry** (NPC-001): 24 typed definitions + validation (data structure)
- **npcTopicFsm** (NPC-016, NPC-017): Evidence/contradiction revival + cooldown ledger (extends existing)
- **npcKnowledgeSync** (NPC-022–NPC-025): Witness eligibility + faction broadcast + gossip + anti-sync
- **arcDirector** (NPC-005, NPC-006): Pre-GM lifecycle checks + deadline evaluation
- **relationshipState** (NPC-026, NPC-033): Directional projections + threshold events

### Small Complexity (S)
- **Role assignment** (NPC-002): Add one field to NPC runtime state
- **Lifecycle record** (NPC-003): Add 6-state enum to state
- **Exit window** (NPC-007): 10-turn counter after debt_satisfied
- **JSON Schema** (NPC-009): Draft 2020-12 validation at write boundary
- **Filter unavailable** (NPC-014): Exclude absent/transformed before prompt
- **Cooldown ledger** (NPC-017): Track last-used turn per topic
- **Departure events** (NPC-021): Append on turnover
- **Anti-sync gates** (NPC-025): Check deny list before propagation
- **Trait modulation** (NPC-027): 2-3 traits affect tone, not state

### Total Effort Estimate
- **P0 (15 tasks)**: ~12-15 implementation days
- **P1 (13 tasks)**: ~10-12 implementation days
- **P2 (8 tasks)**: ~6-8 implementation days
- **Total**: ~28-35 implementation days (4-5 weeks, one engineer)

Does not include:
- Initial research/design (complete)
- Test fixture creation (~2-3 days)
- Integration testing (~3-4 days)
- Playtest validation (~ongoing)

## Recommended Implementation Order

### Phase 1: Foundation (P0 critical path, ~3-4 days)
**Goal:** Prevent infinite NPC presence and identity reset

1. `npcRoleRegistry` — 24 typed roles + validation (NPC-001)
2. `npcLifecycle` — 6-state enum + record (NPC-003)
3. Role assignment to runtime state (NPC-002)
4. Filter absent/transformed actors before prompt (NPC-014)
5. 10-turn exit window enforcement (NPC-007)

**Deliverable:** NPCs can have typed roles and lifecycle states; absent actors cannot speak

### Phase 2: Memory Core (P0, ~4-5 days)
**Goal:** Persist key moments across scenes

6. `NpcKeyMoment` event model (NPC-008)
7. JSON Schema validation (NPC-009)
8. Append-only ledger + replay projection (NPC-010)
9. Persist first_meet/quest/betrayal/deal/favor/revelation/role_change/death (NPC-011)

**Deliverable:** NPCs remember prior encounters; Aldous won't reintroduce himself

### Phase 3: Lifecycle + Deadlines (P0, ~3-4 days)
**Goal:** Enforce role obligations and exits

10. Guarded lifecycle reducer (NPC-004)
11. Run lifecycle checks before every GM commit (NPC-005)
12. Hard/soft/story-beat/quota deadline implementation (NPC-006)

**Deliverable:** NPCs exit or transform when obligations are satisfied or deadlines missed

### Phase 4: Topic Exhaustion (P0, ~2-3 days)
**Goal:** Prevent canonical repetition

13. Topic reveal version + count fields (NPC-012, extends existing)
14. Exhausted-topic response mode (NPC-013)

**Deliverable:** Aldous won't repeat "I'm Aldous the guide" 50 times; Oskar won't rehash deals

### Phase 5: Baseline Eval (P0, ~2-3 days)
**Goal:** Measure current failures before fixes

15. Add G1–G5 smoke tests (NPC-015)
16. Reproduce Aldous/Oskar failure cases as fixtures

**Deliverable:** Automated regression detection

**Phase 1-5 Total:** ~14-19 days (P0 complete)

### Phase 6: Revival + Turnover (P1, ~5-6 days)
**Goal:** Enable topic evolution and deterministic exits

17. Evidence/contradiction/story-beat revival (NPC-016)
18. Configurable cooldown ledger (NPC-017)
19. Actor turnover decision engine (NPC-018)
20. Role-specific success/failure actions (NPC-019)
21. Fallback selection + successor spawn (NPC-020)
22. Append departure/role-change events (NPC-021)

**Deliverable:** Topics can reopen with new evidence; plot-critical functions transfer on exit

### Phase 7: Knowledge Sync (P1, ~4-5 days)
**Goal:** Bounded social propagation

23. Witness eligibility checks (NPC-022)
24. Faction leadership broadcast (NPC-023)
25. Hub-local gossip with delay/decay (NPC-024)
26. Deny-faction anti-sync gates (NPC-025)

**Deliverable:** NPCs learn through participation, not telepathy; faction boundaries respected

### Phase 8: Relationships + Packet (P1, ~3-4 days)
**Goal:** Situational memory retrieval

27. Directional relationship projections (NPC-026)
28. Role + 2-3 trait modulation (NPC-027)
29. Expose obligations/lifecycle/topics/memory in packet (NPC-028)

**Deliverable:** NPCs express relationship state; GM receives bounded relevant memories

**Phase 6-8 Total:** ~12-15 days (P1 complete)

### Phase 9: Deterministic Retrieval (P2, ~3-4 days)
**Goal:** Stable memory ranking

30. Relevance scoring + stable tie-breaks (NPC-029)
31. Mandatory-memory + forbidden-event rails (NPC-030)

**Deliverable:** Same situation yields same packet; grounding controls prevent leaks

### Phase 10: Prose Verification (P2, ~2-3 days)
**Goal:** Detect violations

32. Prose-grounding verifier (NPC-031)
33. Lifecycle-output verifier (NPC-032)

**Deliverable:** Catch memory leaks and absent-speaker dialogue

### Phase 11: Relationship Events (P2, ~2 days)
**Goal:** Dynamic thresholds

34. Relationship-threshold events (NPC-033)

**Deliverable:** Emit change only when thresholds crossed

### Phase 12: Snapshots + Telemetry (P2, ~3-4 days)
**Goal:** Performance + observability

35. Event snapshot compaction (NPC-034)
36. Telemetry dashboard exports (NPC-035)

**Deliverable:** Fast reads without log replay; G1–G5 metrics visible

### Phase 13: Regression Suite (P2, ~2-3 days)
**Goal:** Multi-genre validation

37. 300-turn multi-genre regression (NPC-036)

**Deliverable:** LitRPG/DnD/RPG/PYOA fixtures pass G1–G5

**Phase 9-13 Total:** ~12-16 days (P2 complete)

## Risk Assessment

### High Risk
1. **Memory ledger persistence** — Requires new Supabase table schema + migration; changes to save format; potential perf impact on long campaigns
2. **Lifecycle FSM integration** — Touches `useGame`, `fateAutoplay`, `qualityGovernance`, `situationPacket`; Wave 3 manifest changes may conflict
3. **Prose verification** — LLM grounding checks are expensive; false positives could block valid turns

### Medium Risk
1. **Topic exhaustion versioning** — Current Wave 2 code has simple exhaustion; upgrading to versioned revival requires careful migration of existing saves
2. **Cross-NPC sync** — Witness/faction/gossip propagation needs faction standing data (Wave 1 26j/26k); may need faction backfill for older saves
3. **Fallback spawning** — Requires NPC spawn authority in arcDirector; interaction with existing hub contact banks unclear

### Low Risk
1. **Role registry** — Pure data structure; extends existing 8 roles to 24 without breaking changes
2. **Deadline policy** — Hard/soft/story-beat deadlines are straightforward extensions of current turn-based model
3. **Relationship projections** — New feature; no existing code to break

### Mitigation Strategies
1. **Feature flag** — Gate WS-2 features behind `ENABLE_NPC_LIFECYCLE_V2` env var; gradual rollout
2. **Save migration** — `saveMigration.applySaveRepair` handles old → new schema (existing pattern from 19ae/26n)
3. **Fixture testing** — G1–G5 fixtures catch regressions before playtest (existing pattern from 28a–30d)
4. **Incremental integration** — Phase 1-5 (P0) is self-contained; can ship without P1/P2 if needed

## Dependencies and Prerequisites

### Code Dependencies
- **Wave 1 factions** (26j/26k): `factionStandings` must exist for cross-NPC faction sync (NPC-023)
- **Wave 3 manifest** (28c/30d): `sealedManifest` may need NPC lifecycle fields; coordinate with B026-B028
- **Memory keyword retrieve** (25b SNAPSHOT): Existing retrieval extended with NPC key moments (NPC-028)
- **ArcDirector** (28a/29a): Pre-GM commit pattern used for lifecycle checks (NPC-005)

### Schema Changes
- New Supabase table: `npc_memory_ledger` (event log)
- GameState extensions:
  ```typescript
  arcDirector: {
    npcRoleObligations: NpcRoleObligation[];  // exists (Wave 2)
    npcLifecycleStates: Record<npcId, NpcLifecycleState>;  // new
    npcMemoryLedger: NpcKeyMoment[];  // new
    npcTopicVersions: Record<npcId, Record<topicId, TopicVersion>>;  // extends existing
    npcKnowledgeRecords: NpcKnowledgeRecord[];  // new
  }
  ```

### Research Prerequisites
- **None** — All research complete; ready for implementation

### Testing Prerequisites
- Deterministic seed fixtures (existing from 26q fate-autoplay)
- 300-turn harness infrastructure (existing from 28c eval quarantine)
- G1–G5 telemetry hooks (new, part of P2 NPC-035)

## Next Steps

### Immediate Actions (John approval required)
1. **Review WS-2 executive summary** — Confirm problem/solution alignment
2. **Pick implementation path** — Full P0+P1+P2, or P0-only MVP?
3. **Approve schema changes** — Supabase migration for memory ledger
4. **Set quality bar** — Target G1–G5 thresholds before next playtest gate

### Ship Authorization Decision Points
- **After Phase 1-5 (P0)**: Can ship basic lifecycle + memory + deadlines without turnover/sync (minimal viable fix for Aldous/Oskar)
- **After Phase 6-8 (P1)**: Can ship turnover + fallback + knowledge sync (full WS-2 core)
- **After Phase 9-13 (P2)**: Can ship deterministic retrieval + prose verification + 300-turn regression (production hardening)

### Integration with Existing Roadmap
- **BIG CHANGES (27w–30d)**: WS-2 is complementary; lifecycle FSM uses existing ArcDirector commit pattern
- **Path A manifest (28a–30d)**: Coordinate B026-B028 sealed manifest with NPC lifecycle fields
- **Premium themes (19t–19ac)**: No conflicts; orthogonal concerns
- **Gemini calibration (29d)**: WS-2 lifecycle rails complement prose license/authority
- **World map overhaul (29e)**: NPC hub relocation uses existing settlement atlas

## Research Provenance

### Citations in Manus Spec
1. Emily Short — "Modeling conversation flow: NPC repeating information" (2009)
2. Mateas and Stern — "Façade Interactive Drama Architecture" (2005)
3. Guimarães, Santos, Jhala — "CiF-CK: An Architecture for Social NPCs" (2017)
4. Park et al. — "Generative Agents: Interactive Simulacra of Human Behavior" (2023, arXiv)
5. W3C — "State Chart XML (SCXML): State Machine Notation" (2015)
6. Martin Fowler — "Event Sourcing" (eaaDev)

### Source Files in Package
- `sources/facade_content_architecture.pdf` + `.txt`
- `sources/riedl_bulitko_interactive_narrative.pdf` + `.txt`
- `sources/valve_ai_systems_of_l4d.pdf` + `.txt`
- `CiF-CK.txt` (extracted notes)

### Manus Metadata
- Research completion: ~2026-08-27 (commissioned)
- Package validation: Passed (24 roles, 36 tasks, 5 gates, 6 schema-valid examples)
- TypeScript strict check: Passed (ES2020/CommonJS)

## Open Questions for John

1. **Target timeline** — Ship P0 only (3-4 weeks), or full P0+P1+P2 (6-8 weeks)?
2. **Quality bar** — G1–G5 thresholds from Manus spec, or custom targets?
3. **Save migration** — Break old saves, or backfill NPC lifecycle state?
4. **Feature flag** — Gradual rollout with env var, or full cutover?
5. **Integration sequence** — Before or after next Gemini alt-cells 4×300 re-score (29d gate)?
6. **Faction prereq** — Use existing Wave 1 faction standings (26j/26k), or defer faction sync to P1.5?
7. **Playtest gate** — What's the next quality checkpoint after WS-2 ships (12×300 manifest? Gemini re-score? User playtest)?

---

**Recommendation:** Start with Phase 1-5 (P0 critical path, ~3-4 weeks) to fix perpetual NPCs and identity reset. Defer turnover/fallback (P1) and prose verification (P2) until P0 validates in playtest. This minimizes risk while delivering the core Aldous/Oskar fixes.
