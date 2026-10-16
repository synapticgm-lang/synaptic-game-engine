import { describe, expect, it } from 'vitest';
import { foeCanSpeak } from './rules/srdMonsters';
import { lineHasWrongTimeOfDay } from './tokenProse';
import type { ActiveEncounter } from './types';

const foe = (name: string) => ({ name } as unknown as ActiveEncounter);

describe('lap 37 root causes', () => {
  it('RC-S1: speech comes from the SRD Languages line', () => {
    expect(foeCanSpeak(foe('Cave Spider'))).toBe(false);
    expect(foeCanSpeak(foe('Wilds Stalker'))).toBe(false);
    expect(foeCanSpeak(foe('Restless Dead'))).toBe(false);
    expect(foeCanSpeak(foe('Road Bandits'))).toBe(true);
    expect(foeCanSpeak(foe('Goblin Raiders'))).toBe(true);
  });

  it('N4: a camp span the record states covers every slot it passes', () => {
    const camp = 'engine result: Travel: camped from night until morning, now morning.\n\u0000clock\u0000morning';
    expect(lineHasWrongTimeOfDay('Jax slept through the night by the fire.', camp)).toBe(false);
    expect(lineHasWrongTimeOfDay('Dawn came grey over the trees.', camp)).toBe(false);
    expect(lineHasWrongTimeOfDay('The afternoon sun beat down.', camp)).toBe(true);
  });
});
