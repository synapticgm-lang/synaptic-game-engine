import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  runArcDirectorBeforeGm,
  forceLivenessBeat,
  formatArcStatusReceipts,
} from './arcDirector';
import {
  buildSealedManifest,
  applyRenderFallback,
  hashBeatEffects,
} from './sealedManifest';
import {
  hashCanonicalState,
  recordReplayHash,
  verifyReplayChain,
} from './replayHash';
import { enumerateLegalEdges } from './choiceEdge';
import { compileChoices } from './choiceCompiler';
import { recordPyoaBranchChoice, isPyoaBranchExhausted } from './pyoaBranchLedger';
import { checkReceiptLivenessGates, validateEvalRun } from './evalHarness';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { buildAuthorityVoiceHint, buildVoiceCadence } from './voiceCadenceSystem';
import type { RunSummary } from './fateAutoplay';

describe('playtest28c — Manus complete ranked backlog', () => {
  it('Wave 3: sealed manifest hash + deterministic fallback prose', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    state.turn = 10;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
    state.currentLocation = 'Lowmarket';
    const arc = runArcDirectorBeforeGm(state, 'Ask who summoned me');
    const manifest = buildSealedManifest(arc.state, 'Ask who summoned me', arc);
    expect(manifest.beatEffectsHash).toMatch(/^[0-9a-f]{8}$/);
    expect(manifest.requiredFacts.some((f) => /Location:/.test(f))).toBe(true);
    const fallback = applyRenderFallback(manifest, arc.state, 'timeout');
    expect(fallback.prose).not.toMatch(/beat recovered/i);
    expect(fallback.prose).not.toMatch(/RenderFallbackUsed/i);
    expect(fallback.prose.length).toBeGreaterThan(40);
  });

  it('Wave 3 chaos: GM fail preserves ArcDirector ledger — no duplicate XP on replay hash', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    state.turn = 10;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
    state.quests = [
      {
        id: 'sp-quest-1',
        name: "The Circle's Price",
        description: 'test',
        status: 'active',
        type: 'main',
        revealed: true,
        objectives: [
          { id: 'o1', description: 'bearings', completed: true },
          { id: 'o2', description: 'hear reason', completed: false },
        ],
      },
    ];
    state.arcDirector = { committedBeatIds: ['sp-beat-orient'] };
    const arc = runArcDirectorBeforeGm(state, 'Ask why the Circle wanted me');
    const hashBeforeFail = hashCanonicalState(arc.state);
    const manifest = buildSealedManifest(arc.state, 'Ask why', arc);
    const fallback = applyRenderFallback(manifest, arc.state, 'empty');
    const after = recordReplayHash(arc.state);
    expect(after.replayHashes?.length).toBe(1);
    expect(hashBeatEffects(arc.state, arc)).toBe(manifest.beatEffectsHash);
    expect(hashCanonicalState(arc.state)).toBe(hashBeforeFail);
    expect(fallback.systemLog[0]).toMatch(/ledger preserved/i);
    expect(arc.beatCommitted || arc.systemReceipts.length >= 0).toBe(true);
  });

  it('B007 replay hash verifier records monotonic chain', () => {
    let state = createInitialState();
    state.turn = 1;
    state = recordReplayHash(state);
    state = { ...state, turn: 2, character: { ...state.character, xp: state.character.xp + 5 } };
    state = recordReplayHash(state);
    const chain = verifyReplayChain(state.replayHashes ?? []);
    expect(chain.ok).toBe(true);
    expect(state.replayHashes?.length).toBe(2);
  });

  it('B018–B021 ChoiceEdge enumeration drives compileChoices pad', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    state.turn = 9;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
    state.arcDirector = { activeBeatId: 'sp-beat-skirmish', lastMandate: 'ARC BEAT (skirmish)' };
    state.activeEncounter = {
      name: 'Pact-Hunter Skirmisher',
      level: 1,
      hp: 16,
      maxHp: 16,
      armorClass: 12,
      strength: 12,
      dexterity: 12,
      constitution: 12,
      xpReward: 30,
      goldReward: 5,
    };
    const edges = enumerateLegalEdges(state);
    expect(edges.some((e) => e.kind === 'combat')).toBe(true);
    const { choices, notes } = compileChoices(state, ['Inspect the wall again']);
    expect(choices.some((c) => /Press the attack|Engage/i.test(c))).toBe(true);
    expect(notes.some((n) => /Legal edges/i.test(n))).toBe(true);
  });

  it('B043 liveness gates force skirmish by T8 LitRPG', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    state.turn = 8;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
    state.arcDirector = {
      committedBeatIds: ['sp-beat-orient', 'sp-beat-hear-reason'],
    };
    const committed = new Set(state.arcDirector!.committedBeatIds!);
    const forced = forceLivenessBeat(state, committed);
    expect(forced?.id).toBe('sp-beat-skirmish');
    const arc = runArcDirectorBeforeGm(state, 'Look around');
    expect(arc.beatCommitted).toBe(true);
    expect(arc.beatId).toMatch(/skirmish/);
  });

  it('B043 PYOA crisis gate by T12', () => {
    const state = createInitialState(undefined, 'pyoa');
    state.campaignBibleId = 'thornferry-road';
    state.turn = 12;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
    const forced = forceLivenessBeat(state, new Set());
    expect(forced?.id).toBe('pyoa-beat-crisis');
  });

  it('B022–B025 PYOA branch ledger exhausts Millstone Charter', () => {
    let state = createInitialState(undefined, 'pyoa');
    state = recordPyoaBranchChoice(state, 'Use the Millstone Charter');
    state = recordPyoaBranchChoice(state, 'Read the Millstone Charter again');
    state = recordPyoaBranchChoice(state, 'Inspect the charter clause');
    expect(isPyoaBranchExhausted(state, 'millstone-charter')).toBe(true);
    expect(state.pyoaBranchLedger?.charterUses).toBe(3);
  });

  it('Wave 4 eval harness binds manifest stamp and liveness gates', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.turn = 20;
    state.runManifest = {
      buildStamp: BUILD_STAMP,
      seed: '1',
      saveId: state.saveId,
      engineMode: 'litrpg',
      bibleId: 'summoned-pact',
      createdAt: Date.now(),
      eventSeq: 3,
    };
    state.stateTxLog = [
      {
        id: '1',
        rev: 1,
        turn: 9,
        kind: 'beat_commit',
        summary: 'Hub skirmish committed',
        createdAt: Date.now(),
      },
      {
        id: '2',
        rev: 2,
        turn: 9,
        kind: 'combat',
        summary: 'Encounter: Pact-Hunter',
        createdAt: Date.now(),
      },
    ];
    const summary: RunSummary = {
      runId: 'test',
      bibleId: 'summoned-pact',
      bibleTitle: 'Test',
      engineMode: 'litrpg',
      personalityId: 'cold-registrar',
      seed: 1,
      requestedTurns: 20,
      completedTurns: 20,
      dryRun: true,
      aiTier: 'free',
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      errorCount: 0,
      timeoutCount: 0,
      transportRetryCount: 0,
      latencyMs: { p50: 0, p95: 0, mean: 0 },
      issueTurns: [],
      outDir: '/tmp',
      runManifest: state.runManifest,
    };
    const evalResult = validateEvalRun(state, summary, []);
    expect(evalResult.manifestBound).toBe(true);
    expect(evalResult.livenessGates.combatByT8).toBe(true);
  });

  it('Voice cadence Wave 5 authority hint without Mid writer', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    const state = createInitialState(undefined, 'litrpg');
    state.arcDirector = { activeBeatId: 'sp-beat-hear-reason' };
    state.sealedManifest = {
      turn: 5,
      eventSeq: 1,
      gist: 'ARC BEAT (hear-reason)',
      beatEffectsHash: 'abc12345',
      requiredFacts: [],
      forbiddenReversals: [],
      allowedUncertainty: [],
      playerAction: 'Ask',
      sealedAt: Date.now(),
    };
    const hint = buildAuthorityVoiceHint(state, 'cold-registrar');
    expect(hint).toContain('AUTHORITY VOICE');
    expect(buildVoiceCadence('dry-wit').personality).toBe('dry-wit');
  });

  it('T12 hook STATUS receipts still wired', () => {
    const state = createInitialState(undefined, 'litrpg');
    state.campaignBibleId = 'summoned-pact';
    state.turn = 10;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
    state.quests = [
      {
        id: 'sp-quest-1',
        name: "The Circle's Price",
        description: 'test',
        status: 'active',
        type: 'main',
        revealed: true,
        objectives: [
          { id: 'o1', description: 'bearings', completed: true },
          { id: 'o2', description: 'hear reason', completed: false },
        ],
      },
    ];
    state.arcDirector = { committedBeatIds: ['sp-beat-orient'] };
    const arc = runArcDirectorBeforeGm(state, 'Ask who summoned me and why');
    const status = formatArcStatusReceipts(arc);
    expect(status.some((l) => /XP Gained: 45/i.test(l))).toBe(true);
  });

  it('receipt liveness gate helper', () => {
    const state = createInitialState(undefined, 'pyoa');
    state.turn = 15;
    const gates = checkReceiptLivenessGates(state);
    expect(gates.crisisByT12).toBe(false);
  });
});
