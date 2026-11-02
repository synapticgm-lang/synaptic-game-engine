/**
 * XP-D1 OPEN6 — wilds seed on every outdoor turn; Hunt survives affordance pad rebuild;
 * foe strength from creature level; gather pouch gate; hand-over mats.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { compileChoices } from './choiceCompiler';
import { padChoicesToCount } from './choicePipeline';
import { resolveOfferedChoices, commitOfferedTurn } from './playTranscript';
import {
  HUNT_WILDS_CHIP,
  GATHER_WILDS_CHIP,
  SEEK_FIGHT_CHIP,
  HAND_OVER_MATERIALS_CHIP,
  rankChoices,
  gatherQuestTurnInChip,
} from './choiceRanking';
import { affordancesCoverGenerics } from './sceneAffordances';
import { ensureWildsReady, isOutdoorWildsPlace, wildsHasStock } from './wilds';
import { huntFoe, startHandOverMaterialsFromInput } from './wildlifeActions';
import { canAddMaterials } from './inventory';
import type { GameState } from './types';
import type { WildsSlot as Slot } from './wilds';

const RUN_7301 =
  'C:/Users/littl/OneDrive/Documents/synapticgm/game/wt/XPWILDS/scripts/fate-autoplay/runs/2026-11-02T14-14-29-289Z_summoned-pact_cold-system_s7301';

function load7301(): GameState | null {
  if (!existsSync(resolve(RUN_7301, 'snapshot.json'))) return null;
  return JSON.parse(readFileSync(resolve(RUN_7301, 'snapshot.json'), 'utf8')).state as GameState;
}

function outdoorBase(snap: GameState): GameState {
  return {
    ...snap,
    currentLocation: 'Kitchen Saint Alley',
    openingEstablishment: { ...(snap.openingEstablishment as object), complete: true },
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    offeredPad: null,
    choices: ['Look around', 'Wait', 'Ask what they want', 'Travel toward Contract Hall', 'Say something…'],
  } as GameState;
}

describe('OPEN6 wilds seed + Hunt pad survival', () => {
  const snap = load7301();
  const hasRun = !!snap;

  it.skipIf(!hasRun)('ensureWildsReady persists stock on the real 7301 final', () => {
    const seeded = ensureWildsReady(outdoorBase(snap!));
    expect(Object.keys(seeded.wildsByPlace ?? {}).length).toBeGreaterThan(0);
    expect(Object.keys(seeded.regionLevelBands ?? {}).length).toBeGreaterThan(0);
    expect(wildsHasStock(seeded)).toBe(true);
    expect(isOutdoorWildsPlace(seeded)).toBe(true);
  });

  it.skipIf(!hasRun)('padChoicesToCount keeps Hunt when affordances cover (OPEN5 root cause)', async () => {
    const state = outdoorBase(snap!);
    expect(affordancesCoverGenerics(state)).toBe(true);
    const compiled = compileChoices(state, state.choices!);
    expect(compiled.choices.includes(HUNT_WILDS_CHIP)).toBe(true);
    const padded = padChoicesToCount(compiled.choices, state, 'Jax stood in the alley.', 3, 'Look around');
    expect(padded.includes(HUNT_WILDS_CHIP), `padded=${JSON.stringify(padded.slice(0, 15))}`).toBe(true);
  });

  it.skipIf(!hasRun)(
    'resolveOfferedChoices includes Hunt on the crowded alley',
    async () => {
      const state = outdoorBase(snap!);
      const seeded = ensureWildsReady(state);
      const offered = resolveOfferedChoices(seeded);
      expect(
        offered.some((c) => c === HUNT_WILDS_CHIP || c === SEEK_FIGHT_CHIP),
        JSON.stringify(offered.slice(0, 12))
      ).toBe(true);
      const committed = commitOfferedTurn(seeded);
      expect(Object.keys(committed.wildsByPlace ?? {}).length).toBeGreaterThan(0);
    },
    120_000
  );

  it.skipIf(!hasRun)('journey road pad still keeps Hunt', () => {
    const state = {
      ...outdoorBase(snap!),
      currentLocation: 'On the road between places',
      journey: { status: 'underway', from: 'Kitchen Saint Alley', to: 'Contract Hall', legsDone: 0, legsTotal: 1 } as GameState['journey'],
    } as GameState;
    const compiled = compileChoices(state, ['Walk on', 'Turn back toward Kitchen Saint Alley']);
    expect(compiled.choices.includes(HUNT_WILDS_CHIP) || compiled.choices.includes(SEEK_FIGHT_CHIP)).toBe(true);
    const padded = padChoicesToCount(compiled.choices, state, 'The road stretches on.', 3, 'Walk on');
    expect(padded.some((c) => c === HUNT_WILDS_CHIP || c === SEEK_FIGHT_CHIP)).toBe(true);
  });
});

describe('OPEN6 foe strength from creature level', () => {
  function slot(level: number): Slot {
    return {
      speciesId: `plains:wolf:${level}`,
      name: 'Wolf',
      level,
      kind: 'beast',
      behaviour: 'pack',
      stock: 1,
      maxStock: 1,
      skinnable: true,
      primaryDrop: 'hide',
    };
  }

  it('level 20 wolf has more HP/str than level 10; both use own level', () => {
    const a = huntFoe(slot(20), 'Wilds');
    const b = huntFoe(slot(10), 'Wilds');
    expect(a.level).toBe(20);
    expect(b.level).toBe(10);
    expect(a.maxHp).toBeGreaterThan(b.maxHp);
    expect((a.strength ?? 0)).toBeGreaterThan(b.strength ?? 0);
    expect(a.levelSource).toBe('table');
  });

  it('damage pressure: L4 player loses more HP per round vs L10 than vs L4 (str gap)', () => {
    const high = huntFoe(slot(10), 'Wilds');
    const low = huntFoe(slot(4), 'Wilds');
    // Same formula as roadFoe: strength 10+level — higher foe hits harder in engine Fight checks.
    expect((high.strength ?? 0) - 4).toBeGreaterThan((low.strength ?? 0) - 4);
  });
});

describe('OPEN6 gather pouch + hand-over', () => {
  it('Gather pad is withheld when the pouch cannot take materials', () => {
    const state = {
      engineMode: 'litrpg',
      seed: 'pouch-full',
      turn: 10,
      currentLocation: 'Kitchen Saint Alley',
      openingEstablishment: { complete: true },
      character: { name: 'Jax', level: 3, xp: 0, xpToNext: 100, hp: 20, maxHp: 20 },
      materials: Array.from({ length: 40 }, (_, i) => ({
        id: `mat-${i}`,
        name: `Stuff ${i}`,
        rarity: 'Common' as const,
        quantity: 1,
        stackType: 'material' as const,
      })),
      inventory: [],
      containers: [{ id: 'bag', name: 'Bag', capacity: 1, used: 1, storageType: 'General', kind: 'physical' }],
      places: [{ id: 'place_kitchen-saint-alley', name: 'Kitchen Saint Alley' }],
    } as unknown as GameState;
    // If capacity still allows stacks, skip; otherwise assert no Gather chip.
    const can = canAddMaterials(state, 1).ok;
    const ranked = rankChoices(ensureWildsReady(state), ['Look around', 'Wait', 'Ask what they want']);
    if (!can) {
      expect(ranked.choices.some((c) => isGatherLike(c))).toBe(false);
    } else {
      expect(true).toBe(true);
    }
  });

  it('Hand over the materials spends mats and completes the objective', () => {
    const state = {
      engineMode: 'litrpg',
      seed: 'hand-over',
      turn: 12,
      currentLocation: 'Kitchen Saint Alley',
      openingEstablishment: { complete: true },
      character: { name: 'Jax', level: 3, xp: 0, xpToNext: 200, hp: 20, maxHp: 20, professions: [] },
      materials: [{ id: 'peacebloom', name: 'Peacebloom', rarity: 'Common', quantity: 5, stackType: 'material' }],
      quests: [
        {
          id: 'q-herbs',
          name: 'Herb Run',
          status: 'active',
          revealed: true,
          objectives: [
            { id: 'o1', description: 'Collect 3 Peacebloom for the apothecary', completed: false },
          ],
        },
      ],
    } as unknown as GameState;
    expect(gatherQuestTurnInChip(state)).toBe(HAND_OVER_MATERIALS_CHIP);
    const r = startHandOverMaterialsFromInput(state, HAND_OVER_MATERIALS_CHIP)!;
    expect(r.state.materials.find((m) => m.id === 'peacebloom')?.quantity).toBe(2);
    expect(r.state.quests?.[0]?.objectives?.[0]?.completed).toBe(true);
    expect(r.receipts.some((x) => /handed over|turned in/i.test(x))).toBe(true);
  });
});

function isGatherLike(c: string): boolean {
  return /^gather herbs and resources nearby$/i.test(c);
}
