import { describe, expect, it } from 'vitest';
import { classifyTokenLine, introducedRolePeople, introducedThings, lineHasOutOfWorldThing } from './tokenProse';
import '../data/campaigns';
import { offSettingWords } from './settingVocabulary';
import { registerWriterIntroductions } from './writerIntroductions';
import type { GameState } from './types';

const world = offSettingWords({ campaignBibleId: null, worldAtlas: null, engineMode: 'dnd' } as Pick<GameState, 'campaignBibleId' | 'worldAtlas' | 'engineMode'>);

describe('P-5a/c writer introductions', () => {
  it('lets an invented thing that fits the world pass, and rejects one the world has no word for', () => {
    expect(lineHasOutOfWorldThing('Jax found a small iron key under the bench.', '', world)).toBe(false);
    expect(lineHasOutOfWorldThing('The keeper had a dagger at her belt.', '', world)).toBe(false);
    expect(lineHasOutOfWorldThing('The keeper had her satchel strap across one shoulder.', '', world)).toBe(false);
    expect(lineHasOutOfWorldThing('Jax found a rifle under the bench.', '', world)).toBe(true);
    expect(lineHasOutOfWorldThing('Jax found a rifle under the bench.', 'a rifle lies here', world)).toBe(false);
  });

  it('no longer flags a fitting role person or an unhanded find in a token line', () => {
    const beat = { refs: [], lines: [] } as never;
    const line = (text: string) => ({ fn: 'narration', text }) as never;
    expect(classifyTokenLine(line('A guard coiled rope by the rail.'), beat, [], [], '', undefined, undefined, undefined, world).ok).toBe(true);
    expect(classifyTokenLine(line('Jax found a small iron key under the bench.'), beat, [], [], '', undefined, undefined, undefined, world).ok).toBe(true);
    expect(classifyTokenLine(line('Jax found a rifle under the bench.'), beat, [], [], '', undefined, undefined, undefined, world).reason).toBe('out-of-world');
  });

  it('registers introduced people as cast and things as scene props', () => {
    const text = 'A guard coiled rope by the rail. Jax found a small iron key under the bench.';
    expect(introducedRolePeople(text)).toContain('guard');
    expect(introducedThings(text)).toEqual(['small iron key']);
    const state = {
      turn: 4,
      currentLocation: 'Docks',
      npcMemories: [],
      sceneFacts: { crowd: 'empty', noise: 'quiet', present: [], props: [], lastBeat: '' },
    } as unknown as GameState;
    const next = registerWriterIntroductions(state, text);
    expect(next.npcMemories?.map((m) => m.npcName)).toEqual(['the guard']);
    expect(next.sceneFacts?.props).toEqual(['small iron key']);
    const again = registerWriterIntroductions({ ...next, turn: 5 }, text);
    expect(again.npcMemories).toHaveLength(1);
    expect(again.npcMemories![0]!.lastSeenTurn).toBe(5);
  });
});
