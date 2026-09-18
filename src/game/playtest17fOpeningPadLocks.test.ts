/**
 * 2026-09-17f — site-wide opening / pad locks from the 4×T10 AI-player tape.
 * A locked name never reprints the page-1 name-ask.
 * B second who/want is already-told; third+ same pad leaves stitch.
 * C no Attack/Flee/Parley on a name cover.
 * D Inspect the panel is LitRPG only.
 * Mid writer OFF. No SNAPSHOT/CRAFT.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { applyErrorRepairs } from './errorRepairWarden';
import { initEncounterTerminal } from './encounterTerminalFsm';
import { compileGraphChoiceLabels } from './graphChoices';
import { compileChoices, namedPropPadsFromBeat } from './choiceCompiler';
import { resolveOfferedChoices } from './playTranscript';
import { lastResortStoryBody } from './completedEventPacket';
import { stitchOpeningContinue, stitchOpeningScene } from './openingStitch';
import {
  coverContinuePads,
  dropLockedNameCovers,
  openingAlreadyToldLine,
  shouldStitchOpeningContinue,
  shouldStarveCombatPadsOnCover,
} from './openingEstablishment';
import type { GameState } from './types';

const PAGE1_NAME_ASK =
  'A bitter wind over wild-country ash snaps you awake. You are lying on cracked blocks in the stump of a watchtower. A blue panel hangs in the freeze. The panel waits on a name. What do you enter?';

function litrpgNamed(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 3,
    currentLocation: 'a ruined watchtower',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'a ruined watchtower', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: true,
      pickedHookFallback: PAGE1_NAME_ASK,
    },
    sceneFacts: emptySceneFacts(3),
    log: [
      { id: 'g0', turn: 0, role: 'gm', content: PAGE1_NAME_ASK, timestamp: 0 },
    ],
    ...over,
  };
}

function saltHire(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('Salt Road Heist', 'rpg');
  const want =
    'Vessa answers you. "I need a cutter who can walk the Salt Road and a name I can use."';
  return {
    ...base,
    campaignBibleId: 'salt-road-heist',
    engineMode: 'rpg',
    turn: 4,
    currentLocation: 'a Salt Road tavern hire',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'a Salt Road tavern hire', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook:
        'Location: a Salt Road tavern hire\nWho is here / who summoned: Vessa\nWhy this happened: Vessa wants a cutter and a name she can use.',
    },
    sceneFacts: emptySceneFacts(4),
    log: [
      { id: 'p1', turn: 2, role: 'player', content: 'Ask what they want', timestamp: 2 },
      { id: 'g1', turn: 2, role: 'gm', content: want, timestamp: 3 },
    ],
    ...over,
  };
}

function nameCover(mode: GameState['engineMode'], bibleId: string, over: Partial<GameState> = {}): GameState {
  const base = createInitialState('Cover lock', mode);
  return {
    ...base,
    campaignBibleId: bibleId,
    engineMode: mode,
    turn: 1,
    currentLocation: 'the opening room',
    character: { ...base.character, name: 'Unknown Survivor' },
    openingEstablishment: {
      pending: [{ id: 'name', kind: 'name', question: 'What name do they get from you?' }],
      answers: { where: 'the opening room' },
      complete: false,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
    },
    sceneFacts: {
      ...emptySceneFacts(1),
      lastBeat: 'A blue panel hangs. Someone waits.',
      props: ['blue panel'],
    },
    choices: ['Attack', 'Flee', 'Parley', 'Give your name'],
    ...over,
  };
}

describe('playtest17f — site-wide opening / pad locks', () => {
  it('HUD/BUILD are 17f, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-18a');
    expect(BUILD_STAMP).toBe('2026-09-18a');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('locked name never reprints the page-1 name-ask', () => {
    const state = litrpgNamed();
    const page = stitchOpeningScene(state);
    const cont = stitchOpeningContinue(state, 'Look around');
    const resort = lastResortStoryBody(state);
    expect(page).not.toMatch(/What do you enter|The panel waits on a name|What name/i);
    expect(cont).not.toMatch(/What do you enter|The panel waits on a name|They still want a name/i);
    expect(resort.prose).not.toMatch(/What do you enter|The panel waits on a name/i);
    const leftover = {
      ...state,
      openingEstablishment: {
        ...state.openingEstablishment!,
        complete: false,
        pending: [{ id: 'name', kind: 'name' as const, question: 'What name do they get from you?' }],
      },
    };
    const repaired = applyErrorRepairs(leftover);
    expect(repaired.state.openingEstablishment?.pending.some((p) => p.kind === 'name')).toBe(false);
    expect(repaired.state.openingEstablishment?.complete).toBe(true);
    const dropped = dropLockedNameCovers(leftover.openingEstablishment!, 'Jax');
    expect(dropped.complete).toBe(true);
    expect(dropped.pending).toEqual([]);
  });

  it('second want is already-told, not the same first stub; third leaves stitch', () => {
    const fresh = saltHire({ log: [] });
    const firstWant = stitchOpeningContinue(fresh, 'Ask what they want');
    const afterFirst = saltHire({
      log: [
        { id: 'p1', turn: 2, role: 'player', content: 'Ask what they want', timestamp: 2 },
        { id: 'g1', turn: 2, role: 'gm', content: firstWant, timestamp: 3 },
      ],
    });
    const second = stitchOpeningContinue(afterFirst, 'Ask what they want');
    expect(firstWant.length).toBeGreaterThan(12);
    expect(second).toMatch(/already said it|already answered you/i);
    expect(second).not.toBe(firstWant);
    expect(second).toBe(openingAlreadyToldLine(afterFirst, 'want'));
    expect(shouldStitchOpeningContinue(afterFirst, 'Ask what they want')).toBe(true);

    const third = saltHire({
      log: [
        { id: 'p1', turn: 2, role: 'player', content: 'Ask what they want', timestamp: 2 },
        { id: 'g1', turn: 2, role: 'gm', content: firstWant, timestamp: 3 },
        { id: 'p2', turn: 3, role: 'player', content: 'Ask what they want', timestamp: 4 },
        { id: 'g2', turn: 3, role: 'gm', content: second, timestamp: 5 },
      ],
    });
    expect(shouldStitchOpeningContinue(third, 'Ask what they want')).toBe(false);
  });

  it('combat pads are absent during a name cover', () => {
    const cover = nameCover('litrpg', 'summoned-pact');
    expect(shouldStarveCombatPadsOnCover(cover)).toBe(true);
    expect(coverContinuePads(cover).join(' ')).not.toMatch(/Attack|Flee|Parley/i);
    expect(resolveOfferedChoices(cover).join(' ')).not.toMatch(/Attack|Flee|Parley|Press the attack/i);
    const enc = initEncounterTerminal(
      {
        name: 'Pact-Hunter Skirmisher',
        level: 1,
        hp: 17,
        maxHp: 20,
        armorClass: 12,
        strength: 12,
        dexterity: 12,
        constitution: 12,
        xpReward: 25,
        goldReward: 5,
      },
      cover
    );
    const fighting = { ...cover, activeEncounter: enc };
    expect(compileGraphChoiceLabels(fighting).join(' ')).not.toMatch(/Attack|Flee|Parley|Press the attack/i);
    const compiled = compileChoices(fighting, ['Attack', 'Flee', 'Parley', 'Give your name']);
    expect(compiled.choices.join(' ')).not.toMatch(/Attack|Flee|Parley|Press the attack/i);
  });

  it('panel chip is absent on dnd and rpg fixtures', () => {
    const dnd = nameCover('dnd', 'cursed-keep', {
      character: { ...createInitialState('Cursed Keep', 'dnd').character, name: 'Jax' },
      openingEstablishment: {
        pending: [],
        answers: { where: 'Greyhollow tavern common room', name: 'Jax' },
        complete: true,
        sceneWritten: true,
        mode: 'weave',
        aloneArrival: false,
      },
      currentLocation: 'Greyhollow tavern common room',
      log: [
        { id: 'p1', turn: 1, role: 'player', content: 'Ask what they want', timestamp: 1 },
      ],
    });
    const rpg = nameCover('rpg', 'salt-road-heist', {
      character: { ...createInitialState('Salt Road Heist', 'rpg').character, name: 'Jax' },
      openingEstablishment: {
        pending: [],
        answers: { where: 'a Salt Road tavern hire', name: 'Jax' },
        complete: true,
        sceneWritten: true,
        mode: 'weave',
        aloneArrival: false,
      },
      currentLocation: 'a Salt Road tavern hire',
      log: [
        { id: 'p1', turn: 1, role: 'player', content: 'Ask what they want', timestamp: 1 },
      ],
    });
    expect(coverContinuePads(dnd).join(' ')).not.toMatch(/Inspect the panel/i);
    expect(coverContinuePads(rpg).join(' ')).not.toMatch(/Inspect the panel/i);
    expect(namedPropPadsFromBeat(dnd)).not.toContain('Inspect the panel');
    expect(namedPropPadsFromBeat(rpg)).not.toContain('Inspect the panel');
    expect(shouldStitchOpeningContinue(dnd, 'Inspect the panel')).toBe(false);
    expect(shouldStitchOpeningContinue(rpg, 'Inspect the panel')).toBe(false);
    const litrpg = nameCover('litrpg', 'summoned-pact', {
      character: { ...createInitialState('The Summoned Pact', 'litrpg').character, name: 'Jax' },
      openingEstablishment: {
        pending: [],
        answers: { where: 'a ruined watchtower', name: 'Jax' },
        complete: true,
        sceneWritten: true,
        mode: 'weave',
        aloneArrival: true,
      },
      log: [
        { id: 'p1', turn: 1, role: 'player', content: 'Ask what they want', timestamp: 1 },
      ],
    });
    expect(coverContinuePads(litrpg)).toContain('Inspect the panel');
  });
});
