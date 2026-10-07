import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildInfoSheet } from './infoSheet';
import { buildLitrpgSystemWindow, ledgerSheetLine } from './litrpgSystemWindow';
import { SYSTEM_PART_IDS, clampSystemHousing, writerFacts, type SystemHousingConfig, type SystemPartId } from './systemHousing';
import type { GameState } from './types';

function config(housing: SystemHousingConfig['housing'], on: SystemPartId[]): SystemHousingConfig {
  const parts = Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, on.includes(p)])) as Record<SystemPartId, boolean>;
  return { housing, parts };
}

function housed(housing: SystemHousingConfig): GameState {
  const state = createInitialState('Story', 'litrpg', undefined, 'housing-writer-facts');
  state.campaignBibleId = 'summoned-pact';
  state.character = { ...state.character!, name: 'Jax' };
  state.log = [];
  state.systemHousing = clampSystemHousing(housing);
  state.inventory = [
    { id: 'clothes', name: 'clothes', description: 'The clothes you had on when the light took you.', quantity: 1, equipped: true, slot: 'Body' },
  ] as GameState['inventory'];
  state.quests = [{
    id: 'sp-spine-cathedral-royal-vanguard', name: "The Crown's Meat Shield", description: 'Serve the vanguard',
    status: 'active', type: 'main', revealed: true,
    objectives: [{ id: 'o1', description: 'Report to High Priest Arus', completed: false }],
  }] as GameState['quests'];
  return state;
}

describe('housing writer facts', () => {
  it('leftover_pocket keeps the quest in the world, prints no quest list, and keeps worn clothes out of the pocket', () => {
    const state = housed(config('leftover_pocket', []));
    const open = buildInfoSheet(state).open.join('\n');
    expect(open).toContain("The Crown's Meat Shield");
    expect(open).toContain('Report to High Priest Arus');
    expect(open).not.toMatch(/no live quest step/);

    const window = buildLitrpgSystemWindow(state)!;
    expect(window.lines.join('\n')).not.toMatch(/quest|Meat Shield/i);
    expect(window.lines).toContain('Pocket: empty');
    expect(ledgerSheetLine(state)).toBe('Pocket: empty.');
    expect(writerFacts(state).blocks.join('\n')).not.toMatch(/Quest list/);
  });

  it('a stored item is listed in the pocket, a worn one is not', () => {
    const state = housed(config('leftover_pocket', []));
    state.inventory = [
      ...state.inventory,
      { id: 'coin', name: 'copper coin', description: '', quantity: 3, storedInPocket: true },
    ] as GameState['inventory'];
    expect(ledgerSheetLine(state)).toBe('Pocket: copper coin.');
  });

  it('a full housing is unchanged: quest list, level and XP still print', () => {
    const state = housed(config('private_window', ['skills', 'quest_list', 'pocket', 'shop']));
    expect(buildInfoSheet(state).open.join('\n')).toContain("The Crown's Meat Shield");
    const sheet = ledgerSheetLine(state);
    expect(sheet).toMatch(/^The window reads:/);
    expect(sheet).toContain("Quest: The Crown's Meat Shield, next: Report to High Priest Arus");
    const lines = buildLitrpgSystemWindow(state)!.lines;
    expect(lines.some((l) => /^Level /.test(l))).toBe(true);
    expect(lines.some((l) => /^XP /.test(l))).toBe(true);
    expect(writerFacts(state).blocks.join('\n')).toMatch(/Quest list: \[MAIN\] The Crown's Meat Shield \(active\)/);
  });
});
