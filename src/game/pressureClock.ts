/** Pressure clock — director spine snippet for stagnation turns 5+. OPT-3 agenda advance on fire. */
import type { GameState, TimelineFact } from './types';

export interface PressureClockState {
  turnsSinceBeat?: number;
  deadlineTurn?: number;
  label?: string;
  /** Last turn an OPT-3 agenda advanced from this clock (one step per fire). */
  lastAgendaAdvanceTurn?: number;
}

/** Shared engine steps for a Doran motivation (one advance = one step). */
const AGENDA_STEPS = [
  'seeking a way at their goal',
  'pressing harder toward their goal',
  'acting on their goal without waiting',
  'seeking comfort or shelter',
  'securing a safer hold',
  'settling in on their own terms',
  'guarding their name',
  'claiming a public win',
  'forcing a reputation payoff',
  'quieting the threat on them',
  'cutting a deal for peace',
  'closing the matter for good',
  'watching over what they protect',
  'rallying help for the ward',
  'taking the hit for their charge',
  'pushing their plan forward',
  'seizing an opening',
  'finishing the conquest move',
  'chasing a payday',
  'locking in the take',
  'collecting what they are owed',
  'hunting a skill or lesson',
  'testing what they learned',
  'proving the new ability',
  'hunting the right tool',
  'securing the gear they need',
  'putting the equipment to use',
];

const MOTIVATION_BASE: Record<string, number> = {
  Knowledge: 0,
  Comfort: 3,
  Reputation: 6,
  Serenity: 9,
  Protection: 12,
  Conquest: 15,
  Wealth: 18,
  Ability: 21,
  Equipment: 24,
};

export function formatPressureClockSnippet(state: GameState): string | null {
  const clock = state.arcDirector?.pressureClock;
  const stagnation = state.progressGovernor?.turnsSinceProgress ?? 0;
  const turnsSinceBeat = clock?.turnsSinceBeat ?? stagnation;
  if (turnsSinceBeat < 5 && stagnation < 5) return null;
  const deadline = clock?.deadlineTurn ?? state.turn + Math.max(1, 8 - turnsSinceBeat);
  const label = clock?.label ?? 'arc deadline';
  return `PRESSURE CLOCK (${turnsSinceBeat} turns since last arc commit): ${label} — deadline ~T${deadline}. Deliver a receipt this beat (quest stage, encounter round, leverage delta, or crisis fork). Atmosphere alone fails.`;
}

export function tickPressureClock(
  prev: PressureClockState | undefined,
  beatCommitted: boolean,
  turn: number,
): PressureClockState {
  const base = prev ?? { turnsSinceBeat: 0 };
  if (beatCommitted) {
    return {
      turnsSinceBeat: 0,
      deadlineTurn: turn + 8,
      label: base.label ?? 'next arc anchor',
      lastAgendaAdvanceTurn: base.lastAgendaAdvanceTurn,
    };
  }
  return {
    ...base,
    turnsSinceBeat: (base.turnsSinceBeat ?? 0) + 1,
    deadlineTurn: base.deadlineTurn ?? turn + 8,
  };
}

/**
 * OPT-3: when the pressure clock fires (stagnation crosses 5, or deadline turn),
 * advance one NPC agenda by one engine step. The change is a world fact
 * (timeline + sceneFacts.agendaWorldFact) for the writer packet.
 */
export function applyPressureAgendaAdvance(
  state: GameState,
  prevClock: PressureClockState | undefined,
  nextClock: PressureClockState,
  beatCommitted: boolean,
): GameState {
  const turn = state.turn;
  let fires = false;
  if (!beatCommitted && nextClock.lastAgendaAdvanceTurn !== turn) {
    const prevSince = prevClock?.turnsSinceBeat ?? 0;
    const nextSince = nextClock.turnsSinceBeat ?? 0;
    if (nextSince >= 5 && prevSince < 5) fires = true;
    else {
      const deadline = nextClock.deadlineTurn;
      if (deadline != null && turn >= deadline) fires = true;
    }
  }

  if (!fires) {
    return {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        pressureClock: nextClock,
      },
    };
  }

  const memories = state.npcMemories ?? [];
  let pick = -1;
  for (let i = 0; i < memories.length; i++) {
    const m = memories[i]!;
    if (m.goal?.motivation && m.goal.target) {
      pick = i;
      break;
    }
  }
  if (pick < 0) {
    return {
      ...state,
      arcDirector: {
        ...state.arcDirector,
        pressureClock: {
          ...nextClock,
          lastAgendaAdvanceTurn: turn,
          deadlineTurn: turn + 8,
        },
      },
    };
  }

  const target = memories[pick]!;
  const nextStep = (target.agendaStep ?? 0) + 1;
  const motivation = target.goal?.motivation ?? 'Knowledge';
  const base = MOTIVATION_BASE[motivation] ?? 0;
  const label = AGENDA_STEPS[base + Math.min(Math.max(nextStep, 1), 3) - 1] ?? AGENDA_STEPS[0]!;
  const factText = `${target.npcName}'s agenda advanced (step ${nextStep}): ${label} — goal ${target.goal!.motivation} (${target.goal!.target}).`;
  const nextMemories = memories.slice();
  nextMemories[pick] = { ...target, agendaStep: nextStep };

  const fact: TimelineFact = {
    id: `agenda-${turn}-${pick}`,
    turn,
    kind: 'npc',
    text: factText,
    at: Date.now(),
  };
  const timeline = [...(state.timeline ?? []), fact].slice(-80);

  return {
    ...state,
    npcMemories: nextMemories,
    timeline,
    sceneFacts: state.sceneFacts
      ? { ...state.sceneFacts, agendaWorldFact: factText }
      : {
          crowd: 'unknown',
          noise: 'unknown',
          present: [],
          props: [],
          lastBeat: '',
          updatedTurn: turn,
          agendaWorldFact: factText,
        },
    arcDirector: {
      ...state.arcDirector,
      pressureClock: {
        ...nextClock,
        lastAgendaAdvanceTurn: turn,
        deadlineTurn: turn + 8,
        turnsSinceBeat: nextClock.turnsSinceBeat,
      },
    },
  };
}
