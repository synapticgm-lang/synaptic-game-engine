/**
 * A companion is on the scene list only when a presence record already seats them.
 * Hit points do not remove them. A memory with no location is seated only if the scene list names them.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { formatSceneBlock } from './sceneBlock';
import type { Companion, GameState, NpcMemory } from './types';

function base(): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    turn: 4,
    currentLocation: 'Grey Yard',
    npcMemories: [],
    companions: [],
    activeEncounter: null,
    sceneFacts: {
      ...(s.sceneFacts ?? { crowd: 'unknown', noise: 'unknown', present: [], props: [], lastBeat: '', updatedTurn: 4 }),
      present: [],
    },
  };
}

function beast(hp: number): Companion {
  return {
    id: 'beast-bramble',
    name: 'Bramble',
    type: 'beast',
    role: 'hound',
    hp,
    maxHp: 8,
    maintenanceCost: '',
    assignment: '',
    notes: '',
  };
}

function memory(location: string, disposition: NpcMemory['disposition']): NpcMemory {
  return {
    npcId: 'beast-bramble',
    npcName: 'Bramble',
    disposition,
    facts: [],
    lastSeenTurn: 4,
    location,
  };
}

describe('companion animals on the scene list', () => {
  it('names a living hound whose record is here, as an animal', () => {
    const s = base();
    s.companions = [beast(8)];
    s.npcMemories = [memory('Grey Yard', 'neutral')];
    const scene = formatSceneBlock(s);
    expect(scene).toMatch(/CREATURES:.*Bramble/);
    expect(scene).not.toMatch(/Bramble \(person\)/);
  });

  it('names a living companion who is still travelling even when the old stamp names another place', () => {
    const s = base();
    s.companions = [{ ...beast(8), id: 'companion-vessa', name: 'Vessa', type: 'party', role: 'guide' }];
    s.npcMemories = [{ ...memory('Saltford', 'neutral'), npcId: 'companion-vessa', npcName: 'Vessa' }];
    const scene = formatSceneBlock(s);
    expect(scene).toMatch(/PRESENT:.*Vessa \(person\)/);
  });

  it('keeps a hound at 0 HP when the record places them here', () => {
    const down = base();
    down.companions = [beast(0)];
    down.npcMemories = [memory('Grey Yard', 'neutral')];
    const scene = formatSceneBlock(down);
    expect(scene).toMatch(/CREATURES:.*Bramble/);
    expect(scene).not.toMatch(/Bramble \(person\)/);
  });

  it('does not invent a place for a memory with no location unless the scene list already names them', () => {
    const blank = base();
    blank.companions = [beast(8)];
    blank.npcMemories = [{ ...memory('', 'neutral'), location: undefined }];
    expect(formatSceneBlock(blank)).not.toMatch(/Bramble/);

    const named = base();
    named.companions = [beast(8)];
    named.npcMemories = [{ ...memory('', 'neutral'), location: undefined }];
    named.sceneFacts = { ...named.sceneFacts!, present: ['Bramble'] };
    expect(formatSceneBlock(named)).toMatch(/CREATURES:.*Bramble/);
  });

  it('leaves out a hound who stayed behind and one with no record', () => {
    const stayed = base();
    stayed.companions = [beast(8)];
    stayed.npcMemories = [memory('Saltford', 'hostile')];
    expect(formatSceneBlock(stayed)).not.toMatch(/Bramble/);

    const unplaced = base();
    unplaced.companions = [beast(8)];
    expect(formatSceneBlock(unplaced)).not.toMatch(/Bramble/);
  });
});
