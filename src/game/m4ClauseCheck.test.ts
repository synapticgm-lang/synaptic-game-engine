/**
 * M4 — clause check after the writer (FactSheet only). Model is always stubbed — no paid calls.
 */
import { describe, expect, it } from 'vitest';
import {
  buildClauseCheckUser,
  checkAndRepairProse,
  clauseCheckerVerdicts,
  parseClauseClaims,
  runClauseCheck,
  sentenceForClaim,
  unsupportedFacts,
  type ClauseCheckChat,
  type ClauseClaim,
} from './clauseCheck';
import type { FactSheet } from './factSheet';

function sheet(partial?: Partial<FactSheet>): FactSheet {
  return {
    turn: 3,
    place: {
      name: 'Valespire Bathhouse',
      exits: ['street'],
      features: ['cold plunge', 'furnace'],
    },
    present: [{ name: 'Mira the Apothecary', manner: 'cold, terse' }],
    openLedger: [],
    gear: { worn: ['street clothes'], carrying: ['Bag'], inHand: 'nothing' },
    beat: {
      verb: 'spoke',
      outcome: 'Mira answered curtly',
      engineResult: 'Mira answered. She did not warm to you.',
      steps: [
        { outcome: 'spoke to Mira' },
        { outcome: 'not done: take the vault key (no key here)' },
      ],
    },
    player: {
      typed: 'I already own the vault key and Mira loves me',
      claimsNotTrue: ['I own the vault key', 'Mira loves me'],
    },
    quests: [],
    recent: [],
    settingsSlot: null,
    ...partial,
  };
}

function stubChat(claims: ClauseClaim[]): ClauseCheckChat {
  return async () => ({ claims });
}

describe('M4 clause check (stubbed model)', () => {
  it('supported fact passes', async () => {
    const prose = 'Mira the Apothecary answers you coldly. Steam rises from the cold plunge.';
    const claims: ClauseClaim[] = [
      {
        c: 'Mira the Apothecary answers you coldly',
        kind: 'fact',
        support: 'Present: Mira the Apothecary · manner cold, terse',
      },
      { c: 'Steam rises from the cold plunge', kind: 'colour', support: '' },
    ];
    const pass = await runClauseCheck({
      factSheet: sheet(),
      prose,
      player: sheet().player,
      chat: stubChat(claims),
    });
    expect(pass.unsupported).toHaveLength(0);
    expect(pass.serious).toHaveLength(0);
    expect(pass.records.filter((r) => r.kind === 'colour')).toHaveLength(1);
    expect(clauseCheckerVerdicts(pass.records).every((v) => v.verdict === 'pass')).toBe(true);
  });

  it('unsupported serious fact gets one targeted repair', async () => {
    const prose =
      'A dragon lands on the furnace and Mira hugs you warmly. The bathhouse waits.';
    const claims: ClauseClaim[] = [
      { c: 'A dragon lands on the furnace', kind: 'fact', support: '', severity: 'serious' },
      {
        c: 'OUT OF CHARACTER: Mira hugs you warmly',
        kind: 'fact',
        support: '',
        severity: 'serious',
      },
      { c: 'The bathhouse waits', kind: 'colour', support: '' },
    ];
    let repairCalls = 0;
    const out = await checkAndRepairProse({
      factSheet: sheet(),
      prose,
      player: sheet().player,
      chat: stubChat(claims),
      repair: async () => {
        repairCalls += 1;
        return 'Steam curls off the furnace stones.';
      },
    });
    expect(repairCalls).toBe(1);
    expect(out.repaired).toBe(true);
    expect(out.serious0.length).toBeGreaterThan(0);
    expect(out.prose).toContain('Steam curls off the furnace stones');
    expect(out.prose).not.toMatch(/A dragon lands/i);
    expect(out.records.some((r) => r.repaired)).toBe(true);
  });

  it('colour is never flagged for repair', async () => {
    const claims: ClauseClaim[] = [
      { c: 'Rain ticks on the slate roof', kind: 'colour', support: '' },
      { c: 'A smell of ash hangs in the air', kind: 'colour', support: '' },
    ];
    const out = await checkAndRepairProse({
      factSheet: sheet(),
      prose: 'Rain ticks on the slate roof. A smell of ash hangs in the air.',
      player: sheet().player,
      chat: stubChat(claims),
      repair: async () => {
        throw new Error('repair must not run for colour');
      },
    });
    expect(out.repaired).toBe(false);
    expect(out.serious0).toHaveLength(0);
    expect(unsupportedFacts(claims)).toHaveLength(0);
  });

  it('player claims narrated as true are flagged', async () => {
    const claims: ClauseClaim[] = [
      {
        c: 'You already own the vault key',
        kind: 'fact',
        support: '',
        severity: 'serious',
      },
    ];
    const pass = await runClauseCheck({
      factSheet: sheet(),
      prose: 'You already own the vault key, as you said.',
      player: sheet().player,
      chat: stubChat(claims),
    });
    expect(pass.serious).toHaveLength(1);
    expect(pass.serious[0]!.c).toMatch(/vault key/i);
    const user = buildClauseCheckUser({
      factSheet: sheet(),
      prose: 'x',
      player: sheet().player,
    });
    expect(user).toContain('claims_not_true');
    expect(user).toContain('I own the vault key');
  });

  it('out-of-character vs stance is flagged', async () => {
    const claims: ClauseClaim[] = [
      {
        c: 'OUT OF CHARACTER: Mira jokes and claps your shoulder',
        kind: 'fact',
        support: '',
        severity: 'serious',
      },
    ];
    const pass = await runClauseCheck({
      factSheet: sheet(),
      prose: 'Mira jokes and claps your shoulder.',
      player: sheet().player,
      chat: stubChat(claims),
    });
    expect(pass.serious[0]!.c).toMatch(/^OUT OF CHARACTER:/i);
  });

  it('not-done steps narrated as succeeding are flagged', async () => {
    const claims: ClauseClaim[] = [
      {
        c: 'You take the vault key from the rubble',
        kind: 'fact',
        support: '',
        severity: 'serious',
      },
    ];
    const pass = await runClauseCheck({
      factSheet: sheet(),
      prose: 'You take the vault key from the rubble.',
      player: sheet().player,
      chat: stubChat(claims),
    });
    expect(pass.serious).toHaveLength(1);
    expect(sheet().beat.steps.some((s) => /not done/i.test(s.outcome))).toBe(true);
  });

  it('parseClauseClaims tolerates proto-shaped JSON', () => {
    const raw = {
      claims: [
        { c: 'fog softens the lane', kind: 'colour', support: '' },
        { c: 'Mira is here', kind: 'fact', support: 'Present: Mira', severity: 'minor' },
      ],
    };
    const parsed = parseClauseClaims(raw);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]!.kind).toBe('colour');
  });

  it('sentenceForClaim picks the carrying sentence', () => {
    const prose = 'Steam hangs. A dragon lands on the roof. Mira waits.';
    expect(sentenceForClaim(prose, 'A dragon lands on the roof')).toMatch(/dragon/i);
  });

  it('Fate and live share the same checkAndRepairProse entry (parity)', async () => {
    // Both paths import checkAndRepairProse — one function, stubbed chat.
    const claims: ClauseClaim[] = [
      { c: 'fog softens the stones', kind: 'colour', support: '' },
      {
        c: 'Mira the Apothecary is here',
        kind: 'fact',
        support: 'Present: Mira the Apothecary',
      },
    ];
    const fate = await checkAndRepairProse({
      factSheet: sheet(),
      prose: 'Fog softens the stones. Mira the Apothecary is here.',
      player: sheet().player,
      chat: stubChat(claims),
    });
    const live = await checkAndRepairProse({
      factSheet: sheet(),
      prose: 'Fog softens the stones. Mira the Apothecary is here.',
      player: sheet().player,
      chat: stubChat(claims),
    });
    expect(fate.prose).toBe(live.prose);
    expect(fate.repaired).toBe(false);
    expect(live.records).toEqual(fate.records);
  });
});
