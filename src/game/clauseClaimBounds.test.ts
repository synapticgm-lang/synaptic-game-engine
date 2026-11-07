/**
 * Claim schema and sentence matching used by the check and the repair recheck.
 * Stubs only. No paid inference.
 */
import { describe, expect, it } from 'vitest';
import {
  checkAndRepairProse,
  clauseCheckerVerdicts,
  runClauseCheck,
  sentenceForClaim,
} from './clauseCheck';
import { parseClauseClaims } from './clauseCheckPrompt';
import type { FactSheet } from './factSheet';

function sheet(): FactSheet {
  return {
    turn: 4,
    place: { name: 'Harbor hold', exits: ['street'], features: ['lamp'] },
    present: [{ name: 'Mira' }],
    openLedger: [],
    gear: { worn: ['clothes'], carrying: [], inHand: 'nothing' },
    beat: { verb: 'spoke', outcome: 'spoke', engineResult: 'Mira heard you.', steps: [] },
    player: { typed: 'hello Mira', claimsNotTrue: [] },
    quests: [],
    recent: [],
    settingsSlot: null,
  };
}

describe('claim schema', () => {
  it('accepts string claims only, and a non-string support is empty', () => {
    const parsed = parseClauseClaims({
      claims: [
        { c: '  Mira is here  ', kind: 'FACT', support: '  Present: Mira  ', severity: 'MINOR' },
        { c: 'fog on the lane', kind: 'color', support: '' },
        { c: true, kind: 'fact', support: 'Present: Mira' },
        { c: 12, kind: 'fact', support: 'Present: Mira' },
        { c: { text: 'Mira' }, kind: 'fact', support: 'Present: Mira' },
        { kind: 'fact', support: 'Present: Mira' },
        { c: 'The dragon landed', kind: true, support: true, severity: true },
        { c: 'The dragon counted', kind: 'fact', support: 1, severity: 'serious' },
        { c: 'The dragon objected', kind: 'fact', support: false },
        { c: 'The dragon boxed', kind: 'fact', support: { quote: 'Present: Mira' } },
        { c: 'The dragon listed', kind: 'fact', support: ['Present: Mira'] },
        { c: 'The dragon nulled', kind: 'fact', support: null, severity: 0 },
        { c: 'A minor aside', kind: 'fact', support: true, severity: 'minor' },
      ],
    });
    expect(parsed.map((claim) => claim.c)).toEqual([
      'Mira is here',
      'fog on the lane',
      'The dragon landed',
      'The dragon counted',
      'The dragon objected',
      'The dragon boxed',
      'The dragon listed',
      'The dragon nulled',
      'A minor aside',
    ]);
    expect(parsed[0]).toMatchObject({ kind: 'fact', support: 'Present: Mira', severity: 'minor' });
    expect(parsed[1]).toMatchObject({ kind: 'colour', support: '' });
    expect(parsed[2]).toMatchObject({ kind: 'fact', support: '' });
    expect(parsed[2]!.severity).toBeUndefined();
    expect(parsed[3]).toMatchObject({ kind: 'fact', support: '', severity: 'serious' });
    expect(parsed[4]).toMatchObject({ support: '' });
    expect(parsed[5]).toMatchObject({ support: '' });
    expect(parsed[6]).toMatchObject({ support: '' });
    expect(parsed[7]).toMatchObject({ support: '' });
    expect(parsed[7]!.severity).toBeUndefined();
    expect(parsed[8]).toMatchObject({ support: '', severity: 'minor' });
    const fromText = parseClauseClaims(
      '{"claims":[{"c":"The dragon landed","kind":"fact","support":true,"severity":"serious"}]}'
    );
    expect(fromText[0]).toMatchObject({ c: 'The dragon landed', support: '', kind: 'fact' });
  });

  it('a non-string support does not pass the check or the repair recheck', async () => {
    const checked = await runClauseCheck({
      factSheet: sheet(),
      prose: 'A dragon lands on the furnace. The bathhouse waits by the lamp.',
      player: sheet().player,
      chat: async () => ({
        claims: [
          { c: 'A dragon lands on the furnace', kind: 'fact' as const, support: true as unknown as string, severity: 'serious' as const },
          { c: 'The bathhouse waits by the lamp', kind: 'colour' as const, support: '' },
        ],
      }),
    });
    expect(checked.failed).toBe(false);
    expect(checked.serious.map((claim) => claim.c)).toEqual(['A dragon lands on the furnace']);
    expect(checked.claims[0]?.support).toBe('');
    expect(clauseCheckerVerdicts(checked.records)[0]?.verdict).toBe('fail');

    let repairs = 0;
    let passes = 0;
    const repaired = await checkAndRepairProse({
      factSheet: sheet(),
      prose: 'A dragon lands on the furnace. The bathhouse waits by the lamp.',
      player: sheet().player,
      chat: async () => {
        passes += 1;
        if (passes === 1) {
          return {
            claims: [
              { c: 'A dragon lands on the furnace', kind: 'fact' as const, support: '', severity: 'serious' as const },
              { c: 'The bathhouse waits by the lamp', kind: 'colour' as const, support: '' },
            ],
          };
        }
        return {
          claims: [
            { c: 'Steam curls off the furnace stones', kind: 'fact' as const, support: true as unknown as string, severity: 'serious' as const },
            { c: 'The bathhouse waits by the lamp', kind: 'colour' as const, support: '' },
          ],
        };
      },
      repair: async () => {
        repairs += 1;
        return 'Steam curls off the furnace stones.';
      },
    });
    // The recheck must not treat support:true as a quote that clears the new sentence.
    expect(repairs).toBe(1);
    expect(repaired.withheld).toBe(false);
    expect(repaired.prose).toContain('The bathhouse waits by the lamp');
    expect(repaired.prose).not.toContain('dragon');
    expect(repaired.prose).not.toContain('Steam curls');
    expect(repaired.prose).not.toMatch(/support/);
    expect(repaired.records.every((row) => row.support !== 'true')).toBe(true);
  });
});

describe('sentence matching', () => {
  it('does not fall back to the first sentence, and an exact short sentence still matches', () => {
    const prose = 'The bathhouse waits by the lamp. Mira keeps her hands still.';
    expect(sentenceForClaim(prose, 'The hidden vault key opens the north gate')).toBeNull();
    expect(sentenceForClaim(prose, '')).toBeNull();
    expect(sentenceForClaim(prose, '.')).toBeNull();
    expect(sentenceForClaim(prose, 'Mira')).toBeNull();
    expect(sentenceForClaim('Mira nods at the lamp.', 'Mira nods.')).toBeNull();
    expect(sentenceForClaim('She nods. The lamp stays lit.', 'She nods.')).toBe('She nods.');
    expect(sentenceForClaim('Mira nods at the lamp. Mira nods.', 'Mira nods.')).toBe('Mira nods.');
    expect(sentenceForClaim('Steam hangs. A dragon lands on the roof. Mira waits.', 'A dragon lands on the roof')).toMatch(/dragon/i);
    const partial = 'Hi there. The vault key sits in the box.';
    expect(sentenceForClaim(partial, 'The vault key sits in the box and also something else entirely')).toBeNull();
  });

  it('does not repair an unmatched claim by rewriting the first sentence', async () => {
    let request = '';
    const out = await checkAndRepairProse({
      factSheet: sheet(),
      prose: 'The bathhouse waits by the lamp. Mira keeps her hands still.',
      player: sheet().player,
      chat: async () => ({
        claims: [
          { c: 'The hidden vault key opens the north gate', kind: 'fact' as const, support: '', severity: 'serious' as const },
          { c: 'The bathhouse waits by the lamp', kind: 'colour' as const, support: '' },
          { c: 'Mira keeps her hands still', kind: 'colour' as const, support: '' },
        ],
      }),
      repair: async (next) => {
        request = next;
        return 'Steam curls off the cold stones.';
      },
    });
    expect(request).toBe('');
    expect(out.withheld).toBe(true);
    expect(out.prose).not.toContain('Steam curls');
    expect(out.prose).not.toContain('bathhouse');
  });

  it('still publishes a short whole-sentence line the checker names exactly', async () => {
    const out = await checkAndRepairProse({
      factSheet: sheet(),
      prose: 'She nods.',
      player: sheet().player,
      chat: async () => ({ claims: [{ c: 'She nods.', kind: 'colour' as const, support: '' }] }),
    });
    expect(out.withheld).toBe(false);
    expect(out.prose).toContain('She nods');
    const fragment = await checkAndRepairProse({
      factSheet: sheet(),
      prose: 'Mira nods at the lamp.',
      player: sheet().player,
      chat: async () => ({ claims: [{ c: 'Mira nods.', kind: 'colour' as const, support: '' }] }),
    });
    expect(fragment.withheld).toBe(true);
    expect(fragment.prose).not.toContain('lamp');
  });
});
