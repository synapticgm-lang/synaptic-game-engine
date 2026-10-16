import { describe, expect, it } from 'vitest';
import { lineHasWrongTimeOfDay } from './tokenProse';

describe('lap 37 root causes', () => {
  it('N4: a camp span the record states covers every slot it passes', () => {
    const camp = 'engine result: Travel: camped from night until morning, now morning.\n\u0000clock\u0000morning';
    expect(lineHasWrongTimeOfDay('Jax slept through the night by the fire.', camp)).toBe(false);
    expect(lineHasWrongTimeOfDay('Dawn came grey over the trees.', camp)).toBe(false);
    expect(lineHasWrongTimeOfDay('The afternoon sun beat down.', camp)).toBe(true);
  });
});
