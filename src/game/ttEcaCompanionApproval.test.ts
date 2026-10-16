/**
 * q31-ECA / Spec E-CA: companion approval from intent + engine outcome, not stance wording.
 * Same line + different outcomes → different events; converse also holds.
 */
import { describe, expect, it } from 'vitest';
import type { GameState } from './types';
import { storedRelationshipFor } from './npcRelationships';
import {
  APPROVAL_SHIFT,
  settleCompanions,
  type ApprovalOutcome,
} from './rules/companions';

function baseState(): GameState {
  return {
    engineMode: 'rpg',
    turn: 10,
    companions: [
      {
        id: 'companion-vessa',
        name: 'Vessa',
        type: 'party',
        role: 'companion',
        hp: 10,
        maxHp: 10,
        maintenanceCost: 'none',
        assignment: 'At your side',
        notes: '',
        recruited: true,
        approvalWarnings: 0,
        sidekick: 'expert',
      },
    ],
    sceneFacts: { present: ['Vessa', 'Hobb Dunmore', 'Sefa Crane'] },
    arcDirector: {
      npcRelationships: [{ npcName: 'Vessa', trust: APPROVAL_SHIFT.join.trust, familiarity: APPROVAL_SHIFT.join.familiarity }],
    },
  } as GameState;
}

function trust(s: GameState): number {
  return storedRelationshipFor(s, 'Vessa')!.trust;
}

const LINE = 'Deal with Hobb Dunmore';

describe('q31-ECA companion approval (intent + outcome)', () => {
  it('same wording, different outcomes → harmOther / kindOther / foughtTogether / no-change', () => {
    const s = baseState();
    const join = APPROVAL_SHIFT.join.trust;

    const harm = settleCompanions(s, LINE, { outcome: { harmed: ['Hobb Dunmore'] } });
    expect(harm.receipts[0]).toMatch(/^Companion: Vessa disapproves/);
    expect(trust(harm.state)).toBe(join + APPROVAL_SHIFT.harmOther.trust);

    const kind = settleCompanions(s, LINE, { outcome: { helped: ['Hobb Dunmore'] } });
    expect(kind.receipts).toEqual(['Companion: Vessa approves.']);
    expect(trust(kind.state)).toBe(join + APPROVAL_SHIFT.kindOther.trust);

    const fight: ApprovalOutcome = {
      wonFight: true,
      fightFoes: ['Hobb Dunmore'],
      harmed: ['Hobb Dunmore'],
    };
    const won = settleCompanions(s, LINE, { outcome: fight });
    expect(trust(won.state)).toBe(join + APPROVAL_SHIFT.foughtTogether.trust);

    const quiet = settleCompanions(s, LINE);
    expect(quiet.receipts).toEqual([]);
    expect(trust(quiet.state)).toBe(join);
  });

  it('different wording, same outcome → the same event (wording is not the score)', () => {
    const s = baseState();
    const join = APPROVAL_SHIFT.join.trust;
    const a = settleCompanions(s, 'Threaten Hobb Dunmore', { outcome: { harmed: ['Hobb Dunmore'] } });
    const b = settleCompanions(s, 'Attack Hobb Dunmore', { outcome: { harmed: ['Hobb Dunmore'] } });
    expect(trust(a.state)).toBe(join + APPROVAL_SHIFT.harmOther.trust);
    expect(trust(b.state)).toBe(join + APPROVAL_SHIFT.harmOther.trust);
    expect(a.receipts[0]).toBe(b.receipts[0]);
  });

  it('harm to the companion scores harmCompanion; targetsSelf scores nothing', () => {
    const s = baseState();
    const join = APPROVAL_SHIFT.join.trust;
    const hit = settleCompanions(s, 'Strike Vessa', { outcome: { harmed: ['Vessa'] } });
    expect(trust(hit.state)).toBe(join + APPROVAL_SHIFT.harmCompanion.trust);
    expect(hit.receipts[0]).toMatch(/^Companion: Vessa disapproves/);

    const self = settleCompanions(s, 'I turn my sword on myself', {
      outcome: { harmed: ['Vessa'], wonFight: true },
    });
    expect(self.receipts).toEqual([]);
    expect(trust(self.state)).toBe(join);
  });

  it('taking goods without consent is harmOther; a won fight alone is foughtTogether', () => {
    const s = baseState();
    const join = APPROVAL_SHIFT.join.trust;
    const steal = settleCompanions(s, 'Take the pouch', { outcome: { takenFrom: ['Hobb Dunmore'] } });
    expect(trust(steal.state)).toBe(join + APPROVAL_SHIFT.harmOther.trust);

    const won = settleCompanions(s, 'Face the thugs', { outcome: { wonFight: true, fightFoes: ['the thugs'] } });
    expect(trust(won.state)).toBe(join + APPROVAL_SHIFT.foughtTogether.trust);
  });
});
