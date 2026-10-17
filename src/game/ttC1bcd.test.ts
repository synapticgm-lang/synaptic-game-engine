/**
 * q37-C1bcd — TT-C1 part b cooldown only (John 17 Oct 12:48, mode switch 12:49).
 * OPT1-8: REPEAT_COOLDOWN_TURNS by mode inside C1b repeat-suppression.
 * Keyed by actionId + scene key (place, present, eventSeq). No word lists.
 *
 * Tabletop keeps only the 08:41 situation-aware streak rule (cooldown 0).
 * LitRPG / Story RPG: offered on turn N → not again before N+5 in an unchanged scene
 * unless activeSituation lists the actionId; exits never suppressed; floor ≥2 with
 * cooldownReturn on the offered-chip record.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createInitialState } from './defaults';
import {
  allocateAffordanceSlots,
  applyOptionCooldown,
  collectSceneAffordances,
  type OptionCooldownChip,
  isOptionRepeat,
  REPEAT_COOLDOWN_TURNS,
  stampRecentOfferedActions,
} from './sceneAffordances';
import type { EngineMode, GameState, NpcMemory } from './types';

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
    ...extra,
  } as GameState;
}

function offerThenAdvance(s: GameState, actionIds: string[], fromTurn: number): GameState {
  const stamped = stampRecentOfferedActions({ ...s, turn: fromTurn }, actionIds);
  return {
    ...stamped,
    turn: fromTurn + 1,
    optionSceneKey: s.optionSceneKey ?? {
      placeId: 'Camp',
      presentIds: ['npc-scout'],
      eventSeq: 1,
    },
    activeSituation: s.activeSituation,
    engineMode: s.engineMode,
    currentLocation: s.currentLocation,
  };
}

describe('q37-C1bcd OPT1-8 cooldown', () => {
  it('REPEAT_COOLDOWN_TURNS is tabletop 0, litrpg 5, rpg 5', () => {
    expect(REPEAT_COOLDOWN_TURNS.tabletop).toBe(0);
    expect(REPEAT_COOLDOWN_TURNS.dnd).toBe(0);
    expect(REPEAT_COOLDOWN_TURNS.litrpg).toBe(5);
    expect(REPEAT_COOLDOWN_TURNS.rpg).toBe(5);
  });

  it('OPT1-8 (a): LitRPG/RPG — offered turn 1 suppressed on 2–5, free on 6', () => {
    for (const mode of ['litrpg', 'rpg'] as const) {
      const waitId = 'object:brush-1:inspect';
      let s = base(mode);
      s = offerThenAdvance(s, [waitId], 1);
      for (let t = 2; t <= 5; t++) {
        expect(isOptionRepeat(s, waitId)).toBe(true);
        s = { ...s, turn: t + 1 };
      }
      expect(s.turn).toBe(6);
      expect(isOptionRepeat(s, waitId)).toBe(false);
    }
  });

  it('OPT1-8 (b): activeSituation stealth actionId is exempt every turn', () => {
    const sneakId = 'object:brush-1:inspect';
    let s = base('litrpg', {
      activeSituation: {
        kind: 'stealth',
        id: 'camp-approach',
        since: 1,
        actionIds: [sneakId],
      },
    });
    s = offerThenAdvance(s, [sneakId], 1);
    for (let t = 2; t <= 5; t++) {
      expect(isOptionRepeat(s, sneakId)).toBe(false);
      s = {
        ...offerThenAdvance(s, [sneakId], t),
        activeSituation: s.activeSituation,
      };
    }
  });

  it('OPT1-8 (c): scene change on turn 3 resets cooldown', () => {
    const id = 'object:brush-1:inspect';
    let s = base('litrpg');
    s = offerThenAdvance(s, [id], 1);
    expect(isOptionRepeat(s, id)).toBe(true);
    s = {
      ...s,
      turn: 3,
      currentLocation: 'Road',
      optionSceneKey: { placeId: 'Road', presentIds: ['npc-scout'], eventSeq: 1 },
    };
    expect(isOptionRepeat(s, id)).toBe(false);

    // New event (eventSeq) also resets.
    let s2 = base('rpg');
    s2 = offerThenAdvance(s2, [id], 1);
    s2 = {
      ...s2,
      turn: 3,
      optionSceneKey: { placeId: 'Camp', presentIds: ['npc-scout'], eventSeq: 2 },
    };
    expect(isOptionRepeat(s2, id)).toBe(false);
  });

  it('OPT1-8 (d): travel/leave exit chip is never suppressed', () => {
    const exitId = 'exit:ex-road:travel';
    let s = base('litrpg');
    s = offerThenAdvance(s, [exitId], 1);
    expect(isOptionRepeat(s, exitId, { slotKind: 'exit', required: true })).toBe(false);
    const slots = allocateAffordanceSlots(collectSceneAffordances(s), 5, s);
    expect(slots.some((c) => c.actionId === exitId)).toBe(true);
  });

  it('OPT1-8 (e): fewer than 2 chips → least-recent cooled returns with cooldownReturn', () => {
    // Solo optional props, no exit sheet — suppress both after one offer.
    const s0 = base('litrpg', {
      locationSheet: {
        name: 'Camp',
        interactables: [
          { id: 'brush-1', name: 'the brush', state: 'closed', kind: 'prop' },
          { id: 'crate-1', name: 'a crate', state: 'closed', kind: 'prop' },
        ],
        exits: [],
        presentNpcIds: [],
      },
      npcMemories: [],
      sceneFacts: {
        crowd: 'none',
        noise: 'quiet',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 1,
      },
      optionSceneKey: { placeId: 'Camp', presentIds: [], eventSeq: 1 },
    });
    const all = collectSceneAffordances(s0);
    const optIds = all.filter((a) => !a.required).map((a) => a.actionId);
    expect(optIds.length).toBeGreaterThanOrEqual(2);
    // Offer both on turn 1 (brush first = more recent in history if re-offered later).
    let s = offerThenAdvance(s0, optIds, 1);
    const optional = all.filter((a) => !a.required);
    const pad: OptionCooldownChip[] = [];
    for (let i = 0; i < optional.length; i++) {
      const a = optional[i]!;
      pad.push({
        label: a.label,
        actionId: a.actionId,
        kind: 'affordance',
        slotKind: a.slotKind,
        required: a.required,
      });
    }
    const cooled = applyOptionCooldown(s, pad);
    expect(cooled.length).toBeGreaterThanOrEqual(2);
    const returned = cooled.filter((c) => c.cooldownReturn === true);
    expect(returned.length).toBeGreaterThanOrEqual(1);
    // Least-recently offered among suppressed: first id in the stamp list has the same turn;
    // restore picks the earliest lastTurn (all turn 1) — at least one carries the flag.
    expect(returned.every((c) => optIds.includes(c.actionId))).toBe(true);
  });

  it('OPT1-8 (f): tabletop cooldown off — only 08:41 streak; stealth every turn', () => {
    const stealthId = 'object:brush-1:inspect';
    const waitId = 'wait:watch';
    let s = base('dnd', {
      activeSituation: {
        kind: 'stealth',
        id: 'camp-approach',
        since: 1,
        actionIds: [stealthId],
      },
    });
    // Same tape as (a): one offer does NOT cooldown-suppress on tabletop.
    s = offerThenAdvance(s, [stealthId, waitId], 1);
    expect(isOptionRepeat(s, stealthId)).toBe(false);
    expect(isOptionRepeat(s, waitId)).toBe(false);
    // Stealth stays every turn under activeSituation.
    for (let t = 2; t <= 5; t++) {
      s = {
        ...offerThenAdvance(s, [stealthId, waitId], t),
        activeSituation: {
          kind: 'stealth',
          id: 'camp-approach',
          since: 1,
          actionIds: [stealthId],
        },
      };
      expect(isOptionRepeat(s, stealthId)).toBe(false);
    }
    // Unchanged-scene Wait streak ≥5 still is a repeat (08:41).
    let plain = base('dnd', { activeSituation: null });
    for (let t = 1; t <= 5; t++) {
      plain = {
        ...stampRecentOfferedActions({ ...plain, turn: t }, [waitId]),
        turn: t,
        optionSceneKey: { placeId: 'Camp', presentIds: ['npc-scout'], eventSeq: 1 },
        activeSituation: null,
      };
    }
    expect(isOptionRepeat(plain, waitId)).toBe(true);
  });

  it('OPT1-8: no word list or label regex in cooldown / repeat logic', () => {
    const src = fs.readFileSync(path.join(__dirname, 'sceneAffordances.ts'), 'utf8');
    const start = src.indexOf('export const REPEAT_COOLDOWN_TURNS');
    const mid = src.indexOf('export function isOptionRepeat');
    const end = src.indexOf('stampRecentOfferedActions');
    // Constant + isOptionRepeat only (not chip label builders above).
    const block = src.slice(start, start + 200) + src.slice(mid, end);
    expect(block).not.toMatch(/\.test\(/);
    expect(block).not.toMatch(/new RegExp/);
    expect(block).not.toMatch(/Wait and watch|Scout for danger/);
  });
});
