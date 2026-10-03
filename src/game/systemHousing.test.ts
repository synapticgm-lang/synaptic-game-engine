import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import {
  SYSTEM_PART_IDS,
  WORLD_STATUS_WRITER_SENTENCE,
  clampSystemHousing,
  formatSystemBlock,
  housingFromSystemBlock,
  rollSystemHousing,
  systemHousingWriterClause,
  systemHousingWriterSentence,
  systemStatusChip,
  type SystemHousingConfig,
  type SystemPartId,
} from './systemHousing';
import type { GameState } from './types';

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
  it('chips name the frozen housing instead of always the panel', () => {
    expect(systemStatusChip('worn_device')).toBe('Read the device');
    expect(systemStatusChip('private_window')).toBe('Look inward');
    expect(systemStatusChip('world_status')).toBe('Ask the world');
    expect(systemStatusChip('leftover_pocket')).toBe('Reach into the pocket');
    expect(systemStatusChip(undefined)).toBe('Inspect the panel');
  });

  it('a worn_device packet is an object on the body, not a floating panel', () => {
    const state = createInitialState('Story', 'litrpg', undefined, 'worn-packet');
    state.character = { ...state.character!, name: 'Jax' };
    state.log = [];
    state.systemHousing = clampSystemHousing(config('worn_device', ['quest_list', 'radio']));
    state.sceneFacts = { ...state.sceneFacts!, props: ['blue panel'], present: [], lastBeat: '' };
    const text = formatWriterFacingEvent(buildCompletedEventPacket(state, 'Read the device'));
    expect(text.toLowerCase()).not.toMatch(/blue panel|empty air|only they could see/);
    expect(text).toMatch(/object on the body/);
    expect(text).toMatch(/Others can see the object/);
  });

  it('a private_window packet does not call it a worn object', () => {
    const state = createInitialState('Story', 'litrpg', undefined, 'private-packet');
    state.character = { ...state.character!, name: 'Jax' };
    state.log = [];
    state.systemHousing = clampSystemHousing(config('private_window', []));
    state.sceneFacts = { ...state.sceneFacts!, props: [], present: [], lastBeat: '' };
    const text = formatWriterFacingEvent(buildCompletedEventPacket(state, 'Look inward'));
    expect(text.toLowerCase()).not.toMatch(/worn object|worn device/);
    expect(text).toMatch(/only in the player's head/);
  });

  function worldStatus(): GameState {
    const state = createInitialState('Story', 'litrpg', undefined, 'world-packet');
    state.campaignBibleId = 'summoned-pact';
    state.character = { ...state.character!, name: 'Jax' };
    state.log = [];
    state.systemHousing = clampSystemHousing(config('world_status', ['quest_list', 'weapon_copy']));
    state.quests = [{
      id: 'q', name: 'Find the vault key', description: 'Search the rubble', status: 'active', type: 'main', revealed: true,
      objectives: [{ id: 'o', description: 'Search the rubble', completed: false }],
    }] as GameState['quests'];
    state.sceneFacts = { ...state.sceneFacts!, props: ['blue panel'], present: [], lastBeat: 'System panel is visible' };
    return state;
  }

  it('a world_status packet says there is no panel, device or window, and shows no quest', () => {
    expect(clampSystemHousing(config('world_status', ['quest_list'])).parts.quest_list).toBe(false);
    for (const action of ['Ask the world', 'Look around']) {
      const text = formatWriterFacingEvent(buildCompletedEventPacket(worldStatus(), action));
      expect(systemLine(text)).toContain(WORLD_STATUS_WRITER_SENTENCE);
      expect(text, action).not.toMatch(/blue panel|panel in the air|empty air|System window|panel read/i);
      expect(text, action).not.toMatch(/Quest: /);
    }
    const read = formatWriterFacingEvent(buildCompletedEventPacket(worldStatus(), 'Ask the world'));
    expect(read).toMatch(/Jax took stock of what the world knows of/);
    const status = read.split('\n').find((l) => l.startsWith('STATUS ('));
    expect(status).toContain('Known in the world:');
    expect(status).toContain(WORLD_STATUS_WRITER_SENTENCE);
    expect(status).not.toMatch(/vault key/);
  });

  it('a world_status ref enum and allowlist carry no blue panel', () => {
    const packet = buildCompletedEventPacket(worldStatus(), 'Look around');
    expect((packet.refEnum ?? []).some((r) => /blue panel/i.test(r.display) || r.klass === 'window')).toBe(false);
    expect(packet.allowlist.map((n) => n.toLowerCase())).not.toContain('blue panel');
  });

  it('only housing none keeps the blue panel in the writer packet', () => {
    const none = worldStatus();
    none.systemHousing = undefined;
    const refs = buildCompletedEventPacket(none, 'Look around').refEnum ?? [];
    expect(refs.some((r) => r.display === 'blue panel' && r.klass === 'window')).toBe(true);
  });

  it('no housing writer text calls the system a panel in the air or empty air', () => {
    for (const housing of ['private_window', 'worn_device', 'world_status', 'leftover_pocket'] as const) {
      const block = formatSystemBlock(config(housing, []));
      expect(block, housing).not.toMatch(/blue panel|panel in the air|empty air/i);
      expect(housingFromSystemBlock(block)).toBe(housing);
      expect(systemHousingWriterClause(housing), housing).not.toMatch(/blue panel|panel in the air|empty air/i);
      expect(systemHousingWriterSentence(housing), housing).not.toMatch(/blue panel|panel in the air|empty air/i);
    }
    expect(formatSystemBlock(config('leftover_pocket', []))).toMatch(/no status panel and no window/);
  });
});
