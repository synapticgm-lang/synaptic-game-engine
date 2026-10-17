/**
 * q44-OCD2 — one pad cooldown for every chip source (John 17 Oct 17:58).
 * Keyed by actionId. No label word lists.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { agendaFromRole } from './npcMemory';
import { commitOfferedPad, commitOfferedTurn } from './playTranscript';
import { exitPlaceNames } from './placeNames';
import {
  applyOptionCooldown,
  computeOptionSceneKey,
  isWayOut,
  REPEAT_COOLDOWN_TURNS,
  WAY_OUT_PAD_CAP,
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
      // q45-OCD3: exit label must be a reachable hub for this bible (commitTravel / wayOutMovesPlayer).
      exits: [
        {
          id: 'ex-road',
          label: play === 'dnd' ? 'Greyhollow Inn' : play === 'rpg' ? 'Safehouse Alley' : 'Lowmarket',
        },
      ],
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
    const source = SOURCES[i]!;
    // A generic is on the pad only when the offered list still has room for one.
    if (source === 'generic' && !tracked.has(source)) continue;
    expect(tracked.has(source), `${mode} turn 1 missing ${source}`).toBe(true);
  }
  if (mode === 'rpg') expect(tracked.has('generic'), 'rpg turn 1 missing generic').toBe(true);
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
    const bare = {
      ...s,
      places: [{ id: 'camp', name: 'Camp', cardBuiltTurn: 1, exits: [] }],
      locationSheet: { ...s.locationSheet!, exits: [] },
      sceneFacts: { ...s.sceneFacts!, indoor: true },
    };
    const cooled = applyOptionCooldown(bare, pad);
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


function routeNames(state: GameState): string[] {
  const names: string[] = [];
  const sheet = state.locationSheet?.exits ?? [];
  for (let i = 0; i < sheet.length; i++) {
    const label = (sheet[i]?.label ?? '').trim();
    if (label) names.push(label);
  }
  const card = exitPlaceNames(state);
  for (let i = 0; i < card.length; i++) {
    const label = (card[i] ?? '').trim();
    if (label && !names.includes(label)) names.push(label);
  }
  return names;
}

function pointsAtRoute(chip: { label: string; actionId: string }, names: string[]): boolean {
  for (let i = 0; i < names.length; i++) {
    const name = names[i]!;
    if (chip.actionId.includes(name) || chip.label.endsWith(name)) return true;
  }
  return false;
}

describe('q44b-OCD2x way out', () => {
  it('a place with no exits and no travel adds nothing', () => {
    const s = {
      ...base('litrpg'),
      currentLocation: 'Bare Room',
      places: [{ id: 'bare', name: 'Bare Room', cardBuiltTurn: 1, exits: [] }],
      locationSheet: { name: 'Bare Room', interactables: [], exits: [], presentNpcIds: [] },
      sceneFacts: { crowd: 'alone', noise: 'quiet', present: [], props: [], lastBeat: '', updatedTurn: 1, indoor: true },
    } as unknown as GameState;
    const pad: OptionCooldownChip[] = [
      { label: 'Talk to Scout', actionId: 'npc:Scout:talk', kind: 'affordance', slotKind: 'person', rank: 80 },
    ];
    const cooled = applyOptionCooldown(s, pad);
    expect(cooled.map((c) => c.actionId)).toEqual(['npc:Scout:talk']);
    expect(cooled.some(isWayOut)).toBe(false);
  });

  it('a pad that already has a moving travel chip is unchanged', () => {
    const s = base('litrpg');
    const pad: OptionCooldownChip[] = [
      { label: 'Talk to Scout', actionId: 'npc:Scout:talk', kind: 'affordance', slotKind: 'person', rank: 80 },
      {
        label: 'Travel toward Lowmarket',
        actionId: 'exit:ex-road:travel',
        kind: 'exit',
        slotKind: 'exit',
        rank: 70,
      },
    ];
    const cooled = applyOptionCooldown(s, pad);
    expect(cooled.map((c) => c.actionId)).toEqual(pad.map((c) => c.actionId));
    expect(cooled.map((c) => c.label)).toEqual(pad.map((c) => c.label));
  });

  it('tabletop, litrpg and rpg each keep a way out', () => {
    const modes = ['dnd', 'litrpg', 'rpg'] as const;
    for (let i = 0; i < modes.length; i++) {
      const s = base(modes[i]!);
      const pad: OptionCooldownChip[] = [
        { label: 'Talk to Scout', actionId: 'npc:Scout:talk', kind: 'affordance', slotKind: 'person', rank: 40 },
        { label: 'Say something…', actionId: 'free-input:say', kind: 'free-input', rank: 0 },
      ];
      const cooled = applyOptionCooldown(s, pad);
      const way = cooled.find(isWayOut);
      expect(way, modes[i]).toBeTruthy();
      expect(pointsAtRoute(way!, routeNames(s))).toBe(true);
    }
  });

  it('a full pad replaces the lowest-ranked non-free non-situation chip', () => {
    const s = base('litrpg');
    const pad: OptionCooldownChip[] = [
      { label: 'Say something…', actionId: 'free-input:say', kind: 'free-input', rank: 0 },
      {
        label: 'Search the brush',
        actionId: 'object:brush-1:inspect',
        kind: 'affordance',
        slotKind: 'object',
        rank: 1,
      },
    ];
    s.activeSituation = { kind: 'search', id: 'sit', since: 1, actionIds: ['quest:keep:act'] };
    pad.push({ label: 'Follow the lead', actionId: 'quest:keep:act', kind: 'affordance', slotKind: 'quest', rank: 0 });
    for (let i = pad.length; i < WAY_OUT_PAD_CAP; i++) {
      pad.push({
        label: `Inspect mark ${i}`,
        actionId: `object:mark-${i}:inspect`,
        kind: 'affordance',
        slotKind: 'object',
        rank: 10 + i,
      });
    }
    const cooled = applyOptionCooldown(s, pad);
    expect(cooled.length).toBe(WAY_OUT_PAD_CAP);
    expect(cooled.some((c) => c.actionId === 'free-input:say')).toBe(true);
    expect(cooled.some((c) => c.actionId === 'quest:keep:act')).toBe(true);
    expect(cooled.some((c) => c.actionId === 'object:brush-1:inspect')).toBe(false);
    expect(cooled.some(isWayOut)).toBe(true);
  });

  it('mega 19051 T85 and T94 rebuild a way out of The Weighing Cup', async () => {
    const t85 = (await import('./__fixtures__/mega19051-t85.json')).default as {
      before: GameState;
    };
    const t94 = (await import('./__fixtures__/mega19051-t94.json')).default as {
      before: GameState;
    };
    for (const fix of [t85, t94]) {
      const before = { ...fix.before, offeredPad: null };
      const next = commitOfferedPad(before);
      const chips = next.offeredPad?.chips ?? [];
      const labels = next.offeredPad?.choices ?? [];
      const way = chips.find(isWayOut);
      expect(way, before.currentLocation).toBeTruthy();
      const names = routeNames(before);
      expect(names.length).toBeGreaterThan(0);
      expect(pointsAtRoute(way!, names)).toBe(true);
      expect(labels.some((label) => label === way!.label)).toBe(true);
    }
  }, 20000);
});

function isAlleySocial(c: { actionId: string }): boolean {
  const id = c.actionId;
  const person = id.includes('hobb-dunmore') || id.includes('sefa-crane');
  return person && (id.endsWith(':talk') || id.endsWith(':agenda') || id.endsWith(':standing'));
}

describe('q44c-OCD2y offered pad', () => {
  it('mega 19052 T100 rebuilds a way out of Safehouse Alley', async () => {
    const fix = (await import('./__fixtures__/mega19052-t100.json')).default as {
      before: GameState;
      offeredPad: { choices: string[] };
    };
    expect(fix.offeredPad.choices.some((c) => c.startsWith('Travel toward'))).toBe(false);
    const before = { ...fix.before, offeredPad: null };
    const next = commitOfferedPad(before);
    const chips = next.offeredPad?.chips ?? [];
    const labels = next.offeredPad?.choices ?? [];
    const way = chips.find(isWayOut);
    expect(way).toBeTruthy();
    const names = routeNames(before);
    expect(names.length).toBeGreaterThan(0);
    expect(pointsAtRoute(way!, names)).toBe(true);
    expect(labels.some((label) => label === way!.label)).toBe(true);
  });

  it('Hobb and Sefa talk, ask, and standing chips cool across 6 unchanged turns', async () => {
    const fix = (await import('./__fixtures__/mega19052-t100.json')).default as { before: GameState };
    const places = (fix.before.places ?? []).map((p) => {
      const next = { ...p };
      delete (next as { sceneLedger?: unknown }).sceneLedger;
      return next;
    });
    let s = { ...fix.before, offeredPad: null, places, log: [] } as GameState;
    const seen = new Map<string, number[]>();
    for (let t = 0; t < 6; t++) {
      s = {
        ...s,
        turn: (fix.before.turn ?? 100) + t,
        log: [{ id: 'gm-x', role: 'gm', content: 'The alley holds.', timestamp: t } as LogEntry],
      };
      s = commitOfferedTurn(s, 'gm-x');
      const chips = s.offeredPad?.chips ?? [];
      for (let i = 0; i < chips.length; i++) {
        const c = chips[i]!;
        if (!isAlleySocial(c)) continue;
        if (c.cooldownReturn === true) continue;
        const turns = seen.get(c.actionId) ?? [];
        turns.push(t + 1);
        seen.set(c.actionId, turns);
      }
    }
    expect(seen.size).toBeGreaterThan(0);
    for (const [id, turns] of seen) {
      for (let i = 0; i < turns.length; i++) {
        expect(turns[i] === 1 || turns[i] === 6, `${id} on replay turn ${turns[i]}`).toBe(true);
      }
    }
  }, 20000);

  it('a pad truncated to its cap still keeps one way out', async () => {
    const fix = (await import('./__fixtures__/mega19052-t100.json')).default as { before: GameState };
    const s = { ...fix.before, offeredPad: null } as GameState;
    const pad: OptionCooldownChip[] = [];
    for (let i = 0; i < WAY_OUT_PAD_CAP; i++) {
      pad.push({
        label: `Talk ${i}`,
        actionId: `person:npc-${i}:talk`,
        kind: 'affordance',
        slotKind: 'person',
        rank: WAY_OUT_PAD_CAP - i,
      });
    }
    const cooled = applyOptionCooldown(s, pad);
    expect(cooled.length).toBe(WAY_OUT_PAD_CAP);
    const way = cooled.find(isWayOut);
    expect(way).toBeTruthy();
    expect(pointsAtRoute(way!, routeNames(s))).toBe(true);
    expect(cooled.some((c) => c.actionId === 'person:npc-0:talk')).toBe(true);
    expect(cooled.some((c) => c.actionId === `person:npc-${WAY_OUT_PAD_CAP - 1}:talk`)).toBe(false);
  });
});
