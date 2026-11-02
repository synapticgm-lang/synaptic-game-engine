/**
 * XP-D1 OPEN8 FIX 1 — crowd / role Talk must answer in prose (7402 T5 / T6).
 * Offline: no AI. Real turn inputs + gate's turn-ignored-action check.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { checkActionFollowed } from './turnCheck';
import { ensureCrowdOrRoleTalkAnswered, dropPlayerActEchoOpening } from './writerTurn';
import type { GameState } from './types';

/** Real 7402 T5 player line + committed prose before OPEN8 repair. */
const T5_ACT = 'Ask a witness who knows the lead about their wares';
const T5_BROKEN =
  'The people here turned back to their ledger and made a small mark on the page, slow enough that Jax could watch them do it. A second horse nickered from the far stalls, and the stable door stood half open with grey daylight on the boards. The hut stayed silent around them. No one was there to answer.';

/** Real 7402 T6 — Follow up with people here while a witness is present; encounter prose ignored the ask. */
const T6_ACT = 'Follow up with the people here: the delivery in their care';
const T6_BROKEN =
  'A witness who knows the lead backed against the stall rail and held very still, eyes fixed on the scout instead of on Jax. Brine Scout stopped six paces out and looked right at Jax, one hand loose and one hand low, and the air in the stable seemed to tighten around them both. Brine Scout made clear that they needed eyes on the approach.';

function twinStable(present: string[]): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'twin-lanterns',
    turn: 5,
    currentLocation: 'Twin Lanterns stable',
    character: { ...s.character, name: 'Jax', level: 1, xp: 140, xpToNext: 150, hp: 24, maxHp: 24 },
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    sceneFacts: {
      ...emptySceneFacts(5),
      present,
    },
  } as GameState;
}

describe('OPEN8 — crowd/role Talk always answered (7402 T5/T6)', () => {
  it('T5 broken page fails the gate; repair names the witness and passes', () => {
    const state = twinStable(['the people here', 'a witness who knows the lead']);
    const broken = checkActionFollowed(state, state, T5_ACT, T5_BROKEN);
    expect(broken.p0.some((f) => f.kind === 'ignored-action')).toBe(true);

    const fixed = ensureCrowdOrRoleTalkAnswered(T5_BROKEN, state, T5_ACT);
    expect(fixed).toMatch(/witness who knows the lead/i);
    expect(fixed).not.toMatch(/No one was there to answer/i);
    const ok = checkActionFollowed(state, state, T5_ACT, fixed);
    expect(ok.p0.filter((f) => f.kind === 'ignored-action')).toEqual([]);
  });

  it('T6 broken page fails the gate; repair lands people-here answer and passes', () => {
    const state = twinStable(['the people here', 'a witness who knows the lead']);
    const broken = checkActionFollowed(state, state, T6_ACT, T6_BROKEN);
    expect(broken.p0.some((f) => f.kind === 'ignored-action')).toBe(true);

    const fixed = ensureCrowdOrRoleTalkAnswered(T6_BROKEN, state, T6_ACT);
    expect(fixed).toMatch(/people here|["\u201c]/i);
    const ok = checkActionFollowed(state, state, T6_ACT, fixed);
    expect(ok.p0.filter((f) => f.kind === 'ignored-action')).toEqual([]);
  });

  it('empty seats get acknowledged absence', () => {
    const state = twinStable(['the people here']);
    const draft = 'The stable door stood half open with grey daylight on the boards.';
    const fixed = ensureCrowdOrRoleTalkAnswered(draft, state, 'Talk to the people here');
    expect(fixed).toMatch(/Nobody here can answer/i);
  });

  it('OPEN7B echo strip still composes with OPEN8 talk repair', () => {
    const state = twinStable(['a witness who knows the lead']);
    const echoed =
      'Jax asked a witness who knows the lead about their wares. The hut stayed silent. No one was there to answer.';
    const stripped = dropPlayerActEchoOpening(echoed, T5_ACT);
    const fixed = ensureCrowdOrRoleTalkAnswered(stripped, state, T5_ACT);
    expect(fixed).toMatch(/witness who knows the lead/i);
    expect(
      checkActionFollowed(state, state, T5_ACT, fixed).p0.filter((f) => f.kind === 'ignored-action'),
    ).toEqual([]);
  });

  it('shared engine path: LitRPG present role also repairs', () => {
    const s = createInitialState(undefined, 'litrpg') as GameState;
    const state = {
      ...s,
      engineMode: 'litrpg' as const,
      turn: 4,
      currentLocation: 'Ash Court',
      character: { ...s.character, name: 'Jax' },
      sceneFacts: {
        ...emptySceneFacts(4),
        present: ['a witness who knows the lead'],
      },
    } as GameState;
    const fixed = ensureCrowdOrRoleTalkAnswered(
      'Dust hung in the shafts. No one was there to answer.',
      state,
      T5_ACT,
    );
    expect(fixed).toMatch(/witness who knows the lead/i);
    expect(
      checkActionFollowed(state, state, T5_ACT, fixed).p0.filter((f) => f.kind === 'ignored-action'),
    ).toEqual([]);
  });
});
