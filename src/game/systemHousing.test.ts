import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import {
  SYSTEM_PART_IDS,
  clampSystemHousing,
  formatSystemBlock,
  rollSystemHousing,
  type SystemHousingConfig,
  type SystemPartId,
} from './systemHousing';

const HOUSINGS = ['private_window', 'worn_device', 'world_status', 'leftover_pocket'];

function config(housing: SystemHousingConfig['housing'], on: SystemPartId[]): SystemHousingConfig {
  const parts = Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, on.includes(p)])) as Record<SystemPartId, boolean>;
  return { housing, parts };
}

function systemLine(text: string): string {
  return text.split('\n').find((l) => l.startsWith('SYSTEM:')) ?? '';
}

describe('system housing', () => {
  it('(a) same seed, same frozen housing; New Game stores it', () => {
    const a = rollSystemHousing('housing-a');
    expect(rollSystemHousing('housing-a')).toEqual(a);
    expect(HOUSINGS).toContain(a.housing);
    const state = createInitialState('Story', 'litrpg', undefined, 'housing-a');
    expect(state.systemHousing).toEqual(a);
    expect(HOUSINGS).toContain(rollSystemHousing('housing-b').housing);
    expect(createInitialState('Story', 'dnd', undefined, 'housing-a').systemHousing).toBeUndefined();
  });

  it('(b) forbidden parts never turn on', () => {
    for (const seed of ['s1', 's2', 's3', 'housing-a', 'housing-b', '42', '43', 'zz']) {
      const c = rollSystemHousing(seed);
      if (c.housing === 'private_window') {
        expect(c.parts.radio).toBe(false);
        expect(c.parts.map).toBe(false);
        expect(c.parts.weapon_copy).toBe(false);
      }
      expect(c.parts.base_building).toBe(false);
      expect(clampSystemHousing(c)).toEqual(c);
    }
    const forced = clampSystemHousing(config('private_window', ['radio', 'map', 'weapon_copy']));
    expect(forced.parts.radio).toBe(false);
    expect(forced.parts.map).toBe(false);
    expect(forced.parts.weapon_copy).toBe(false);
    expect(forced.parts.health).toBe(true);
  });

  it('(c) leftover pocket is only the pocket', () => {
    const c = clampSystemHousing(config('leftover_pocket', ['quest_list', 'health', 'level', 'experience']));
    expect(c.parts.pocket).toBe(true);
    expect(c.parts.quest_list).toBe(false);
    expect(c.parts.health).toBe(false);
    expect(c.parts.level).toBe(false);
    expect(c.parts.experience).toBe(false);
    expect(c.rule).toMatch(/thief/i);
    expect(formatSystemBlock(c)).toMatch(/thief/i);
  });

  it('(d) writer packet carries the SYSTEM paragraph of parts that are on', () => {
    const state = createInitialState('Story', 'litrpg', undefined, 'housing-a');
    state.systemHousing = clampSystemHousing(config('private_window', ['quest_list', 'radio', 'map']));
    const packet = buildCompletedEventPacket(state, 'Look around');
    const line = systemLine(formatWriterFacingEvent(packet));
    expect(line).toContain('SYSTEM:');
    expect(line).toMatch(/quest list/);
    expect(line).not.toMatch(/radio|map|weapon/i);
    expect(line).not.toMatch(/_/);

    const pocket = createInitialState('Story', 'litrpg', undefined, 'housing-a');
    pocket.systemHousing = clampSystemHousing(config('leftover_pocket', []));
    const pocketLine = systemLine(formatWriterFacingEvent(buildCompletedEventPacket(pocket, 'Look around')));
    expect(pocketLine).toContain('SYSTEM:');
    expect(pocketLine).toMatch(/pocket/);
    expect(pocketLine).not.toMatch(/quest/i);
  });
});
