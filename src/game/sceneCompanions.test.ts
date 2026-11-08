/**
 * A companion is on the scene list only when the existing presence record says they are here
 * and their hit points say they are up. A row with no record is not given a place.
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

  it('leaves out a hound who stayed behind, one who is down, and one with no record', () => {
    const stayed = base();
    stayed.companions = [beast(8)];
    stayed.npcMemories = [memory('Saltford', 'hostile')];
    expect(formatSceneBlock(stayed)).not.toMatch(/Bramble/);

    const down = base();
    down.companions = [beast(0)];
    down.npcMemories = [memory('Grey Yard', 'neutral')];
    expect(formatSceneBlock(down)).not.toMatch(/Bramble/);

    const unplaced = base();
    unplaced.companions = [beast(8)];
    expect(formatSceneBlock(unplaced)).not.toMatch(/Bramble/);
  });
});
