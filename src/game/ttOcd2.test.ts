/**
 * q44-OCD2 — one pad cooldown for every chip source (John 17 Oct 17:58).
 * Keyed by actionId. No label word lists.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { agendaFromRole } from './npcMemory';
import { commitOfferedTurn } from './playTranscript';
import {
  applyOptionCooldown,
  computeOptionSceneKey,
  REPEAT_COOLDOWN_TURNS,
  type OptionCooldownChip,
} from './sceneAffordances';
import type { EngineMode, GameState, LogEntry, NpcMemory, Quest } from './types';

function scout(mode: 'litrpg' | 'rpg'): NpcMemory {
  const agenda = agendaFromRole({
    role: 'quest-patron',
    disposition: 'friendly',
    bindTarget: mode === 'litrpg' ? 'the System board' : 'the salt road',
  });
  return {
    npcId: 'npc-scout',
    npcName: 'Scout',
    disposition: 'friendly',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    location: 'Camp',
    roleHint: 'quest-patron',
    goal: agenda.goal,
    need: agenda.need,
    offer: agenda.offer,
    attitude: agenda.attitude,
    traits: agenda.traits,
    speechRegister: agenda.speechRegister,
  };
}

function questFor(mode: 'litrpg' | 'rpg'): Quest {
  const third =
    mode === 'rpg'
      ? { id: 'y', kind: 'contact' as const, label: 'Call on a standing contact for the lead', entityId: 'contact:s1' }
      : { id: 'y', kind: 'system' as const, label: 'Read the System trail', entityId: 'system:s1' };
  return {
    id: 'gen-ocd2',
    name: mode === 'rpg' ? 'A personal favour' : 'System bounty',
    description: 'Follow the open lead.',
    status: 'active',
    revealed: true,
    type: 'main',
    objectives: [
      {
        id: 's1',
        description: 'Find the lead',
        completed: false,
        placeId: 'Camp',
        routes: [
          { id: 'p', kind: 'person', label: 'Ask Scout about the lead', entityId: 'npc:Scout' },
          { id: 'o', kind: 'object', label: 'Search the brush', entityId: 'object:brush-1' },
          third,
        ],
      },
    ],
  } as Quest;
}

function base(mode: EngineMode): GameState {
  const play = mode === 'rpg' ? 'rpg' : mode === 'dnd' ? 'dnd' : 'litrpg';
  const s = createInitialState('Ria', play);
  const who = play === 'dnd' ? undefined : scout(play);
  return {
    ...s,
    campaignBibleId: play === 'dnd' ? 'cursed-keep' : play === 'rpg' ? 'salt-road-heist' : 'summoned-pact',
    engineMode: play,
    currentLocation: 'Camp',
    turn: 1,
    quests: play === 'dnd' ? s.quests : [questFor(play)],
    openingEstablishment: {
      ...(s.openingEstablishment as object),
      complete: true,
    } as GameState['openingEstablishment'],
    sceneFacts: {
      crowd: 'present',
      noise: 'quiet',
      present: who ? ['Scout'] : [],
      props: [],
      lastBeat: '',
      updatedTurn: 1,
    },
    npcMemories: who ? [who] : [],
    locationSheet: {
      name: 'Camp',
      interactables: [{ id: 'brush-1', name: 'the brush', state: 'closed', kind: 'prop' }],
      exits: [{ id: 'ex-road', label: 'the road' }],
      presentNpcIds: who ? ['npc-scout'] : [],
    },
    log: [{ id: 'gm-1', role: 'gm', content: 'The brush stirs at the camp edge.', timestamp: 1 } as LogEntry],
  } as GameState;
}

type Chip = NonNullable<LogEntry['offeredChips']>[number];

function buckets(c: Chip, mode: 'litrpg' | 'rpg'): string[] {
  const id = c.actionId;
  const tags: string[] = [];
  if (c.kind === 'free-input') tags.push('free');
  if (c.kind === 'exit' || c.kind === 'hub' || c.kind === 'journey' || id.startsWith('exit:')) tags.push('travel');
  if (id.endsWith(':talk')) tags.push('npc');
  if (mode === 'litrpg' && (id.endsWith(':skill') || id.endsWith(':system'))) tags.push('opt1m');
  if (mode === 'rpg' && (id.endsWith(':standing') || id.endsWith(':contact'))) tags.push('opt1m');
  if (id.endsWith(':agenda')) tags.push('opt2m');
  if (id.startsWith('quest-route:')) {
    tags.push('quest');
    tags.push('opt4m');
  }
  if (id.startsWith('object:') || id.startsWith('item:')) tags.push('affordance');
  if (c.kind === 'fallback' || c.kind === 'compiled' || c.kind === 'system') tags.push('generic');
  return tags;
}

function runTape(mode: 'litrpg' | 'rpg' | 'dnd', turns: number, alter?: (s: GameState, turn: number) => GameState) {
  let s = base(mode);
  const rows: Array<{ turn: number; offeredChips: Chip[] }> = [];
  for (let t = 1; t <= turns; t++) {
    s = {
      ...s,
      turn: t,
      log: [{ id: `gm-${t}`, role: 'gm', content: 'The camp holds.', timestamp: t } as LogEntry],
    };
    if (alter) s = alter(s, t);
    s = commitOfferedTurn(s, `gm-${t}`);
    const gm = s.log?.find((e) => e.id === `gm-${t}`);
    rows.push({ turn: t, offeredChips: gm?.offeredChips ?? [] });
  }
  return rows;
}

const SOURCES = ['affordance', 'npc', 'quest', 'opt1m', 'opt2m', 'opt4m', 'generic'] as const;

function assertCooldownTape(mode: 'litrpg' | 'rpg') {
  expect(REPEAT_COOLDOWN_TURNS[mode]).toBe(5);
  const rows = runTape(mode, 7);
  const first = rows[0]!.offeredChips;
  expect(first.length).toBeGreaterThan(0);
  const tracked = new Map<string, string>();
  for (let i = 0; i < first.length; i++) {
    const tags = buckets(first[i]!, mode);
    for (let t = 0; t < tags.length; t++) {
      const tag = tags[t]!;
      if (!tracked.has(tag)) tracked.set(tag, first[i]!.actionId);
    }
  }
  for (let i = 0; i < SOURCES.length; i++) {
    expect(tracked.has(SOURCES[i]!), `${mode} turn 1 missing ${SOURCES[i]}`).toBe(true);
  }
  expect(tracked.has('travel')).toBe(true);
  expect(tracked.has('free')).toBe(true);

  for (let s = 0; s < SOURCES.length; s++) {
    const id = tracked.get(SOURCES[s]!)!;
    for (let r = 0; r < rows.length; r++) {
      const hit = rows[r]!.offeredChips.find((c) => c.actionId === id);
      if (!hit || hit.cooldownReturn === true) continue;
      expect(rows[r]!.turn === 1 || rows[r]!.turn >= 6, `${mode} ${SOURCES[s]} ${id} on turn ${rows[r]!.turn}`).toBe(
        true,
      );
    }
  }
  for (let r = 0; r < rows.length; r++) {
    expect(rows[r]!.offeredChips.length).toBeGreaterThan(0);
    expect(rows[r]!.offeredChips.some((c) => c.kind === 'free-input')).toBe(true);
    expect(
      rows[r]!.offeredChips.some(
        (c) => c.kind === 'exit' || c.kind === 'hub' || c.kind === 'journey' || c.actionId.startsWith('exit:'),
      ),
    ).toBe(true);
  }
}

describe('q44-OCD2 pad cooldown', () => {
  it('LitRPG unchanged scene: every source at most on turns 1 and 6', () => {
    assertCooldownTape('litrpg');
  });

  it('RPG unchanged scene: every source at most on turns 1 and 6', () => {
    assertCooldownTape('rpg');
  });

  it('a scene change on turn 3 lets a cooled chip return', () => {
    const rows = runTape('litrpg', 3, (s, turn) => {
      if (turn < 3) return s;
      const people = (s.npcMemories ?? []).map((m) => ({ ...m, location: 'Road' }));
      return { ...s, currentLocation: 'Road', npcMemories: people };
    });
    const id = rows[0]!.offeredChips.find((c) => c.actionId.endsWith(':talk'))?.actionId;
    expect(id).toBeTruthy();
    const turn2 = rows[1]!.offeredChips.find((c) => c.actionId === id);
    if (turn2) expect(turn2.cooldownReturn).toBe(true);
    const turn3 = rows[2]!.offeredChips.find((c) => c.actionId === id);
    expect(turn3).toBeTruthy();
    expect(turn3!.cooldownReturn).not.toBe(true);
  });

  it('an active situation keeps its chip every turn', () => {
    const id = 'object:brush-1:inspect';
    const rows = runTape('litrpg', 5, (s) => ({
      ...s,
      activeSituation: { kind: 'search', id: 'brush', since: 1, actionIds: [id] },
    }));
    for (let i = 0; i < rows.length; i++) {
      const hit = rows[i]!.offeredChips.find((c) => c.actionId === id);
      expect(hit, `turn ${rows[i]!.turn}`).toBeTruthy();
      expect(hit!.cooldownReturn).not.toBe(true);
    }
  });

  it('fewer than 2 non-free chips brings back the least recent with cooldownReturn', () => {
    const s = { ...base('litrpg'), turn: 2 };
    const sk = computeOptionSceneKey(s);
    const sceneKey = `${sk.placeId}\0${sk.presentIds.join('\0')}\0${sk.eventSeq}`;
    s.recentOfferedActions = [
      {
        turn: 1,
        sceneKey,
        actionIds: ['object:brush-1:inspect', 'object:crate-1:inspect'],
      },
    ];
    s.optionSceneKey = sk;
    const pad: OptionCooldownChip[] = [
      { label: 'Inspect the brush', actionId: 'object:brush-1:inspect', kind: 'affordance', slotKind: 'object', required: false },
      { label: 'Inspect a crate', actionId: 'object:crate-1:inspect', kind: 'affordance', slotKind: 'object', required: false },
    ];
    const cooled = applyOptionCooldown({ ...s, currentLocation: 'Camp' }, pad);
    expect(cooled.length).toBeGreaterThanOrEqual(2);
    expect(cooled.every((c) => c.cooldownReturn === true)).toBe(true);
  });

  it('tabletop keeps the 08:41 rule and does not 5-turn-cool turns 2–4', () => {
    expect(REPEAT_COOLDOWN_TURNS.dnd).toBe(0);
    const rows = runTape('dnd', 5);
    const id =
      rows[0]!.offeredChips.find((c) => c.kind !== 'free-input' && !c.actionId.startsWith('exit:') && c.kind !== 'exit')
        ?.actionId ?? '';
    expect(id).toBeTruthy();
    for (let t = 2; t <= 4; t++) {
      const hit = rows[t - 1]!.offeredChips.find((c) => c.actionId === id);
      expect(hit, `tabletop turn ${t}`).toBeTruthy();
    }
  });
});
