/**
 * Diagnostic cause for a withheld clause check. The model is stubbed. Gates stay the same.
 */
import { describe, expect, it } from 'vitest';
import {
  checkAndRepairProse,
  diagnosticClauseWithholdVerdict,
  makeGmClauseChat,
  type ClauseCheckChat,
  type ClauseClaim,
} from './clauseCheck';
import type { FactSheet } from './factSheet';

function sheet(): FactSheet {
  return {
    turn: 3,
    place: { name: 'The Weighing Cup', exits: [], features: [] },
    present: [{ name: 'Mara Vell' }],
    openLedger: [],
    gear: { worn: [], carrying: [], inHand: 'nothing' },
    beat: { verb: 'spoke', outcome: 'spoke', steps: [] },
    player: { typed: 'Mara Vell, guard the door', claimsNotTrue: [] },
    quests: [],
    recent: [],
    settingsSlot: null,
  };
}

const prose = 'Mara Vell stays by the door and does not take the order.';

describe('clause withhold cause', () => {
  it('a thrown checker call is threw, and a null reply is empty', async () => {
    const thrown = await checkAndRepairProse({
      factSheet: sheet(),
      prose,
      player: sheet().player,
      chat: async () => {
        throw new Error('socket hang up');
      },
    });
    expect(thrown.withheld).toBe(true);
    expect(thrown.prose).toBe('');
    expect(thrown.records).toEqual([]);
    expect(thrown.withholdCause).toBe('threw');

    const empty = await checkAndRepairProse({
      factSheet: sheet(),
      prose,
      player: sheet().player,
      chat: async () => null,
    });
    expect(empty.withheld).toBe(true);
    expect(empty.withholdCause).toBe('empty');
  });

  it('a blank reply is empty and unparseable text is parse', async () => {
    const blank = makeGmClauseChat(async () => '');
    const blanked = await checkAndRepairProse({
      factSheet: sheet(),
      prose,
      player: sheet().player,
      chat: blank,
    });
    expect(blanked.withholdCause).toBe('empty');

    const junk = makeGmClauseChat(async () => 'not json at all');
    const parsed = await checkAndRepairProse({
      factSheet: sheet(),
      prose,
      player: sheet().player,
      chat: junk,
    });
    expect(parsed.withheld).toBe(true);
    expect(parsed.withholdCause).toBe('parse');
  });

  it('a parsed empty claim list is no-clauses, and a serious unsupported fact is serious', async () => {
    const none = makeGmClauseChat(async () => '{"claims":[]}');
    const skipped = await checkAndRepairProse({
      factSheet: sheet(),
      prose,
      player: sheet().player,
      chat: none,
    });
    expect(skipped.withholdCause).toBe('no-clauses');

    const claims: ClauseClaim[] = [
      { c: 'Mara Vell hands over the vault key', kind: 'fact', support: '', severity: 'serious' },
    ];
    const chat: ClauseCheckChat = async () => ({ claims });
    const rejected = await checkAndRepairProse({
      factSheet: sheet(),
      prose: 'Mara Vell hands over the vault key.',
      player: sheet().player,
      chat,
    });
    expect(rejected.withheld).toBe(true);
    expect(rejected.withholdCause).toBe('serious');
  });

  it('a claim list that skips a sentence is uncovered, and a covered draft has no cause', async () => {
    const chat: ClauseCheckChat = async () => ({
      claims: [{ c: 'Mara Vell stays by the door', kind: 'fact', support: 'Present: Mara Vell' }],
    });
    const missed = await checkAndRepairProse({
      factSheet: sheet(),
      prose: 'Mara Vell stays by the door. The lamp keeps burning on the bar.',
      player: sheet().player,
      chat,
    });
    expect(missed.withheld).toBe(true);
    expect(missed.withholdCause).toBe('uncovered');

    const covered = await checkAndRepairProse({
      factSheet: sheet(),
      prose: 'Mara Vell stays by the door.',
      player: sheet().player,
      chat,
    });
    expect(covered.withheld).toBe(false);
    expect(covered.withholdCause).toBeUndefined();
    expect(covered.prose).toBe('Mara Vell stays by the door.');
  });

  it('the diagnostic tape note is the cause code only, and a normal session adds nothing', () => {
    expect(diagnosticClauseWithholdVerdict('parse', true)).toEqual([
      { checker: 'clauseWithhold', verdict: 'fail', detail: 'parse' },
    ]);
    expect(diagnosticClauseWithholdVerdict('serious', false)).toEqual([]);
    expect(diagnosticClauseWithholdVerdict(undefined, true)).toEqual([]);
  });
});
