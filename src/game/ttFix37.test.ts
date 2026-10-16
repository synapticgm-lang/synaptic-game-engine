import { describe, expect, it } from 'vitest';
import { lastResortStoryBody, tokenUseMatchesClass } from './completedEventPacket';
import { foeCanSpeak } from './rules/srdMonsters';
import { lineHasWrongTimeOfDay } from './tokenProse';
import type { ActiveEncounter, GameState } from './types';

const foe = (name: string) => ({ name } as unknown as ActiveEncounter);

describe('lap 37 root causes', () => {
  it('RC-S1: speech comes from the SRD Languages line', () => {
    expect(foeCanSpeak(foe('Cave Spider'))).toBe(false);
    expect(foeCanSpeak(foe('Wilds Stalker'))).toBe(false);
    expect(foeCanSpeak(foe('Restless Dead'))).toBe(false);
    expect(foeCanSpeak(foe('Road Bandits'))).toBe(true);
    expect(foeCanSpeak(foe('Goblin Raiders'))).toBe(true);
    expect(tokenUseMatchesClass('speaker', 'creature')).toBe(false);
    expect(tokenUseMatchesClass('actor', 'creature')).toBe(true);
  });

  it('N3b: the last-resort page is this turn travel record', () => {
    const fact = 'The way passes the Hollow Spring and camp is made for the night.';
    const state = {
      turn: 4,
      travelBeat: { turn: 4, facts: [fact] },
      log: [],
      character: { name: 'Jax' },
    } as unknown as GameState;
    const page = lastResortStoryBody(state, undefined, 'Make camp');
    expect(page.prose).toBe(fact);
    expect(page.status).toContain('turn record');
  });

  it('N3c: a dungeon or rest record is the page, and a road label is not a place', () => {
    const room = 'Dungeon room: Broken Gate, inside Keep Gate. Ways on: Corridor (unexplored).';
    const inn = {
      turn: 16,
      currentLocation: 'On the road between places',
      previousLocationSheet: { name: 'On the road between places' },
      log: [],
      character: { name: 'Jax' },
      sceneFacts: { present: ['Silas Thorne', 'Wenna Barrow', 'Ysolde Tew'], leftBehind: ['Silas Thorne'] },
      completedEvent: { engineResult: room },
    } as unknown as GameState;
    const page = lastResortStoryBody(inn, undefined, 'Recover the lost survey journals');
    expect(page.prose).toMatch(/Broken Gate/);
    expect(page.prose).toMatch(/Keep Gate/);
    expect(page.prose).toMatch(/way led on to Corridor/);
    expect(page.prose).not.toMatch(/On the road between places|on On|Silas|Wenna|Ysolde|reached/i);
    const rest = lastResortStoryBody(
      { turn: 18, log: [], character: { name: 'Jax' }, completedEvent: { engineResult: 'Rest: long rest, 8 hours — HP 4 → 12 (morning).' } } as unknown as GameState,
      undefined,
      'Take a long rest'
    );
    expect(rest.prose).toMatch(/long rest/);
    expect(rest.prose).toMatch(/4 to 12/);
    const road = lastResortStoryBody(
      { turn: 8, currentLocation: 'On the road between places', log: [], character: { name: 'Jax' }, previousLocationSheet: { name: 'Open road' } } as unknown as GameState,
      undefined,
      'Look around'
    );
    expect(road.prose).not.toMatch(/On the road between places|Open road/);
  });

  it('N4: a camp span the record states covers every slot it passes', () => {
    const camp = 'engine result: Travel: camped from night until morning, now morning.\n\u0000clock\u0000morning';
    expect(lineHasWrongTimeOfDay('Jax slept through the night by the fire.', camp)).toBe(false);
    expect(lineHasWrongTimeOfDay('Dawn came grey over the trees.', camp)).toBe(false);
    expect(lineHasWrongTimeOfDay('The afternoon sun beat down.', camp)).toBe(true);
  });
});
