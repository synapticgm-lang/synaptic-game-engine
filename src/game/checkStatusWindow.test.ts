/**
 * s73 K — Check Status: one ledger-read test decides the System block, and the window's own
 * field labels are not invented names. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { systemWindowFieldNames, withLitrpgSystemWindow } from './litrpgSystemWindow';
import { clampSystemHousing, SYSTEM_PART_IDS, type SystemHousingId, type SystemPartId } from './systemHousing';
import { classifyTokenLine, knownProperNames, type TokenBeat } from './tokenProse';
import type { GameState, Item, LogEntry } from './types';

const allParts = Object.fromEntries(SYSTEM_PART_IDS.map((p) => [p, true])) as Record<SystemPartId, boolean>;

const item = (id: string, name: string): Item => ({ id, name, quantity: 1 }) as Item;

const gmEntry = (turn: number, content: string): LogEntry =>
  ({ id: `gm${turn}`, turn, role: 'gm', content, timestamp: turn }) as LogEntry;

function summoned(housing: SystemHousingId): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'seed73',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Lowmarket',
    places: [{ id: 'lowmarket', name: 'Lowmarket' }],
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    npcMemories: [],
    companions: [],
    inventory: [item('i1', 'clothes'), item('i2', 'Bag')],
    character: { ...s.character!, name: 'Jax', level: 2, xp: 25, xpToNext: 225 },
    systemHousing: clampSystemHousing({ housing, parts: allParts }),
    openingEstablishment: {
      ...(s.openingEstablishment ?? {}),
      answers: { name: 'Jax' },
      pending: [],
      complete: true,
    } as GameState['openingEstablishment'],
    log: [gmEntry(16, 'Lowmarket hummed around the stalls.')],
    turn: 17,
    sceneFacts: { ...s.sceneFacts!, crowd: 'present', present: [] },
  } as GameState;
}

const WINDOW_REACT =
  'The window showed Name: Jax, Level 2, Pocket: clothes and Bag, Mark: Pactborn / Calamity Mark — unresolved, XP 25/225.';

const reactBeat = (text: string): TokenBeat => ({ refs: [], lines: [{ fn: 'react', text }] });

describe('s73 K — Check Status paints the System window', () => {
  it('private window: the GM entry gets the window with Level 2 and an XP line', () => {
    const s = summoned('private_window');
    const entry = withLitrpgSystemWindow(gmEntry(17, 'You looked inward.'), s, 'Check Status');
    expect(entry.systemWindow?.heading).toBe('SYSTEM');
    expect(entry.systemWindow?.lines).toContain('Level 2');
    expect(entry.systemWindow?.lines.some((l) => /^XP 25\/225$/.test(l))).toBe(true);
  });

  it('the writer packet still carries the WINDOW line', () => {
    const writer = formatWriterFacingEvent(buildCompletedEventPacket(summoned('private_window'), 'Check Status'));
    expect(writer).toMatch(/WINDOW \(game chrome[^)]*\): The window reads: Name: Jax; Level 2;[^\n]*XP 25\/225/);
  });

  it('a react line quoting Pocket and Mark is not dropped as capital', () => {
    const s = summoned('private_window');
    const beat = reactBeat(WINDOW_REACT);
    expect(classifyTokenLine(beat.lines[0]!, beat, [], knownProperNames(s))).toEqual({ ok: true });
  });

  it('a housing without a pocket does not whitelist Pocket', () => {
    const s = summoned('world_status');
    expect(systemWindowFieldNames(s)).not.toContain('Pocket');
    expect(knownProperNames(s)).not.toContain('Pocket');
    expect(systemWindowFieldNames(s)).toEqual(expect.arrayContaining(['Level', 'XP', 'Mark']));
    const beat = reactBeat(WINDOW_REACT);
    expect(classifyTokenLine(beat.lines[0]!, beat, [], knownProperNames(s))).toEqual({ ok: false, reason: 'capital' });
  });
});
