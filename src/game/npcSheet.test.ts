import { describe, expect, it } from 'vitest';
import archetypes from '../../docs/research/manus-next-stage/npc-personalities.json';
import { ensureNpcSheet, npcSheetWriterLine, pickNpcSheet, sheetPlaceFor } from './npcSheet';
import type { GameState, NpcMemory } from './types';

const CHEER = /\b(?:cheerful|bright|playful|hopeful|optimistic|contagious|animated|enthusiastic|excited|funny|bold|hearty|affable|boastful|charming|teasing|trusting|theatrical|impulsive)\b/;
const NAMES = Array.from({ length: 150 }, (_, i) => `Townsfolk ${i}`);

/** Parts that belong to a cheerful archetype — a prisoner may not take any of them. */
const cheerfulParts = new Set(
  (archetypes as Array<{ speechPatterns: { tone: string }; motivations: string[]; fears: string[]; secrets: string[] }>)
    .filter((a) => a.speechPatterns.tone.split(',').some((t) => !/unexpectedly/.test(t) && CHEER.test(t)))
    .flatMap((a) => [...a.motivations, ...a.fears, ...a.secrets]),
);

function state(memories: NpcMemory[] = [], location = 'Greyhollow Square'): GameState {
  return { turn: 3, currentLocation: location, campaignBibleId: 'cursed-keep', npcMemories: memories } as unknown as GameState;
}

describe('npc sheet', () => {
  it('a dungeon prisoner is never cheerful', () => {
    for (const place of ['dungeon', 'cell'] as const) {
      for (const name of NAMES) {
        const s = pickNpcSheet(name, place, { roleHint: 'captive' });
        expect(s.job).toBe('prisoner');
        expect(s.speech).not.toMatch(CHEER);
        expect(s.speech).toMatch(/\b(?:bitter|tired|guarded|haunted|wary|resentful|lonely|sad|hurt|burdened|grave|volatile|fierce|defensive|suspicious|brittle|exhausted|tense|worried|nervous|anxious|apologetic|ashamed)\b/);
        for (const part of [s.motive, s.fear, s.secret]) expect(cheerfulParts.has(part)).toBe(false);
      }
    }
  });

  it('an inn pick can be warm', () => {
    const warm = NAMES.map((n) => pickNpcSheet(n, 'inn', { roleHint: 'keeper' }))
      .filter((s) => /\b(?:warm|gentle|tender|hospitable|tactful)\b/.test(s.speech));
    expect(warm.length).toBeGreaterThan(0);
  });

  it('a jailer is not a victim, and a road bandit is bored or threatening', () => {
    for (const name of NAMES) {
      expect(pickNpcSheet(name, 'cell', { roleHint: 'gatekeeper' }).speech).not.toMatch(/\b(?:anxious|nervous|apologetic|worried|tense|ashamed)\b/);
      expect(pickNpcSheet(name, 'road', { roleHint: 'bounty-target' }).speech)
        .toMatch(/\b(?:tired|dry|sardonic|cold|intimidating|detached|clinical|unsentimental|mocking|imperious|sharp|unsettling|calculating)\b/);
    }
  });

  it('parts come from different archetypes, and the place picks from its own job list', () => {
    const s = pickNpcSheet('Wat Miller', 'road');
    expect(['courier', 'merchant', 'refugee', 'bandit', 'herald', 'rival', 'informant', 'guide']).toContain(s.job);
    expect(sheetPlaceFor('Cathedral Undercroft')).toBe('dungeon');
    expect(sheetPlaceFor('Greyhollow Inn')).toBe('inn');
    expect(sheetPlaceFor('Pellane War Camp')).toBe('camp');
  });

  it('the same person returns the same sheet on the next turn', () => {
    const first = ensureNpcSheet(state([], 'Greyhollow Inn'), 'Wat Miller');
    const sheet = first.npcMemories!.find((m) => m.npcName === 'Wat Miller')!.sheet!;
    expect(sheet.job).toBeTruthy();
    const moved = { ...first, turn: 4, currentLocation: 'Back streets' } as GameState;
    const next = ensureNpcSheet(moved, 'Wat Miller');
    expect(next).toBe(moved);
    expect(next.npcMemories!.find((m) => m.npcName === 'Wat Miller')!.sheet).toEqual(sheet);
    expect(pickNpcSheet('Wat Miller', 'inn', { campaignId: 'cursed-keep' })).toEqual(sheet);
  });

  it('a named roster NPC is unchanged', () => {
    const dain: NpcMemory = { npcId: 'ck-npc-7', npcName: 'Dain Holt', disposition: 'neutral', facts: ['Bible roster: gatekeeper'], lastSeenTurn: 0 };
    const s = state([dain]);
    expect(ensureNpcSheet(s, 'Dain Holt')).toBe(s);
    expect(ensureNpcSheet(s, 'Captain Dain')).toBe(s);
    const empty = state();
    expect(ensureNpcSheet(empty, 'Harker Vale')).toBe(empty);
    const aldous: NpcMemory = { npcId: 'ck-aldous', npcName: 'Father Aldous', disposition: 'neutral', facts: ['Bible roster: quest-patron'], lastSeenTurn: 0 };
    const withAldous = state([aldous]);
    expect(ensureNpcSheet(withAldous, 'Father Aldous')).toBe(withAldous);
  });

  it('the writer line carries name, job, motive, fear and speech — never the secret', () => {
    const s = pickNpcSheet('Wat Miller', 'inn');
    const line = npcSheetWriterLine('Wat Miller', s);
    expect(line).toContain('Wat Miller');
    expect(line).toContain(s.job);
    if (s.secret) expect(line).not.toContain(s.secret.toLowerCase());
    expect(npcSheetWriterLine('Wat Miller', { ...s, fear: '' })).not.toMatch(/fears:/);
  });
});
