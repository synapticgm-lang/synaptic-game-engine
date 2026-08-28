# WS-7 Social Gameplay Implementation Plan

**Date:** 2026-08-28  
**Package:** WS-7 Social Gameplay and Non-Combat Systems  
**Ingest:** `docs/research/manus-ws-7-social-gameplay-ingest-2026-08-28.md`  
**Status:** Ready for John authorization

## Executive Summary

This document provides a detailed implementation plan for WS-7 Social Gameplay, structured in 4 coordinated waves following the Path A pattern (Waves A-D). Each wave includes:
- Specific file changes (new + modified)
- Task breakdown with effort estimates
- Integration points with existing systems
- Exit criteria and validation gates
- Vitest coverage requirements

**Total Effort:** 16-20 implementation days (~3-4 weeks for P0+P1)  
**Deployment:** Client-only Waves 1-3; client + edge Wave 4  
**Risk Level:** Medium-High (new persistent stores, complex state machines)

## Wave Breakdown

### Wave 1: Crisis & Leverage Foundation (4-5 days)

**Goal:** Get one social crisis (SC-01 Social Standoff) working end-to-end with leverage exhaustion.

**Exit Criteria:**
- SC-01 can spawn in eligible contexts (DnD/RPG/PYOA modes)
- Crisis commits stakes before GM (gain, loss, owner, deadline)
- Leverage registry tracks assets and target cooldowns
- One leverage use exhausts the asset against that NPC
- Vitest: `playtest31aWave1Social.test.ts` passes (5+ tests)

**Tasks (8):**

| ID | Task | Effort | Files Changed |
|----|------|--------|---------------|
| WS7-001 | Add SocialCrisis and SocialStakes domain types | 0.5d | NEW: `socialCrisisTypes.ts` |
| WS7-002 | Load and validate 15-pattern crisis catalog | 0.5d | NEW: `socialCrisis.ts`, `public/data/social-crisis-catalog.json` |
| WS7-003 | Implement mode and context eligibility filters | 0.5d | MOD: `socialCrisis.ts` (eligibility logic) |
| WS7-004 | Implement crisis scheduler with 30-turn target | 0.5d | MOD: `arcDirector.ts` (crisis selection) |
| WS7-005 | Commit social stakes before GM prose | 0.5d | MOD: `arcDirector.ts` (pre-GM commit) |
| WS7-006 | Add social context to SituationPacket | 0.5d | MOD: `situationPacket.ts` (social snapshot) |
| WS7-007 | Implement proposition fingerprinting | 0.5d | NEW: `socialSkills.ts` (fingerprint util) |
| WS7-008 | Block exact-repeat checks without state delta | 0.5d | MOD: `socialSkills.ts` (repeat blocker) |

**New Files:**
- `src/game/socialCrisisTypes.ts` — crisis, stakes, resolution types
- `src/game/socialCrisis.ts` — loader, eligibility, scheduler
- `src/game/socialSkills.ts` — 4 skills, fingerprints, hybrid resolution
- `src/game/leverageMechanics.ts` — registry, resolver, exhaustion
- `public/data/social-crisis-catalog.json` — 15 patterns (start with 5-8)
- `public/data/social-crisis-catalog.schema.json` — JSON Schema

**Modified Files:**
- `src/game/arcDirector.ts` — add crisis selection + commit (before beat selection)
- `src/game/situationPacket.ts` — add `socialContext` field (stakes, relationship, leverage)
- `src/game/types.ts` — add `socialCrises`, `leverageAssets` stores to GameState
- `src/game/stateTx.ts` — add `social_crisis_commit`, `leverage_consumed` tx types

**Integration Points:**
- Crisis eligibility checks `engineMode` (litrpg/dnd/rpg/pyoa)
- Crisis scheduler uses `turnNumber` and `pressureClock` for 30-turn cadence
- Leverage resolver reads `npcRelationships` (stub for now; full in Wave 2)

**Vitest:**
- `playtest31aWave1Social.test.ts`:
  - Test 1: SC-01 eligible in DnD mode with two opposed actors
  - Test 2: Crisis commits stakes before GM (gain, loss, owner)
  - Test 3: Leverage asset registered on first use
  - Test 4: Second leverage use against same NPC is blocked
  - Test 5: Crisis scheduler suppresses same pattern for 60 turns

**Deployment:** Client-only (no gm-turn changes needed; SNAPSHOT sends crisis context)

---

### Wave 2: Skills & Relationships (5-6 days)

**Goal:** Add persistent relationship ledgers with 6-state FSM so betrayal at T50 caps disposition at T100.

**Exit Criteria:**
- 6-state disposition FSM (hostile→wary→neutral→friendly→allied→loyal)
- Trust/respect/fear/intimacy/familiarity dimensions tracked
- Milestones persist (betrayal, promise, alliance, loyalty)
- Promotion requires threshold + familiarity + milestone + no unrepaired breach
- Atomic state transactions (path, quest, faction, relationship mutations)
- Vitest: `playtest31bWave2Relationships.test.ts` passes (8+ tests)

**Tasks (9):**

| ID | Task | Effort | Files Changed |
|----|------|--------|---------------|
| WS7-009 | Implement hybrid roll policy | 0.5d | MOD: `socialSkills.ts` (automatic/roll tiers) |
| WS7-010 | Implement modifier calculation | 0.5d | MOD: `socialSkills.ts` (skill + relationship + evidence + leverage + faction) |
| WS7-011 | Implement 5 outcome bands and margin rules | 0.5d | MOD: `socialSkills.ts` (critical success → critical failure) |
| WS7-012 | Apply social state mutations before prose | 1.0d | MOD: `arcDirector.ts`, `stateTx.ts` (atomic transaction) |
| WS7-013 | Add prose conformance checks | 0.5d | MOD: `proseWarden.ts` (reject contradictions) |
| WS7-014 | Implement LeverageAsset registry | 0.5d | MOD: `leverageMechanics.ts` (6 types, evidence strength, credibility) |
| WS7-015 | Implement target pressure profiles | 0.5d | MOD: `leverageMechanics.ts` (fears, wants, duties, taboos) |
| WS7-016 | Implement conditional leverage resolver | 1.0d | MOD: `leverageMechanics.ts` (score calculation, -6 to +6 modifier) |
| WS7-017 | Enforce one-use target cooldown | 0.5d | MOD: `leverageMechanics.ts` (ledger entry, exhausted flag) |

**New Files:**
- `src/game/relationshipTypes.ts` — relationship, milestone, promise, boundary types
- `src/game/npcRelationships.ts` — FSM, ledgers, promotion gates
- `src/game/leverageTypes.ts` — leverage asset, use, resolution types

**Modified Files:**
- `src/game/socialSkills.ts` — add hybrid resolution, modifiers, outcome bands
- `src/game/leverageMechanics.ts` — complete resolver implementation
- `src/game/arcDirector.ts` — atomic state transaction before GM
- `src/game/stateTx.ts` — add `relationship_milestone`, `promise_made`, `boundary_set` tx types
- `src/game/proseWarden.ts` — add social conformance checks
- `src/game/types.ts` — add `npcRelationships` store to GameState
- `src/game/saveSchema.ts` — add relationship ledger schema
- `src/game/saveMigration.ts` — repair missing relationship ledgers on load

**Integration Points:**
- WS-2 NPC role obligations can trigger relationship milestones
- WS-2 topic exhaustion affects relationship-gated dialogue
- Relationship FSM reads `trust`, `familiarity`, and `milestones` for promotion
- Leverage resolver reads `npcRelationships` for pressure profile and trust/fear

**Vitest:**
- `playtest31bWave2Relationships.test.ts`:
  - Test 1: New NPC starts at neutral disposition with trust 0
  - Test 2: Favor granted awards +10 trust, requires `favor_granted` milestone for friendly
  - Test 3: Betrayal milestone caps disposition until explicit repair
  - Test 4: Hostile NPC (-60 trust) cannot promote to friendly without repair
  - Test 5: Leverage use reduces trust by type (physical_threat: -18)
  - Test 6: Promise broken adds `promise_broken` milestone and trust -30
  - Test 7: Save/load preserves relationship ledger exactly
  - Test 8: Atomic transaction applies path + quest + faction + relationship mutations together

**Deployment:** Client-only (relationship ledger persists in localStorage save; no edge changes)

---

### Wave 3: Modes & Progression (3-4 days)

**Goal:** Add mode-specific adapters (DnD/RPG/PYOA/LitRPG), skill tree UI, and XP parity evaluation.

**Exit Criteria:**
- All 4 modes resolve same committed state correctly
- DnD shows explicit DC and d20; PYOA hides numbers; LitRPG shows thresholds
- PYOA Insight appears as internal comment with confidence/bias
- 10-node skill tree unlocks (Tier 1 → Master Diplomat)
- XP novelty ledger prevents duplicate awards
- 80% XP parity top-up at objective completion
- Vitest: `playtest31cWave3Modes.test.ts` passes (6+ tests)

**Tasks (8):**

| ID | Task | Effort | Files Changed |
|----|------|--------|---------------|
| WS7-018 | Propagate leverage consequences across NPC network | 0.5d | MOD: `leverageMechanics.ts` (witness/confidant/faction/public/rumor) |
| WS7-019 | Create persistent relationship repository | 0.5d | MOD: `npcRelationships.ts` (repository layer) |
| WS7-020 | Implement 6-state disposition FSM | 0.5d | MOD: `npcRelationships.ts` (promotion gates) |
| WS7-021 | Track promises, milestones, knowledge, boundaries | 0.5d | MOD: `npcRelationships.ts` (ledger append) |
| WS7-022 | Integrate WS-2 role obligations | 0.5d | MOD: `npcRelationships.ts`, `npcTopicFsm.ts` (role bridge) |
| WS7-023 | Implement outcome mutation catalog | 0.5d | NEW: `socialStakes.ts` (12 templates) |
| WS7-024 | Add crisis and outcome audit events | 0.5d | NEW: `evalHarness.ts` (telemetry) |
| WS7-025 | Implement G1-G5 automated gates | 0.5d | MOD: `evalHarness.ts` (aggregation) |

**New Files:**
- `src/game/socialStakes.ts` — 12 mode-specific templates (3 DnD, 3 RPG, 3 PYOA, 3 LitRPG)
- `src/game/socialProgression.ts` — skill tree, novelty ledger, XP parity
- `src/components/RelationshipPanel.tsx` — disposition, dimensions, milestones view
- `src/components/PromisesJournal.tsx` — open promises, deadlines
- `src/components/SocialSkillTree.tsx` — 10 nodes, unlocks

**Modified Files:**
- `src/game/npcRelationships.ts` — complete FSM + ledgers
- `src/game/leverageMechanics.ts` — add knowledge propagation
- `src/game/socialSkills.ts` — add mode adapters (DnD/RPG/PYOA/LitRPG presentation)
- `src/game/socialMilestoneLedger.ts` — upgrade to full novelty ledger
- `src/game/useGame.ts` — wire XP parity evaluation on objective complete
- `src/game/evalHarness.ts` — add G1-G5 gates

**Integration Points:**
- Mode adapters read `gameState.engineMode` for presentation
- PYOA Insight generates internal comment with `confidence` and `bias` fields
- LitRPG shows threshold contributions in STATUS chrome
- Skill tree unlocks gate relationship/faction actions (e.g., Tier 3 Leverage Appraisal)
- XP parity compares social XP vs matched combat route (requires WS-4 encounter bible)

**Vitest:**
- `playtest31cWave3Modes.test.ts`:
  - Test 1: DnD mode shows explicit DC, d20 roll, modifier breakdown
  - Test 2: PYOA mode hides numbers; Insight is internal comment
  - Test 3: LitRPG mode shows threshold contributions (skill 2 + trust 20 + leverage 4)
  - Test 4: RPG mode shows inspectable leverage prerequisites
  - Test 5: Skill tree Tier 2 unlocks after Tier 1 complete
  - Test 6: XP novelty ledger blocks duplicate leverage-target award

**Deployment:** Client-only (UI + mode adapters; no edge changes)

---

### Wave 4: Governance & Evaluation (4-5 days)

**Goal:** Add ProseWarden constraints, full evaluation harness, and balance tuning.

**Exit Criteria:**
- ProseWarden rejects contradicted outcomes, omitted costs, reversed results
- G1-G5 automated gates run on deterministic seeds
- 100 deterministic 100-turn runs per mode (DnD, RPG, PYOA, LitRPG)
- Crisis pattern coverage ≥10 in RPG and PYOA
- Terminal resolution rate ≥95%
- Zero critical invariant violations
- Vitest: `playtest31dWave4Governance.test.ts` passes (10+ tests)

**Tasks (11):**

| ID | Task | Effort | Files Changed |
|----|------|--------|---------------|
| WS7-026 | Build DnD stakes adapter | 0.5d | MOD: `socialStakes.ts` (3 DnD templates) |
| WS7-027 | Build RPG stakes adapter | 0.5d | MOD: `socialStakes.ts` (3 RPG templates) |
| WS7-028 | Build PYOA stakes adapter | 0.5d | MOD: `socialStakes.ts` (3 PYOA templates) |
| WS7-029 | Build LitRPG stakes adapter | 0.5d | MOD: `socialStakes.ts` (3 LitRPG templates) |
| WS7-030 | Implement relationship and journal UI | 1.0d | NEW: `RelationshipPanel.tsx`, `PromisesJournal.tsx` |
| WS7-031 | Implement social XP novelty ledger | 0.5d | MOD: `socialProgression.ts` (novelty keys) |
| WS7-032 | Implement 80% parity top-up | 0.5d | MOD: `socialProgression.ts` (parity evaluation) |
| WS7-033 | Implement social skill tree and unlock gates | 0.5d | MOD: `socialProgression.ts` (10 nodes) |
| WS7-034 | Author crisis-specific prose tests | 1.0d | NEW: 15 patterns × 4 modes prose fixtures |
| WS7-035 | Add designer telemetry dashboard | 0.5d | NEW: `scripts/eval-social-gameplay.ts` |
| WS7-036 | Run balance and abuse hardening wave | 1.0d | MOD: all WS-7 modules (tune DC, deltas) |

**New Files:**
- `scripts/eval-social-gameplay.ts` — deterministic 100×100 runs, G1-G5 aggregation
- `scripts/social-prose-fixtures.ts` — 60 fixtures (15 patterns × 4 modes)
- `docs/research/ws-7-balance-notes.md` — DC tuning, XP ratios

**Modified Files:**
- `src/game/proseWarden.ts` — add social conformance (contradictions, omissions, reversals)
- `src/game/socialStakes.ts` — complete 12 templates
- `src/game/socialProgression.ts` — complete skill tree + parity
- `src/game/evalHarness.ts` — wire G1-G5 into deterministic runs
- `src/components/RelationshipPanel.tsx` — full UI
- `src/components/PromisesJournal.tsx` — full UI
- `src/components/SocialSkillTree.tsx` — full UI

**Integration Points:**
- ProseWarden reads `crisisCommit` envelope to validate GM prose
- Eval harness runs `fate-autoplay` with `--social-crises` flag
- Telemetry dashboard aggregates crisis spawn, terminal, leverage exhaustion, relationship callbacks
- Balance tuning uses G5 XP parity ratios

**Vitest:**
- `playtest31dWave4Governance.test.ts`:
  - Test 1: ProseWarden rejects GM prose that contradicts committed success
  - Test 2: ProseWarden rejects GM prose that omits declared cost
  - Test 3: ProseWarden rejects GM prose that reverses committed state
  - Test 4: G1 crisis eligibility gate passes (≥10 patterns in RPG/PYOA)
  - Test 5: G2 skill checks gate passes (all 4 skills, all outcome bands)
  - Test 6: G3 leverage gate passes (6 types, same asset/NPC max 1)
  - Test 7: G4 relationship gate passes (exact save/load, betrayal at T100)
  - Test 8: G5 parity gate passes (talk/fight median XP ≥0.80)
  - Test 9: Zero critical invariant violations (100 runs)
  - Test 10: Terminal resolution rate ≥95%

**Deployment:** Client + edge (ProseWarden synced to gm-turn; eval harness client-only)

---

## File Changes Summary

### New Files (15-20)

**Game Logic (8):**
- `src/game/socialCrisisTypes.ts`
- `src/game/socialCrisis.ts`
- `src/game/socialSkills.ts`
- `src/game/leverageMechanics.ts`
- `src/game/leverageTypes.ts`
- `src/game/relationshipTypes.ts`
- `src/game/npcRelationships.ts`
- `src/game/socialStakes.ts`
- `src/game/socialProgression.ts`

**Data (3):**
- `public/data/social-crisis-catalog.json`
- `public/data/social-crisis-catalog.schema.json`
- `public/data/npc-relationship.schema.json`

**UI (3):**
- `src/components/RelationshipPanel.tsx`
- `src/components/PromisesJournal.tsx`
- `src/components/SocialSkillTree.tsx`

**Evaluation (3):**
- `src/game/evalHarness.ts` (or extend existing)
- `scripts/eval-social-gameplay.ts`
- `scripts/social-prose-fixtures.ts`

**Docs (1):**
- `docs/research/ws-7-balance-notes.md`

### Modified Files (10-15)

**Core Integration:**
- `src/game/arcDirector.ts` (crisis selection + commit)
- `src/game/situationPacket.ts` (social context)
- `src/game/stateTx.ts` (social tx types)
- `src/game/types.ts` (social stores)
- `src/game/proseWarden.ts` (social conformance)

**Save/Load:**
- `src/game/saveSchema.ts` (social crisis + relationship schema)
- `src/game/saveMigration.ts` (repair missing ledgers)

**Existing Systems:**
- `src/game/socialMilestoneLedger.ts` (upgrade to full novelty)
- `src/game/npcTopicFsm.ts` (WS-2 bridge)
- `src/hooks/useGame.ts` (wire XP parity)

**Edge (if Wave 4 needs sync):**
- `supabase/functions/gm-turn/proseWarden.ts` (sync conformance checks)

---

## Prerequisites and Dependencies

### Before Wave 1

**Required:**
- ✅ Path A Wave 0-1 shipped (28a) — ArcDirector, beatContract, stateTx
- ✅ Social milestones basic (28a) — `socialMilestoneLedger.ts` exists
- ⏸️ John authorization to implement WS-7

**Optional:**
- ⏸️ WS-2 NPC roles shipped (helps but not blocking)
- ⏸️ WS-4 encounter bible shipped (needed for XP parity comparison)

### Between Waves

**Wave 1 → Wave 2:**
- Wave 1 crisis commits must be stable
- Leverage registry must persist correctly

**Wave 2 → Wave 3:**
- Relationship ledger must save/load correctly
- FSM promotion gates must work

**Wave 3 → Wave 4:**
- All 4 mode adapters must resolve correctly
- XP novelty ledger must prevent duplicates

---

## Integration with Other Systems

### ArcDirector Integration

**Wave 1:** Add crisis selection before beat selection.

```typescript
// src/game/arcDirector.ts (Wave 1)
export function selectNextMove(state: GameState): ArcDirectorDecision {
  // 1. Check for eligible social crisis (P2 priority)
  const crisis = selectEligibleSocialCrisis(state);
  if (crisis) {
    const commit = commitSocialStakes(state, crisis);
    return { type: 'social_crisis', crisis, commit };
  }
  
  // 2. Existing beat selection (P1 priority)
  const beat = selectNextBeat(state);
  if (beat) {
    return { type: 'beat', beat };
  }
  
  // 3. Fallback
  return { type: 'continue' };
}
```

**Wave 2:** Apply atomic state transaction before GM.

```typescript
// src/game/arcDirector.ts (Wave 2)
export function applyResolutionMutations(
  state: GameState,
  resolution: SocialResolution
): StateTx[] {
  const txs: StateTx[] = [];
  
  // Atomic transaction across stores
  for (const mutation of resolution.consequences) {
    if (mutation.path.startsWith('paths.')) {
      txs.push({ type: 'path_opened', path: mutation.value });
    } else if (mutation.path.startsWith('relationships.')) {
      txs.push({ type: 'relationship_milestone', ...mutation });
    } else if (mutation.path.startsWith('leverage.')) {
      txs.push({ type: 'leverage_consumed', ...mutation });
    }
    // ... quest, faction, etc.
  }
  
  return txs;
}
```

### SituationPacket Integration

**Wave 1:** Add social context snapshot.

```typescript
// src/game/situationPacket.ts (Wave 1)
export interface SocialContext {
  crisisCommit?: {
    patternId: string;
    stakes: { gain: string; loss: string; owner: string; deadline?: number };
    feasibility: 'routine' | 'plausible' | 'impossible';
    dc?: number;
    modifiers?: { skill: number; relationship: number; leverage: number };
  };
  relationship?: {
    disposition: Disposition;
    trust: number;
    fear: number;
    milestones: string[];
  };
  leverageFreshness?: {
    assetId: string;
    exhausted: boolean;
    lastUseTurn: number;
  };
}

export interface SituationPacket {
  // ... existing fields
  socialContext?: SocialContext;
}
```

### ProseWarden Integration

**Wave 2:** Add social conformance checks.

```typescript
// src/game/proseWarden.ts (Wave 2)
export function validateSocialConformance(
  prose: string,
  commit: SocialCrisisCommit
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  // Check: GM prose must not contradict committed outcome
  if (commit.result === 'success' && prose.includes('refuse')) {
    violations.push('Prose contradicts committed success');
  }
  
  // Check: GM prose must not omit declared cost
  if (commit.cost && !proseContainsCost(prose, commit.cost)) {
    violations.push('Prose omits declared cost');
  }
  
  // Check: GM prose must not reverse state mutation
  if (commit.mutations.includes('alliance_severed') && prose.includes('ally remains')) {
    violations.push('Prose reverses committed state');
  }
  
  return { valid: violations.length === 0, violations };
}
```

### WS-2 NPC Roles Bridge

**Wave 3:** Integrate role obligations with relationship milestones.

```typescript
// src/game/npcRelationships.ts (Wave 3)
export function integrateWS2RoleObligation(
  relationship: NpcRelationship,
  roleDebt: NpcRoleDebt
): NpcRelationship {
  // If role debt is satisfied, award trust + milestone
  if (roleDebt.satisfied) {
    return {
      ...relationship,
      trust: relationship.trust + 15,
      milestones: [
        ...relationship.milestones,
        {
          type: 'favor_granted',
          turn: roleDebt.satisfiedTurn,
          summary: `Fulfilled obligation: ${roleDebt.description}`,
          valence: 30,
          salience: 60,
          permanent: true,
        },
      ],
    };
  }
  
  // If role debt is missed, reduce trust + add breach
  if (roleDebt.dueTurn && roleDebt.dueTurn < state.turnNumber) {
    return {
      ...relationship,
      trust: relationship.trust - 20,
      milestones: [
        ...relationship.milestones,
        {
          type: 'promise_broken',
          turn: roleDebt.dueTurn,
          summary: `Failed obligation: ${roleDebt.description}`,
          valence: -30,
          salience: 70,
          permanent: true,
        },
      ],
    };
  }
  
  return relationship;
}
```

---

## Validation and Testing Strategy

### Unit Tests (Each Wave)

**Wave 1:**
- Crisis eligibility (mode, context, repeat suppression)
- Leverage registry (asset creation, exhaustion)
- Proposition fingerprinting (stability, collisions)

**Wave 2:**
- Relationship FSM (promotion gates, breach caps)
- Leverage resolver (modifier calculation, pressure fit)
- Atomic transactions (all mutations apply or none)

**Wave 3:**
- Mode adapters (DnD/RPG/PYOA/LitRPG presentation)
- XP novelty ledger (duplicate prevention)
- XP parity evaluation (80% top-up)

**Wave 4:**
- ProseWarden conformance (contradictions, omissions, reversals)
- G1-G5 aggregation (crisis patterns, skills, leverage, relationships, parity)
- Balance (DC bands, trust deltas, XP ratios)

### Integration Tests (Cross-Wave)

**Wave 1+2:**
- Crisis spawns → leverage use → relationship trust delta → ledger persists

**Wave 2+3:**
- Relationship milestone → skill tree unlock → XP parity top-up

**Wave 3+4:**
- Mode adapter → GM prose → ProseWarden validation → G1-G5 pass

### Evaluation Harness (Wave 4)

**G1: Crisis Patterns**
- 100 deterministic 100-turn runs per mode (DnD, RPG, PYOA, LitRPG)
- Measure: distinctEligiblePatternIds, distinctSpawnedPatternIds
- Pass: ≥10 patterns in RPG and PYOA
- Pass: terminalResolutionRate ≥95%
- Pass: zero suppressionViolations, zero unchangedStateAfterResolution

**G2: Social Skills**
- Cross-product: 4 skills × 5 DC bands × 3 dispositions × 3 evidence bands
- Measure: skillsCovered, outcomeBandsCovered, preCommitMutationCoverage
- Pass: all 4 skills observed
- Pass: success/partial/failure observed for each skill
- Pass: 100% commits include mutations

**G3: Leverage**
- All 6 leverage types × matching/mismatching pressure profiles
- Measure: typesCovered, exhaustionRate, repeatBlockRate
- Pass: 6 success and 6 failure cases
- Pass: same asset/NPC max 1 use
- Pass: 100% repeats blocked

**G4: Relationships**
- Alliance at T25 → betrayal at T50 → save/load → allied request at T100 → repair
- Measure: save/load exactness, betrayal persistence, cap effectiveness
- Pass: exact save/load round-trip
- Pass: betrayal present at T100
- Pass: allied request blocked before repair
- Pass: boundaries never overridden

**G5: XP Parity**
- 20+ completed talk routes, 20+ completed fight routes, matched objectives
- Measure: talk/fight median XP ratio, quest progress ratio
- Pass: talk/fight median XP ≥0.80
- Pass: quest progress ratio ≥0.90
- Pass: zero duplicate-novelty XP

---

## Deployment Strategy

### Wave 1 Deployment

**Files Changed:**
- Client: 6 new, 4 modified
- Edge: 0 (SNAPSHOT sends crisis context via situationPacket)

**Deployment Steps:**
1. Build client (`npm run build`)
2. Update HUD stamp (`2026-08-31a`)
3. Update `index.html` meta tag
4. Deploy client (Vercel auto-deploy on push)
5. No edge redeploy needed

**Rollback Plan:**
- Crisis scheduler defaults OFF if no patterns loaded
- Existing social milestones continue to work

### Wave 2 Deployment

**Files Changed:**
- Client: 3 new, 8 modified
- Edge: 0 (relationship ledger persists in client save)

**Deployment Steps:**
1. Add save schema migration for `npcRelationships`
2. Test migration on 10+ old saves
3. Build client
4. Update HUD stamp (`2026-09-02a`)
5. Deploy client

**Rollback Plan:**
- Save migration repairs missing relationship ledgers
- Existing saves continue to work (relationships start empty)

### Wave 3 Deployment

**Files Changed:**
- Client: 3 new, 6 modified
- Edge: 0 (mode adapters are presentation-only)

**Deployment Steps:**
1. Build client with UI components
2. Update HUD stamp (`2026-09-05a`)
3. Deploy client

**Rollback Plan:**
- UI panels collapse if relationship data missing
- Existing modes continue to work

### Wave 4 Deployment

**Files Changed:**
- Client: 3 new, 5 modified
- Edge: 1 modified (`proseWarden.ts`)

**Deployment Steps:**
1. Sync `proseWarden.ts` to edge (`node scripts/sync-gm-edge-shared.mjs`)
2. Deploy edge (`npx supabase functions deploy gm-turn`)
3. Build client
4. Update HUD stamp (`2026-09-09a`)
5. Deploy client

**Rollback Plan:**
- ProseWarden soft-rejects first (warning only)
- Hard-reject only on critical invariants
- Can disable social conformance checks via feature flag

---

## Risk Mitigation

### High-Risk Mitigations

**Leverage propagation breaks NPC coherence**
- Mitigation: Use WS-2 knowledge sync channels
- Mitigation: Add confidence/delay to all propagated facts
- Mitigation: Test with 3+ NPCs in same scene

**Relationship save/load migration fails**
- Mitigation: Versioned schema (`schemaVersion: 1`)
- Mitigation: Test migration on 10+ old saves before ship
- Mitigation: Repair missing ledgers on load (don't error)

**XP parity calculation unstable**
- Mitigation: Use Path A receipt provenance (atomic commit)
- Mitigation: Apply top-up once at objective complete (not per turn)
- Mitigation: Log talk/fight XP separately in telemetry

**ProseWarden increases GM fail rate**
- Mitigation: Soft-reject first (warning only)
- Mitigation: Hard-reject only on critical invariants
- Mitigation: Log rejection reasons for tuning

**Crisis scheduling conflicts with ArcDirector**
- Mitigation: Social crises at P2 priority (below combat at P1)
- Mitigation: Suppress during unresolved high-salience crisis
- Mitigation: 30-turn cadence is target, not hard requirement

### Medium-Risk Mitigations

**15 crisis patterns too many for initial ship**
- Mitigation: Ship 5-8 patterns first (SC-01, SC-02, SC-03, SC-07, SC-05)
- Mitigation: Add remaining patterns in P1 polish

**Hybrid resolution confusing for players**
- Mitigation: Add tutorial toast on first social crisis
- Mitigation: Settings explanation for automatic/roll tiers
- Mitigation: Log automatic tiers in Debug export

**Relationship UI too complex**
- Mitigation: Start with disposition + trust only
- Mitigation: Add respect/fear/intimacy/familiarity in P1
- Mitigation: Collapse milestones by default (expand on tap)

**Mode adapters diverge**
- Mitigation: Use shared state contract (modes only change presentation)
- Mitigation: Vitest tests verify all modes resolve to same mutations
- Mitigation: Unified `SocialResolution` type

---

## Timeline and Effort

### Sequential Implementation (1 dev)

| Wave | Duration | Calendar | HUD Stamp |
|------|----------|----------|-----------|
| Wave 1 | 4-5 days | Aug 29 - Sep 2 | `2026-08-31a` or `2026-09-02a` |
| Wave 2 | 5-6 days | Sep 3 - Sep 9 | `2026-09-05a` or `2026-09-09a` |
| Wave 3 | 3-4 days | Sep 10 - Sep 13 | `2026-09-12a` |
| Wave 4 | 4-5 days | Sep 14 - Sep 18 | `2026-09-16a` |

**Total:** 16-20 days (~3-4 weeks)

### Parallel Implementation (2 devs)

| Wave | Duration | Calendar | Parallelization |
|------|----------|----------|-----------------|
| Wave 1 | 4-5 days | Aug 29 - Sep 2 | Dev A: crisis scheduler; Dev B: leverage registry |
| Wave 2 | 3-4 days | Sep 3 - Sep 6 | Dev A: relationship FSM; Dev B: leverage resolver |
| Wave 3 | 2-3 days | Sep 7 - Sep 9 | Dev A: mode adapters; Dev B: skill tree UI |
| Wave 4 | 3-4 days | Sep 10 - Sep 13 | Dev A: ProseWarden; Dev B: eval harness |

**Total:** 12-16 days (~2.5-3 weeks)

### P2 Polish (After Wave 4)

**Tasks:**
- Analytics dashboard (telemetry aggregation)
- Balance tuning (DC bands, trust deltas, XP ratios)
- Abuse hardening (prompt injection, save editing)
- Expand to 15 crisis patterns (8 remaining)

**Effort:** 3-4 days

**Grand Total:** 19-24 days (~4-5 weeks)

---

## Post-Ship Validation

### Week 1 (After Wave 1-2 Ship)

**Tasks:**
1. Run 4×100 autoplay with social crises enabled
2. Measure crisis spawn rate (target: 1 per 30 turns)
3. Measure leverage exhaustion rate (target: 60-80%)
4. Measure relationship milestone persistence (save/load round-trip)

**Success Criteria:**
- Crisis spawn rate within 25-35 turn range
- Leverage exhaustion rate 60-80%
- Zero save/load corruption
- Zero critical invariant violations

### Week 2 (After Wave 3-4 Ship)

**Tasks:**
1. Run G1-G5 automated gates (100×100 deterministic runs)
2. Gemini re-score 4×300 runs (DnD/RPG modes)
3. Measure talk/fight XP parity (median ratio)
4. Human playtest (5-10 players, DnD/RPG modes)

**Success Criteria:**
- G1-G5 all pass
- Gemini DnD/RPG scores uplift from 1-3/10 → 5-7/10
- Talk/fight median XP ratio ≥0.80
- Zero Walk Away padding (exact-repeat blocks work)
- Players report relationships feel meaningful

### Week 3 (Balance Tuning)

**Tasks:**
1. Analyze telemetry (crisis patterns, leverage types, relationship promotions)
2. Tune DC bands (too easy/hard?)
3. Tune trust deltas (too fast/slow promotion?)
4. Tune XP parity (80% vs 90% vs 100%?)
5. Add remaining 8 crisis patterns (if needed)

**Success Criteria:**
- Crisis pattern coverage balanced (no single pattern dominates)
- Leverage type coverage balanced (all 6 types used)
- Relationship promotion feels earned (not instant, not impossible)
- XP parity feels fair (talk builds viable)

---

## Recommended Next Actions

### Immediate (After John Authorization)

1. ✅ **Create branch:** `git checkout -b feature/ws-7-social-gameplay`
2. 📝 **Wave 1 implementation:** Crisis + Leverage (4-5 days)
3. 📝 **Vitest:** `playtest31aWave1Social.test.ts` (5+ tests)
4. 📝 **HUD stamp:** `2026-08-31a` (client-only)
5. 📝 **Ship Wave 1:** Client deploy

### Week 1 (Wave 1)

**Day 1-2:**
- WS7-001 to WS7-004 (crisis types, catalog, eligibility, scheduler)
- Test crisis eligibility in DnD/RPG/PYOA modes

**Day 3-4:**
- WS7-005 to WS7-008 (stakes commit, situation packet, fingerprinting, repeat blocking)
- Test leverage asset registry and exhaustion

**Day 5:**
- Vitest coverage + integration
- Ship Wave 1 (`2026-08-31a`)

### Week 2 (Wave 2)

**Day 6-7:**
- WS7-009 to WS7-013 (hybrid resolution, modifiers, outcome bands, mutations, conformance)
- Test relationship FSM promotion gates

**Day 8-10:**
- WS7-014 to WS7-017 (leverage asset, pressure profiles, resolver, cooldown)
- Test save/load round-trip with relationship ledgers

**Day 11:**
- Vitest coverage + integration
- Ship Wave 2 (`2026-09-05a`)

### Week 3 (Wave 3)

**Day 12-13:**
- WS7-018 to WS7-023 (propagation, repository, FSM, milestones, WS-2 bridge, stakes templates)
- Test mode adapters (DnD/RPG/PYOA/LitRPG)

**Day 14-15:**
- WS7-024 to WS7-025 (audit events, G1-G5 gates)
- Test XP novelty ledger + parity evaluation

**Day 16:**
- Vitest coverage + UI components
- Ship Wave 3 (`2026-09-12a`)

### Week 4 (Wave 4)

**Day 17-18:**
- WS7-026 to WS7-033 (mode adapters, relationship UI, XP ledger, parity, skill tree)
- Test ProseWarden conformance

**Day 19-20:**
- WS7-034 to WS7-036 (prose fixtures, telemetry, balance tuning)
- Run G1-G5 automated gates

**Day 21:**
- Ship Wave 4 (`2026-09-16a`)
- Deploy client + edge (ProseWarden sync)

### Week 5 (Validation)

**Day 22-23:**
- Run 4×300 autoplay with social crises
- Gemini re-score DnD/RPG modes
- Human playtest (5-10 players)

**Day 24-25:**
- Balance tuning (DC, trust, XP)
- Fix any critical issues
- Add remaining crisis patterns (if needed)

---

## Summary Table

| Aspect | Assessment |
|--------|-----------|
| **Total Effort** | 16-20 days (3-4 weeks) P0+P1; +3-4 days P2 |
| **Wave 1** | Crisis + Leverage (4-5 days) |
| **Wave 2** | Skills + Relationships (5-6 days) |
| **Wave 3** | Modes + Progression (3-4 days) |
| **Wave 4** | Governance + Eval (4-5 days) |
| **New Files** | 15-20 (8 game logic, 3 data, 3 UI, 3 eval) |
| **Modified Files** | 10-15 (arcDirector, situationPacket, stateTx, proseWarden, etc.) |
| **Complexity** | High (new persistent stores, complex FSMs) |
| **Risk** | Medium-High (leverage propagation, relationship persistence, XP parity, ProseWarden) |
| **Deployment** | Client-only Waves 1-3; client + edge Wave 4 |
| **Expected Uplift** | DnD/RPG scores 1-3/10 → 5-7/10; Walk Away loops end; social builds viable |

---

## Changelog

- **2026-08-28:** Initial WS-7 implementation plan created after ingest analysis

---

**Document Status:** Ready for John authorization  
**Next Step:** John approves WS-7 implementation; engineering starts Wave 1
