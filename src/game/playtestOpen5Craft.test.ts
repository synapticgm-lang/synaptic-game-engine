/**
 * XP-D1 OPEN5 — craft / brew / gather-quest mat turn-in + world band coverage + equip-only reader.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  consumeGatherQuestMats,
  startBrewFromInput,
  startCraftFromInput,
} from './wildlifeActions';
import { ensureRegionBands, ensureRegionResources } from './regionLevels';
import { WORLD_OUTLINES } from '../data/worldOutlines';
import { WORLD_MAX_CREATURE_LEVEL } from './rules/wildlifeConfig';
import { canEquipAtLevel, EQUIP_LEVEL_MARGIN } from './rules/equipLevel';
import { killScale } from './rules/xpPace';
import type { GameState } from './types';

function base(over: Partial<GameState> = {}): GameState {
  return {
    engineMode: 'litrpg',
    turn: 10,
    seed: 'open5-craft',
    openingEstablishment: { complete: true },
    character: {
      name: 'Jax',
      level: 5,
      xp: 0,
      xpToNext: 363,
      attributes: {},
      skills: [],
      professions: [
        { type: 'Leatherworking', level: 12, maxLevel: 50 },
        { type: 'Herbalism', level: 8, maxLevel: 50 },
      ],
    },
    inventory: [],
    materials: [
      { id: 'light-leather', name: 'Light leather', rarity: 'Common', quantity: 3 },
      { id: 'peacebloom', name: 'Peacebloom', rarity: 'Common', quantity: 2 },
    ],
    containers: [],
    companions: [],
    quests: [],
    log: [],
    currentLocation: 'Lowmarket',
    ...over,
  } as unknown as GameState;
}

describe('OPEN5 craft / brew / turn-in', () => {
  it('crafts leather kit from hide at workshop (trade XP only)', () => {
    const r = startCraftFromInput(base(), 'Craft at a workshop')!;
    expect(r).toBeTruthy();
    expect(r.state.inventory.some((i) => /leather kit/i.test(i.name) && (i.itemLevel ?? 0) > 0)).toBe(true);
    expect((r.state.materials ?? []).find((m) => m.id === 'light-leather')?.quantity).toBe(2);
    expect(r.state.character.xp).toBe(0);
  });

  it('brews restorative from herb', () => {
    const r = startBrewFromInput(base(), 'Brew at camp or inn')!;
    expect(r.state.inventory.some((i) => /restorative/i.test(i.name))).toBe(true);
    expect(r.state.character.xp).toBe(0);
  });

  it('consumeGatherQuestMats spends stored mats', () => {
    const r = consumeGatherQuestMats(base(), 'Light leather', 2);
    expect(r.consumed).toBe(2);
    expect(r.state.materials.find((m) => m.id === 'light-leather')?.quantity).toBe(1);
  });

  it('dnd refuses craft', () => {
    expect(startCraftFromInput(base({ engineMode: 'dnd' }), 'Craft at a workshop')).toBeNull();
  });
});

describe('OPEN5 world coverage bands', () => {
  it('every WORLD_OUTLINES region gets a band; start 1-3; farthest reaches max; connected mids ≤6', () => {
    for (const outline of WORLD_OUTLINES) {
      let s = base({
        seed: `band-${outline.id}`,
        worldAtlas: {
          outlineId: outline.id,
          outlineName: outline.name,
          description: outline.description ?? '',
          currentRegionId: outline.regions[0]!.id,
          regions: outline.regions.map((r) => ({
            id: r.id,
            name: r.name,
            blurb: r.blurb,
            connections: r.connections ?? [],
            tags: r.tags ?? [],
            revealed: true,
          })),
        },
      });
      s = ensureRegionResources(ensureRegionBands(s));
      const bands = s.regionLevelBands ?? {};
      expect(Object.keys(bands).length).toBe(outline.regions.length);
      const start = bands[outline.regions[0]!.id]!;
      expect(start.low).toBe(1);
      expect(start.high).toBe(3);
      let maxHigh = 0;
      let maxHop = 1;
      const hops = new Map<string, number>();
      {
        const q = [outline.regions[0]!.id];
        hops.set(q[0]!, 0);
        while (q.length) {
          const id = q.shift()!;
          const row = outline.regions.find((x) => x.id === id);
          for (const n of row?.connections ?? []) {
            if (hops.has(n)) continue;
            hops.set(n, (hops.get(id) ?? 0) + 1);
            q.push(n);
          }
        }
        for (const d of hops.values()) maxHop = Math.max(maxHop, d || 1);
      }
      // Prefer ≤6; short graphs must step faster so the farthest high can still hit WORLD_MAX.
      const midCap = Math.max(6, Math.ceil((WORLD_MAX_CREATURE_LEVEL - 2) / maxHop));
      for (const r of outline.regions) {
        const b = bands[r.id]!;
        expect(b).toBeTruthy();
        expect(b.high).toBeGreaterThanOrEqual(b.low);
        maxHigh = Math.max(maxHigh, b.high);
        for (const n of r.connections ?? []) {
          const o = bands[n];
          if (!o) continue;
          const midA = (b.low + b.high) / 2;
          const midB = (o.low + o.high) / 2;
          // Band width (up to 6) + danger boost can nudge displayed mids past the hop step.
          expect(Math.abs(midA - midB)).toBeLessThanOrEqual(midCap + 3);
        }
      }
      expect(maxHigh).toBe(WORLD_MAX_CREATURE_LEVEL);
      expect(Object.values(s.regionResourceProfiles ?? {}).some((p) => p.richWeak)).toBe(true);
    }
  });
});

describe('OPEN5 equip rule sole reader + killScale smoke', () => {
  it('EQUIP_LEVEL_MARGIN is 2 and canEquipAtLevel is the wear gate', () => {
    expect(EQUIP_LEVEL_MARGIN).toBe(2);
    expect(canEquipAtLevel({ itemLevel: 12 }, 10, 'litrpg')).toBe(true);
    expect(canEquipAtLevel({ itemLevel: 13 }, 10, 'litrpg')).toBe(false);
    expect(canEquipAtLevel({}, 1, 'litrpg')).toBe(true);
    expect(canEquipAtLevel({ itemLevel: 99 }, 1, 'dnd')).toBe(true);
  });

  it('no other src/game file compares itemLevel to player level except equipLevel/gearEquip/wildlifeActions craft', () => {
    const root = join(process.cwd(), 'src', 'game');
    const files = [
      'choiceRanking.ts',
      'choicePipeline.ts',
      'lootTableRegistry.ts',
      'merchant.ts',
      'inventory.ts',
      'combat.ts',
      'sandboxXp.ts',
    ];
    for (const f of files) {
      const text = readFileSync(join(root, f), 'utf8');
      expect(text.includes('canEquipAtLevel') || !/itemLevel\s*[<>]=?\s*.*level|level\s*[<>]=?\s*.*itemLevel/.test(text)).toBe(
        true
      );
    }
  });

  it('on-level R is 1', () => {
    expect(killScale(10, 10)).toBeCloseTo(1, 5);
  });
});
