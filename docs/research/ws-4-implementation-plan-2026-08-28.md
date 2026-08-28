# WS-4 Encounter Bible — Implementation Plan

**Status:** Ready for execution  
**Est. duration:** 24–35 days  
**Dependencies:** Path A architecture (shipped 28a–30d), WS-2/WS-5 (parallel)  
**Risk level:** High (critical path through ArcDirector integration)

---

## Implementation Strategy

### Parallel Build Approach

**Decision:** Build new WS-4 modules in parallel with existing encounter code, then deprecate old code after validation.

**Rationale:**
- Existing `encounterResolution.ts` (P1.2 spec) and `encounterTerminalFsm.ts` are partial implementations
- WS-4 is more comprehensive (telegraph, stakes, biome filters, receipts)
- Refactoring in-place risks breaking existing playtest builds
- Parallel build allows gradual migration and A/B testing

**Migration path:**
1. Build WS-4 modules (`encounterBible`, `encounterStakes`, etc.)
2. Wire WS-4 into `arcDirector.ts` behind a feature flag
3. Test WS-4 with 12×300 evals (compare to baseline)
4. If uplift confirmed (≥6/10 Gemini scores), promote WS-4 to default
5. Deprecate old `encounterResolution.ts` (P1.2 spec)

---

## Wave 1 — Contracts and Selection

**Objective:** Load/version schemas, libraries, telegraphs, stakes, and hard biome authority.

**Exit condition:** One legal template can be selected and rendered with no unresolvable action or wrong-bible substitution.

**Duration:** 5–7 days

### Tasks

| ID | Task | Priority | Complexity | Days | Owner |
|----|------|----------|------------|------|-------|
| **B001** | Register encounter template schema and semantic version policy | P0 | S | 0.5 | — |
| **B002** | Implement per-bible library loader and immutable index | P0 | M | 1.0 | — |
| **B003** | Compute and verify template content hashes | P0 | S | 0.5 | — |
| **B004** | Implement telegraph catalog loader and selector | P0 | M | 1.0 | — |
| **B005** | Build telegraph situation-packet section | P0 | M | 1.0 | — |
| **B006** | Implement stakes materializer from current state | P0 | L | 2.0 | — |
| **B007** | Add action-honesty validator | P0 | M | 1.0 | — |
| **B020** | Parse and version biome spawn matrix | P0 | M | 1.0 | — |
| **B021** | Implement hard biome and bible candidate filter | P0 | L | 2.0 | — |
| **B022** | Add wrong-bible spawn regression suite | P0 | M | 1.0 | — |

### File Changes

**Create:**
- `src/game/encounterBible.ts` — Template loader, version/hash management, immutable index
- `src/game/encounterTelegraph.ts` — Telegraph catalog, cue selection, situation packet builder
- `src/game/encounterStakes.ts` — Stakes materializer, legal action validator, requirements checker
- `src/game/encounterBiomeMatrix.ts` — Biome spawn matrix parser, hard filter, wrong-bible blocker
- `src/game/schemas/encounter-template.schema.json` — Copy from `D12_implementation_backlog.csv`
- `src/game/data/encounters/D2_litrpg_encounter_library.json` — Copy from pasted/
- `src/game/data/encounters/D3_dnd_encounter_library.json` — Copy from pasted/
- `src/game/data/encounters/D4_rpg_encounter_library.json` — Copy from pasted/
- `src/game/data/encounters/D5_pyoa_crisis_library.json` — Copy from pasted/
- `src/game/data/encounters/D10_biome_spawn_matrix.csv` — Copy from pasted/

**Extend:**
- `src/game/situationPacket.ts` — Add `encounterContract` field with telegraph section
- `src/game/types.ts` — Add WS-4 encounter types (`EncounterTemplate`, `Telegraph`, `Stakes`, etc.)

**Test:**
- `src/game/encounterBible.test.ts` — Schema loading, version policy, content hashes, immutable index
- `src/game/encounterBiomeMatrix.test.ts` — Hard filter, wrong-bible spawn regression, fallback logic
- `src/game/encounterStakes.test.ts` — Stakes materialization, requirements validation, action honesty

### Dependencies

**Prerequisites:**
- Path A architecture (shipped 28a): `runManifest`, `beatContract`, `arcDirector`
- `situationPacket.ts` exists and can be extended

**Parallel work:**
- WS-2 (NPC roles) can proceed independently
- WS-5 (PYOA persistence) can proceed independently

### Acceptance Criteria

- [ ] All 48 templates load without schema errors
- [ ] Content hashes match stored values
- [ ] Biome matrix blocks Keep Wraith on Shattered Coast
- [ ] Biome matrix blocks Summoned Pact actors in Cursed Keep
- [ ] Stakes materializer exposes only legal actions with requirements
- [ ] Action-honesty validator rejects actions without resolver or state delta
- [ ] Telegraph catalog selects ≥1 channel for normal, ≥2 for elite, ≥3 for boss

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Schema parse errors | Validate against JSON Schema first; use WS-4 validation scripts |
| Template version conflicts | Snapshot templates on spawn; active encounters retain exact version |
| Biome matrix coverage gaps | Use drought fallback or content-gap receipt when legal set is empty |

---

## Wave 2 — Resolution and Receipts

**Objective:** Complete combat, d20, flee, parley, clocks, crisis commits, forced terminal, and aftermath.

**Exit condition:** Adversarial runs cannot keep an encounter active beyond its bound; every terminal has one receipt.

**Duration:** 7–10 days

### Tasks

| ID | Task | Priority | Complexity | Days | Owner |
|----|------|----------|------------|------|-------|
| **B008** | Make encounter HP ledger atomic and authoritative | P0 | L | 1.5 | — |
| **B009** | Implement seeded damage calculation and replay tests | P0 | M | 1.0 | — |
| **B010** | Implement bounded combat terminal evaluation | P0 | M | 1.0 | — |
| **B011** | Implement real flee progress and danger clocks | P0 | L | 1.5 | — |
| **B012** | Implement parley thresholds and one-use leverage | P0 | L | 1.5 | — |
| **B013** | Implement official-style d20 resolver | P0 | M | 1.0 | — |
| **B014** | Implement progress danger and racing clocks | P0 | M | 1.0 | — |
| **B015** | Implement PYOA exclusive-fact commit | P0 | L | 2.0 | — |
| **B016** | Implement forced terminal at maxTurns | P0 | M | 1.0 | — |
| **B017** | Implement typed aftermath receipt generator | P0 | L | 1.5 | — |
| **B018** | Add receipt idempotency keys and duplicate guard | P0 | M | 1.0 | — |
| **B019** | Reconcile aftermath against all authoritative ledgers | P0 | L | 2.0 | — |

### File Changes

**Extend:**
- `src/game/encounterResolution.ts` — Upgrade to WS-4 resolution mechanics
  - Add seeded RNG for damage/rolls
  - Add HP ledger atomicity (before/after snapshots)
  - Add bounded combat terminal evaluation
  - Add flee progress and danger clocks
  - Add parley thresholds and leverage consumption
  - Add d20 resolver with advantage/disadvantage
  - Add progress/danger racing clocks
  - Add PYOA exclusive-fact commits
- `src/game/encounterTerminalFsm.ts` — Add forced terminal at maxTurns
  - Reject actions after terminal
  - Force fallback resolution at bound
  - Clear encounter from GameState after terminal

**Create:**
- `src/game/encounterAftermath.ts` — Receipt generator, idempotency keys, ledger reconciliation
- `src/game/data/encounters/D8_resolution_mechanics.ts` — Copy WS-4 resolver implementations

**Extend:**
- `src/game/types.ts` — Add receipt types (`EncounterReceipt`, `ReceiptType`, etc.)

**Test:**
- `src/game/encounterResolution.test.ts` — Seeded replay, HP ledger, flee/parley, d20, clocks, PYOA forks, forced terminal
- `src/game/encounterAftermath.test.ts` — Receipt generation, idempotency, ledger reconciliation

### Dependencies

**Prerequisites:**
- Wave 1 complete (templates, stakes, biome filters)
- Existing `encounterTerminalFsm.ts` (extend, don't replace)

**Parallel work:**
- WS-2 NPC ledger (needed for NPC receipts, but WS-2 can define the contract)
- WS-5 PYOA persistence (needed for exclusive facts, but WS-5 can define the contract)

### Acceptance Criteria

- [ ] Combat encounters terminate within `maxTurns` (8 LitRPG, 10 DnD)
- [ ] Forced terminal fires at bound (no 290-turn purgatory)
- [ ] Flee attempts decrement budget; success commits `fled` terminal
- [ ] Parley attempts consume leverage; success commits `parleyResolved` terminal
- [ ] d20 rolls are deterministic under stored seed (replay test passes)
- [ ] Progress vs danger clocks: both-full tie becomes success with cost
- [ ] PYOA forks write exclusive facts and ending eligibility
- [ ] Every terminal emits receipt with ≥2 types (XP, loot, faction, quest, NPC, dungeon)
- [ ] Receipt idempotency key prevents duplicate application
- [ ] Ledger reconciliation fails rather than partially applying mismatched deltas

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| PYOA fork complexity | Defer B015 to end of Wave 2; test with simple fork first |
| Receipt reconciliation atomicity | Use transaction-like pattern: validate all mutations before applying any |
| Forced terminal edge cases | Test every encounter family (combat, trap, hazard, check, social, crisis) |

---

## Wave 3 — Director Integration

**Objective:** Add density governance, pre-GM commit, situation packets, prose validation, and telemetry.

**Exit condition:** GM output cannot contradict committed mechanics; drought remains biome-safe.

**Duration:** 5–7 days

### Tasks

| ID | Task | Priority | Complexity | Days | Owner |
|----|------|----------|------------|------|-------|
| **B023** | Implement density profiles and role budgets | P0 | L | 2.0 | — |
| **B024** | Implement interactive and hostile drought timers | P0 | M | 1.5 | — |
| **B025** | Integrate pre-GM encounter commit in ArcDirector | P0 | XL | 3.0 | — |
| **B026** | Extend situation packet with immutable encounter contract | P0 | L | 1.5 | — |
| **B027** | Extend prose warden with contradiction checks | P0 | L | 2.0 | — |
| **B028** | Emit encounter lifecycle telemetry events | P0 | M | 1.0 | — |

### File Changes

**Create:**
- `src/game/encounterDensity.ts` — Density profiles, role budgets, drought timers, saturation guards, variety scoring
- `src/game/data/encounters/D11_encounter_density.ts` — Copy WS-4 density logic

**Extend:**
- `src/game/arcDirector.ts` — Pre-GM encounter commit
  - Select template from legal candidates (biome filter + density preference)
  - Freeze template snapshot, telegraph, stakes, seed, maxTurns, fallback
  - Commit to `runManifest` before `callGm`
  - Emit density/drought telemetry
- `src/game/situationPacket.ts` — Add `encounterContract` field
  - Template version + content hash
  - Telegraph section (cues, channels, action hooks)
  - Stakes section (legal approaches, requirements, outcomes)
  - Mechanics section (resolver IDs, clocks, HP, seed)
  - Forced terminal fallback
- `src/game/proseWarden.ts` — Add contradiction checks
  - Detect altered outcome (victory → defeat, fled → captured)
  - Detect HP resurrection (enemy dead → alive)
  - Detect item contradiction (loot granted → not in inventory)
  - Detect faction contradiction (friendly → hostile without ledger change)
  - Detect quest contradiction (complete → active)
  - Detect actor contradiction (Keep Wraith in Saltmar)
  - Detect biome contradiction (snow in desert)
  - Detect terminality contradiction (terminal → re-engaged)
- `src/game/telemetry.ts` — Add encounter lifecycle events
  - `encounter.spawned` (template, biome, role, turn)
  - `encounter.telegraph` (channels, cues, response window)
  - `encounter.action` (action ID, approach, requirements, outcome)
  - `encounter.delta` (HP, clocks, resources, before/after)
  - `encounter.terminal` (outcome, reason, turn count, receipts)
  - `encounter.receipt` (types, amounts, idempotency key)
  - `encounter.rejection` (reason, candidate, filter)
  - `encounter.content_gap` (bible, biome, desired role, rejected candidates)

**Test:**
- `src/game/encounterDensity.test.ts` — Density profiles, drought triggers, saturation guards, variety scoring
- `src/game/arcDirector.test.ts` — Pre-GM commit, template freeze, biome filter, density preference
- `src/game/proseWarden.test.ts` — Contradiction checks (outcome, HP, item, faction, quest, actor, biome, terminality)

### Dependencies

**Prerequisites:**
- Wave 1 complete (templates, stakes, biome filters)
- Wave 2 complete (resolution, receipts, forced terminal)
- Existing `arcDirector.ts`, `situationPacket.ts`, `proseWarden.ts`

**Parallel work:**
- Wave 4 (loot tables) can start in parallel with B025–B028

### Acceptance Criteria

- [ ] Density profiles enforce role bands (4–6 trash, 1–2 elite, exactly 1 boss per LitRPG dungeon)
- [ ] Drought timer triggers encounter at 15 turns (LitRPG hostile) or 8 turns (DnD interactive)
- [ ] Saturation guard prevents >2 encounters in 5 turns (LitRPG)
- [ ] Variety scoring penalizes recent-role repeats
- [ ] Pre-GM commit freezes template, telegraph, stakes, seed, maxTurns, fallback
- [ ] Situation packet includes immutable encounter contract
- [ ] Prose warden rejects GM output contradicting committed mechanics
- [ ] Telemetry events cover spawn, telegraph, action, delta, terminal, receipt, rejection, content-gap
- [ ] Drought remains biome-safe (no wrong-bible substitution)

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| ArcDirector integration complexity | Start with feature flag; test with synthetic fixtures before playtest |
| Prose warden false positives | Start with high-confidence contradictions (HP, terminality); iterate on edge cases |
| Density enforcement over-constraints | Use legal fallback or content-gap receipt when preferred set is empty |
| Situation packet size growth | Test Free (Gemini Flash Lite) compatibility; may need simplified packet for Free tier |

---

## Wave 4 — Content and Rewards

**Objective:** Integrate loot and register all 48 templates/callbacks.

**Exit condition:** All libraries load, all PYOA links resolve, and rewards reconcile.

**Duration:** 4–6 days

### Tasks

| ID | Task | Priority | Complexity | Days | Owner |
|----|------|----------|------------|------|-------|
| **B029** | Implement tiered LitRPG loot tables and pity counters | P1 | M | 1.5 | — |
| **B030** | Implement DnD treasure quest-item and route-key tables | P1 | M | 1.5 | — |
| **B031** | Implement RPG favors intel and access as typed assets | P1 | M | 1.5 | — |
| **B032** | Implement PYOA callback and ending reward records | P1 | M | 1.5 | — |
| **B033** | Connect dungeon mob ledger to cleared-node spawn locks | P1 | M | 1.0 | — |
| **B034** | Register 24 combat social and hazard templates in BeatContract | P1 | M | 1.5 | — |
| **B035** | Register 24 PYOA crises and delayed callbacks | P1 | L | 2.0 | — |

### File Changes

**Create:**
- `src/game/lootTables.ts` — Typed loot resolution, pity counters, uniqueness rules, procedural trash
- `src/game/data/encounters/D9_loot_tables.json` — Copy from pasted/

**Extend:**
- `src/game/dungeonMobLedger.ts` — Connect to biome matrix
  - `clearedNodeIds` blocks respawn
  - Cleared rooms return content-gap receipt or discovery beat (not generic mob spawn)
- `src/game/beatContract.ts` — Register 48 templates
  - Map D2–D4 templates to beat roles (ambush, patrol, trash, elite, boss, trap, hazard, check, puzzle, social, crisis)
  - Map D5 PYOA crises to one-shot crisis IDs
  - Add terminal expectations per template

**Test:**
- `src/game/lootTables.test.ts` — Typed rewards, pity counters, uniqueness, procedural trash
- `src/game/dungeonMobLedger.test.ts` — Cleared-node spawn locks
- `src/game/beatContract.test.ts` — Template registration, beat roles, terminal expectations

### Dependencies

**Prerequisites:**
- Wave 2 complete (receipts)
- Wave 3 B025 complete (ArcDirector pre-GM commit)

**Parallel work:**
- Wave 4 can partially overlap with Wave 3 B026–B028

### Acceptance Criteria

- [ ] LitRPG elite/boss rewards are typed and build-relevant
- [ ] Third eligible miss guarantees rare drop (pity counter)
- [ ] Duplicate uniques convert to alternate reward
- [ ] DnD treasure includes quest items and route keys filtered by tier, biome, site
- [ ] RPG favors, intel, access persist provenance, scope, value, consumption, expiry, source
- [ ] PYOA callbacks and ending rewards write to story state
- [ ] Convergence reads prior fork facts and callbacks
- [ ] Cleared dungeon nodes do not respawn (unless explicit repopulation event)
- [ ] All 48 templates registered in BeatContract with correct beat roles

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Loot table balance | Start with conservative drop rates; tune after playtest telemetry |
| PYOA callback complexity | Use simple delayed-callback pattern first; iterate on complex convergence |
| BeatContract registry size | Use lazy loading; index by mode, bible, role for fast lookup |

---

## Wave 5 — Evaluation and Operations

**Objective:** Run historical regressions, property tests, linting, and promotion gates.

**Exit condition:** G1–G5 pass at the required sample and stable-promotion standard.

**Duration:** 3–5 days

### Tasks

| ID | Task | Priority | Complexity | Days | Owner |
|----|------|----------|------------|------|-------|
| **B036** | Build five-gate evaluation harness and fixtures | P1 | L | 2.0 | — |
| **B037** | Add four 300-turn historical regression scenarios | P1 | L | 2.0 | — |
| **B038** | Add property tests for no unchanged accepted action | P1 | L | 1.0 | — |
| **B039** | Build authoring linter and content-gap report | P2 | M | 1.5 | — |
| **B040** | Add shadow canary stable promotion dashboard | P2 | L | 1.5 | — |

### File Changes

**Create:**
- `src/game/evalHarness.ts` — Five quality gates (G1–G5), evidence retention, per-run and aggregate metrics
- `src/game/evalHarness.test.ts` — Four historical regressions (R1–R4)
- `scripts/encounter-linter.ts` — Authoring linter (missing telegraphs, receipts, fallbacks, biome rows, callbacks, resolver IDs)
- `scripts/encounter-promotion-dashboard.ts` — Shadow/canary/stable promotion dashboard
- `src/game/data/encounters/D12_eval_gates.json` — Copy from pasted/

**Extend:**
- `src/game/encounterResolution.test.ts` — Property tests (no unchanged accepted action)

**Test:**
- R1 (Summoned Pact combat purgatory): Terminal ≤ template bound; state-changing flee/parley; one receipt
- R2 (Cursed Keep passive GM): Keep profile includes combat, hazard/trap, checks/puzzles, boss
- R3 (Cape District pad loop): Walk Away terminates; leverage consumed/discredited; unchanged retry rejected
- R4 (Thornferry theater branching): Exclusive facts, delayed callback, ending difference, one-shot crisis lock persist

### Dependencies

**Prerequisites:**
- Wave 1–4 complete (full WS-4 implementation)

**Parallel work:**
- Wave 5 can partially overlap with Wave 4 B033–B035

### Acceptance Criteria

- [ ] G1 (Resolution): 100% of spawns reach terminal within `maxTurns` with one receipt
- [ ] G2 (Telegraph): ≥80% pre-engagement warning; zero unactionable cues
- [ ] G3 (Biome): 100% pass mode, bible, biome, site, faction, tier, exclusion, cooldown, density checks
- [ ] G4 (Density): 100% meet role bands; exact boss count
- [ ] G5 (Aftermath): 100% emit ≥2 reconciled receipt types; zero duplicate application
- [ ] R1 (combat purgatory): Pass (terminal ≤ bound)
- [ ] R2 (passive GM): Pass (Keep profile met)
- [ ] R3 (pad loop): Pass (Walk Away terminates; leverage consumed)
- [ ] R4 (theater branching): Pass (exclusive facts persist; callbacks fire)
- [ ] Property test: No unchanged accepted action (state hash or terminality must change)

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Historical regressions fail | Iterate on resolution mechanics until regressions pass before shipping |
| G4 density violations | Tune density profiles after telemetry; 95% in canary, 100% before stable |
| Eval harness performance | Use sampling for large runs; store evidence incrementally |

---

## Integration Timeline

```
Week 1: Wave 1 (contracts and selection)
  Days 1-2: B001-B003 (schema, loader, hashes)
  Days 3-4: B004-B007 (telegraph, stakes, action honesty)
  Days 5-7: B020-B022 (biome matrix, hard filter, regression suite)

Week 2: Wave 2 (resolution and receipts) — Part 1
  Days 8-9: B008-B010 (HP ledger, seeded damage, combat terminal)
  Days 10-11: B011-B012 (flee clocks, parley leverage)
  Days 12-14: B013-B014 (d20 resolver, progress/danger clocks)

Week 3: Wave 2 (resolution and receipts) — Part 2
  Days 15-16: B015 (PYOA exclusive-fact commit)
  Day 17: B016 (forced terminal at maxTurns)
  Days 18-19: B017-B018 (receipt generator, idempotency)
  Days 20-21: B019 (ledger reconciliation)

Week 4: Wave 3 (director integration)
  Days 22-23: B023-B024 (density profiles, drought timers)
  Days 24-26: B025 (pre-GM encounter commit in ArcDirector)
  Day 27: B026 (situation packet extension)
  Days 28-29: B027 (prose warden contradictions)
  Day 30: B028 (telemetry events)

Week 5: Wave 4 (content and rewards)
  Days 31-32: B029-B030 (LitRPG/DnD loot tables)
  Days 33-34: B031-B032 (RPG/PYOA rewards)
  Day 35: B033 (dungeon mob ledger)
  Days 36-37: B034-B035 (BeatContract registration)

Week 6: Wave 5 (evaluation and operations)
  Days 38-39: B036 (eval harness)
  Days 40-41: B037 (historical regressions)
  Day 42: B038 (property tests)
  Days 43-44: B039-B040 (linter, promotion dashboard)
```

**Critical path:** Wave 1 → Wave 2 → Wave 3 (30 days)  
**Parallel work:** Wave 4 can overlap with Wave 3 tail (saves 2–3 days)  
**Full completion:** 35–42 days

---

## Test Plan

### Unit Tests

| Module | Coverage | Key Tests |
|--------|----------|-----------|
| `encounterBible` | Schema loading, version/hash management | Load all 48 templates; verify hashes; reject unknown versions |
| `encounterTelegraph` | Cue selection, channel minima | Normal ≥1, elite ≥2, boss ≥3 channels; actionable hooks |
| `encounterStakes` | Stakes materialization, requirements validation | Only legal actions; reject without resolver or state delta |
| `encounterBiomeMatrix` | Hard filter, wrong-bible blocker | Keep Wraith blocked on coast; Summoned actors blocked in Keep |
| `encounterResolution` | HP ledger, seeded damage, flee/parley, d20, clocks, PYOA forks | Replay test (same seed/snapshot); forced terminal at bound |
| `encounterAftermath` | Receipt generation, idempotency | ≥2 receipt types; duplicate guard; ledger reconciliation atomicity |
| `encounterDensity` | Role budgets, drought timers, saturation guards | 4–6 trash, 1–2 elite, 1 boss per dungeon; max 2 in 5 turns |
| `arcDirector` | Pre-GM commit, template freeze | Encounter selected and frozen before `callGm` |
| `proseWarden` | Contradiction checks | Reject altered outcome, HP resurrection, wrong-bible actor |
| `lootTables` | Typed rewards, pity counters | Third eligible miss guarantees rare; duplicates convert |

### Integration Tests

| Scenario | Test |
|----------|------|
| **Spawn → Terminal lifecycle** | Spawn LitRPG trash → engage → flee attempts → terminal within 8 turns → receipt with ≥2 types |
| **Biome filter enforcement** | Request Keep Wraith on coast → rejected → fallback or content-gap receipt |
| **Density quota enforcement** | 10-room dungeon → 4–6 trash, 1–2 elite, 1 boss; no saturation violation |
| **Drought trigger** | 15 turns no combat → drought fires → legal hostile spawn |
| **Forced terminal** | Combat exceeds maxTurns → forced fallback (costly escape or victory) → receipt |
| **Receipt idempotency** | Terminal emits receipt → attempt duplicate application → blocked |
| **Prose contradiction** | GM narrates enemy resurrection → prose warden rejects → retry |

### Historical Regression Tests

| Fixture | Reproduced Failure | Required New Behavior |
|---------|-------------------|------------------------|
| **R1 — Summoned Pact combat purgatory** | 290-turn combat; decorative flee/parley | Terminal ≤ template bound; state-changing flee/parley; one receipt |
| **R2 — Cursed Keep passive GM** | No combat/traps/checks in 300 turns | Keep profile includes combat, hazard/trap, checks/puzzles, boss |
| **R3 — Cape District pad loop** | Walk Away and leverage repetition | Walk Away terminates; leverage consumed/discredited; unchanged retry rejected |
| **R4 — Thornferry theater branching** | Crisis repeats; branch flags disappear | Exclusive facts, delayed callback, ending difference, one-shot crisis lock persist |

### Property Tests

| Property | Test |
|----------|------|
| **No unchanged accepted action** | Given state S and action A accepted → state S' or terminal T must differ from S |
| **Monotonic progress** | Given repeated action A → success advances, danger advances, resource consumed, position changed, or action locked |
| **Terminal finality** | Given terminal outcome O at turn T → no action accepted at turn T+1 |
| **Receipt completeness** | Given terminal outcome O → receipt R has ≥2 nonempty types |
| **Biome hard filter** | Given mode M, bible B, biome BI → candidate C must pass all filters or be rejected |

---

## Rollout Plan

### Phase 1: Feature Flag (Days 1–30)

**Objective:** Build WS-4 behind feature flag; existing encounter code remains default.

**Actions:**
- Add `enableWs4Encounters` feature flag to `src/game/featureFlags.ts`
- Wire WS-4 modules into `arcDirector.ts` behind flag
- Default: flag OFF (old `encounterResolution.ts` + `encounterTerminalFsm.ts`)
- Test: flag ON (WS-4 modules)

**Testing:**
- Unit tests for all WS-4 modules
- Integration tests with synthetic fixtures
- No playtest exposure yet

### Phase 2: Internal Validation (Days 31–37)

**Objective:** Validate WS-4 with 12×300 evals and historical regressions.

**Actions:**
- Run 12×300 autoplay with WS-4 enabled (10 per mode, 100 encounters overall)
- Run four historical regressions (R1–R4)
- Measure G1–G5 gates
- Compare to baseline (old encounter code)

**Success criteria:**
- G1–G5 pass at required thresholds
- R1–R4 pass (no more combat purgatory, passive GM, pad loops, theater branching)
- Gemini encounter scores ≥6/10 (vs ~1–2/10 baseline)

**If success:** Proceed to Phase 3  
**If failure:** Iterate on resolution/density/receipts until gates pass

### Phase 3: Canary Release (Days 38–42)

**Objective:** Expose WS-4 to limited playtest traffic (10–20% of runs).

**Actions:**
- Enable `enableWs4Encounters` for 10% of sessions (session ID mod 10)
- Monitor telemetry for G1–G5 violations, wrong-bible spawns, purgatory, pad loops
- Collect player feedback on encounter quality

**Success criteria:**
- No critical failures (wrong-bible spawns, purgatory, missing receipts)
- G4 density ≥95% (100% before stable)
- No P0 defects

**If success:** Proceed to Phase 4  
**If failure:** Fix defects, iterate on density tuning, then re-run canary

### Phase 4: Stable Promotion (Days 43+)

**Objective:** Make WS-4 the default encounter system; deprecate old code.

**Actions:**
- Enable `enableWs4Encounters` for 100% of sessions
- Update HUD stamp to reflect WS-4 (e.g., `2026-09-15a`)
- Deprecate old `encounterResolution.ts` (P1.2 spec)
- Remove feature flag after 1 week of stable operation

**Success criteria:**
- G1–G5 pass at 100% (or near 100% with rare edge cases tracked)
- No regression in Gemini scores
- Player feedback neutral or positive

---

## Coordination with Other Workstreams

### WS-2 (NPC Role, Memory, Lifecycle)

**Integration point:** NPC receipts in encounter aftermath

**WS-4 needs from WS-2:**
- NPC ledger mutation contract (alive/dead, recruited, trust, injury, availability)
- NPC role obligations (encounter contracts that involve NPCs)

**WS-2 needs from WS-4:**
- NPC receipts in `encounterAftermath.ts` (call WS-2 mutation functions)

**Timing:** WS-4 Wave 2 B019 needs NPC ledger contract; WS-2 can proceed in parallel and define the contract by end of Wave 1.

### WS-5 (PYOA Persistence)

**Integration point:** PYOA exclusive facts and ending eligibility

**WS-4 needs from WS-5:**
- Exclusive-fact commit contract (write selected fact, lock opposite, schedule callback, set ending eligibility)
- Story state persistence (facts survive convergence)

**WS-5 needs from WS-4:**
- PYOA fork resolution in `encounterResolution.ts` (call WS-5 commit functions)

**Timing:** WS-4 Wave 2 B015 needs exclusive-fact contract; WS-5 can proceed in parallel and define the contract by end of Wave 1.

### Path A Architecture (Manifest, BeatContract, ArcDirector)

**Integration point:** Pre-GM encounter commit, template registry, density checks

**WS-4 extends:**
- `arcDirector.ts` — Pre-GM encounter commit (B025)
- `beatContract.ts` — Register 48 templates (B034, B035)
- `runManifest.ts` — Encounter lifecycle events (B028)

**Timing:** WS-4 Wave 3 B025 is the critical integration point; requires Waves 1–2 complete first.

### Quality Governance (27w modules)

**Integration point:** Encounter-specific quality gates (G1–G5)

**WS-4 complements:**
- `qualityGovernance.ts` — Existing quality modules remain; WS-4 adds encounter-specific gates
- `forwardProgressGovernor.ts` — Encounter terminals count as forward progress

**Timing:** WS-4 eval harness (Wave 5 B036) measures encounter-specific quality; can proceed after Wave 4.

---

## Open Questions and Decisions

### Q1: Refactor or parallel build?

**Decision:** Parallel build (new WS-4 modules alongside existing encounter code, then deprecate old code after validation).

**Rationale:** Lower risk; allows gradual migration and A/B testing.

### Q2: Mid-campaign save migration?

**Decision:** Add `saveMigration.applyWs4EncounterRepair` to convert old encounters to WS-4 format on load.

**Implementation:** Wave 3 B025 includes save migration logic.

### Q3: Content authoring pipeline?

**Decision:** Wave 5 B039 builds authoring linter; content ops team can commission new templates using WS-4 schema.

**Implementation:** `scripts/encounter-linter.ts` validates new templates before registration.

### Q4: Gemini scoring re-run timing?

**Decision:** Ship Wave 1–3, then gate Wave 4–5 on Gemini re-score showing ≥6/10 encounter quality.

**Implementation:** Phase 2 (Internal Validation) runs 12×300 autoplay with Gemini scoring.

### Q5: Free model compatibility?

**Decision:** Test Free (Gemini Flash Lite) compatibility in Wave 3; may need separate simplified packet for Free tier.

**Implementation:** Wave 3 B026 tests situation packet size with Free; if too large, create simplified telegraph/stakes section for Free.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| **ArcDirector integration breaks existing beat selection** | Medium | High | Use feature flag; test with synthetic fixtures before playtest | — |
| **PYOA fork complexity delays Wave 2** | Medium | Medium | Defer B015 to end of Wave 2; test with simple fork first | — |
| **Prose warden false positives block valid GM output** | Medium | Medium | Start with high-confidence contradictions; iterate on edge cases | — |
| **Density enforcement over-constraints legal candidates** | Low | Medium | Use legal fallback or content-gap receipt when preferred set is empty | — |
| **Situation packet size breaks Free model** | Low | Medium | Test Free compatibility in Wave 3; create simplified packet if needed | — |
| **Receipt reconciliation atomicity bug** | Low | High | Use transaction-like pattern; test thoroughly in Wave 2 | — |
| **Historical regressions fail after implementation** | Medium | High | Iterate on resolution mechanics until regressions pass before shipping | — |
| **Gemini scores don't improve (still ~1–2/10)** | Low | High | Run 12×300 autoplay in Phase 2; iterate if scores don't reach ≥6/10 | — |
| **Mid-campaign save migration breaks existing saves** | Low | High | Test migration thoroughly; provide fallback to old encounter code if needed | — |

---

## Success Metrics

### Quality Gates (G1–G5)

| Gate | Baseline (27w) | Target (WS-4) | Measurement |
|------|---------------|---------------|-------------|
| **G1 — Resolution** | ~30% reach terminal | **100%** | Every spawn reaches terminal within maxTurns with one receipt |
| **G2 — Telegraph** | ~40% pre-engagement warning | **≥80%** | Warning shown before engagement; every cue has real counterplay |
| **G3 — Biome** | Known violations (Keep Wraith on coast) | **100%** | Zero wrong-bible spawns |
| **G4 — Density** | Empty dungeons (~30% of runs) | **100%** | Every closed location/chapter meets role bands; exact boss count |
| **G5 — Aftermath** | ~50% have receipts | **100%** | Every terminal produces ≥2 reconciled receipt types |

### Gemini Encounter Scores

| Mode | Baseline (27w) | Target (WS-4) | Measurement |
|------|---------------|---------------|-------------|
| LitRPG | ~1.5/10 | **≥6/10** | Gemini re-score on 12×300 autoplay |
| DnD | ~1.8/10 | **≥6/10** | Gemini re-score on 12×300 autoplay |
| RPG | ~2.0/10 | **≥6/10** | Gemini re-score on 12×300 autoplay |
| PYOA | ~1.2/10 | **≥6/10** | Gemini re-score on 12×300 autoplay |

### Historical Regressions

| Fixture | Baseline (27w) | Target (WS-4) | Measurement |
|---------|---------------|---------------|-------------|
| R1 (combat purgatory) | 290 turns, no resolution | Terminal ≤ bound | Regression test passes |
| R2 (passive GM) | 300 turns, zero encounters | Keep profile met | Regression test passes |
| R3 (pad loop) | Walk Away repeats ×364 | Walk Away terminates | Regression test passes |
| R4 (theater branching) | Crisis repeats, flags lost | Exclusive facts persist | Regression test passes |

### Player Feedback

| Metric | Baseline (27w) | Target (WS-4) | Measurement |
|--------|---------------|---------------|-------------|
| Combat purgatory complaints | ~5% of feedback | **<1%** | Player feedback analysis |
| "Nothing happens" complaints | ~10% of feedback | **<2%** | Player feedback analysis |
| Wrong-bible spawn reports | ~2% of feedback | **0%** | Player feedback analysis |

---

## Summary

WS-4 implementation is a 24–35 day effort across five waves:

1. **Wave 1 (5–7 days):** Schema loading, biome filters, telegraph/stakes materialization
2. **Wave 2 (7–10 days):** Resolution mechanics, forced terminals, receipts
3. **Wave 3 (5–7 days):** ArcDirector integration, density enforcement, prose validation
4. **Wave 4 (4–6 days):** Loot tables, template registration
5. **Wave 5 (3–5 days):** Eval harness, historical regressions, promotion gates

**Critical path:** Waves 1–3 (17–24 days)  
**Next action:** John approval + start Wave 1 (schema loading and biome filtering)  
**Success criteria:** G1–G5 pass at 100%, Gemini scores ≥6/10, four historical regressions pass
