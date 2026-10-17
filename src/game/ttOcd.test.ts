/**
 * q43-OCD — headless fate path stamps offered-chip history (John 17 Oct 16:59).
 * Shared commitOfferedTurn = commitOfferedPad → stampOfferedChipChecks → rebind pad → recordReplayHash.
 * LitRPG/RPG 5-turn cooldown and tabletop 08:41 rule both read recentOfferedActions from that stamp.
 * Free-input chips stay on the offeredChips record and are never cooled. No word lists.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { checkChipKinds } from './chipCheck';
import { stampOfferedChipChecks } from './choicePipeline';
import { commitOfferedTurn, resolveOfferedChoices } from './playTranscript';
import {
  allocateAffordanceSlots,
  collectSceneAffordances,
  isOptionRepeat,
  REPEAT_COOLDOWN_TURNS,
} from './sceneAffordances';
import type { EngineMode, GameState, LogEntry, NpcMemory } from './types';

function npc(name: string, extra?: Partial<NpcMemory>): NpcMemory {
  return {
    npcId: `npc-${name.toLowerCase().replace(/\s+/g, '-')}`,
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    location: 'Camp',
    ...extra,
  };
}

function base(mode: EngineMode, extra?: Partial<GameState>): GameState {
  const s = createInitialState('Ria', mode);
  return {
    ...s,
    campaignBibleId: mode === 'dnd' ? 'cursed-keep' : mode === 'rpg' ? 'salt-road-heist' : 'summoned-pact',
    engineMode: mode,
    currentLocation: 'Camp',
    turn: 1,
    openingEstablishment: {
      ...(s.openingEstablishment as object),
      complete: true,
    } as GameState['openingEstablishment'],
    sceneFacts: {
      crowd: 'present',
      noise: 'quiet',
      present: ['Scout'],
      props: [],
      lastBeat: '',
      updatedTurn: 1,
    },
    npcMemories: [npc('Scout', { location: 'Camp' })],
    locationSheet: {
      name: 'Camp',
      interactables: [{ id: 'brush-1', name: 'the brush', state: 'closed', kind: 'prop' }],
      exits: [{ id: 'ex-road', label: 'the road' }],
      presentNpcIds: ['npc-scout'],
    },
    optionSceneKey: { placeId: 'Camp', presentIds: ['npc-scout'], eventSeq: 1 },
    log: [
      {
        id: 'gm-1',
        role: 'gm',
        content: 'The brush stirs at the camp edge.',
        timestamp: 1,
      } as LogEntry,
    ],
    ...extra,
  } as GameState;
}

/** Headless-style tape: commitOfferedTurn each beat (same shared step fateAutoplay uses). */
function runUnchangedSceneTape(mode: EngineMode, turns: number): Array<{
  turn: number;
  actionIds: string[];
  offeredChips: NonNullable<LogEntry['offeredChips']>;
  cooldownReturns: string[];
}> {
  let s = base(mode);
  const rows: Array<{
    turn: number;
    actionIds: string[];
    offeredChips: NonNullable<LogEntry['offeredChips']>;
    cooldownReturns: string[];
  }> = [];
  for (let t = 1; t <= turns; t++) {
    s = { ...s, turn: t, log: [{ id: `gm-${t}`, role: 'gm', content: 'Camp holds.', timestamp: t } as LogEntry] };
    s = commitOfferedTurn(s, `gm-${t}`);
    const gm = [...(s.log ?? [])].reverse().find((e) => e?.role === 'gm');
    const offeredChips = gm?.offeredChips ?? s.offeredPad?.chips ?? [];
    const actionIds = offeredChips.filter((c) => c.kind !== 'free-input' && c.kind !== 'exit').map((c) => c.actionId);
    rows.push({
      turn: t,
      actionIds,
      offeredChips,
      cooldownReturns: offeredChips.filter((c) => c.cooldownReturn === true).map((c) => c.actionId),
    });
  }
  return rows;
}

describe('q43-OCD shared offered-chip commit', () => {
  it('commitOfferedTurn stamps recentOfferedActions and offeredChips (fate path was missing this)', () => {
    let s = base('litrpg');
    expect(s.recentOfferedActions ?? []).toHaveLength(0);
    s = commitOfferedTurn(s, 'gm-1');
    expect((s.recentOfferedActions ?? []).length).toBeGreaterThan(0);
    const gm = s.log?.find((e) => e.id === 'gm-1');
    expect(gm?.offeredChips?.length).toBeGreaterThan(0);
    expect(gm?.offeredChips?.every((c) => c.label && c.actionId && c.kind)).toBe(true);
    expect(s.replayHashes?.length).toBeGreaterThan(0);
  });

  it('LitRPG 7-turn unchanged scene: non-exit chip at most on turns 1 and 6 (or cooldownReturn)', () => {
    expect(REPEAT_COOLDOWN_TURNS.litrpg).toBe(5);
    const rows = runUnchangedSceneTape('litrpg', 7);
    for (const row of rows) {
      expect(row.offeredChips.length).toBeGreaterThan(0);
      expect(row.offeredChips.some((c) => c.kind === 'free-input')).toBe(true);
    }
    // Pick one non-exit, non-free action that appeared on turn 1.
    const firstNonExit = rows[0]!.offeredChips.find(
      (c) => c.kind !== 'free-input' && c.kind !== 'exit' && !c.actionId.startsWith('free-input:'),
    );
    expect(firstNonExit).toBeTruthy();
    const id = firstNonExit!.actionId;
    const offers: number[] = [];
    for (const row of rows) {
      const hit = row.offeredChips.find((c) => c.actionId === id);
      if (hit && !hit.cooldownReturn) offers.push(row.turn);
    }
    // Without cooldownReturn fallback: at most turn 1 and turn 6+.
    for (const t of offers) {
      expect(t === 1 || t >= 6).toBe(true);
    }
    // Turns 2–5: either absent, or only via cooldownReturn floor.
    for (let t = 2; t <= 5; t++) {
      const hit = rows[t - 1]!.offeredChips.find((c) => c.actionId === id);
      if (hit) expect(hit.cooldownReturn === true).toBe(true);
    }
  });

  it('tabletop keeps only the 08:41 rule (cooldown 0): same chip may repeat every turn', () => {
    expect(REPEAT_COOLDOWN_TURNS.dnd).toBe(0);
    const waitId = 'object:brush-1:inspect';
    let s = base('dnd');
    s = stampOfferedChipChecks(s);
    // After one stamp, cooldown path must not suppress (tabletop cd=0); streak needs 5.
    expect(isOptionRepeat(s, waitId)).toBe(false);
    for (let t = 2; t <= 4; t++) {
      s = { ...s, turn: t, log: [{ id: `gm-${t}`, role: 'gm', content: 'Camp.', timestamp: t } as LogEntry] };
      s = stampOfferedChipChecks(s);
      expect(isOptionRepeat(s, waitId)).toBe(false);
    }
  });

  it('free-input chips are on the record and never enter recentOfferedActions', () => {
    let s = base('litrpg');
    s = commitOfferedTurn(s, 'gm-1');
    const chips = s.log?.find((e) => e.id === 'gm-1')?.offeredChips ?? [];
    const free = chips.filter((c) => c.kind === 'free-input');
    expect(free.length).toBeGreaterThanOrEqual(1);
    const hist = s.recentOfferedActions ?? [];
    const last = hist[hist.length - 1]!;
    for (const f of free) {
      expect(last.actionIds.includes(f.actionId)).toBe(false);
    }
  });

  it('allocateAffordanceSlots uses stamped history after commitOfferedTurn', () => {
    let s = base('litrpg');
    const all = collectSceneAffordances(s);
    const first = allocateAffordanceSlots(all, undefined, s);
    const target = first.find((a) => a.slotKind !== 'exit' && !a.required) ?? first.find((a) => a.slotKind !== 'exit');
    expect(target).toBeTruthy();
    s = commitOfferedTurn(s, 'gm-1');
    s = { ...s, turn: 2 };
    expect(isOptionRepeat(s, target!.actionId)).toBe(true);
    const again = allocateAffordanceSlots(collectSceneAffordances(s), undefined, s);
    expect(again.some((a) => a.actionId === target!.actionId)).toBe(true);
    s = commitOfferedTurn({ ...s, log: [{ id: 'gm-2', role: 'gm', content: 'Camp holds.', timestamp: 2 } as LogEntry] }, 'gm-2');
    const hit = (s.log?.find((e) => e.id === 'gm-2')?.offeredChips ?? []).find((c) => c.actionId === target!.actionId);
    if (hit) expect(hit.cooldownReturn).toBe(true);
  });

  it('stored pad after the cooldown stamp binds in engineChips (no dead-chip)', () => {
    let s = base('litrpg');
    s = { ...s, turn: 2 };
    s = commitOfferedTurn(s, 'gm-1');
    const offered = resolveOfferedChoices(s);
    expect(offered.length).toBeGreaterThan(0);
    expect(checkChipKinds(s, offered).filter((f) => f.kind === 'dead-chip')).toEqual([]);
    s = commitOfferedTurn(s, 'gm-1');
    const again = resolveOfferedChoices(s);
    expect(again.length).toBeGreaterThan(0);
    expect(checkChipKinds(s, again).filter((f) => f.kind === 'dead-chip')).toEqual([]);
  });
});
