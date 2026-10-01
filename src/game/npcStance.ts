/**
 * Stance: how a person is toward the player now. Who they are (the sheet) stays fixed; the stance
 * moves only when the engine records an event aimed at them this turn, and the writer is told the
 * stance and its cause. A stance is a state, not a score: an event id applies once, and repeating
 * the same kind of event cannot push someone past where it already put them.
 */
import type { GameState, NpcMemory, NpcStance } from './types';
import { stanceActionKind } from './npcMemory';
import { presentNpcRecords } from './npcRecords';

export type StanceEventKind = 'rescued' | 'helped' | 'threatened' | 'harmed';

export interface StanceEvent {
  kind: StanceEventKind;
  /** Stable id for this event on this person; replaying it changes nothing. */
  id: string;
  turn: number;
  /** What happened, in words the writer can use. */
  cause: string;
  /** The player's name, for a betrayal cause. */
  pc?: string;
}

function trusting(m: NpcMemory): boolean {
  const now = m.stance?.now;
  if (now === 'grateful' || now === 'warm') return true;
  return m.disposition === 'friendly' || m.disposition === 'allied' || m.disposition === 'romanced';
}

function isCaptive(m: NpcMemory): boolean {
  return m.sheet?.job === 'prisoner' || m.roleHint === 'captive';
}

function nextStance(m: NpcMemory, kind: StanceEventKind): { now: NpcStance['now']; betrayal: boolean } {
  const now = m.stance?.now;
  switch (kind) {
    case 'rescued':
      return { now: 'grateful', betrayal: false };
    case 'helped':
      if (now === 'hostile' || now === 'afraid') return { now: 'wary', betrayal: false };
      return { now: now === 'grateful' ? 'grateful' : 'warm', betrayal: false };
    case 'threatened':
      return trusting(m) ? { now: 'wary', betrayal: true } : { now: now === 'hostile' ? 'hostile' : 'afraid', betrayal: false };
    case 'harmed':
      return { now: 'hostile', betrayal: trusting(m) };
  }
}

function dispositionFor(m: NpcMemory, now: NpcStance['now']): NpcMemory['disposition'] {
  if (now === 'hostile') return 'hostile';
  if (now === 'grateful' || now === 'warm') {
    return m.disposition === 'allied' || m.disposition === 'romanced' ? m.disposition : 'friendly';
  }
  return m.disposition === 'hostile' ? 'hostile' : 'neutral';
}

/** Apply one engine event to one person. Returns the same object when nothing changes. */
export function applyStanceEvent(m: NpcMemory, ev: StanceEvent): NpcMemory {
  if (m.stance?.events.includes(ev.id)) return m;
  const { now, betrayal } = nextStance(m, ev.kind);
  const events = [...(m.stance?.events ?? []), ev.id].slice(-12);
  // Same stance again: remember the event so it cannot replay, keep the first cause that put them there.
  if (m.stance?.now === now) return { ...m, stance: { ...m.stance, events } };
  const cause = betrayal ? `${ev.cause}, after they had trusted ${ev.pc ?? 'the player'}` : ev.cause;
  return { ...m, disposition: dispositionFor(m, now), stance: { now, cause, turn: ev.turn, events } };
}

function mentions(input: string, m: NpcMemory): boolean {
  const hay = ` ${input.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ')} `;
  for (const n of [m.npcName, ...(m.aliases ?? [])]) {
    const full = n.toLowerCase().trim();
    if (full && hay.includes(` ${full} `)) return true;
    const given = full.split(/\s+/)[0];
    if (given && given.length >= 3 && hay.includes(` ${given} `)) return true;
  }
  return false;
}

/** The present person this action is aimed at: named, or the only one here with the job it names. */
function stanceTarget(state: GameState, input: string): NpcMemory | undefined {
  const here = presentNpcRecords(state);
  const named = here.filter((m) => mentions(input, m));
  if (named.length === 1) return named[0];
  if (named.length > 1) return undefined;
  const hay = input.toLowerCase();
  const byJob = here.filter((m) => m.sheet?.job && new RegExp(`\\b${m.sheet.job}\\b`).test(hay));
  return byJob.length === 1 ? byJob[0] : undefined;
}

const OFFER_ONLY =
  /\b(?:offer(?:s|ed|ing)?|propos\w*|promis\w*|volunteer\w*|(?:can|could|will|would|shall|may|might)\s+(?:\w+\s+)?help|i'll\s+help|(?:want|like|happy|glad|willing|ready|here)\s+to\s+help|let me help)\b/i;

const VERB_CAUSE: Record<StanceEventKind, string> = {
  rescued: 'freed them',
  helped: 'helped them',
  threatened: 'threatened them',
  harmed: 'attacked them',
};

/**
 * The engine event this turn's committed action makes, if any. A failed check this turn is no event:
 * the attempt did not happen the way the player wanted.
 */
export function stanceEventFromAction(
  state: GameState,
  playerInput: string,
  opts: { engineResult?: string } = {},
): { npcId: string; event: StanceEvent } | null {
  if (/\b(?:fail(?:s|ed|ure)?|miss(?:es|ed)?)\b/i.test(opts.engineResult ?? '')) return null;
  const act = stanceActionKind(playerInput);
  if (!act) return null;
  // Offering help is talk; the stance moves on the turn the help is actually done.
  if (act === 'kind' && OFFER_ONLY.test(playerInput)) return null;
  const target = stanceTarget(state, playerInput);
  if (!target) return null;
  const kind: StanceEventKind | null =
    act === 'free' ? (isCaptive(target) ? 'rescued' : null) : act === 'harm' ? 'harmed' : act === 'threat' ? 'threatened' : 'helped';
  if (!kind) return null;
  const pc = state.character?.name?.trim() || 'the player';
  const where = kind === 'rescued' && state.currentLocation ? ` at ${state.currentLocation}` : '';
  // The turn being committed, as the log and the other memory notes number it.
  const turn = (state.turn ?? 0) + 1;
  return {
    npcId: target.npcId,
    event: { kind, id: `${kind}:${turn}`, turn, pc, cause: `${pc} ${VERB_CAUSE[kind]}${where} (T${turn})` },
  };
}

/** Record this turn's stance event on the person it targets. Returns the same state when there is none. */
export function recordStanceFromAction(state: GameState, playerInput: string, opts: { engineResult?: string } = {}): GameState {
  const hit = stanceEventFromAction(state, playerInput, opts);
  if (!hit) return state;
  const memories = state.npcMemories ?? [];
  let changed = false;
  const next = memories.map((m) => {
    if (m.npcId !== hit.npcId) return m;
    const after = applyStanceEvent(m, hit.event);
    changed ||= after !== m;
    return after;
  });
  return changed ? { ...state, npcMemories: next } : state;
}

/** What the writer is told: each present person's stance and its cause. */
export function stanceWriterLine(m: NpcMemory): string {
  if (!m.stance) return '';
  return `${m.npcName} is ${m.stance.now} toward the player now — because ${m.stance.cause}. Who they are has not changed; this is how they meet the player now.`;
}
