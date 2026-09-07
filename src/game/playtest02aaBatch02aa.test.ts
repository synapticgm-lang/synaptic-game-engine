/**
 * Batch 02aa — five structural locks after 02z Gemini 2/10.
 * Never-CAST, fact-close, talk-loop starve, stub fingerprint, pronoun scope.
 * Mid writer OFF. No live GM call. No T50.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { canHarvestAsNamedPerson } from './entityRegistry';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { sealedCastNames } from './beatContract';
import { classifyBeatCommit, isFactClosedViolation, codedSceneMove } from './beatCommitGate';
import { isSlotGlueViolation } from './slotGlue';
import { isNeverCastTitle, ledgerNeverCastTitles } from './neverCast';
import { applyClosedFactHarvest } from './closedFactLedger';
import {
  compileChoices,
} from './choiceCompiler';
import { shouldStarveTalkPads, excludedPadFamilies, isNamedTalkPad } from './padUniverse';
import { isTalkQaLoopStarved, hasTalkQaShape, isAmbientStubRecycle } from './semanticLoopDetector';
import { enforcePerspective, rewriteNpcSubjectPcBody } from './perspectiveWarden';
import { initPyoaBranchLedger } from './pyoaBranchLedger';
import type { GameState } from './types';

function litrpgState(partial: Partial<GameState> = {}): GameState {
  const state = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...state,
    bibleId: 'summoned-pact',
    campaignBibleId: 'summoned-pact',
    openingEstablishment: {
      pending: [],
      answers: { where: 'Sevenfold Circle' },
      complete: true,
      aloneArrival: false,
    },
    currentLocation: 'West Wall',
    turn: 18,
    sceneFacts: emptySceneFacts(18),
    places: [
      { id: 'saltmeet', name: 'Saltmeet' },
      { id: 'old-garrison', name: 'Old Garrison' },
      { id: 'scattered', name: 'Scattered Scale' },
    ],
    lorebook: [
      {
        id: 'calamity-mark',
        name: 'Calamity Mark',
        type: 'lore',
        keywords: ['mark'],
        summary: 'A branded symbol.',
        lastSeenTurn: 1,
        revealed: true,
      },
    ],
    ...partial,
  };
}

function roadState(partial: Partial<GameState> = {}): GameState {
  const state = createInitialState(undefined, 'pyoa') as GameState;
  return {
    ...state,
    engineMode: 'pyoa',
    campaignBibleId: 'thornferry-road',
    currentLocation: 'mill landing at Thornferry',
    turn: 20,
    companions: [
      {
        id: 'wren',
        name: 'Wren Holt',
        type: 'party',
        role: 'guide',
        hp: 8,
        maxHp: 8,
        maintenanceCost: '',
        assignment: '',
        notes: '',
      },
    ],
    sceneFacts: { ...emptySceneFacts(20), present: ['Wren Holt'] },
    pyoaBranchLedger: initPyoaBranchLedger(),
    inventory: [{ id: 'cu', name: 'copper', rarity: 'Common', quantity: 1 }],
    ...partial,
  };
}

describe('Batch 02aa stamps', () => {
  it('HUD and BUILD are 2026-09-02aa and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP.startsWith('2026-09-02')).toBe(true);
    expect(BUILD_STAMP.startsWith('2026-09-02')).toBe(true);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02aa — never-CAST lock', () => {
  it('place/concept titles fail harvest; Wren Holt stays', () => {
    const state = litrpgState();
    expect(canHarvestAsNamedPerson('West Wall', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Scattered Scale', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('The Weighing', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Old Garrison', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('The Mark', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('At Saltmeet', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('Wren Holt', 'thornferry-road')).toBe(true);
    expect(canHarvestAsNamedPerson('Father Karel', 'summoned-pact')).toBe(true);

    expect(isNeverCastTitle('West Wall', state)).toBe(true);
    expect(isNeverCastTitle('The Weighing', state)).toBe(true);
    expect(isNeverCastTitle('At Saltmeet', state)).toBe(true);
    expect(isNeverCastTitle('The Mark', state)).toBe(true);
    expect(isNeverCastTitle('Wren Holt', state)).toBe(false);

    const harvested = harvestNarrativeIntoLedger(
      state,
      'West Wall watches you. The Weighing nods. At Saltmeet waits. The Mark asks. Wren Holt keeps pace.',
      18
    );
    const present = harvested.sceneFacts?.present ?? [];
    expect(present.some((p) => /west wall|weighing|saltmeet|the mark/i.test(p))).toBe(false);
    expect(sealedCastNames(harvested).some((n) => /west wall|weighing|saltmeet/i.test(n))).toBe(false);
  });

  it('rejects place/concept titles used as person subjects', () => {
    const titles = ledgerNeverCastTitles(litrpgState());
    expect(titles.some((t) => /west wall/i.test(t))).toBe(true);
    const scale = 'Copper and wet stone smell thick in West Wall. Scattered Scale shifts, expecting you to act.';
    const mark = "The Mark's eyes don't leave the seam in the ceiling.";
    const salt = 'Rain drums the awning while At Saltmeet watches you from the stall.';
    const weigh = "The Weighing's fingers drum the damp counter.";
    expect(isSlotGlueViolation(scale, [], titles)).toBe(true);
    expect(isSlotGlueViolation(mark, [], titles)).toBe(true);
    expect(isSlotGlueViolation(salt, [], titles)).toBe(true);
    expect(isSlotGlueViolation(weigh, [], titles)).toBe(true);
    expect(isFactClosedViolation(litrpgState(), scale)).toBe(true);
    expect(isFactClosedViolation(litrpgState(), 'Wren Holt watches you from the stall.')).toBe(false);
  });
});

describe('Batch 02aa — fact-close post-commit', () => {
  it('copper given cannot sit warm in your palm later', () => {
    const give =
      'You set the copper down on the millstone\'s flat face. Wren Holt pick it up like it\'s a live coal and tuck it into a waxed pouch on their belt.';
    const back = 'The copper sits warm in your palm, heavier than it looked — a single stamped piece.';
    let state = applyClosedFactHarvest(roadState(), give);
    expect(state.sceneFacts?.givenAway?.some((n) => /copper/i.test(n))).toBe(true);
    expect(isFactClosedViolation(state, back)).toBe(true);
    expect(classifyBeatCommit(state, back, 'Look at your hand').accept).toBe(false);
    expect(isFactClosedViolation(roadState(), back)).toBe(false);
  });

  it('flood saved cannot rewind as a live climbing crisis', () => {
    const saved =
      'The flood gate flies open and the water begins to drain, swirling around your legs, dropping inch by inch.';
    const rewind =
      'The flood room is worse than the door promised. The millrace is coming through white and fast — the water\'s already breast-high and still climbing.';
    let state = applyClosedFactHarvest(roadState(), saved);
    expect(state.sceneFacts?.resolvedCrises).toContain('flood');
    expect(isFactClosedViolation(state, rewind)).toBe(true);
    expect(classifyBeatCommit(state, rewind, 'Open the next door').accept).toBe(false);
    expect(isFactClosedViolation(roadState(), rewind)).toBe(false);
  });
});

describe('Batch 02aa — talk-loop starve', () => {
  it('starves all talk pads when last 3 GM beats share the want Q&A shape', () => {
    const beats = [
      "The Mark's jaw works. 'You came to ask what I want, so you want something from me too.'",
      "'What I want is the breach shut,' they say.",
      "'What do I want? Here it is: that thing's been scratching at the gate.'",
    ];
    expect(beats.every((b) => hasTalkQaShape(b))).toBe(true);
    const state = litrpgState({
      sceneFacts: { ...emptySceneFacts(51), present: ['Wren Holt'] },
      companions: roadState().companions,
      log: beats.map((content, i) => ({
        id: `g${i}`,
        role: 'gm' as const,
        content,
        timestamp: i + 1,
        turn: 48 + i,
      })),
    });
    expect(isTalkQaLoopStarved(state)).toBe(true);
    expect(shouldStarveTalkPads(state)).toBe(true);
    expect(excludedPadFamilies(state).has('talk')).toBe(true);
    const compiled = compileChoices(state, [
      'Talk to Wren Holt',
      'Ask Wren Holt what they want',
      'Inspect the immediate surroundings',
    ]);
    expect(compiled.choices.some((c) => isNamedTalkPad(c))).toBe(false);
    expect(
      compiled.choices.some((c) => /\b(inspect|scout|stake|travel|press for leverage)\b/i.test(c))
    ).toBe(true);

    const first = litrpgState({
      sceneFacts: { ...emptySceneFacts(24), present: ['Wren Holt'] },
      companions: roadState().companions,
      log: [{ id: 'g1', role: 'gm', content: beats[0], timestamp: 1, turn: 24 }],
    });
    expect(isTalkQaLoopStarved(first)).toBe(false);
    expect(shouldStarveTalkPads(first)).toBe(false);
  });
});

describe('Batch 02aa — stub fingerprint', () => {
  it('rejects the third copper-and-wet-stone + shifts stub in last 10', () => {
    const stub =
      'Copper and wet stone smell thick in West Wall. Someone nearby shifts, expecting you to act.';
    const variant =
      'Copper and wet stone smell thick in West Wall. Scattered Scale shifts, expecting you to act.';
    const state = litrpgState({
      log: [
        { id: 'g1', role: 'gm', content: stub, timestamp: 1, turn: 3 },
        { id: 'g2', role: 'gm', content: variant, timestamp: 2, turn: 6 },
      ],
    });
    expect(isAmbientStubRecycle(state, stub)).toBe(true);
    expect(classifyBeatCommit(state, stub, 'Look around').accept).toBe(false);
    const first = litrpgState({ log: [] });
    expect(isAmbientStubRecycle(first, stub)).toBe(false);
    expect(codedSceneMove(state)).not.toMatch(/shifts, expecting you to act/i);
  });
});

describe('Batch 02aa — pronoun scope', () => {
  it('rewrites NPC-subject your-body to her/his and keeps PC actions', () => {
    expect(rewriteNpcSubjectPcBody('She crosses your arms.')).toMatch(/she crosses her arms/i);
    const out = enforcePerspective('She crosses your arms.', { perspective: 'second-person' }, 'Jax');
    expect(out).toMatch(/her arms/i);
    expect(out).not.toMatch(/your arms/i);
    const ticks = rewriteNpcSubjectPcBody('She ticks the ways forward on you fingers.');
    expect(ticks).toMatch(/her fingers/i);
    const pc = enforcePerspective(
      'You crouch low and the scale between your fingers confirms it.',
      { perspective: 'second-person' },
      'Jax'
    );
    expect(pc).toMatch(/your fingers/i);
  });
});
