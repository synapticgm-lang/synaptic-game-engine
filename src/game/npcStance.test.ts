import { describe, expect, it } from 'vitest';
import { applyStanceEvent, recordStanceFromAction, stanceEventFromAction } from './npcStance';
import { pickNpcSheet } from './npcSheet';
import { prepareWriterInputWithTownsfolk, seedTownsfolkHere } from './townsfolk';
import type { GameState, NpcMemory } from './types';

const CELL = 'Keep Cells';

function prisoner(): NpcMemory {
  return {
    npcId: 'town-wat-pike',
    npcName: 'Wat Pike',
    disposition: 'unknown',
    facts: [],
    lastSeenTurn: 2,
    met: true,
    location: CELL,
    sheet: pickNpcSheet('Wat Pike', 'cell', { roleHint: 'captive', campaignId: 'cursed-keep' }),
  };
}

function ally(): NpcMemory {
  return { npcId: 'ck-wren', npcName: 'Wren Holt', disposition: 'allied', facts: [], lastSeenTurn: 2, met: true, location: CELL };
}

function state(memories: NpcMemory[], turn = 5): GameState {
  return {
    turn,
    currentLocation: CELL,
    campaignBibleId: 'cursed-keep',
    character: { name: 'Jax' },
    npcMemories: memories,
    townsfolkPlaces: ['midnight well', 'keep cells'],
    openingEstablishment: { pending: [], answers: {}, complete: true, sceneWritten: true },
    sceneFacts: {},
    inventory: [],
    log: [],
  } as unknown as GameState;
}

const find = (s: GameState, id: string) => s.npcMemories!.find((m) => m.npcId === id)!;

describe('npc stance', () => {
  it('a rescued prisoner turns grateful, with the cause; who they are does not change', () => {
    const before = prisoner();
    const after = find(recordStanceFromAction(state([before]), 'Unlock the shackles and free Wat'), before.npcId);
    expect(after.stance?.now).toBe('grateful');
    expect(after.stance?.cause).toBe('Jax freed them at Keep Cells (T6)');
    expect(after.disposition).toBe('friendly');
    expect(after.sheet).toEqual(before.sheet);
  });

  it('a betrayed ally turns hostile, and the cause says they had trusted the player', () => {
    const after = find(recordStanceFromAction(state([ally()], 7), 'Attack Wren Holt'), 'ck-wren');
    expect(after.stance?.now).toBe('hostile');
    expect(after.stance?.cause).toBe('Jax attacked them (T8), after they had trusted Jax');
    expect(after.disposition).toBe('hostile');
  });

  it('the same event twice does not swing them further', () => {
    const once = recordStanceFromAction(state([prisoner()]), 'Free the prisoner');
    const replay = recordStanceFromAction(once, 'Free the prisoner');
    expect(replay).toBe(once);
    // Freed again on a later turn: still grateful, still the first cause — not "more grateful".
    const later = recordStanceFromAction({ ...once, turn: 9 }, 'Free Wat Pike');
    expect(find(later, 'town-wat-pike').stance?.now).toBe('grateful');
    expect(find(later, 'town-wat-pike').stance?.cause).toBe('Jax freed them at Keep Cells (T6)');
    // Attacked twice: hostile once, then no further.
    const hit = recordStanceFromAction(state([ally()], 7), 'Attack Wren');
    const hitAgain = recordStanceFromAction({ ...hit, turn: 8 }, 'Attack Wren');
    expect(find(hitAgain, 'ck-wren').stance).toMatchObject({ now: 'hostile', turn: 8 });
  });

  it('stance moves only on an engine event: talk, a failed check, or no clear target changes nothing', () => {
    const s = state([prisoner(), ally()]);
    expect(recordStanceFromAction(s, 'Ask Wat what happened')).toBe(s);
    expect(recordStanceFromAction(s, 'Free Wat', { engineResult: 'Lockpick check failed (7 vs 12)' })).toBe(s);
    expect(recordStanceFromAction(s, 'Attack them')).toBe(s);
    expect(stanceEventFromAction(s, 'Free Wren Holt')).toBeNull();
  });

  it('kindness eases a hostile person to wary, not straight to friendly', () => {
    const hostile = applyStanceEvent(ally(), { kind: 'harmed', id: 'harmed:3', turn: 3, cause: 'Jax attacked them (T3)', pc: 'Jax' });
    const eased = applyStanceEvent(hostile, { kind: 'helped', id: 'helped:6', turn: 6, cause: 'Jax helped them (T6)' });
    expect(eased.stance).toMatchObject({ now: 'wary', cause: 'Jax helped them (T6)' });
  });

  it('the writer is told the stance and its cause, on that person’s token', () => {
    const prepared = prepareWriterInputWithTownsfolk(state([prisoner()]), 'Free Wat Pike');
    const tok = prepared.packet.refEnum!.find((r) => r.display === 'Wat Pike')!.tok;
    expect(prepared.packet.stances).toEqual([
      `@${tok} Wat Pike is grateful toward the player now — because Jax freed them at Keep Cells (T6). Who they are has not changed; this is how they meet the player now.`,
    ]);
    expect(prepared.writerFacing).toContain('HOW THEY ARE NOW');
    expect(prepared.state.npcMemories!.find((m) => m.npcName === 'Wat Pike')!.stance?.now).toBe('grateful');
  });

  it('someone with no event has no stance line', () => {
    const s = seedTownsfolkHere(state([prisoner()]));
    const prepared = prepareWriterInputWithTownsfolk(s, 'Look around');
    expect(prepared.packet.stances).toBeUndefined();
    expect(prepared.writerFacing).not.toContain('HOW THEY ARE NOW');
  });
});
