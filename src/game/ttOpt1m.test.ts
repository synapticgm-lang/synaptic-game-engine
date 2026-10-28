/**
 * q42-OPT1m — OPT-1 LitRPG / Story RPG adapters.
 * LitRPG: skill + system actions on the same entities; RPG: standing + contact.
 * Labels stay plain (feature-groups-plan §4). missing-chip-kind kept.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createInitialState } from './defaults';
import { engineChips } from './choicePipeline';
import { checkChipKinds } from './chipCheck';
import {
  allocateAffordanceSlots,
  affordanceEntityPresent,
  collectSceneAffordances,
  affordancesCoverGenerics,
} from './sceneAffordances';
import type { GameState, NpcMemory, Quest } from './types';

function npc(name: string, extra?: Partial<NpcMemory>): NpcMemory {
  return {
    npcId: `npc-${name.toLowerCase().replace(/\s+/g, '-')}`,
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    location: 'Market',
    ...extra,
  };
}

function modeBase(mode: 'litrpg' | 'rpg', extra?: Partial<GameState>): GameState {
  const s = createInitialState(mode === 'litrpg' ? 'Jax' : 'Ria', mode);
  return {
    ...s,
    campaignBibleId: mode === 'litrpg' ? 'summoned-pact' : 'salt-road-heist',
    engineMode: mode,
    currentLocation: 'Market',
    turn: 4,
    // T10D: RPG origin owns the pad until recorded; adapters assert post-setup standing/contact.
    character: mode === 'rpg' ? { ...s.character, origin: 'sage' } : s.character,
    openingEstablishment: {
      ...(s.openingEstablishment as object),
      complete: true,
    } as GameState['openingEstablishment'],
    ...extra,
  } as GameState;
}

function twoNpcScene(mode: 'litrpg' | 'rpg', extra?: Partial<GameState>): GameState {
  return modeBase(mode, {
    sceneFacts: {
      crowd: 'sparse',
      noise: 'voices',
      present: ['Maud Pike', 'Orin Quill'],
      props: ['crate'],
      lastBeat: '',
      updatedTurn: 4,
    },
    npcMemories: [
      npc('Maud Pike', { location: 'Market', roleHint: 'quest-patron', disposition: 'friendly' }),
      npc('Orin Quill', { location: 'Market', roleHint: 'merchant', disposition: 'friendly' }),
    ],
    locationSheet: {
      name: 'Market',
      interactables: [{ id: 'door-1', name: 'the side door', state: 'locked', kind: 'door' }],
      exits: [{ id: 'ex-dock', label: 'the docks' }],
      presentNpcIds: ['npc-maud-pike', 'npc-orin-quill'],
    },
    circling: { stale: {}, lastProgressTurn: 0, visits: {} },
    ...extra,
  });
}

describe('q42-OPT1m LitRPG / RPG affordance adapters', () => {
  it('OPT1-1 LitRPG: two NPCs + exit + merchant get person/exit/shop; skill and system on each person', () => {
    const s = twoNpcScene('litrpg');
    const all = collectSceneAffordances(s);
    const slots = allocateAffordanceSlots(all);
    expect(slots.filter((c) => c.slotKind === 'person' && c.actionId.endsWith(':talk')).length).toBe(2);
    expect(slots.some((c) => c.slotKind === 'exit' && c.entityId)).toBe(true);
    expect(slots.some((c) => c.slotKind === 'shop' && c.entityId)).toBe(true);

    const skill = all.find((c) => c.actionId.endsWith(':skill') && c.label.includes('Maud'));
    const system = all.find((c) => c.actionId.endsWith(':system') && c.label.includes('Maud'));
    expect(skill).toBeTruthy();
    expect(skill!.label).toBe('Read Maud Pike');
    expect(skill!.label).not.toMatch(/\[|Persuasion|Novice|Apprentice/);
    expect(skill!.check == null || typeof skill!.check?.dc === 'number').toBe(true);
    expect(system).toBeTruthy();
    expect(system!.label).toBe('Analyze Maud Pike');
    expect(system!.check).toBeNull();

    const engine = engineChips(s);
    expect(engine.some((c) => c.kind === 'affordance' && c.action?.endsWith(':skill'))).toBe(true);
    expect(engine.some((c) => c.kind === 'affordance' && c.action?.endsWith(':system'))).toBe(true);
  });

  it('OPT1-1 RPG: standing + contact on friendly people; contact label stays plain', () => {
    const quest: Quest = {
      id: 'sr-main',
      name: 'Salt Road',
      type: 'main',
      status: 'active',
      revealed: true,
      description: 'The heist',
      objectives: [
        {
          id: 'o1',
          description: 'Pick an approach',
          completed: false,
          routes: [
            { id: 'r1', kind: 'person', label: 'Ask Vessa for the approach', entityId: 'npc:vessa' },
            { id: 'r2', kind: 'place', label: 'Scout the quay', placeId: 'Quay' },
            { id: 'r3', kind: 'contact', label: 'Call on a standing contact for the approach', entityId: 'contact:favor' },
          ],
        },
      ],
    };
    const s = twoNpcScene('rpg', { quests: [quest] });
    const all = collectSceneAffordances(s);
    const standing = all.find((c) => c.actionId.endsWith(':standing') && c.label.includes('Maud'));
    const contact = all.find((c) => c.actionId.endsWith(':contact') && c.label.includes('Maud'));
    expect(standing).toBeTruthy();
    expect(standing!.label).toBe('Press your standing with Maud Pike');
    expect(standing!.check).toBeUndefined();
    expect(contact).toBeTruthy();
    expect(contact!.label).toMatch(/^Call on Maud Pike:/);
    expect(contact!.required).toBe(true);
    expect(contact!.label).not.toMatch(/\[|standing tag|DC/);

    const engine = engineChips(s);
    expect(engine.some((c) => c.kind === 'affordance' && c.action?.endsWith(':standing'))).toBe(true);
    expect(engine.some((c) => c.kind === 'affordance' && c.action?.endsWith(':contact'))).toBe(true);
  });

  it('OPT1-1 shared: removing an NPC from the record drops its mode actions', () => {
    const s = twoNpcScene('litrpg', {
      npcMemories: [npc('Orin Quill', { location: 'Market', roleHint: 'merchant' })],
      sceneFacts: {
        crowd: 'sparse',
        noise: 'voices',
        present: ['Orin Quill'],
        props: [],
        lastBeat: '',
        updatedTurn: 4,
      },
    });
    const all = collectSceneAffordances(s);
    expect(all.every((c) => !c.label.includes('Maud'))).toBe(true);
    expect(all.some((c) => c.actionId.endsWith(':skill') && c.label.includes('Orin'))).toBe(true);
  });

  it('missing-chip-kind: named NPC present without a talk chip still flags', () => {
    const s = twoNpcScene('litrpg');
    const flags = checkChipKinds(s, ['Travel toward the docks', 'Wait and watch'], '');
    expect(flags.some((f) => f.kind === 'missing-chip-kind' && /Maud|Orin/.test(f.detail))).toBe(true);
  });

  it('missing-chip-kind: talk affordances clear the person flag', () => {
    const s = twoNpcScene('rpg');
    const offered = allocateAffordanceSlots(collectSceneAffordances(s)).map((c) => c.label);
    const flags = checkChipKinds(s, offered, '');
    expect(flags.filter((f) => f.kind === 'missing-chip-kind' && /is here and no chip talks/.test(f.detail))).toEqual(
      [],
    );
  });

  it('OPT1-6: no regex literals in sceneAffordances.ts', () => {
    const src = fs.readFileSync(path.join(__dirname, 'sceneAffordances.ts'), 'utf8');
    const bare = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      // 18 Oct 00:2x (harness): string literals (import paths like './rules/x') are not regex literals.
      .replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''");
    expect(bare).not.toMatch(/\/[^/\n]+\/[gimsuy]*/);
    expect(bare).not.toMatch(/new RegExp/);
  });

  it('affordances cover LitRPG/RPG scenes so generic builders retire', () => {
    expect(affordancesCoverGenerics(twoNpcScene('litrpg'))).toBe(true);
    expect(affordancesCoverGenerics(twoNpcScene('rpg'))).toBe(true);
  });

  it('w4-gh2-fixgh2litrpg: affordanceEntityPresent demands npc presence; system: always legal', () => {
    const s = twoNpcScene('litrpg');
    expect(affordanceEntityPresent(s, 'npc:Maud Pike')).toBe(true);
    expect(affordanceEntityPresent(s, 'npc:High Priest Arus')).toBe(false);
    expect(affordanceEntityPresent(s, 'system:trail-1')).toBe(true);
    expect(affordanceEntityPresent(s, 'skill:trail-1')).toBe(true);
  });
});
