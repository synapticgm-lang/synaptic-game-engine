/**
 * 28u1 — spine main-path progress pays milestone XP; recycled sentences drop from a committed beat;
 * full labels are named once per beat; article glue around painted labels is repaired.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { advancePyoaSpine, ensurePyoaSpine } from './pyoaSpine';
import { applySandboxXpAwards } from './sandboxXp';
import { recycledSentencesIn, trimRecycledSentences } from './semanticLoopDetector';
import { placeShortForm, polishMentions, repairLabelArticles, varyRepeatMentions } from './mentionVariety';
import type { LedgerRef } from './completedEventPacket';

function thornferryState() {
  let state = createInitialState(undefined, 'pyoa');
  state.campaignBibleId = 'thornferry-road';
  state.engineMode = 'pyoa';
  state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
  state.turn = 3;
  state.currentLocation = 'the ford below Thornferry';
  return ensurePyoaSpine(state);
}

function xpFor(state: ReturnType<typeof thornferryState>, action: string) {
  return applySandboxXpAwards(state, {
    playerAction: action,
    locationName: state.currentLocation,
    previousLocationName: state.currentLocation,
    questsBefore: [],
    questsAfter: [],
    events: [],
    turn: state.turn,
  });
}

const refs: LedgerRef[] = [
  { tok: 't1', id: 'here', display: 'The Quiet Bell chapel', klass: 'place' },
  { tok: 't2', id: 'wren', display: 'Wren Holt', klass: 'person' },
  { tok: 't3', id: 'pell', display: 'Magistrate Pell', klass: 'person' },
];

describe('playtest28u1XpRepeats', () => {
  it('spine steps pay once: new place, then the fork, idempotent on repeat', () => {
    let s = advancePyoaSpine(thornferryState(), 'Walk the road together');
    const first = xpFor(s, 'Walk the road together');
    expect(first.xp).toBeGreaterThan(0);
    expect(first.notes.join(' ')).toMatch(/reached Thornferry streets/);
    s = { ...s, sandboxAwardKeys: first.awardKeys };
    expect(xpFor(s, 'Look around').xp).toBe(0);
    s = advancePyoaSpine(s, 'Keep the charter with the mill');
    const fork = xpFor(s, 'Keep the charter with the mill');
    expect(fork.awardKeys.some((k) => k.startsWith('spine-'))).toBe(true);
  });

  it('an ending pays quest complete once', () => {
    let s = thornferryState();
    s = { ...s, pyoaSpine: { ...s.pyoaSpine!, endingId: 'thornferry:burned' } };
    const r = xpFor(s, 'Burn it');
    expect(r.notes.join(' ')).toMatch(/an ending reached/);
    expect(xpFor({ ...s, sandboxAwardKeys: r.awardKeys }, 'Burn it').xp).toBe(0);
  });

  it('recycled sentences and re-spoken lines drop when two sentences stay', () => {
    const prior = 'Jax stood in the cold gray nave of the chapel, warped floorboards creaking underfoot and daylight under the vestry door. Wren said, "The oak door is at your back, courier."';
    const draft = 'Jax stood in the cold gray nave of the chapel, warped floorboards creaking underfoot and daylight under the vestry door. Wren said again, "The oak door is at your back, courier." A priest stepped out of the vestry with a lamp. He asked Jax what business brought a courier here.';
    expect(recycledSentencesIn(draft, [prior])).toHaveLength(2);
    const t = trimRecycledSentences(draft, [prior]);
    expect(t.text).toBe('A priest stepped out of the vestry with a lamp. He asked Jax what business brought a courier here.');
    expect(trimRecycledSentences(prior, [prior]).text).toBe(prior);
  });

  it('second mentions of a full label take the short form', () => {
    expect(placeShortForm('the ferry inn at Thornferry')).toBe('the inn');
    expect(placeShortForm('The road east toward Highmark')).toBe('the road');
    expect(placeShortForm('West Wall')).toBeNull();
    const out = varyRepeatMentions(
      'Jax stood in The Quiet Bell chapel. Wren Holt waited. The Quiet Bell chapel was cold, and Wren Holt spoke of Magistrate Pell. Magistrate Pell was waiting.',
      refs
    );
    expect(out).toBe('Jax stood in The Quiet Bell chapel. Wren Holt waited. The chapel was cold, and Wren spoke of Magistrate Pell. Magistrate Pell was waiting.');
  });

  it('article glue around labels is repaired', () => {
    expect(repairLabelArticles('Jax lingered on the mud-rutted The road east.', refs)).toBe('Jax lingered on the mud-rutted road east.');
    expect(repairLabelArticles('Nothing moved, and the Wren Holt\'s warning stayed. The Magistrate Pell\'s business waited.', refs))
      .toBe('Nothing moved, and Wren Holt\'s warning stayed. Magistrate Pell\'s business waited.');
    expect(polishMentions('Wren Holt \'s name went unspoken.', refs)).toBe('Wren Holt\'s name went unspoken.');
  });
});
