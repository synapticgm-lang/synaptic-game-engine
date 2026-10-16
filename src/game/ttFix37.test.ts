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

  it('N4: a camp span the record states covers every slot it passes', () => {
    const camp = 'engine result: Travel: camped from night until morning, now morning.\n\u0000clock\u0000morning';
    expect(lineHasWrongTimeOfDay('Jax slept through the night by the fire.', camp)).toBe(false);
    expect(lineHasWrongTimeOfDay('Dawn came grey over the trees.', camp)).toBe(false);
    expect(lineHasWrongTimeOfDay('The afternoon sun beat down.', camp)).toBe(true);
  });
});
