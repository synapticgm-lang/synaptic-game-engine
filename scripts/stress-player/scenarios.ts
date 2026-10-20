/**
 * q76e-SCENARIOS — engine-built risky start states for the stress player.
 * Uses selectCatalogEncounter / initEncounterTerminal / rollRoadEncounter /
 * commitTravel / ensureNpcAgenda / recordPersonSeen — not hand-made encounter JSON.
 * No game behaviour change; harness-only. No AI calls.
 */
import type { GameState, RoadEncounter } from '../../src/game/types';
import type { Rng } from '../../src/game/fatePick';
import { initEncounterTerminal } from '../../src/game/encounterTerminalFsm';
import { selectCatalogEncounter } from '../../src/game/encounterBible';
import { commitTravel, rollRoadEncounter, type StretchContext } from '../../src/game/travelJourney';
import { hubsForBibleId } from '../../src/game/outdoorHubs';
import { ensureNpcAgenda } from '../../src/game/npcMemory';
import { recordPersonSeen } from '../../src/game/timeline';
import { resolveEngineFight } from '../../src/game/engineFight';
import { isDying } from '../../src/game/tabletop/roundFight';
import { applyTabletopSheet, resolveSheet } from '../../src/game/tabletop/characterBuild';

export type StressScenarioId =
  | 'none'
  | 'fight'
  | 'dying'
  | 'road-block'
  | 'gatekeeper'
  | 'replay-20632-t9'
  | 'replay-l6-dying'
  | 'replay-l6-road';

export type StressScenarioPick = { id: StressScenarioId; state: GameState };

/** Catalog foe → live activeEncounter via engine init (arcDirector hubSkirmish shape). */
export function injectFight(state: GameState): GameState {
  const seed = selectCatalogEncounter(state);
  const lvl = state.character?.level ?? 1;
  const hp = 12 + lvl * 4;
  const name = seed?.foeName ?? 'the thugs';
  const enc = initEncounterTerminal(
    {
      name,
      level: lvl,
      hp,
      maxHp: hp,
      armorClass: 11 + lvl,
      strength: 12,
      dexterity: 12,
      constitution: 12,
      xpReward: seed?.xpReward ?? 25 + lvl * 5,
      goldReward: seed?.goldReward ?? 5 + lvl * 2,
    },
    state,
    { forcedSpawnKey: name, source: seed?.id ?? 'stress-scenario' },
  );
  const loc = state.currentLocation?.trim() || 'On the road between places';
  return {
    ...state,
    currentLocation: loc,
    activeEncounter: enc,
    openingEstablishment: {
      ...(state.openingEstablishment ?? { pending: [], answers: {} }),
      complete: true,
      pending: [],
    },
  };
}

/**
 * Drop PC to 0 HP through the real fight path: catalog encounter → resolveEngineFight rounds
 * until roundFight writes defeat deathSaves (not a hand-stamped 0 HP).
 * SRD 5.2.1 Death Saving Throws / Dropping to 0 Hit Points (Wizards of the Coast, CC BY 4.0).
 * isDying is tabletop-only (engineMode === 'dnd').
 */
export function injectDying(state: GameState): GameState {
  const base: GameState =
    state.engineMode === 'dnd'
      ? state
      : { ...state, engineMode: 'dnd' };
  // Real tabletop sheet so resolveRoundFight can open rounds (pcCombatProfile).
  const sheet = resolveSheet({
    classId: 'fighter',
    speciesId: 'human',
    backgroundId: 'soldier',
    method: 'point-buy',
    baseScores: { STR: 15, DEX: 13, CON: 14, INT: 8, WIS: 12, CHA: 10 },
    kitId: 'A',
    source: 'build',
  });
  let fighting = applyTabletopSheet(
    {
      ...(base.activeEncounter ? base : injectFight(base)),
      engineMode: 'dnd',
      openingEstablishment: {
        ...(base.openingEstablishment ?? { pending: [], answers: {} }),
        complete: true,
        pending: [],
      },
    },
    sheet,
  );
  fighting = {
    ...fighting,
    character: {
      ...fighting.character,
      hp: Math.min(fighting.character.hp ?? 4, 4),
      maxHp: Math.max(fighting.character.maxHp ?? 12, 12),
    },
  };
  if (!fighting.activeEncounter) fighting = injectFight(fighting);
  let s = fighting;
  for (let i = 0; i < 40; i++) {
    if (isDying(s) || s.deathSaves?.dead) break;
    const r = resolveEngineFight(s, 'Dodge');
    if (!r) break;
    s = r.state;
  }
  if (!(isDying(s) || s.deathSaves?.dead)) {
    // Last resort: same defeat stamp roundFight writes when the catalog foe never drops the PC.
    s = {
      ...s,
      character: {
        ...s.character,
        hp: 0,
        conditions: [...new Set([...(s.character.conditions ?? []), 'Unconscious'])],
      },
      deathSaves: { successes: 0, failures: 0 },
      roundCombat: null,
      activeEncounter: s.activeEncounter,
    };
  }
  // Stress coverage: two failures already counted so the next failed save ends the run (ended>0).
  if (isDying(s) && s.deathSaves && !s.deathSaves.dead) {
    s = {
      ...s,
      deathSaves: {
        successes: s.deathSaves.successes ?? 0,
        failures: Math.max(2, s.deathSaves.failures ?? 0),
        stable: false,
        dead: false,
      },
    };
  }
  return s;
}

function pickTravelTarget(state: GameState, rng: Rng): string | null {
  const hubs = hubsForBibleId(state.campaignBibleId);
  const here = (state.currentLocation ?? '').trim().toLowerCase();
  const candidates: string[] = [];
  for (let i = 0; i < hubs.length; i++) {
    const n = hubs[i]!.name.trim();
    if (n && n.toLowerCase() !== here) candidates.push(n);
  }
  if (!candidates.length) return null;
  return candidates[Math.min(candidates.length - 1, Math.floor(rng() * candidates.length))]!;
}

/**
 * Open a journey with a hostile road meeting via rollRoadEncounter (chanceRoll 0 = always meet)
 * after commitTravel starts the trip. Falls back to seed-retry commitTravel when hubs allow.
 */
export function injectRoadBlock(state: GameState, rng: Rng): GameState {
  const ready: GameState = {
    ...state,
    activeEncounter: null,
    journey: null,
    openingEstablishment: {
      ...(state.openingEstablishment ?? { pending: [], answers: {} }),
      complete: true,
      pending: [],
    },
  };
  const target = pickTravelTarget(ready, rng);
  let underway: GameState = ready;
  if (target) {
    const trip = commitTravel(ready, `Travel toward ${target}`);
    underway = trip.state;
  }
  if (!underway.journey) {
    // Minimal underway shell so rollRoadEncounter can attach — still engine roll for the meeting.
    underway = {
      ...underway,
      currentLocation: 'On the road between places',
      journey: {
        from: ready.currentLocation || 'Greyhollow Inn',
        to: target || 'Keep Gate',
        ground: 'Road',
        terrain: 'road',
        legsTotal: 3,
        legsDone: 1,
        hoursPerLeg: 1,
        startedTurn: ready.turn ?? 1,
        areaTier: 2,
        quietStretches: 2,
      },
    };
  }
  const j = underway.journey!;
  const ctx: StretchContext = {
    terrain: j.terrain,
    haunted: !!j.haunted,
    areaTier: j.areaTier ?? 2,
    stretch: j.legsDone,
    legsTotal: j.legsTotal,
    quietStretches: j.quietStretches ?? 2,
  };
  const level = Math.max(1, underway.character?.level ?? 1);
  // chanceRoll 0 always passes meetingOn gate; kindRoll biased toward hostile kinds.
  const enc = rollRoadEncounter(ctx, level, 0, 0.85, 0.5);
  if (!enc) {
    // Engine returned quiet — force a thugs roll by retrying kind until non-null (still rollRoadEncounter).
    let forced: RoadEncounter | null = null;
    for (let k = 0; k < 16 && !forced; k++) {
      forced = rollRoadEncounter(ctx, level, 0, k / 16, 0.2);
    }
    if (!forced) return underway;
    return attachRoadEncounter(underway, forced);
  }
  return attachRoadEncounter(underway, enc);
}

function attachRoadEncounter(state: GameState, enc: RoadEncounter): GameState {
  if (!enc.want) enc.want = 'a toll for the road';
  const j = state.journey!;
  const named = enc.name?.trim();
  let next: GameState = {
    ...state,
    currentLocation: 'On the road between places',
    journey: { ...j, encounter: enc, quietStretches: 0 },
    activeEncounter: null,
  };
  if (named) next = recordPersonSeen(next, named, 'met on the road');
  return next;
}

/** Gatekeeper with a want — ensureNpcAgenda(role gatekeeper) + present. */
export function injectGatekeeper(state: GameState): GameState {
  const name = 'Osric Brack';
  const mem = ensureNpcAgenda(
    {
      npcId: 'person:osric-brack',
      npcName: name,
      disposition: 'hostile',
      facts: [],
      lastSeenTurn: state.turn ?? 1,
      present: true,
      location: state.currentLocation,
      roleHint: 'gatekeeper',
    },
    { role: 'gatekeeper', disposition: 'hostile', bindTarget: 'the gate' },
  );
  const others = (state.npcMemories ?? []).filter(
    (m) => m.npcName.trim().toLowerCase() !== name.toLowerCase(),
  );
  const present = [...(state.sceneFacts?.present ?? [])];
  if (!present.some((p) => String(p).toLowerCase() === name.toLowerCase())) present.push(name);
  let next: GameState = {
    ...state,
    npcMemories: [...others, mem],
    sceneFacts: {
      ...(state.sceneFacts ?? {
        present: [],
        props: [],
        crowd: 'sparse',
        noise: 'quiet',
        lastBeat: '',
        updatedTurn: state.turn ?? 1,
      }),
      present,
      updatedTurn: state.turn ?? 1,
    },
    openingEstablishment: {
      ...(state.openingEstablishment ?? { pending: [], answers: {} }),
      complete: true,
      pending: [],
    },
  };
  next = recordPersonSeen(next, name, 'gatekeeper at the door');
  return next;
}

/** Recorded replay shapes (20632 T9 mid-fight; L6 T36–39 dying; L6 road blocker). */
export function injectReplay20632T9(state: GameState): GameState {
  return injectFight({ ...state, turn: Math.max(state.turn ?? 1, 9) });
}

export function injectReplayL6Dying(state: GameState): GameState {
  return injectDying({ ...state, turn: Math.max(state.turn ?? 1, 36) });
}

export function injectReplayL6Road(state: GameState, rng: Rng): GameState {
  const blocked = injectRoadBlock({ ...state, turn: Math.max(state.turn ?? 1, 39) }, rng);
  const enc = blocked.journey?.encounter;
  if (enc && !enc.want) {
    return {
      ...blocked,
      journey: {
        ...blocked.journey!,
        encounter: { ...enc, want: 'your name for a debt', kind: enc.kind === 'traveler' ? 'villain' : enc.kind },
      },
    };
  }
  return blocked;
}

const RISKY: StressScenarioId[] = [
  'fight',
  'dying',
  'road-block',
  'gatekeeper',
  'replay-20632-t9',
  'replay-l6-dying',
  'replay-l6-road',
];

/**
 * ~60% of games start in a risky scenario (engine-built).
 * Tabletop gets dying/fight preference so isDying coverage can fire.
 */
export function pickAndInjectScenario(state: GameState, rng: Rng): StressScenarioPick {
  if (rng() >= 0.6) return { id: 'none', state };
  let id = RISKY[Math.min(RISKY.length - 1, Math.floor(rng() * RISKY.length))]!;
  // Dying only meaningful for tabletop (isDying requires dnd).
  if ((id === 'dying' || id === 'replay-l6-dying') && state.engineMode !== 'dnd') {
    id = rng() < 0.5 ? 'fight' : 'road-block';
  }
  switch (id) {
    case 'fight':
      return { id, state: injectFight(state) };
    case 'dying':
      return { id, state: injectDying(state) };
    case 'road-block':
      return { id, state: injectRoadBlock(state, rng) };
    case 'gatekeeper':
      return { id, state: injectGatekeeper(state) };
    case 'replay-20632-t9':
      return { id, state: injectReplay20632T9(state) };
    case 'replay-l6-dying':
      return { id, state: injectReplayL6Dying(state) };
    case 'replay-l6-road':
      return { id, state: injectReplayL6Road(state, rng) };
    default:
      return { id: 'none', state };
  }
}

export type CoverageBucket = {
  fight: number;
  dying: number;
  roadBlock: number;
  typed: number;
  ended: number;
  turns: number;
};

export function emptyCoverage(): CoverageBucket {
  return { fight: 0, dying: 0, roadBlock: 0, typed: 0, ended: 0, turns: 0 };
}

export function sampleCoverage(state: GameState, typed: boolean): Omit<CoverageBucket, 'turns'> {
  const dying =
    !!state.deathSaves && !state.deathSaves.dead && !state.deathSaves.stable && (state.character?.hp ?? 1) <= 0;
  return {
    fight: state.activeEncounter ? 1 : 0,
    dying: dying ? 1 : 0,
    roadBlock: state.journey?.encounter ? 1 : 0,
    typed: typed ? 1 : 0,
    ended: state.playPhase === 'ended' ? 1 : 0,
  };
}

/**
 * Typed line has a real engine answer: hard-gate refusalBody, travel/system receipt
 * (not dry-run chrome), or completedEvent.engineResult — not bare stub gmText alone.
 */
export function engineAnswered(opts: {
  typed: boolean;
  refusalBody?: string | null;
  systemLog?: string[] | null;
  travelReceipt?: string | null;
  engineResult?: string | null;
  gateMessage?: string | null;
}): { answered: boolean; visibleAnswer: string } {
  if (!opts.typed) {
    return { answered: true, visibleAnswer: '' };
  }
  const refusal = (opts.refusalBody ?? '').trim();
  if (refusal) return { answered: true, visibleAnswer: refusal };
  const gate = (opts.gateMessage ?? '').trim();
  if (gate) return { answered: true, visibleAnswer: gate };
  const travel = (opts.travelReceipt ?? '').trim();
  if (travel) return { answered: true, visibleAnswer: travel };
  const fact = (opts.engineResult ?? '').trim();
  if (fact) return { answered: true, visibleAnswer: fact };
  const logs = opts.systemLog ?? [];
  for (let i = 0; i < logs.length; i++) {
    const line = String(logs[i] ?? '').trim();
    if (!line) continue;
    if (/^Dry run/i.test(line)) continue;
    return { answered: true, visibleAnswer: line };
  }
  return { answered: false, visibleAnswer: '' };
}
