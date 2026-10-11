/**
 * Root C (seed 81) — outside a dungeon the engine decides a search or an opened chest before the writer.
 * Each one has an ENGINE RESULT, and anything found is in the inventory.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { advanceDungeonCard } from './dungeonCard';
import { engineResultFact } from './engineResult';
import type { GameState } from './types';

function atTheClose(turn: number): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 81, personality: 'cold-system' });
  const s = stampOpening(state);
  return { ...s, turn, currentLocation: 'Cathedral Close', journey: undefined, activeEncounter: undefined, activeDungeon: undefined };
}

/** The receipt names every find; each named item is now carried. */
function expectFindsCarried(before: GameState, after: GameState, receipts: string[]) {
  const head = receipts.find((r) => r.startsWith('Search:'))!;
  const gained = (after.inventory ?? []).slice((before.inventory ?? []).length);
  for (const item of gained) expect(head).toContain(item.name);
  if (!gained.length && (after.gold ?? 0) === (before.gold ?? 0)) expect(head).toMatch(/found nothing/);
}

describe('s81 Root C — a search outside a dungeon has an engine result', () => {
  it('T14 "Check the chest": ENGINE RESULT, finds carried, the chest is then empty', () => {
    const before = atTheClose(14);
    const t = advanceDungeonCard(before, 'Check the chest');
    expect(engineResultFact(t.receipts)).toMatch(/^Search: you opened the chest and found /);
    expectFindsCarried(before, t.state, t.receipts);
    expect(t.state.sceneFacts?.emptyContainers).toContain('chest');

    const again = advanceDungeonCard({ ...t.state, turn: 15 }, 'Check the chest');
    expect(engineResultFact(again.receipts)).toMatch(/found nothing new/);
    expect(again.state.inventory).toEqual(t.state.inventory);
  });

  it('T17 "Search the area": ENGINE RESULT, finds carried, a second search finds nothing new', () => {
    const before = atTheClose(17);
    const t = advanceDungeonCard(before, 'Search the area');
    expect(engineResultFact(t.receipts)).toMatch(/^Search: you searched Cathedral Close and found /);
    expectFindsCarried(before, t.state, t.receipts);

    const again = advanceDungeonCard({ ...t.state, turn: 18 }, 'Search the area');
    expect(engineResultFact(again.receipts)).toMatch(/found nothing new/);
  });

  it('looking around and checking your own bag are not searches of the world', () => {
    expect(advanceDungeonCard(atTheClose(5), 'Look around').receipts).toEqual([]);
    expect(advanceDungeonCard(atTheClose(5), 'Search my bag').receipts).toEqual([]);
  });
});
