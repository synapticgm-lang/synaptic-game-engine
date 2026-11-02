/**
 * XP-D1 OPEN5 — wilds, world creatures, equip level, OPEN4 misses (order tests 1-5, 15-21).
 *
 * 1  WoW killScale worked numbers (P = 2, 5, 10, 20, 30), to 2 decimals
 * 2  Gray cliff (nothing gray at CL <= 5; gray pays 0)
 * 3  Elite x2 on table kills
 * 4  Hunting budgets 0.30 / 0.15 of the level bar, then the 5% floor; gray 0
 * 5  Region creature stock sits inside the region band and the world cap
 * 15 Equip rule (EQUIP_LEVEL_MARGIN 2; LitRPG + Story RPG only)
 * 16 Hunt pad: outdoor LitRPG only
 * 17 Seek Fight on the real OPEN4 7301 / 7303 final states offers Seek or Hunt
 * 18 Seek Fight is not dropped by the invented-threat gate
 * 19 Filler family cap <= 2 on the real chip-stream replays (rotating labels share one budget)
 * 20 Replay fixtures are real (4 runs, rotating filler labels present)
 * 21 Hunt stays out of tabletop (dnd) and Story RPG
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyWildsHuntBudget,
  conColor,
  grayLevel,
  isChallengeHuntKill,
  killScale,
  unitMilestoneAmount,
  wildsBudgetCaps,
  zeroDifference,
} from './rules/xpPace';
import { EQUIP_LEVEL_MARGIN, canEquipAtLevel, equipBlockReason, modeUsesEquipLevel } from './rules/equipLevel';
import {
  HUNT_PAD,
  SEEK_FIGHT_CHIP,
  WILDS_CHALLENGE_BAR_SHARE,
  WILDS_HUNT_BAR_SHARE,
  WILDS_KILL_XP_MULT,
  WORLD_MAX_CREATURE_LEVEL,
  isHuntPad,
} from './rules/wildlifeConfig';
import {
  creditFillerOffers,
  fillerOfferExhausted,
  fillerSceneKey,
  isFillerNoProgressChip,
  rankChoices,
} from './choiceRanking';
import { compileChoices } from './choiceCompiler';
import { ensureWilds } from './wilds';
import { ensureRegionBands, regionBand, resolvePlaceRegionId } from './regionLevels';
import type { EngineMode, GameState } from './types';

// ---------------------------------------------------------------------------
// fixtures (committed; regenerate with scripts/gen-xp-open4-chipstreams.mjs)
// ---------------------------------------------------------------------------

interface Row {
  turn: number;
  location: string;
  offeredChoices: string[];
  playerInput: string;
  level?: number;
  progress?: boolean;
  xpGained?: number;
  quests?: string;
}
interface FinalState {
  seed: number;
  turn: number;
  engineMode: string;
  currentLocation: string;
  level: number;
  openingEstablishment: { complete: boolean };
  arcDirector: { turnsSinceCombatReceipt: number; lastEncounterClearedTurn?: number | null };
  sceneFacts: { pendingEncounter: unknown; lastKill: unknown };
}

const FIX = (name: string) => fileURLToPath(new URL(`../__tests__/fixtures/xp-open4-chipstreams/${name}`, import.meta.url));
const RUNS = ['7301-random', '7302-random', '7303-quest', '7304-quest'] as const;

function loadRows(run: string): Row[] {
  return readFileSync(FIX(`${run}.jsonl`), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as Row);
}
const FINALS = JSON.parse(readFileSync(FIX('final-state.json'), 'utf8')) as Record<string, FinalState>;

function stateFromFinal(run: string): GameState {
  const f = FINALS[run]!;
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    seed: String(f.seed),
    turn: f.turn,
    currentLocation: f.currentLocation,
    journey: null,
    activeEncounter: null,
    character: { ...s.character, level: f.level },
    openingEstablishment: { ...(s.openingEstablishment as object), complete: f.openingEstablishment.complete } as GameState['openingEstablishment'],
    arcDirector: { ...(s.arcDirector as object), ...f.arcDirector } as GameState['arcDirector'],
    sceneFacts: { ...(s.sceneFacts as object), pendingEncounter: null, lastKill: null } as unknown as GameState['sceneFacts'],
  } as GameState;
}

function wildsBase(mode: EngineMode, level = 3, place = 'Blackspine Treeline'): GameState {
  const s = createInitialState(undefined, mode) as GameState;
  return {
    ...s,
    engineMode: mode,
    seed: 'open5-wildlife',
    currentLocation: place,
    activeEncounter: null,
    journey: null,
    character: { ...s.character, level },
    openingEstablishment: { ...(s.openingEstablishment as object), complete: true } as GameState['openingEstablishment'],
  };
}

const POOL = [
  'Travel toward West Wall',
  'Ask High Chanter Orel Vane about the lead',
  'Search Lowmarket for signs',
  'Say something…',
  'Do something else…',
];

// ---------------------------------------------------------------------------
// 1-4  WoW maths
// ---------------------------------------------------------------------------

describe('OPEN5 1 — WoW killScale worked numbers (to 2 decimals)', () => {
  // R(P, M) = [(45+5M)/(45+5P)] x diff. diff = 1 + 5%/level above (cap +4); 1 - (P-M)/ZD below.
  const table: Array<[number, number, number]> = [
    // P, M, R
    [2, 2, 1.0], [2, 4, 1.3], [2, 6, 1.64],
    [5, 3, 0.51], [5, 5, 1.0], [5, 7, 1.26], [5, 9, 1.54],
    [10, 6, 0.34], [10, 8, 0.64], [10, 10, 1.0], [10, 12, 1.22], [10, 14, 1.45],
    [20, 16, 0.55], [20, 18, 0.76], [20, 20, 1.0], [20, 22, 1.18], [20, 24, 1.37],
    [30, 26, 0.6], [30, 28, 0.79], [30, 30, 1.0], [30, 32, 1.16], [30, 34, 1.32],
  ];
  for (const [P, M, R] of table) {
    it(`P${P} vs M${M} = ${R.toFixed(2)}`, () => {
      expect(killScale(P, M)).toBeCloseTo(R, 2);
    });
  }

  it('Zero Difference steps (S1)', () => {
    expect([2, 5, 10, 20, 30].map(zeroDifference)).toEqual([5, 5, 7, 11, 12]);
  });

  it('a same-level kill is 1.00 at every level', () => {
    for (let L = 1; L <= 40; L += 1) expect(killScale(L, L)).toBeCloseTo(1, 10);
  });

  it('con colours follow the WoW bands', () => {
    expect(conColor(10, 15)).toBe('red');
    expect(conColor(10, 13)).toBe('orange');
    expect(conColor(10, 10)).toBe('yellow');
    expect(conColor(10, 7)).toBe('green');
    expect(conColor(10, 4)).toBe('gray');
  });
});

describe('OPEN5 2 — gray cliff', () => {
  it('nothing is gray at character level 5 or below', () => {
    for (let P = 1; P <= 5; P += 1) {
      expect(grayLevel(P)).toBe(0);
      expect(killScale(P, 1)).toBeGreaterThan(0);
    }
  });

  it('gray mobs pay 0; one level up pays', () => {
    for (const P of [10, 20, 30]) {
      const g = grayLevel(P);
      expect(killScale(P, g)).toBe(0);
      expect(killScale(P, g + 1)).toBeGreaterThan(0);
    }
    expect(grayLevel(10)).toBe(4);
    expect(grayLevel(20)).toBe(13);
    expect(grayLevel(30)).toBe(22);
  });

  it('a gray table kill pays 0 XP through the milestone owner', () => {
    expect(
      unitMilestoneAmount('litrpg', 'encounter', { playerLevel: 10, foeLevel: 4, levelSource: 'table', allowZero: true })
    ).toBe(0);
  });
});

describe('OPEN5 3 — elite x2', () => {
  it('doubles a table kill (elite skips trash WILDS_KILL_XP_MULT) and is a challenge kill', () => {
    // OPEN7 addendum: trash keeps WILDS_KILL_XP_MULT; elite pays full taper ×2 so zone bosses stay worthwhile.
    const opts = { playerLevel: 8, foeLevel: 8, levelSource: 'table' as const, skipEventCap: true };
    const plain = unitMilestoneAmount('litrpg', 'encounter', opts);
    const elite = unitMilestoneAmount('litrpg', 'encounter', { ...opts, elite: true });
    expect(plain).toBeGreaterThan(0);
    expect(elite).toBeGreaterThan(plain * 2);
    expect(elite / plain).toBeCloseTo(2 / WILDS_KILL_XP_MULT, 1);
    expect(isChallengeHuntKill(8, 8, { elite: true })).toBe(true);
    expect(isChallengeHuntKill(8, 8)).toBe(false);
    expect(isChallengeHuntKill(8, 11)).toBe(true);
  });

  it('a table kill above you pays the WoW ratio (no +/-3 clamp, no tough-foe stack)', () => {
    const same = unitMilestoneAmount('litrpg', 'encounter', { playerLevel: 5, foeLevel: 5, levelSource: 'table', skipEventCap: true });
    const up = unitMilestoneAmount('litrpg', 'encounter', { playerLevel: 5, foeLevel: 7, levelSource: 'table', skipEventCap: true });
    expect(up / same).toBeCloseTo(killScale(5, 7), 1);
  });
});

describe('OPEN5 4 — hunting budgets (OPEN7: report-only, no payout cap)', () => {
  // OPEN7 (John 2 Nov 2026): remove per-session hunt XP budgets as payout limiters.
  // Constants remain for historical share naming; applyWildsHuntBudget never refuses/reduces pay.
  it('regular 30% / challenge 15% constants still name the old shares', () => {
    expect(WILDS_HUNT_BAR_SHARE).toBe(0.3);
    expect(WILDS_CHALLENGE_BAR_SHARE).toBe(0.15);
    for (const P of [2, 5, 10, 20]) {
      const caps = wildsBudgetCaps('litrpg', P);
      expect(caps.regular).toBeGreaterThan(caps.challenge);
      expect(caps.regular / caps.challenge).toBeGreaterThan(1.7);
      expect(caps.regular / caps.challenge).toBeLessThan(2.3);
    }
  });

  it('pays full amount every non-gray kill; gray stays 0; never post-cap floor', () => {
    const P = 5;
    const caps = wildsBudgetCaps('litrpg', P);
    const first = applyWildsHuntBudget('litrpg', P, caps.regular + 100, { challenge: false, gray: false });
    expect(first.amount).toBe(caps.regular + 100);
    expect(first.capped).toBe(false);
    const next = applyWildsHuntBudget('litrpg', P, 100, { challenge: false, gray: false, ledger: first.ledger });
    expect(next.capped).toBe(false);
    expect(next.amount).toBe(100);
    const gray = applyWildsHuntBudget('litrpg', P, 100, { challenge: false, gray: true, ledger: first.ledger });
    expect(gray.amount).toBe(0);
  });

  it('challenge kills still track their own ledger (report-only)', () => {
    const P = 5;
    const caps = wildsBudgetCaps('litrpg', P);
    const reg = applyWildsHuntBudget('litrpg', P, caps.regular, { challenge: false, gray: false });
    const chal = applyWildsHuntBudget('litrpg', P, 50, { challenge: true, gray: false, ledger: reg.ledger });
    expect(chal.capped).toBe(false);
    expect(chal.amount).toBe(50);
    expect(chal.ledger.challengePaid).toBe(50);
    expect(chal.ledger.regularPaid).toBe(caps.regular);
  });
});

// ---------------------------------------------------------------------------
// 5  Region creature stock
// ---------------------------------------------------------------------------

describe('OPEN5 5 — region creature stock', () => {
  it('seeds named species inside the world cap with a gentle non-elite first slot', () => {
    for (const level of [1, 5, 12]) {
      const s = ensureWilds(wildsBase('litrpg', level));
      const placeId = Object.keys(s.wildsByPlace ?? {})[0]!;
      const w = s.wildsByPlace![placeId]!;
      expect(w.slots.length).toBeGreaterThan(0);
      expect(w.slots[0]!.elite).toBeFalsy();
      for (const slot of w.slots) {
        expect(slot.name).toBeTruthy();
        expect(slot.level).toBeGreaterThanOrEqual(1);
        expect(slot.level).toBeLessThanOrEqual(WORLD_MAX_CREATURE_LEVEL);
        expect(slot.stock).toBeGreaterThan(0);
        expect(slot.stock).toBeLessThanOrEqual(slot.maxStock);
      }
    }
  });

  it('region band is stable and ordered', () => {
    const s = ensureRegionBands(wildsBase('litrpg', 4));
    const id = resolvePlaceRegionId(s, s.currentLocation);
    const a = regionBand(s, id);
    const b = regionBand(s, id);
    expect(a).toEqual(b);
    expect(a.low).toBeGreaterThanOrEqual(1);
    expect(a.high).toBeGreaterThanOrEqual(a.low);
  });
});

// ---------------------------------------------------------------------------
// 15  Equip rule
// ---------------------------------------------------------------------------

describe('OPEN5 15 — equip level rule', () => {
  it('margin is 2: item level <= P + 2 wears, P + 3 does not', () => {
    expect(EQUIP_LEVEL_MARGIN).toBe(2);
    expect(canEquipAtLevel({ itemLevel: 5 }, 3, 'litrpg')).toBe(true);
    expect(canEquipAtLevel({ itemLevel: 6 }, 3, 'litrpg')).toBe(false);
    expect(equipBlockReason({ itemLevel: 6, name: 'Blade' }, 3, 'rpg')).toBe('Requires level 6 (you are level 3)');
  });

  it('unlevelled gear has no requirement', () => {
    expect(canEquipAtLevel({}, 1, 'litrpg')).toBe(true);
    expect(canEquipAtLevel(null, 1, 'litrpg')).toBe(true);
    expect(equipBlockReason({ name: 'Rag' }, 1, 'litrpg')).toBeNull();
  });

  it('applies to LitRPG + Story RPG only; tabletop and PYOA never', () => {
    expect(modeUsesEquipLevel('litrpg')).toBe(true);
    expect(modeUsesEquipLevel('rpg')).toBe(true);
    expect(modeUsesEquipLevel('dnd')).toBe(false);
    expect(modeUsesEquipLevel('pyoa')).toBe(false);
    expect(canEquipAtLevel({ itemLevel: 40 }, 1, 'dnd')).toBe(true);
    expect(canEquipAtLevel({ itemLevel: 40 }, 1, 'pyoa')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 16 / 21  Hunt pad
// ---------------------------------------------------------------------------

describe('OPEN5 16 — Hunt pad outdoor LitRPG', () => {
  it('offers Hunt outdoors in LitRPG after the opening, replacing filler/social not progress', () => {
    const state = wildsBase('litrpg', 3);
    const ranked = rankChoices(state, POOL);
    expect(ranked.choices.some((c) => isHuntPad(c))).toBe(true);
    expect(ranked.choices).toContain(HUNT_PAD);
    expect(ranked.choices).toContain('Travel toward West Wall');
  });

  it('offers no Hunt indoors', () => {
    const state = wildsBase('litrpg', 3, 'Greyhollow Inn Cellar');
    expect(rankChoices(state, POOL).choices.some((c) => isHuntPad(c))).toBe(false);
  });

  it('offers no Hunt before the opening is done or during a fight', () => {
    const early = wildsBase('litrpg', 3);
    early.openingEstablishment = { ...(early.openingEstablishment as object), complete: false } as GameState['openingEstablishment'];
    expect(rankChoices(early, POOL).choices.some((c) => isHuntPad(c))).toBe(false);
    const fight = { ...wildsBase('litrpg', 3), activeEncounter: { name: 'Wolf', level: 3, hp: 5, maxHp: 10 } } as unknown as GameState;
    expect(rankChoices(fight, POOL).choices.some((c) => isHuntPad(c))).toBe(false);
  });
});

describe('OPEN5 21 — Hunt stays out of tabletop and Story RPG', () => {
  it('dnd and rpg never see Hunt', () => {
    for (const mode of ['dnd', 'rpg'] as const) {
      const ranked = rankChoices(wildsBase(mode, 3), POOL);
      expect(ranked.choices.some((c) => isHuntPad(c))).toBe(false);
    }
  });

  it('dnd never sees a Gather pad either', () => {
    expect(rankChoices(wildsBase('dnd', 3), POOL).choices.some((c) => /^Gather\b/i.test(c))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 17 / 18  Seek Fight on the real OPEN4 finals
// ---------------------------------------------------------------------------

describe('OPEN5 17 — Seek Fight on the real OPEN4 7301 / 7303 final states', () => {
  for (const run of ['7301-random', '7303-quest'] as const) {
    it(`${run}: drought state offers Seek or Hunt through rank, compile and resolve`, () => {
      const state = stateFromFinal(run);
      const since = state.arcDirector?.turnsSinceCombatReceipt;
      expect(typeof since).toBe('number');
      expect(since as number).toBeGreaterThanOrEqual(8);
      const seekOrHunt = (c: string) => c === SEEK_FIGHT_CHIP || isHuntPad(c);
      const rows = loadRows(run);
      const lastPad = rows[rows.length - 1]!.offeredChoices;
      for (const pool of [POOL, lastPad]) {
        const ranked = rankChoices(state, pool);
        expect(ranked.choices.some(seekOrHunt), `rank ${JSON.stringify(ranked.choices)}`).toBe(true);
        const compiled = compileChoices(state, pool);
        expect(compiled.choices.some(seekOrHunt), `compile ${JSON.stringify(compiled.choices)}`).toBe(true);
      }
    });
  }

  it('a journey underway no longer short-circuits the ranker (Seek still lands)', () => {
    const state = stateFromFinal('7301-random');
    const journey = { status: 'underway' } as unknown as GameState['journey'];
    const ranked = rankChoices({ ...state, journey }, POOL);
    expect(ranked.choices.some((c) => c === SEEK_FIGHT_CHIP || isHuntPad(c))).toBe(true);
  });

  it('no Seek Fight inside the first 8 turns after a fight', () => {
    const state = stateFromFinal('7301-random');
    const fresh = { ...state, arcDirector: { ...(state.arcDirector as object), turnsSinceCombatReceipt: 2 } } as GameState;
    const ranked = rankChoices(fresh, POOL);
    expect(ranked.choices).not.toContain(SEEK_FIGHT_CHIP);
  });
});

describe('OPEN5 18 — Seek Fight survives the invented-threat gate', () => {
  it('the chip is never dropped as a threat with no setup', () => {
    const state = stateFromFinal('7301-random');
    const out = compileChoices(state, [...POOL, SEEK_FIGHT_CHIP]);
    expect(out.choices.some((c) => c === SEEK_FIGHT_CHIP || isHuntPad(c))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 19 / 20  Filler family cap on fixture replay
// ---------------------------------------------------------------------------

describe('OPEN5 20 — fixtures are the real chip streams', () => {
  it('four runs with turns, locations and pads', () => {
    expect(Object.keys(FINALS).sort()).toEqual([...RUNS].sort());
    for (const run of RUNS) {
      const rows = loadRows(run);
      expect(rows.length).toBeGreaterThan(20);
      for (const r of rows) {
        expect(typeof r.turn).toBe('number');
        expect(r.location).toBeTruthy();
        expect(Array.isArray(r.offeredChoices)).toBe(true);
      }
      expect(FINALS[run]!.engineMode).toBe('litrpg');
    }
  });

  it('rotating filler labels are present (the shape OPEN4 per-label cap missed)', () => {
    let rotating = 0;
    for (const run of RUNS) {
      const labels = new Set<string>();
      for (const r of loadRows(run)) for (const c of r.offeredChoices) if (isFillerNoProgressChip(c)) labels.add(c);
      if (labels.size >= 3) rotating += 1;
    }
    expect(rotating).toBeGreaterThanOrEqual(1);
  });
});

describe('OPEN5 19 — filler family cap <= 2 on fixture replay', () => {
  for (const run of RUNS) {
    it(`${run}: a search/inspect/use family is offered on at most 2 pads per scene`, () => {
      const rows = loadRows(run);
      let state = stateFromFinal(run);
      state = { ...state, circling: { stale: {}, lastProgressTurn: 0 } as GameState['circling'] };
      const padsPerScene = new Map<string, number>();
      let prevScene: string | undefined;
      let sceneRun = 0;
      let prevCounts: Record<string, number> = {};
      for (const row of rows) {
        state = {
          ...state,
          turn: row.turn,
          currentLocation: row.location,
          character: { ...state.character, level: row.level ?? state.character.level },
        };
        // What the pipeline puts on the pad: filler labels already at the family budget are dropped.
        const shown = row.offeredChoices.filter((c) => !fillerOfferExhausted(state, c));
        state = creditFillerOffers(state, shown);
        const scene = state.circling?.fillerOfferSceneKey;
        const counts = state.circling?.fillerOfferCounts ?? {};
        // A scene change (place / quest / kit / level) is meaningful and resets the budget by design,
        // so count per consecutive scene run, not per place name.
        if (scene !== prevScene) sceneRun += 1;
        const before = scene === prevScene ? prevCounts : {};
        for (const [k, n] of Object.entries(counts)) {
          if (!k.startsWith('fam:') || n <= (before[k] ?? 0)) continue;
          const id = `run${sceneRun}:${scene}::${k}`;
          padsPerScene.set(id, (padsPerScene.get(id) ?? 0) + 1);
        }
        prevScene = scene;
        prevCounts = { ...counts };
      }
      expect(padsPerScene.size).toBeGreaterThan(0);
      for (const [id, n] of padsPerScene) expect(n, id).toBeLessThanOrEqual(2);
    });
  }

  it('rotating labels in one family share one budget', () => {
    let state = wildsBase('litrpg', 3, 'Lowmarket');
    state = { ...state, circling: { stale: {}, lastProgressTurn: 0 } as GameState['circling'] };
    const a = 'Read the signs of the rumor';
    const b = 'Read the report on the rumor';
    const c = 'Read the proof of the rumor';
    expect(fillerOfferExhausted(state, a)).toBe(false);
    state = creditFillerOffers(state, [a]);
    expect(fillerOfferExhausted(state, b)).toBe(false);
    state = creditFillerOffers(state, [b]);
    // Two offers of the family: a brand-new rotating label is already spent.
    expect(fillerOfferExhausted(state, c)).toBe(true);
    // A meaningful scene change (new place) opens the budget again.
    const moved = { ...state, currentLocation: 'West Wall' } as GameState;
    expect(fillerOfferExhausted(moved, c)).toBe(false);
  });

  it('Hunt / Gather / Seek Fight / Free-input are never filler budget', () => {
    let state = wildsBase('litrpg', 3);
    state = { ...state, circling: { stale: {}, lastProgressTurn: 0 } as GameState['circling'] };
    for (let i = 0; i < 4; i += 1) {
      state = creditFillerOffers(state, [HUNT_PAD, 'Gather herbs and resources nearby', SEEK_FIGHT_CHIP, 'Say something…']);
    }
    expect(fillerOfferExhausted(state, HUNT_PAD)).toBe(false);
    expect(fillerOfferExhausted(state, SEEK_FIGHT_CHIP)).toBe(false);
  });
});
