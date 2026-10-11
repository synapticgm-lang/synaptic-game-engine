/**
 * Root B (seed 82) — looting the body of this scene's kill commits an outcome before the writer.
 * The fight already paid its drop, so the body holds nothing more; the chip is not offered again.
 */
import { describe, expect, it } from 'vitest';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { advanceDungeonCard } from './dungeonCard';
import { engineResultFact } from './engineResult';
import { compileChoices } from './choiceCompiler';
import { enumerateLegalEdges } from './graphChoices';
import type { GameState } from './types';

const FOE = 'Void-Touched Scavenger';

/** Seed 82 at T15: the scavenger dead by the wagon desk, its drop (5 gold, Worn Hand Axe) already carried. */
function t15(): GameState {
  const { state } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 82, personality: 'cold-system' });
  const s = stampOpening(state);
  return {
    ...s,
    turn: 15,
    currentLocation: 'the wagon desk of the Argent Ledger',
    journey: null,
    activeEncounter: undefined,
    activeDungeon: undefined,
    gold: (s.gold ?? 0) + 5,
    inventory: [...(s.inventory ?? []), { id: 'axe', name: 'Worn Hand Axe', rarity: 'Common', quantity: 1 }],
    sceneFacts: { ...s.sceneFacts!, lastKill: { name: FOE, outcome: 'victory', turn: 13, remains: true } },
  };
}

describe('s82 Root B — looting a body has an engine result', () => {
  it('T15 "Loot the body": a found-nothing-more receipt, the inventory unchanged', () => {
    const before = t15();
    expect(enumerateLegalEdges(before).map((e) => e.label)).toContain(`Loot the body of ${FOE}`);
    const t = advanceDungeonCard(before, `Loot the body of ${FOE}`);
    expect(engineResultFact(t.receipts)).toMatch(new RegExp(`^Search: you searched the body of ${FOE} and found nothing more`));
    expect(t.state.inventory).toEqual(before.inventory);
    expect(t.state.gold).toBe(before.gold);
    expect(t.state.sceneFacts?.lastKill?.looted).toBe(true);
  });

  it('the next list has no loot-the-body chip', () => {
    const t = advanceDungeonCard(t15(), `Loot the body of ${FOE}`);
    const next: GameState = { ...t.state, turn: 16 };
    const raw = enumerateLegalEdges(next).map((e) => e.label);
    expect(raw).not.toContain(`Loot the body of ${FOE}`);
    const { choices } = compileChoices(next, raw, undefined, `Loot the body of ${FOE}`);
    expect(choices.join(' | ')).not.toMatch(/loot the body/i);
  });

  it('other searches are not a body loot', () => {
    expect(advanceDungeonCard(t15(), 'Check the chest').receipts.join(' ')).not.toMatch(/body of/);
  });
});
