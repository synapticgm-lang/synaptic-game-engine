/**
 * Josie remaining architecture holes — demand ≠ name, camera, pad, faction/XP, lists.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyOpeningAnswer } from './openingEstablishment';
import { stripChoiceList } from './parser';
import { compileChoices } from './choiceCompiler';
import { runArcDirectorBeforeGm } from './arcDirector';
import { formatSituationForPrompt } from './situationPacket';
import { applyCommittedNarrative } from './sceneFacts';
import { enforceCameraOnState, harvestCameraIntoSceneFacts } from './travelAuthority';
import { factionNoteForHook, talkContradictsLockedWhy } from './hookLock';
import { isChromePersonToken } from './chromeAuthority';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import type { GameState, OpeningEstablishment } from './types';
import type { OpeningPrompt } from '@/data/campaigns/types';

const NAME_COVER: OpeningPrompt[] = [
  { id: 'name', kind: 'name', question: 'A name. What do we call you?' },
];

function summonedNameCover(): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    currentLocation: 'The Sevenfold Circle under bombardment',
    character: { ...base.character, name: 'Unknown Survivor' },
    openingEstablishment: {
      pending: NAME_COVER,
      answers: {},
      complete: false,
      registrar: { voice: 'inworld', label: 'THE CIRCLE', startLine: 'Light, then stone.' },
      sceneWritten: true,
      mode: 'weave',
    } as OpeningEstablishment,
    sceneFacts: {
      crowd: 'present',
      noise: 'voices',
      present: [],
      props: ['blue panel', 'cracked street'],
      lastBeat: 'circular mosaic under bombardment',
      updatedTurn: 0,
      indoor: false,
      cameraLock: {
        scale: 'outdoor',
        label: 'The Sevenfold Circle under bombardment',
        lockedTurn: 0,
      },
      hookLock: {
        nature: 'accident',
        summary: 'pulled here by accident, not as a chosen piece',
        lockedTurn: 1,
        source: 'harvest',
      },
    },
  };
}

describe('playtest31c — Josie authority owners', () => {
  it('stamp is 2026-08-31c / 30v and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30v').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31c').toBe(true);
  });

  it.each([
    'well send me back to my world!',
    '"send me back to my world!" I demand',
    'I refuse',
    'get me out of here',
  ])('send-me-back / protest defers to play: %s', async (line) => {
    const result = await applyOpeningAnswer(summonedNameCover(), line);
    expect({
      line,
      defer: result.deferToPlay,
      gen: result.generateOpening,
      complete: result.state.openingEstablishment?.complete,
      pending: result.state.openingEstablishment?.pending.map((p) => p.kind),
      name: result.state.character.name,
    }).toEqual({
      line,
      defer: true,
      gen: false,
      complete: false,
      pending: ['name'],
      name: 'Unknown Survivor',
    });
    const gm = [...result.state.log].reverse().find((e) => e.role === 'gm')?.content ?? '';
    expect(gm).not.toMatch(/They are still waiting for a name you will own/i);
  });

  it('actual name give still locks the cover', async () => {
    const result = await applyOpeningAnswer(summonedNameCover(), 'Josie');
    expect(result.deferToPlay).toBeFalsy();
    expect(result.state.character.name).toBe('Josie');
  });

  it('does not snap outdoor camera to indoor Entry without travel', () => {
    const state = summonedNameCover();
    state.locationSheet = {
      name: state.currentLocation,
      mapScale: 'interior',
      exits: [],
      interactables: [],
      presentNpcIds: [],
    };
    state.activeDungeon = {
      blueprintId: 'interior-plan',
      dungeonName: 'Circle',
      tier: 3,
      currentZLevel: 0,
      currentNodeId: 'entry',
      nodes: [{ id: 'entry', name: 'Entry', links: [] }],
      visitedNodeIds: ['entry'],
      clearedNodeIds: [],
    } as GameState['activeDungeon'];
    state.sceneFacts = { ...state.sceneFacts!, indoor: true };

    const snapped = enforceCameraOnState(state, 'Josie');
    expect(snapped.sceneFacts?.indoor).toBe(false);
    expect(snapped.locationSheet?.mapScale).toBe('street');
    expect(snapped.activeDungeon).toBeNull();
    expect(snapped.currentLocation).toMatch(/Sevenfold Circle/i);

    const afterWalk = enforceCameraOnState(state, 'I walk through the door');
    expect(afterWalk.activeDungeon).toBeTruthy();
  });

  it('harvests outdoor camera from mosaic / bombardment prose', () => {
    const facts = harvestCameraIntoSceneFacts(
      undefined,
      'You stand on the circular mosaic under bombardment. The cracked street shakes.',
      0,
      '(opening)',
      'The Sevenfold Circle under bombardment'
    );
    expect(facts.cameraLock?.scale).toBe('outdoor');
    expect(facts.indoor).toBe(false);
  });

  it('choice pad after a demand drops leftover name / opening chips', () => {
    const state = summonedNameCover();
    state.sceneFacts = {
      ...state.sceneFacts!,
      lastPlayerIntent: {
        family: 'demand',
        text: 'send me back to my world!',
        turn: 2,
      },
    };
    const { choices } = compileChoices(
      state,
      ['Give them your name', 'Ask what is going on', 'Approach the doorway to Foyer', 'Wait'],
      undefined,
      'send me back to my world!'
    );
    const blob = choices.join(' | ').toLowerCase();
    expect(blob).not.toMatch(/give them your name|waiting for a name/);
    expect(blob).toMatch(/send you back|do not belong|wait/);
  });

  it('does not pay hear-reason XP when talk contradicts accident lock', () => {
    const state = summonedNameCover();
    state.turn = 7;
    state.openingEstablishment = { ...state.openingEstablishment!, complete: true, pending: [] };
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
          { id: 'o3', description: 'choose', completed: false },
        ],
      },
    ];
    state.arcDirector = { committedBeatIds: ['sp-beat-orient'] };

    expect(talkContradictsLockedWhy('Ask why I was bought here', state.sceneFacts?.hookLock)).toBe(true);

    const arc = runArcDirectorBeforeGm(state, 'Ask why I was bought here');
    expect(arc.beatCommitted).toBe(false);
    expect(arc.xpAwards.some((a) => /hear-reason|arc|social/i.test(a.reason) && a.amount >= 15)).toBe(
      false
    );
  });

  it('faction matrix follows accident hookLock — no paid-for Pactborn', () => {
    const state = summonedNameCover();
    state.worldLedger = {
      ...state.worldLedger,
      factionStandings: [
        {
          id: 'pellane-crown',
          name: 'Pellane Crown',
          standing: 'neutral',
          influence: 0,
          notes: 'They paid for a Pactborn. You have not sworn yet.',
        },
      ],
    };
    const snap = formatSituationForPrompt(state);
    expect(snap).not.toMatch(/paid for a Pactborn/i);
    expect(snap).toMatch(/rite misfired/i);
    expect(factionNoteForHook('They paid for a Pactborn. You have not sworn yet.', 'accident')).toMatch(
      /misfired/i
    );
  });

  it('stripChoiceList removes singleton numbered offers from opening prose', () => {
    const opening =
      'You stand on the circular mosaic. The panel hums. 1. Scan the mosaic for a way out';
    const stripped = stripChoiceList(opening);
    expect(stripped).toMatch(/circular mosaic/i);
    expect(stripped).not.toMatch(/1\.\s*Scan/i);

    const sit = stripChoiceList('The stone is cold under you. 1. Try to sit up');
    expect(sit).not.toMatch(/1\.\s*Try to sit/i);
  });

  it('registration / System wallpaper is chrome, not a person', () => {
    expect(isChromePersonToken('registration')).toBe(true);
    expect(isChromePersonToken('Registration')).toBe(true);
    expect(isChromePersonToken('registration incomplete')).toBe(true);
    expect(isChromePersonToken('system wallpaper')).toBe(true);
    const facts = applyCommittedNarrative(
      summonedNameCover(),
      'Registration incomplete hangs in the air. A registrar waits in the doorway.',
      1,
      'look around'
    );
    expect(facts.present.some((p) => /registration/i.test(p))).toBe(false);
  });
});
