/**
 * XP-D1 OPEN7B — Story RPG twin-lanterns s7402 LOOP STOP after Brinewatch Knife.
 * Offline: rebuild the post-fight dead crowd scene; assert chips + picker leave the loop in ≤3 turns.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { compileChoices } from './choiceCompiler';
import { rankChoices, turnProgress } from './choiceRanking';
import { preferHurtRecoveryPick } from './fateAutoplay';
import { commitTravel } from './travelJourney';
import { isCrowdOnlyTalkPad, speakablePresentPeople } from './chromeAuthority';
import { peopleHere } from './scenePresence';
import type { GameState } from './types';

/** Post-Knife stable: hurt, only crowd-filler present, lastKill remains (T45-shaped). */
function deadCrowdStable(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'twin-lanterns',
    seed: '7402',
    turn: 45,
    currentLocation: 'Twin Lanterns stable',
    places: [
      { id: 'lowgate', name: 'Lowgate', regionId: 'tl' },
      { id: 'yard', name: 'Twin Lanterns yard', regionId: 'tl' },
      { id: 'stable', name: 'Twin Lanterns stable', regionId: 'tl', lastVisitedTurn: 45 },
    ],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    character: {
      ...s.character,
      name: 'Jax',
      level: 3,
      hp: 14,
      maxHp: 38,
      xp: 32,
      xpToNext: 233,
    },
    sceneFacts: {
      ...emptySceneFacts(45),
      present: ['the people here'],
      lastKill: {
        name: 'Brinewatch Knife',
        outcome: 'victory',
        turn: 39,
        remains: true,
      },
    },
    circling: {
      lastProgressTurn: 44,
      recentFamilies: ['talk', 'talk', 'talk'],
      recentPlaces: ['twin lanterns stable'],
      stale: { 'twin lanterns stable': { inspect: 34 } },
      tried: {},
    },
    ...over,
  } as GameState;
}

describe('OPEN7B — dead crowd scene after Knife fight (s7402)', () => {
  it('chip offer: no crowd-only Talk/Ask; Leave or Travel is present and first', () => {
    const state = deadCrowdStable();
    expect(speakablePresentPeople(peopleHere(state)).length).toBe(0);
    expect(speakablePresentPeople(state.sceneFacts?.present).length).toBe(0);

    const compiled = compileChoices(
      state,
      [
        'Talk to the people here',
        'Ask the people here about the delivery in their care',
        'Face the threat',
        'Search Twin Lanterns stable for signs',
        'Say something…',
        'Do something else…',
      ],
      undefined,
      'Talk to the people here'
    );
    expect(compiled.choices.some((c) => isCrowdOnlyTalkPad(c))).toBe(false);
    expect(compiled.notes.some((n) => /OPEN7B/i.test(n))).toBe(true);
    const move = compiled.choices.find(
      (c) => /^leave(?:\s+the\s+scene)?\b/i.test(c) || /^travel\b/i.test(c) || /^walk\b/i.test(c)
    );
    expect(move).toBeTruthy();
    expect(compiled.choices[0]).toMatch(/^(?:Leave the scene|Travel\b|Walk\b)/i);

    const ranked = rankChoices(state, compiled.choices);
    expect(ranked.choices.some((c) => isCrowdOnlyTalkPad(c))).toBe(false);
  });

  it('hurt picker prefers Leave over Talk; Leave commits progress within 3 turns', () => {
    let state = deadCrowdStable();
    let progressed = false;
    for (let i = 0; i < 3; i++) {
      const compiled = compileChoices(
        state,
        [
          'Talk to the people here',
          'Answer the people here',
          'Face the threat',
          'Honour the promise: Ashin of Redwick\'s favour',
          'Say something…',
          'Do something else…',
        ],
        undefined,
        'Talk to the people here'
      );
      const seed =
        compiled.choices.find((c) => /^talk\b/i.test(c))
        ?? compiled.choices.find((c) => /^face\b/i.test(c))
        ?? compiled.choices[0]!;
      const pick = preferHurtRecoveryPick(compiled.choices, seed, state);
      expect(isCrowdOnlyTalkPad(pick)).toBe(false);
      expect(pick).toMatch(/^(?:Leave the scene|Travel\b|Walk\b|Honour\b)/i);

      if (/^leave(?:\s+the\s+scene)?\b/i.test(pick) || /^travel\b/i.test(pick) || /^walk\b/i.test(pick)) {
        const before = state;
        const left = commitTravel(state, /^leave\b/i.test(pick) ? 'Leave the scene' : pick);
        state = { ...left.state, turn: (state.turn ?? 45) + 1 };
        const receipts = [left.receipt, ...(left.extra ?? [])].filter(Boolean) as string[];
        const p = turnProgress(before, state, receipts);
        if (p.progressed || left.handled || left.arrived || before.currentLocation !== state.currentLocation) {
          progressed = true;
          break;
        }
      } else {
        progressed = true;
        break;
      }
    }
    expect(progressed).toBe(true);
  });
});
