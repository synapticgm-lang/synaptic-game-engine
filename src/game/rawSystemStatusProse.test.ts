/**
 * Live fault (28 Nov 2026): LitRPG openings pasted STATUS: field = known into prose;
 * Read-the-device turns pasted sheet runs with empty labels (Name: —; 1;: incomplete).
 * Root cause: writer was taught STATUS: {field} = {value}, handed formatSystemBlock's
 * Known: parts list, and typedFreeText dumped ledgerSheetLine into ENGINE RESULT.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { formatGmVoiceForPrompt, LITRPG_SYSTEM_PERSONALITIES_SHOP, STATUS_CHROME_ENGINE_OWNED } from './gmVoiceProfile';
import { buildLitrpgSystemWindow } from './litrpgSystemWindow';
import { clampSystemHousing, SYSTEM_PART_IDS, type SystemHousingConfig, type SystemPartId } from './systemHousing';
import { resolveTypedFreeText } from './typedFreeText';
import type { GameState } from './types';

function partsOn(on: SystemPartId[]): SystemHousingConfig['parts'] {
  return Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, on.includes(p)])) as SystemHousingConfig['parts'];
}

function litrpg(over: Partial<GameState> = {}): GameState {
  const s = createInitialState('Story', 'litrpg', undefined, 'raw-status-test');
  return {
    ...s,
    campaignBibleId: 'summoned-pact',
    character: { ...s.character!, name: 'Luca Doyle', level: 1, xp: 0, xpToNext: 150 },
    log: [],
    turn: 1,
    ...over,
  } as GameState;
}

/** Pasteable STATUS / Known-parts syntax that landed in live openings. */
const RAW_STATUS_SYNTAX = /STATUS:\s*\w[\w ]*\s*=\s*(?:known|\d+|pending|none|empty|silent|unbound)/i;
const KNOWN_PARTS_DUMP = /Known:\s*(?:health|one power pool|level)/i;
const SYSTEM_SHOWS_DUMP = /(?:^|\n)SYSTEM:.*(?:It shows|Known:)/i;

describe('no raw System STATUS / readout text for LitRPG writers', () => {
  it('every LitRPG voice tells the writer the engine owns STATUS — never field=value chrome', () => {
    expect(STATUS_CHROME_ENGINE_OWNED).toMatch(/engine paints STATUS/i);
    expect(STATUS_CHROME_ENGINE_OWNED).not.toMatch(/STATUS:\s*\{field\}\s*=\s*\{value\}/);
    for (const p of LITRPG_SYSTEM_PERSONALITIES_SHOP) {
      const rail = formatGmVoiceForPrompt(p.id, { engineMode: 'litrpg' });
      expect(rail, p.id).toContain(STATUS_CHROME_ENGINE_OWNED);
      expect(rail, p.id).not.toMatch(/STATUS:\s*\{field\}\s*=\s*\{value\}/);
      expect(rail, p.id).not.toMatch(/"STATUS:\s*\{field\}/);
    }
  });

  it('writer-facing packets never carry SYSTEM: Known / It shows parts lists (world_status + worn_device)', () => {
    for (const housing of ['world_status', 'worn_device', 'private_window'] as const) {
      const state = litrpg({
        systemHousing: clampSystemHousing({
          housing,
          parts: partsOn(
            housing === 'world_status'
              ? ['health', 'power_pool', 'level', 'experience', 'weapon_copy', 'party_view']
              : ['health', 'power_pool', 'level', 'experience', 'quest_list']
          ),
        }),
      });
      const facing = formatWriterFacingEvent(buildCompletedEventPacket(state, 'Look around'));
      expect(facing, housing).not.toMatch(RAW_STATUS_SYNTAX);
      expect(facing, housing).not.toMatch(KNOWN_PARTS_DUMP);
      expect(facing, housing).not.toMatch(SYSTEM_SHOWS_DUMP);
      expect(facing, housing).toMatch(/^HOUSING:/m);
      expect(facing, housing).not.toMatch(/weapon copying = known|party view = known/i);
    }
  });

  it('Read the device / Check Status ENGINE RESULT is change-only — never a sheet run', () => {
    const state = litrpg({
      systemHousing: clampSystemHousing({
        housing: 'worn_device',
        parts: partsOn(['health', 'power_pool', 'level', 'experience', 'active_effects']),
      }),
      character: {
        ...litrpg().character!,
        name: '',
        attributes: { STR: 14, DEX: 12, CON: 14, INT: 12, WIS: 10, CHA: 10 },
      },
    });
    const typed = resolveTypedFreeText(state, 'Read the device');
    expect(typed.engineResult).toMatch(/First read|Changed since|Nothing changed/i);
    expect(typed.engineResult).not.toMatch(/System readout:/i);
    expect(typed.engineResult).not.toMatch(/Name:\s*—/);
    expect(typed.engineResult).not.toMatch(/Mark: Pactborn/);
    expect(typed.engineResult).not.toMatch(/STR 14/);

    const facing = formatWriterFacingEvent(buildCompletedEventPacket(state, 'Read the device'));
    expect(facing).not.toMatch(/Name:\s*—;\s*\d+;/);
    expect(facing).not.toMatch(/System readout:/i);
    expect(facing).toMatch(/DEVICE \(game chrome/);
  });

  it('painted system window lines always keep a non-empty label', () => {
    const unnamed = litrpg({
      character: { ...litrpg().character!, name: '' },
      systemHousing: clampSystemHousing({
        housing: 'worn_device',
        parts: partsOn(['health', 'power_pool', 'level', 'experience', 'active_effects']),
      }),
    });
    const win = buildLitrpgSystemWindow(unnamed);
    expect(win).not.toBeNull();
    for (const line of win!.lines) {
      const label = line.includes(':')
        ? line.slice(0, line.indexOf(':')).trim()
        : (line.match(/^(\S+)/)?.[1] ?? '');
      expect(label, line).not.toBe('');
      expect(line, line).not.toMatch(/^:\s/);
    }
    expect(win!.lines.some((l) => /^Name:\s*—$/.test(l))).toBe(true);
    expect(win!.lines.some((l) => /^Level:\s*\d+$/.test(l))).toBe(true);
    expect(win!.lines.some((l) => /^XP:\s*\d+\/\d+$/.test(l))).toBe(true);
  });
});
