/**
 * Order E-KIT: CLASS_KITS A/B match SRD 5.2.1 Traits tables; creation inventory never
 * holds a magic item unless that exact name is on the SRD class or background list.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNewGameState } from './fateAutoplay';
import { magicItemDef } from './rules/magicItems';
import {
  BACKGROUNDS,
  CLASS_KITS,
  CLASSES,
  applyTabletopSheet,
  kitDef,
  resolveSheet,
  type TabletopClassId,
} from './tabletop/characterBuild';
import { beginTabletopCreation, creationChips, stepTabletopCreation } from './tabletop/creationFlow';

type GearRow = { name: string; qty?: number };
type KitRow = { gp: number; gear: GearRow[] };
type Fixture = {
  classes: Record<string, { A: KitRow; B: KitRow }>;
};

const fixture = JSON.parse(
  readFileSync(resolve('docs/test-data/srd-class-kits.json'), 'utf8'),
) as Fixture;

function gearKey(g: GearRow): string {
  return `${g.name}|${g.qty ?? 1}`;
}

function expectKitMatch(cls: TabletopClassId, id: 'A' | 'B') {
  const want = fixture.classes[cls][id];
  const got = CLASS_KITS[cls].find((k) => k.id === id);
  expect(got, `${cls} kit ${id}`).toBeTruthy();
  expect(got!.gp, `${cls} ${id} GP`).toBe(want.gp);
  expect(got!.gear.map((g) => gearKey({ name: g.name, qty: g.qty })).sort()).toEqual(
    want.gear.map(gearKey).sort(),
  );
}

describe('E-KIT class starting kits (SRD 5.2.1)', () => {
  it('fixture covers all twelve classes × A and B (24 rows)', () => {
    expect(Object.keys(fixture.classes).sort()).toEqual([...CLASSES.map((c) => c.id)].sort());
    for (const cls of CLASSES.map((c) => c.id)) {
      expect(fixture.classes[cls].A).toBeTruthy();
      expect(fixture.classes[cls].B).toBeTruthy();
    }
  });

  it('CLASS_KITS A and B match the SRD fixture item-by-item', () => {
    for (const cls of CLASSES.map((c) => c.id) as TabletopClassId[]) {
      expectKitMatch(cls, 'A');
      expectKitMatch(cls, 'B');
    }
  });

  it('legacy coin id resolves to gold-only B when the class has no separate (c)', () => {
    expect(kitDef('rogue', 'coin').id).toBe('B');
    expect(kitDef('rogue', 'coin').gp).toBe(100);
    expect(kitDef('fighter', 'coin').id).toBe('coin');
    expect(kitDef('fighter', 'coin').gp).toBe(155);
  });

  it('creation inventory never holds a magic item unless the SRD list names it', () => {
    const allowed = new Set<string>();
    for (const cls of Object.keys(fixture.classes)) {
      for (const id of ['A', 'B'] as const) {
        for (const g of fixture.classes[cls][id].gear) allowed.add(g.name);
      }
    }
    for (const bg of BACKGROUNDS) for (const g of bg.gear) allowed.add(g.name);

    for (const cls of CLASSES.map((c) => c.id) as TabletopClassId[]) {
      for (const kitId of ['A', 'B'] as const) {
        const sheet = resolveSheet({
          classId: cls,
          speciesId: 'human',
          backgroundId: 'soldier',
          method: 'standard-array',
          baseScores: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 },
          kitId,
        });
        let state = buildNewGameState({
          bibleId: 'cursed-keep',
          characterName: 'Jax',
          seed: 42,
          personality: 'chilled-gm',
        }).state;
        state = applyTabletopSheet(state, sheet);
        for (const item of state.inventory ?? []) {
          const magic = magicItemDef(item.name);
          if (magic) {
            expect(allowed.has(item.name), `${cls} kit ${kitId} leaked magic ${item.name}`).toBe(true);
          }
          expect(item.name).not.toBe('Bracers of Defense');
        }
      }
    }
  });

  it('kit chips offer A and B; Bracers are not a creation chip', () => {
    let s = beginTabletopCreation(
      buildNewGameState({ bibleId: 'cursed-keep', characterName: 'Jax', seed: 7, personality: 'chilled-gm' }).state,
    );
    for (const pick of ['Build my own', 'Rogue', 'Human', 'Criminal', 'Standard array']) {
      s = stepTabletopCreation(s, pick);
    }
    s = stepTabletopCreation(s, 'Keep these scores');
    expect(s.tabletopCreation!.stage).toBe('kit');
    const chips = creationChips(s).join(' | ');
    expect(chips).toMatch(/Leather Armor/);
    expect(chips).toMatch(/100 GP/);
    expect(chips).not.toMatch(/Bracers/i);
  });
});

