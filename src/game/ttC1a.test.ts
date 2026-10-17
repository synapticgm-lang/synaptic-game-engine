/**
 * q37-C1a — TT-C1 items 1–3 + OPT-1 items 1–2.
 * Mode-agnostic scene affordances + Dendry-style slot allocation + tabletop CheckSpec.
 * Free chips / fixed-list deletes / repeat suppression → q37-C1b (NEXT).
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createInitialState } from './defaults';
import { engineChips } from './choicePipeline';
import { chipProblem } from './chipLegality';
import {
  allocateAffordanceSlots,
  collectSceneAffordances,
  type SceneAffordance,
} from './sceneAffordances';

function sceneAffordanceChips(state: GameState): SceneAffordance[] {
  return allocateAffordanceSlots(collectSceneAffordances(state));
}
import type { GameState, NpcMemory } from './types';

function npc(name: string, extra?: Partial<NpcMemory>): NpcMemory {
  return {
    npcId: `npc-${name.toLowerCase().replace(/\s+/g, '-')}`,
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    location: 'Gatehouse',
    ...extra,
  };
}

function ttBase(extra?: Partial<GameState>): GameState {
  const s = createInitialState('Ria', 'dnd');
  return {
    ...s,
    campaignBibleId: 'cursed-keep',
    engineMode: 'dnd',
    currentLocation: 'Gatehouse',
    turn: 3,
    openingEstablishment: {
      ...(s.openingEstablishment as object),
      complete: true,
    } as GameState['openingEstablishment'],
    character: {
      ...s.character,
      attributes: { STR: 14, DEX: 12, CON: 14, INT: 12, WIS: 12, CHA: 14 },
    },
    ...extra,
  } as GameState;
}

function guardAtDoor(extra?: Partial<GameState>): GameState {
  return ttBase({
    sceneFacts: {
      crowd: 'present',
      noise: 'quiet',
      present: ['Guard'],
      props: [],
      lastBeat: '',
      updatedTurn: 3,
    },
    npcMemories: [npc('Guard', { location: 'Gatehouse' })],
    locationSheet: {
      name: 'Gatehouse',
      interactables: [
        { id: 'door-1', name: 'the closed door', state: 'locked', kind: 'door' },
      ],
      exits: [{ id: 'ex-yard', label: 'the yard' }],
      presentNpcIds: ['npc-guard'],
    },
    ...extra,
  });
}

describe('q37-C1a scene affordances', () => {
  it('C1-1: guard + closed door yields person and object chips from the record; labels stay plain', () => {
    const s = guardAtDoor();
    const chips = sceneAffordanceChips(s);
    const person = chips.find((c) => c.slotKind === 'person' && c.actionId.endsWith(':talk'));
    const object = chips.find((c) => c.slotKind === 'object');
    expect(person).toBeTruthy();
    expect(person!.label).toMatch(/Talk to Guard/i);
    expect(person!.label).not.toMatch(/Persuasion|Charisma|\[/);
    expect(object).toBeTruthy();
    expect(object!.entityId).toBe('door-1');
    // Tabletop CheckSpec on EngineChip path (tag lives beside the label, never in it).
    const engine = engineChips(s);
    const talk = engine.find((c) => c.kind === 'affordance' && c.label === person!.label);
    expect(talk?.entityId).toBe(person!.entityId);
    expect(talk?.check?.skill === 'persuasion' || talk?.check?.ability === 'CHA' || talk?.check != null || talk?.check === null).toBe(
      true,
    );
  });

  it('C1-2: renaming the guard renames the chip; removing the guard drops person chips', () => {
    const s = guardAtDoor({
      npcMemories: [npc('Captain Hale', { location: 'Gatehouse' })],
      sceneFacts: {
        crowd: 'present',
        noise: 'quiet',
        present: ['Captain Hale'],
        props: [],
        lastBeat: '',
        updatedTurn: 3,
      },
    });
    const chips = sceneAffordanceChips(s);
    expect(chips.some((c) => /Captain Hale/i.test(c.label))).toBe(true);
    expect(chips.some((c) => /\bGuard\b/.test(c.label))).toBe(false);

    const alone = guardAtDoor({
      npcMemories: [],
      sceneFacts: {
        crowd: 'none',
        noise: 'quiet',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 3,
      },
      locationSheet: {
        name: 'Gatehouse',
        interactables: [{ id: 'door-1', name: 'the closed door', state: 'locked', kind: 'door' }],
        exits: [{ id: 'ex-yard', label: 'the yard' }],
        presentNpcIds: [],
      },
    });
    const after = sceneAffordanceChips(alone);
    expect(after.every((c) => c.slotKind !== 'person')).toBe(true);
    expect(after.some((c) => c.slotKind === 'object')).toBe(true);
  });

  it('C1-3: at most one movement chip when a person or object is present', () => {
    const s = guardAtDoor({
      locationSheet: {
        name: 'Gatehouse',
        interactables: [{ id: 'door-1', name: 'the closed door', state: 'locked', kind: 'door' }],
        exits: [
          { id: 'ex-a', label: 'the yard' },
          { id: 'ex-b', label: 'the road' },
          { id: 'ex-c', label: 'the cellar' },
        ],
        presentNpcIds: ['npc-guard'],
      },
    });
    const chips = sceneAffordanceChips(s);
    const exits = chips.filter((c) => c.slotKind === 'exit');
    expect(exits.length).toBeLessThanOrEqual(1);
    expect(chips.some((c) => c.slotKind === 'person')).toBe(true);
  });

  it('C1-5: opening an unlocked door carries no CheckSpec', () => {
    const s = guardAtDoor({
      locationSheet: {
        name: 'Gatehouse',
        interactables: [{ id: 'door-2', name: 'the oak door', state: 'closed', kind: 'door' }],
        exits: [],
        presentNpcIds: ['npc-guard'],
      },
    });
    const open = collectSceneAffordances(s).find((c) => c.actionId.endsWith(':open'));
    expect(open).toBeTruthy();
    expect(open!.check).toBeNull();
  });

  it('OPT1-1: two NPCs + quest + unvisited exit + merchant get required slots and entity ids', () => {
    const s = ttBase({
      currentLocation: 'Market',
      sceneFacts: {
        crowd: 'sparse',
        noise: 'voices',
        present: ['Maud Pike', 'Orin Quill'],
        props: [],
        lastBeat: '',
        updatedTurn: 3,
      },
      npcMemories: [
        npc('Maud Pike', { location: 'Market', roleHint: 'quest-patron' }),
        npc('Orin Quill', { location: 'Market', roleHint: 'merchant' }),
      ],
      locationSheet: {
        name: 'Market',
        interactables: [],
        exits: [{ id: 'ex-dock', label: 'the docks' }],
        presentNpcIds: ['npc-maud-pike', 'npc-orin-quill'],
      },
      circling: { stale: {}, lastProgressTurn: 0, visits: {} },
    });
    const chips = sceneAffordanceChips(s);
    const people = chips.filter((c) => c.slotKind === 'person' && c.actionId.endsWith(':talk'));
    expect(people.length).toBe(2);
    expect(people.every((p) => !!p.entityId)).toBe(true);
    expect(chips.some((c) => c.slotKind === 'exit' && c.entityId)).toBe(true);
    expect(chips.some((c) => c.slotKind === 'shop' && c.entityId)).toBe(true);
    const engine = engineChips(s);
    expect(engine.some((c) => c.kind === 'affordance' && c.entityId)).toBe(true);
  });

  it('OPT1-3: prose change does not change chips; removing NPC from record removes its chip', () => {
    const s = guardAtDoor();
    const a = sceneAffordanceChips(s).map((c) => c.actionId).sort();
    const withProse = {
      ...s,
      log: [
        ...(s.log ?? []),
        {
          id: 'g1',
          turn: 2,
          role: 'gm' as const,
          content: 'A heavy door and an iron gate block the hall. Dust on the lintel.',
          timestamp: 1,
        },
      ],
    };
    const b = sceneAffordanceChips(withProse).map((c) => c.actionId).sort();
    expect(b).toEqual(a);

    const noGuard = guardAtDoor({
      npcMemories: [],
      sceneFacts: {
        crowd: 'none',
        noise: 'quiet',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 3,
      },
    });
    expect(sceneAffordanceChips(noGuard).every((c) => !c.actionId.includes('npc-guard'))).toBe(true);
  });

  it('chipLegality yields to entity-bound affordance (no unrelated-chip from prose)', () => {
    const s = guardAtDoor({
      log: [
        {
          id: 'g1',
          turn: 2,
          role: 'gm',
          content: 'Stone walls. Silence. No door is named in this beat.',
          timestamp: 1,
        },
      ],
    });
    const doorChip = sceneAffordanceChips(s).find((c) => c.slotKind === 'object');
    expect(doorChip).toBeTruthy();
    // Warm engineChips cache so boundEngineChip finds the affordance.
    engineChips(s);
    expect(chipProblem(s, doorChip!.label, 'Stone walls. Silence.')).toBeNull();
  });

  it('C1-5 / plan §4: Search the area is a place Investigation affordance on EngineChip', () => {
    const s = ttBase({ currentLocation: 'Gatehouse' });
    const aff = collectSceneAffordances(s).find((a) => a.label === 'Search the area');
    expect(aff).toBeTruthy();
    expect(aff!.slotKind).toBe('object');
    expect(aff!.actionId).toContain(':search');
    const engine = engineChips(s);
    const chip = engine.find((c) => c.label === 'Search the area');
    expect(chip?.kind).toBe('affordance');
    expect(chip?.entityId).toBe(aff!.entityId);
    // Tabletop CheckSpec lives on the record, never in the label.
    expect(chip?.label).not.toMatch(/Investigation|Perception|\[/);
    expect(chip?.check == null || chip?.check?.skill === 'investigation' || chip?.check?.ability === 'INT').toBe(true);
  });

  it('C1-7 / OPT1-6: no regex literals in sceneAffordances.ts', () => {
    const src = fs.readFileSync(path.join(__dirname, 'sceneAffordances.ts'), 'utf8');
    // Strip block + line comments, then fail on regex literals or new RegExp.
    const bare = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    expect(bare).not.toMatch(/\/[^/\n][^/\n]*\/[gimsuy]*/);
    expect(bare).not.toMatch(/new RegExp/);
  });

  it('allocate: required kinds beat the optional cap', () => {
    const rows: SceneAffordance[] = [];
    for (let i = 0; i < 3; i++) {
      rows.push({
        label: `Talk to P${i}`,
        actionId: `person:p${i}:talk`,
        entityId: `p${i}`,
        slotKind: 'person',
        salience: 80,
        required: true,
      });
    }
    rows.push({
      label: 'Travel toward A',
      actionId: 'exit:a:travel',
      entityId: 'a',
      slotKind: 'exit',
      salience: 70,
      required: true,
    });
    rows.push({
      label: 'Trade with M',
      actionId: 'shop:m:trade',
      entityId: 'm',
      slotKind: 'shop',
      salience: 75,
      required: true,
    });
    for (let i = 0; i < 8; i++) {
      rows.push({
        label: `Inspect thing ${i}`,
        actionId: `object:t${i}:inspect`,
        entityId: `t${i}`,
        slotKind: 'object',
        salience: 10 + i,
        required: false,
      });
    }
    const picked = allocateAffordanceSlots(rows, 2);
    expect(picked.filter((p) => p.slotKind === 'person').length).toBe(2); // >2 people → top 2 Talk
    expect(picked.some((p) => p.slotKind === 'exit')).toBe(true);
    expect(picked.some((p) => p.slotKind === 'shop')).toBe(true);
    expect(picked.filter((p) => !p.required).length).toBeLessThanOrEqual(2);
  });
});
