/**
 * 28x — opening places used up: a revisit loses to an unvisited exit, a fight or the quest step;
 * with none offered one is added (unvisited hub, else a fight where combat is allowed);
 * a nudge line already fired this save never fires again unchanged.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { SEEK_FIGHT_CHIP, nudgeIfStuck, rankChoices, recordCirclingTurn } from './choiceRanking';
import { shouldSpawnCombat } from './arcDirector';
import { hubsForBibleId } from './outdoorHubs';
import type { GameState } from './types';

function visitedAll(mode: 'dnd' | 'rpg', bible: string, except: string[] = []): GameState {
  const hubs = hubsForBibleId(bible).filter((h) => !except.includes(h.name));
  let s = {
    ...createInitialState('Ria', mode),
    campaignBibleId: bible,
    currentLocation: hubs[0]!.name,
    turn: 4,
    openingEstablishment: { complete: true },
  } as unknown as GameState;
  hubs.forEach((h, i) => {
    s = recordCirclingTurn({ ...s, turn: 4 + i, currentLocation: h.name }, `Travel toward ${h.name}`, []);
  });
  return { ...s, turn: 4 + hubs.length, currentLocation: hubs[hubs.length - 1]!.name };
}

describe('28x fresh way on', () => {
  it('revisits drop when an unvisited hub is offered', () => {
    const hubs = hubsForBibleId('cursed-keep');
    const fresh = hubs[hubs.length - 1]!.name;
    const s = visitedAll('dnd', 'cursed-keep', [fresh]);
    const r = rankChoices(s, [`Travel toward ${hubs[0]!.name}`, `Travel toward ${fresh}`, 'Wait and watch']);
    expect(r.choices).toContain(`Travel toward ${fresh}`);
    expect(r.choices.some((c) => c.includes(hubs[0]!.name))).toBe(false);
  });

  it('every hub visited in a combat mode: a fight chip replaces the revisits', () => {
    const s = visitedAll('dnd', 'cursed-keep');
    const hubs = hubsForBibleId('cursed-keep');
    const r = rankChoices(s, [`Travel toward ${hubs[0]!.name}`, `Travel toward ${hubs[1]!.name}`, 'Wait and watch']);
    expect(r.choices[0]).toBe(SEEK_FIGHT_CHIP);
    expect(r.choices.some((c) => /^(?:travel toward|go back to)\b/i.test(c))).toBe(false);
  });

  it('the fight chip spawns a fight without waiting for the drought cadence', () => {
    const s = visitedAll('dnd', 'cursed-keep');
    const fresh = { ...s, arcDirector: { ...(s.arcDirector ?? {}), turnsSinceCombatReceipt: 0 } } as GameState;
    expect(shouldSpawnCombat(fresh, 'Wait and watch')).toBe(false);
    expect(shouldSpawnCombat(fresh, SEEK_FIGHT_CHIP)).toBe(true);
  });

  it('a mode without combat keeps the revisit when nothing else moves on', () => {
    const s = visitedAll('rpg', 'salt-road-heist');
    const hubs = hubsForBibleId('salt-road-heist');
    const r = rankChoices(s, [`Travel toward ${hubs[0]!.name}`, 'Wait and watch', 'Inspect the immediate surroundings']);
    expect(r.choices).not.toContain(SEEK_FIGHT_CHIP);
    expect(r.choices.some((c) => c.includes(hubs[0]!.name))).toBe(true);
  });

  it('a nudge line already fired this save does not fire again', () => {
    // q39-T1b: no generic sensory pool — seed a quest fact source; fired lines stay unique.
    let s = {
      ...createInitialState('Ria', 'litrpg'),
      turn: 10,
      campaignBibleId: 'summoned-pact',
      currentLocation: 'Lowmarket',
      openingEstablishment: { complete: true },
      quests: [
        {
          id: 'q-nudge',
          name: 'The Quiet Job',
          description: 'The Quiet Job',
          status: 'active',
          revealed: true,
          type: 'side',
          objectives: [{ id: 'o1', description: 'Ask at the cup.', completed: false }],
        },
      ],
      npcMemories: [
        {
          npcId: 'npc:kell',
          npcName: 'Kell',
          introSpoken: false,
          disposition: 'neutral',
          location: 'Lowmarket',
          lastSeenTurn: 9,
        },
      ],
      sceneFacts: {
        crowd: 'sparse',
        noise: 'voices',
        present: ['Kell'],
        props: [],
        lastBeat: '',
        updatedTurn: 10,
        outdoor: true,
      },
      circling: { stale: {}, lastProgressTurn: 0 },
    } as unknown as GameState;
    const lines: string[] = [];
    for (let i = 0; i < 12; i++) {
      const r = nudgeIfStuck(s);
      lines.push(...r.receipts);
      s = { ...r.state, turn: (s.turn ?? 0) + 3, circling: { ...r.state.circling!, lastProgressTurn: s.turn ?? 0 } };
    }
    expect(lines.length).toBeGreaterThan(0);
    expect(new Set(lines).size).toBe(lines.length);
    expect(lines.join(' ')).not.toMatch(/noise close by|edge of your sight|new smell/i);
  });
});
