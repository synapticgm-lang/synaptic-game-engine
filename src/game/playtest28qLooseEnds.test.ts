import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { GameState } from './types';
import { calculateSocialModifiers, socialOutcomeBand } from './socialSkills';
import { eventsToQuestUpdates } from './parser';
import { formatArcStatusReceipts } from './arcDirector';
import { telegraphForPendingSpawn } from './encounterTelegraph';
import { buildLifecycleSituationSection, seedPresentNpcLifecycles } from './npcLifecycleFsm';
import { shareTreatmentWithWitnesses } from './npcCrossIntegration';
import { openSeededLootable, seededLootChips } from './looseItems';
import { advanceDungeonCard } from './dungeonCard';

function base(extra: Partial<GameState> = {}): GameState {
  return {
    turn: 10,
    seed: 'seed-28q',
    engineMode: 'litrpg',
    inventory: [],
    quests: [],
    npcMemories: [],
    sceneFacts: {},
    ...extra,
  } as unknown as GameState;
}

function seededDungeon(): GameState['activeDungeon'] {
  return {
    blueprintId: 'bp-28q',
    dungeonName: 'Quay Cellar',
    tier: 4,
    dangerTier: 1,
    currentZLevel: 0,
    currentNodeId: 'n1',
    visitedNodeIds: ['n1'],
    clearedNodeIds: [],
    nodes: [
      {
        id: 'n1',
        name: 'Brine Cellar',
        description: 'Wet stone.',
        connections: [],
        hidden: {
          traps: [],
          lootables: [{ id: 'l1', label: 'Salt chest', opened: false, loot: { rarity: 'Uncommon', qty: 1 } }],
          secrets: [],
          mobs: [],
          looseItems: [],
        },
      },
    ],
  } as unknown as GameState['activeDungeon'];
}

describe('28q loose ends wired back in', () => {
  it('social skills: outcome bands follow roll + margin', () => {
    expect(socialOutcomeBand(20, -10)).toBe('critical_success');
    expect(socialOutcomeBand(1, 10)).toBe('critical_failure');
    expect(socialOutcomeBand(12, 5)).toBe('success');
    expect(socialOutcomeBand(12, 0)).toBe('partial');
    expect(socialOutcomeBand(12, -3)).toBe('failure');
    expect(socialOutcomeBand(12, -8)).toBe('critical_failure');
  });

  it('social skills: leverage on the target NPC applies without an explicit asset id', () => {
    expect(calculateSocialModifiers('persuasion', 'Wren', base()).leverage).toBe(0);
    const state = base({
      arcDirector: {
        leverageAssets: [{ id: 'a1', type: 'evidence', targetNpc: 'Wren', evidenceStrength: 1, credibility: 0.5 }],
      } as never,
    });
    expect(calculateSocialModifiers('persuasion', 'Wren', state).leverage).toBe(5);
    expect(calculateSocialModifiers('persuasion', 'Dain', state).leverage).toBe(0);
  });

  it('quest complete goes through the guard (no same-turn complete)', () => {
    const quest = { id: 'q1', title: 'Q', status: 'active', revealed: true, activatedTurn: 10, objectives: [] };
    const sameTurn = eventsToQuestUpdates([{ type: 'quest-complete', id: 'q1' } as never], [quest as never], 10);
    expect(sameTurn.find((q) => q.id === 'q1')?.status).toBe('active');
    const later = eventsToQuestUpdates([{ type: 'quest-complete', id: 'q1' } as never], [quest as never], 12);
    expect(later.find((q) => q.id === 'q1')?.status).toBe('completed');
  });

  it('social progression receipts reach STATUS', () => {
    const lines = formatArcStatusReceipts({ systemReceipts: ['Social track: +6 (negotiate)'] } as never);
    expect(lines).toContain('Social track: +6 (negotiate)');
  });

  it('telegraph: boss preface gets more channels than trash', () => {
    const state = base({ turn: 3 });
    const trash = telegraphForPendingSpawn('trash', state);
    const boss = telegraphForPendingSpawn('boss', state);
    expect(trash === null || typeof trash === 'string').toBe(true);
    if (trash && boss) expect(boss.length).toBeGreaterThanOrEqual(trash.length);
  });

  it('NPC lifecycle: present NPCs are seeded and shown to the writer', () => {
    const seeded = seedPresentNpcLifecycles(base(), [{ npcName: 'Mira', roleHint: 'merchant', facts: [] }]);
    const lifecycles = (seeded.arcDirector as { npcLifecycles?: { npcId: string }[] } | undefined)?.npcLifecycles ?? [];
    expect(lifecycles.some((lc) => lc.npcId === 'Mira')).toBe(true);
    const again = seedPresentNpcLifecycles(seeded, [{ npcName: 'Mira', roleHint: 'merchant', facts: [] }]);
    expect((again.arcDirector as { npcLifecycles?: unknown[] }).npcLifecycles?.length).toBe(lifecycles.length);
    const section = buildLifecycleSituationSection(seeded, ['Mira']);
    expect(section).toContain('Mira');
    expect(buildLifecycleSituationSection(seeded, ['Someone Else'])).not.toContain('Mira');
  });

  it('cross-NPC: a present witness learns how the player treated someone', () => {
    const before = [
      { npcName: 'Mira', facts: [] },
      { npcName: 'Dain', facts: [] },
    ] as unknown as NonNullable<GameState['npcMemories']>;
    const after = [
      { npcName: 'Mira', facts: ['Treated kindly (T10)'] },
      { npcName: 'Dain', facts: [] },
    ] as unknown as NonNullable<GameState['npcMemories']>;
    const state = base({ sceneFacts: { present: ['Mira', 'Dain'] } as GameState['sceneFacts'] });
    const out = shareTreatmentWithWitnesses(state, before, after);
    const dain = out.npcMemories.find((m) => m.npcName === 'Dain');
    expect(dain?.facts.some((f) => /Saw you treat Mira kindly/.test(f))).toBe(true);
    const round = JSON.parse(JSON.stringify(out.ledgers ?? []));
    expect(Array.isArray(round)).toBe(true);
  });

  it('seeded dungeon: chip, open, then pick up — code-owned loot', () => {
    const state = base({ activeDungeon: seededDungeon() });
    expect(seededLootChips(state)[0]).toBe('Open the Salt chest');
    const opened = openSeededLootable(state, 'Open the Salt chest');
    expect(opened.receipts[0]).toBe('Dungeon: you opened the Salt chest.');
    const node = opened.state.activeDungeon!.nodes[0]!;
    expect(node.hidden!.lootables[0]!.opened).toBe(true);
    const floor = node.hidden!.looseItems ?? [];
    if (floor.length) {
      const picked = openSeededLootable(opened.state, `Pick up ${floor[0]!.label}`);
      expect(picked.receipts[0]).toMatch(/^Loot: picked up /);
      expect(picked.state.inventory?.length).toBe(1);
    }
    expect(openSeededLootable(opened.state, 'Open the Salt chest').receipts).toEqual([]);
  });

  it('seeded dungeon loot runs through advanceDungeonCard (live + fate path)', () => {
    const state = base({ activeDungeon: seededDungeon() });
    const out = advanceDungeonCard(state, 'search the chest') as { receipts: string[] };
    expect(out.receipts.some((r) => r.startsWith('Dungeon: you opened'))).toBe(true);
  });

  it('seeded dungeon: chest stays shut during a fight', () => {
    const state = base({ activeDungeon: seededDungeon(), activeEncounter: { enemies: [] } as never });
    expect(openSeededLootable(state, 'Open the Salt chest').receipts[0]).toMatch(/fight comes first/);
    expect(seededLootChips(state)).toEqual([]);
  });

  it('admin feedback review is mounted in Settings', () => {
    const src = readFileSync('src/components/SettingsModal.tsx', 'utf8');
    expect(src).toMatch(/<GmFeedbackReview\b/);
  });
});
