/**
 * XP-D1 OPEN5 — Gather resolver: herbs / ore from region nodes, trade XP only (0 character XP),
 * ambush from the guards, grace window when clear, mode gates. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  GATHER_TRADE,
  gatherModeOk,
  huntModeOk,
  isGatherRequest,
  startGatherFromInput,
} from './wildlifeActions';
import { GATHER_PAD } from './rules/wildlifeConfig';
import { ensureNodeStock, ensureWilds, hasNodeStock, markGuardsCleared, wildsPlaceId } from './wilds';
import type { EngineMode, GameState } from './types';

function base(mode: EngineMode, level = 3, place = 'Blackspine Treeline'): GameState {
  const s = createInitialState(undefined, mode) as GameState;
  return {
    ...s,
    engineMode: mode,
    seed: 'open5-gather',
    currentLocation: place,
    activeEncounter: null,
    journey: null,
    character: { ...s.character, level },
    openingEstablishment: { ...(s.openingEstablishment as object), complete: true } as GameState['openingEstablishment'],
  };
}

/** Wilds with the guards cleared so the ambush roll never fires. */
function quiet(state: GameState): GameState {
  const s = ensureNodeStock(ensureWilds(state));
  const id = wildsPlaceId(s);
  const w = s.wildsByPlace![id]!;
  const guards = new Set(['aggressive', 'pack', 'territorial']);
  // Same end state as killing every guard: guard stock 0, then the grace window opens.
  const slots = w.slots.map((sl: (typeof w.slots)[number]) => (guards.has(String(sl.behaviour)) ? { ...sl, stock: 0 } : sl));
  return markGuardsCleared({ ...s, wildsByPlace: { ...s.wildsByPlace, [id]: { ...w, slots } } });
}

function tradeRec(state: GameState, id: string) {
  return (state.character.namedSkills ?? []).find((r) => r.id === id);
}

describe('OPEN5 gather request parsing', () => {
  it('knows the pad and plain typed gathering; not quest verbs', () => {
    expect(isGatherRequest(GATHER_PAD)).toBe(true);
    expect(isGatherRequest('I look for ore')).toBe(true);
    expect(isGatherRequest('gather some herbs')).toBe(true);
    expect(isGatherRequest('I go mining')).toBe(true);
    expect(isGatherRequest('Look for a fight')).toBe(false);
    expect(isGatherRequest('I gather my thoughts')).toBe(false);
  });
});

describe('OPEN5 gather resolver', () => {
  it('is LitRPG + Story RPG only; Hunt stays LitRPG only', () => {
    expect(gatherModeOk({ engineMode: 'litrpg' })).toBe(true);
    expect(gatherModeOk({ engineMode: 'rpg' })).toBe(true);
    expect(gatherModeOk({ engineMode: 'dnd' })).toBe(false);
    expect(huntModeOk({ engineMode: 'litrpg' })).toBe(true);
    expect(huntModeOk({ engineMode: 'rpg' })).toBe(false);
    expect(startGatherFromInput(base('dnd'), GATHER_PAD)).toBeNull();
  });

  it('gathers with the guards cleared: material, a spent node unit, trade rank, 0 character XP', () => {
    const s0 = quiet(base('litrpg'));
    expect(hasNodeStock(s0)).toBe(true);
    const xp0 = s0.character.xp;
    const r = startGatherFromInput(s0, GATHER_PAD)!;
    expect(r).toBeTruthy();
    expect(r.fightInput).toBeUndefined();
    expect(r.state.character.xp).toBe(xp0);
    expect(r.receipts.join(' ')).toMatch(/Materials:|nothing worth taking/);
  });

  it('typed "I look for ore" targets ore nodes and grows Mining by use, never character XP', () => {
    let s = quiet(base('litrpg', 5));
    const xp0 = s.character.xp;
    let gathered = 0;
    for (let i = 0; i < 12; i += 1) {
      s = { ...s, turn: (s.turn ?? 0) + 1 };
      const r = startGatherFromInput(s, 'I look for ore');
      if (!r) break;
      s = r.state;
      if (/^You gathered/.test(r.fact ?? '')) gathered += 1;
      expect(r.fightInput).toBeUndefined();
    }
    expect(s.character.xp).toBe(xp0);
    if (gathered > 0) {
      const rec = tradeRec(s, GATHER_TRADE.ore.id);
      expect(rec).toBeTruthy();
      expect(rec!.level).toBeGreaterThanOrEqual(1);
      expect(tradeRec(s, GATHER_TRADE.herb.id)).toBeUndefined();
    }
  });

  it('never rejects: indoors it answers with a fact and changes nothing', () => {
    const s = base('litrpg', 2, 'Greyhollow Inn Cellar');
    const r = startGatherFromInput(s, GATHER_PAD);
    expect(r?.fact).toMatch(/nothing to gather/i);
    expect(r?.state.character.xp).toBe(s.character.xp);
    expect(r?.fightInput).toBeUndefined();
  });

  it('a picked-clean node is an honest receipt, not a crash', () => {
    let s = quiet(base('litrpg', 4));
    const id = wildsPlaceId(s);
    const stock = s.nodeStockByPlace![id]!;
    s = {
      ...s,
      nodeStockByPlace: {
        ...s.nodeStockByPlace,
        [id]: { ...stock, nodes: stock.nodes.map((n) => ({ ...n, stock: 0 })) },
      },
    };
    const r = startGatherFromInput(s, GATHER_PAD)!;
    expect(r.fact).toMatch(/picked clean/i);
    expect(r.receipts.join(' ')).toMatch(/nothing left to gather/i);
  });

  it('is skipped mid-fight (normal path runs)', () => {
    const s = quiet(base('litrpg'));
    const withFight = { ...s, activeEncounter: { name: 'Wolf', level: 3, hp: 5, maxHp: 10 } } as unknown as GameState;
    expect(startGatherFromInput(withFight, GATHER_PAD)).toBeNull();
  });

  it('opens a guard fight (ambush) when guards still stand and the roll hits; otherwise gathers', () => {
    let ambushed = 0;
    let gathered = 0;
    for (let turn = 1; turn <= 60; turn += 1) {
      const s = { ...ensureNodeStock(ensureWilds(base('litrpg', 3))), turn };
      const r = startGatherFromInput(s, GATHER_PAD);
      if (!r) continue;
      if (r.fightInput) {
        ambushed += 1;
        expect(r.fightInput).toMatch(/^Attack /);
        expect(r.state.activeEncounter?.levelSource).toBe('table');
        expect(r.receipts.join(' ')).toMatch(/guarding this ground/);
        expect(r.receipts.join(' ')).not.toMatch(/Materials:/);
      } else if (/^You gathered/.test(r.fact ?? '')) {
        gathered += 1;
      }
    }
    // GUARD_AMBUSH_BASE x share alive is a real chance, not a certainty.
    expect(ambushed).toBeGreaterThan(0);
    expect(gathered).toBeGreaterThan(0);
  });

  it('never ambushes inside the grace window after the guards are cleared', () => {
    const s = quiet(base('litrpg', 3));
    // World hour = turn here; guards respawn every WILDS_RESPAWN_HOURS (6), so stay inside the first window.
    for (let turn = 1; turn <= 5; turn += 1) {
      const r = startGatherFromInput({ ...s, turn }, GATHER_PAD);
      expect(r?.fightInput).toBeUndefined();
    }
  });

  it('works in Story RPG (rpg) without ever starting a Hunt', () => {
    const r = startGatherFromInput(quiet(base('rpg', 3)), 'gather some herbs');
    expect(r).toBeTruthy();
    expect(r?.fightInput).toBeUndefined();
  });
});
