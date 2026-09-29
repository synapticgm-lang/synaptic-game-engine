/**
 * 29y — remembered danger at a place, and playback that reads as one visit. No live GM call. Mid writer OFF.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { compileChoices } from './choiceCompiler';
import { resolveEngineFight } from './engineFight';
import { runArcDirectorBeforeGm } from './arcDirector';
import {
  REMEMBERED_FIGHT_CHIP,
  applyRememberedThreatPick,
  parkedThreatHere,
  placeThreatKey,
  syncPlaceThreat,
} from './placeThreats';
import { renderTokenBeat, salvageTokenJsonProse } from './tokenProse';
import {
  buildCompletedEventPacket,
  compileRefEnum,
  formatWriterFacingEvent,
  movementFact,
  type LedgerRef,
} from './completedEventPacket';
import type { ActiveEncounter, GameState } from './types';

const CHURCH = 'Greyhollow Church';
const INN = 'Greyhollow Inn';

function foe(over: Partial<ActiveEncounter> = {}): ActiveEncounter {
  return {
    name: 'Sleepless Bell-Warden',
    level: 2,
    hp: 30,
    maxHp: 30,
    armorClass: 13,
    strength: 14,
    dexterity: 10,
    constitution: 12,
    xpReward: 50,
    goldReward: 5,
    phase: 'engaged',
    ...over,
  };
}

function base(place = CHURCH): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    turn: 20,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    currentLocation: place,
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    quests: [],
    sceneFacts: s.sceneFacts ? { ...s.sceneFacts, pendingEncounter: undefined } : s.sceneFacts,
  };
}

/** A threat parked at the church (no live fight), optionally refused a parley already. */
function withParked(place: string, parleyRefused = 0): GameState {
  return {
    ...base(place),
    placeThreats: {
      [placeThreatKey(CHURCH)]: {
        place: CHURCH,
        encounter: foe({ hp: 12 }),
        storedTurn: 18,
        parleyRefused,
        lastOutcome: 'defeat',
      },
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('29y stamps', () => {
  it('HUD and BUILD are 2026-09-29z3 and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-29z3');
    expect(BUILD_STAMP).toBe('2026-09-29z3');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('29y — remembered danger', () => {
  it('a refused parley keeps the threat on the place, even when the forced fight is lost', () => {
    const live = { ...base(), activeEncounter: foe({ hp: 400, maxHp: 400, armorClass: 40, strength: 30 }) };
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const arc = runArcDirectorBeforeGm(live, 'Parley with the Bell-Warden');
    expect(arc.systemReceipts.join(' ')).toMatch(/Parley check: d20 1 .*failure/);
    const kept = arc.state.placeThreats?.[placeThreatKey(CHURCH)];
    expect(kept).toBeTruthy();
    expect(kept!.encounter.name).toBe('Sleepless Bell-Warden');
    expect(kept!.parleyRefused).toBe(1);
    expect(kept!.encounter.hp).toBeGreaterThan(0);
  });

  it('a threat still live after a refused parley is stored with the refusal counted', () => {
    const before = { ...base(), activeEncounter: foe() };
    const after = syncPlaceThreat(before, before, ['Parley refused by Sleepless Bell-Warden']);
    const kept = after.placeThreats?.[placeThreatKey(CHURCH)];
    expect(kept?.lastOutcome).toBe('live');
    expect(kept?.parleyRefused).toBe(1);
  });

  it('beaten or fled ends it; a loss keeps it', () => {
    const before = { ...base(), activeEncounter: foe() };
    const cleared = { ...before, activeEncounter: null };
    for (const outcome of ['victory', 'escape', 'parleyResolved']) {
      const s = syncPlaceThreat(before, cleared, [`Encounter cleared: Sleepless Bell-Warden (${outcome})`]);
      expect(s.placeThreats?.[placeThreatKey(CHURCH)]).toBeUndefined();
    }
    const lost = syncPlaceThreat(before, cleared, ['Encounter cleared: Sleepless Bell-Warden (defeat)'], foe({ hp: 9 }));
    expect(lost.placeThreats?.[placeThreatKey(CHURCH)]?.encounter.hp).toBe(9);
  });

  it('leaving and coming back still offers the fight chip; elsewhere it does not', () => {
    const away = compileChoices(withParked(INN), ['Look around', 'Wait a moment'], undefined, 'Look around');
    expect(away.choices).not.toContain(REMEMBERED_FIGHT_CHIP);
    const back = compileChoices(withParked(CHURCH), ['Look around', 'Wait a moment'], undefined, 'Travel toward Greyhollow Church');
    expect(back.choices[0]).toBe(REMEMBERED_FIGHT_CHIP);
  });

  it('the fight chip re-engages the same foe through the existing engine fight', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const s = withParked(CHURCH);
    expect(parkedThreatHere(s)).toBeTruthy();
    const fight = resolveEngineFight(s, REMEMBERED_FIGHT_CHIP);
    expect(fight).toBeTruthy();
    expect(fight!.receipts.join(' ')).toMatch(/Sleepless Bell-Warden/);
    expect(resolveEngineFight(withParked(INN), REMEMBERED_FIGHT_CHIP)).toBeNull();
    expect(resolveEngineFight(s, 'Flee toward the door')).toBeNull();
  });

  it('auto player takes the fight chip instead of look, wait, inspect, or another parley', () => {
    const offered = [REMEMBERED_FIGHT_CHIP, 'Look around', 'Wait a moment', 'Inspect the aisle', 'Parley with the Bell-Warden'];
    const s = withParked(CHURCH, 1);
    for (const pick of ['Look around', 'Wait a moment', 'Inspect the aisle', 'Parley with the Bell-Warden']) {
      expect(applyRememberedThreatPick(s, offered, pick)).toEqual({ pick: REMEMBERED_FIGHT_CHIP, rule: 'remembered-threat' });
    }
    expect(applyRememberedThreatPick(s, offered, 'Travel toward Greyhollow Inn').pick).toBe('Travel toward Greyhollow Inn');
    expect(applyRememberedThreatPick(withParked(CHURCH, 0), offered, 'Parley with the Bell-Warden').pick)
      .toBe('Parley with the Bell-Warden');
  });

  it('a quiet place does not gain a threat', () => {
    const quiet = base(INN);
    const arc = runArcDirectorBeforeGm(quiet, 'Look around');
    if (!arc.state.activeEncounter && !arc.state.sceneFacts?.pendingEncounter) {
      expect(arc.state.placeThreats?.[placeThreatKey(INN)]).toBeUndefined();
    }
    expect(applyRememberedThreatPick(quiet, ['Look around', 'Wait'], 'Look around').pick).toBe('Look around');
    expect(compileChoices(quiet, ['Look around', 'Wait a moment'], undefined, 'Look around').choices)
      .not.toContain(REMEMBERED_FIGHT_CHIP);
    expect(resolveEngineFight(quiet, REMEMBERED_FIGHT_CHIP)).toBeNull();
  });
});

describe('29y — playback reads as one visit', () => {
  const ENUM: LedgerRef[] = [
    { tok: 't1', id: 'here', display: CHURCH, klass: 'place' },
    { tok: 't2', id: 'cast:innkeep', display: 'innkeep', klass: 'person' },
    { tok: 't3', id: 'kit:worn-iron-shortsword', display: 'worn iron shortsword', klass: 'kit' },
  ];

  it('a declared ref binds by its id, not by the writer’s own numbering', () => {
    const text = renderTokenBeat(
      {
        refs: [{ tok: 't2', id: 'kit:worn-iron-shortsword', use: 'worn' }],
        lines: [{ fn: 'action', text: 'You drew @t2 and set your feet on the flagstones.' }],
      },
      ENUM
    );
    expect(text).toContain('worn iron shortsword');
    expect(text).not.toContain('innkeep');
  });

  it('an id the ledger does not hold never paints another label', () => {
    const text = renderTokenBeat(
      {
        refs: [{ tok: 't2', id: 'prop:iron-chest', use: 'prop_used' }],
        lines: [
          { fn: 'place', text: 'Cold air hung in @t1 between the broken pews.' },
          { fn: 'action', text: 'You pried at @t2 until the lid gave way.' },
        ],
      },
      ENUM
    );
    expect(text).toContain(CHURCH);
    expect(text).not.toContain('innkeep');
    expect(text).not.toMatch(/pried at/);
    const salvaged = salvageTokenJsonProse(
      '{"refs":[{"tok":"t2","id":"prop:iron-chest","use":"prop_used"}],"lines":[{"fn":"action","text":"You pried at @t2 until it gave',
      ENUM
    );
    expect(salvaged).not.toContain('innkeep');
  });

  it('a card role label is offered at the opening place only', () => {
    // One initial state for both: createInitialState picks a random seed, and the seed picks the opening card.
    const opening = base(INN);
    const moved = {
      ...opening,
      currentLocation: CHURCH,
      circling: { stale: {}, lastProgressTurn: 19, lastLocation: CHURCH, prevPlace: INN, openingPlace: INN, movedTurn: 19 },
    } as GameState;
    const castAway = compileRefEnum(moved).filter((r) => r.id.startsWith('cast:'));
    expect(castAway).toEqual([]);
    const castHome = compileRefEnum({ ...moved, currentLocation: INN }).filter((r) => r.id.startsWith('cast:'));
    expect(castHome.length).toBeGreaterThan(0);
    expect(castHome.length).toBe(compileRefEnum(opening).filter((r) => r.id.startsWith('cast:')).length);
  });

  it('the writer is told whether the state moved this turn', () => {
    const stayed = {
      ...base(CHURCH),
      circling: { stale: {}, lastProgressTurn: 10, lastLocation: CHURCH, prevPlace: INN, movedTurn: 12 },
    } as GameState;
    expect(movementFact(stayed)).toMatch(/^No move this turn: at Greyhollow Church before and after/);
    const moved = { ...stayed, circling: { ...stayed.circling!, movedTurn: 20 } };
    expect(movementFact(moved)).toMatch(/^Moved this turn: from Greyhollow Inn to Greyhollow Church/);
    const facing = formatWriterFacingEvent(buildCompletedEventPacket(stayed, 'Look around'));
    expect(facing).toMatch(/No move this turn/);
    expect(movementFact(base(CHURCH))).toBe('');
  });
});
