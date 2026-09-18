/**
 * 2026-09-18c — Cover pads never collapse to Inspect-the-panel alone.
 * Who does not starve from a shared CAST "answers you" prefix on the want beat.
 * Compound CAST uses plural speak-verb. Mid writer OFF. No SNAPSHOT/CRAFT.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { compileChoices } from './choiceCompiler';
import { lastResortStoryBody, buildCompletedEventPacket } from './completedEventPacket';
import {
  castSpeakVerb,
  coverContinuePads,
  hallTopicAlreadyAnswered,
  openingNameLockSpokenBeat,
  shouldStarveHallTopicPad,
} from './openingEstablishment';
import type { GameState } from './types';

const PAGE1 =
  'Light, then a wall of festival noise. You hit sunlit cobbles in a no-need Valespire square.';

function namedWatchtower(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    engineMode: 'litrpg',
    turn: 2,
    currentLocation: 'Valespire',
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'Valespire', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook:
        'Location: Valespire\nWho is here / who summoned: the handler\nWhy this happened: they need a Pactborn against the Ash Court.',
      pickedHookFallback: PAGE1,
    },
    sceneFacts: emptySceneFacts(2),
    log: [
      { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
    ],
    ...over,
  };
}

describe('playtest18c — pads refill and CAST glue', () => {
  it('HUD/BUILD are 18c, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-18c');
    expect(BUILD_STAMP).toBe('2026-09-18c');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('compound CAST speak-verb is plural', () => {
    expect(castSpeakVerb('Pellane scouts on one bank and Ash pickets on the other')).toBe('answer');
    expect(castSpeakVerb('the envoys at this table')).toBe('answer');
    expect(castSpeakVerb('the handler')).toBe('answers');
    const who = 'Pellane scouts on one bank and Ash pickets on the other';
    expect(`${who.charAt(0).toUpperCase() + who.slice(1)} ${castSpeakVerb(who)} you.`).toMatch(
      / answer you\.$/
    );
  });

  it('name-lock want beat does not starve Who are you', () => {
    const lock = openingNameLockSpokenBeat(namedWatchtower());
    const state = namedWatchtower({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm', content: lock, timestamp: 2 },
      ],
    });
    expect(hallTopicAlreadyAnswered(state, 'want')).toBe(true);
    expect(hallTopicAlreadyAnswered(state, 'who')).toBe(false);
    expect(shouldStarveHallTopicPad(state, 'Who are you')).toBe(false);
    const pads = coverContinuePads(state);
    expect(pads.join(' ')).not.toMatch(/Ask what they want/i);
    expect(pads).toContain('Who are you');
    expect(pads.filter((c) => /inspect the panel/i.test(c)).length).toBeLessThan(2);
    expect(pads.length).toBeGreaterThan(1);
  });

  it('Inspect the panel dies after one look and Look/Wait refill', () => {
    const lock = openingNameLockSpokenBeat(namedWatchtower());
    const afterInspect = namedWatchtower({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm', content: lock, timestamp: 2 },
        { id: 'p2', turn: 2, role: 'player', content: 'Who are you', timestamp: 3 },
        { id: 'g2', turn: 2, role: 'gm', content: 'The handler answers you. "Handler. You came through. Stay where we can see you."', timestamp: 4 },
        { id: 'p3', turn: 3, role: 'player', content: 'Inspect the panel', timestamp: 5 },
        { id: 'g3', turn: 3, role: 'gm', content: 'The blue panel was yours — a System window, not a person.', timestamp: 6 },
      ],
    });
    expect(shouldStarveHallTopicPad(afterInspect, 'Inspect the panel')).toBe(true);
    const pads = coverContinuePads(afterInspect);
    expect(pads.join(' ')).not.toMatch(/Inspect the panel/i);
    expect(pads.join(' ')).toMatch(/Look around/);
    expect(pads.join(' ')).toMatch(/Wait/);
    expect(compileChoices(afterInspect, ['Inspect the panel', 'Look around', 'Wait']).choices)
      .not.toContain('Inspect the panel');
  });

  it('last-resort for Where/Joss is not the already-answered want telegram', () => {
    const lock = openingNameLockSpokenBeat(namedWatchtower());
    const state = namedWatchtower({
      log: [
        { id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 },
        { id: 'p1', turn: 1, role: 'player', content: 'Jax', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm', content: lock, timestamp: 2 },
      ],
    });
    const line = 'Okay, fine. Let\'s just go. Where is this Joss guy?';
    const resort = lastResortStoryBody(state, buildCompletedEventPacket(state, line), line);
    expect(resort.prose).toMatch(/Joss|way out|loft/i);
    expect(resort.prose).not.toMatch(/the ask was already answered|did not say it twice/i);
  });
});
