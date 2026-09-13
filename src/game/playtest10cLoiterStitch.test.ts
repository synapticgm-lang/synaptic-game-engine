/**
 * 10c — diegetic inspect/wait stitch tiers + DeepSeek same-room history strip.
 * No CRAFT AUTHORITY injection. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { formatCraftSnapshotLines } from './craftBookCompiler';
import {
  assemblePacketStitch,
  buildCompletedEventPacket,
  collapseLoiterWriterBeats,
  formatWriterFacingEvent,
  nextLoiterStreaks,
  prepareRetrospectiveWriterInput,
} from './completedEventPacket';
import { initEncounterTerminal } from './encounterTerminalFsm';
import type { GameState } from './types';

function ruin(partial: Partial<GameState> = {}): GameState {
  const state = createInitialState('Loiter', 'litrpg');
  return {
    ...state,
    campaignBibleId: 'summoned-pact',
    turn: 8,
    currentLocation: 'half-collapsed loft',
    openingEstablishment: { ...state.openingEstablishment!, complete: true },
    sceneFacts: {
      ...emptySceneFacts(8),
      props: ['hatch'],
      searchedEmpty: [],
    },
    ...partial,
  };
}

describe('playtest10c — loiter stitch + writer strip', () => {
  it('HUD/BUILD stay on the 10 line and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(formatCraftSnapshotLines()).toEqual([]);
  });

  it('first look is tier 1; no same-edges recycle line', () => {
    const packet = buildCompletedEventPacket(ruin(), 'Look around');
    expect(packet.inspectStreak).toBe(1);
    const stitch = assemblePacketStitch(packet);
    expect(stitch).toMatch(/took in|studied|eyes went over/i);
    expect(stitch).toMatch(/half-collapsed loft/i);
    expect(stitch).not.toMatch(/same edges|already there|Nothing new stepped/i);
  });

  it('second look uses ledger focus; third+ stays exhausted', () => {
    const first = prepareRetrospectiveWriterInput(ruin(), 'Look around');
    expect(first.state.sceneFacts?.inspectStreak).toBe(1);
    const second = prepareRetrospectiveWriterInput(first.state, 'Inspect the room');
    expect(second.packet.inspectStreak).toBe(2);
    const t2 = assemblePacketStitch(second.packet);
    expect(t2).toMatch(/hatch/i);
    expect(t2).toMatch(/had not moved/i);

    const third = prepareRetrospectiveWriterInput(second.state, 'Look around');
    expect(third.packet.inspectStreak).toBe(3);
    const t3 = assemblePacketStitch(third.packet);
    expect(t3).toMatch(/hatch|nothing else to glean/i);

    const fourth = prepareRetrospectiveWriterInput(third.state, 'Look around');
    expect(fourth.packet.inspectStreak).toBe(4);
    expect(assemblePacketStitch(fourth.packet)).toBe(t3);
  });

  it('travel / talk / HERE change reset the streak', () => {
    const looked = prepareRetrospectiveWriterInput(ruin(), 'Look around');
    const talked = prepareRetrospectiveWriterInput(looked.state, 'Talk to Wren');
    expect(nextLoiterStreaks(talked.state, 'Talk to Wren')).toEqual({
      inspectStreak: 0,
      waitStreak: 0,
      loiterHere: 'half-collapsed loft',
    });

    const moved = {
      ...looked.state,
      currentLocation: 'lower landing',
      sceneFacts: { ...looked.state.sceneFacts!, loiterHere: 'half-collapsed loft', inspectStreak: 3 },
    };
    const afterMove = nextLoiterStreaks(moved, 'Look around');
    expect(afterMove.inspectStreak).toBe(1);
    expect(afterMove.loiterHere).toBe('lower landing');
  });

  it('live combat inspect stays on the fight bank and does not escalate room streak', () => {
    const base = ruin();
    const enc = initEncounterTerminal(
      {
        name: 'Pact-Hunter Skirmisher',
        level: 1,
        hp: 10,
        maxHp: 16,
        armorClass: 12,
        strength: 12,
        dexterity: 12,
        constitution: 12,
        xpReward: 25,
        goldReward: 0,
      },
      base
    );
    const fight = {
      ...base,
      activeEncounter: enc,
      sceneFacts: { ...emptySceneFacts(8), present: ['Pact-Hunter Skirmisher'] },
    };
    const packet = buildCompletedEventPacket(fight, 'Look around');
    expect(packet.inspectStreak).toBe(0);
    expect(assemblePacketStitch(packet)).toMatch(/fight|lane|eyes|reading/i);
  });

  it('same-room inspect ×2 strips the 500-char GM essay from the writer packet', () => {
    const essay = `The loft walls were timber and wet plaster. ${'Dust hung in the light. '.repeat(20)}`;
    expect(essay.length).toBeGreaterThan(200);
    const first = prepareRetrospectiveWriterInput(ruin(), 'Look around');
    const withEssay = {
      ...first.state,
      log: [
        ...(first.state.log ?? []),
        { id: 'g1', turn: 8, role: 'gm' as const, content: essay, timestamp: 8 },
      ],
    };
    const second = prepareRetrospectiveWriterInput(withEssay, 'Look around');
    expect(second.packet.inspectStreak).toBe(2);
    const facing = formatWriterFacingEvent(second.packet);
    expect(facing).toMatch(/HERE unchanged; inspect ×2/);
    expect(facing).not.toMatch(/wet plaster/);
    expect(facing).not.toMatch(/AUTHORITY:/);
    expect(collapseLoiterWriterBeats(second.packet)[0]).toMatch(/inspect ×2/);
    expect(formatCraftSnapshotLines(second.state)).toEqual([]);
  });
});
