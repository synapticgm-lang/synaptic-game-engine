/**
 * 29y — remembered danger at a place.
 * A hostile threat that entered the scene (a live or pending encounter) is kept on that place until it is
 * beaten or talked down; fleeing it does not end it. Leaving and coming back still finds it: the card offers the existing fight chip and the
 * existing engine fight (resolveEngineFight) settles it. A threat never wakes on its own, so a quiet
 * stretch stays quiet. Road meetings are owned by the journey (29w/29x) and are not stored here.
 */
import type { ActiveEncounter, GameState, PlaceThreat } from './types';

export const REMEMBERED_FIGHT_CHIP = 'Press the attack';

/** Outcomes that end the threat. A loss (defeat / capture) or a flee leaves it where it was. */
const GONE_OUTCOMES = new Set(['victory', 'parleyresolved']);

const CLEARED_RECEIPT = /^Encounter cleared:\s*(.+?)\s*\((victory|escape|defeat|capture|parleyResolved)\)\s*$/i;
const PARLEY_REFUSED_RECEIPT = /^Parley (?:check:.*\bfailure\b|refused)/i;

export function placeThreatKey(place: string | undefined | null): string {
  return (place ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function journeyUnderway(state: Pick<GameState, 'journey'>): boolean {
  const j = state.journey;
  return !!j && j.legsDone < j.legsTotal;
}

function liveThreat(state: GameState): ActiveEncounter | null {
  return state.activeEncounter ?? state.sceneFacts?.pendingEncounter ?? null;
}

/** The threat remembered at the current place (live or parked). Null on the road and at quiet places. */
export function rememberedThreatHere(state: GameState): PlaceThreat | null {
  if (journeyUnderway(state)) return null;
  const key = placeThreatKey(state.currentLocation);
  if (!key) return null;
  return state.placeThreats?.[key] ?? null;
}

/** A remembered threat is here and no fight is live: the card owes the fight chip. */
export function parkedThreatHere(state: GameState): PlaceThreat | null {
  if (liveThreat(state)) return null;
  return rememberedThreatHere(state);
}

function withEntry(state: GameState, key: string, entry: PlaceThreat | null): GameState {
  const next = { ...(state.placeThreats ?? {}) };
  if (entry) next[key] = entry;
  else delete next[key];
  return { ...state, placeThreats: next };
}

/** Park a threat for a later engine fight: engaged again, not caught, not mid-parley. */
export function wakeParkedThreat(entry: PlaceThreat): ActiveEncounter {
  const enc = entry.encounter;
  return {
    ...enc,
    phase: 'engaged',
    caught: false,
    hp: Math.max(1, Math.min(enc.hp, enc.maxHp || enc.hp)),
  };
}

/**
 * After the engine settled this turn (before the writer): keep the ledger of threats per place in step.
 * `before` is the state at the start of the turn, `after` the state once the encounter FSM / engine fight ran.
 * `foeAfter` is the foe as the engine left it when the player lost (remaining HP).
 */
export function syncPlaceThreat(
  before: GameState,
  after: GameState,
  receipts: string[],
  foeAfter?: ActiveEncounter | null
): GameState {
  if (journeyUnderway(before) || journeyUnderway(after)) return after;
  const refusedNow = receipts.some((r) => PARLEY_REFUSED_RECEIPT.test(r));

  const live = liveThreat(after);
  if (live) {
    const place = (after.currentLocation ?? '').replace(/\s+/g, ' ').trim();
    const key = placeThreatKey(place);
    if (!key) return after;
    const prior = after.placeThreats?.[key];
    return withEntry(after, key, {
      place,
      encounter: live,
      storedTurn: prior?.storedTurn ?? after.turn,
      parleyRefused: (prior?.parleyRefused ?? 0) + (refusedNow ? 1 : 0),
      lastOutcome: 'live',
    });
  }

  const place = (before.currentLocation ?? '').replace(/\s+/g, ' ').trim();
  const key = placeThreatKey(place);
  if (!key) return after;
  const prior = after.placeThreats?.[key] ?? before.placeThreats?.[key];
  const had = liveThreat(before) ?? prior?.encounter ?? null;
  if (!had) return after;

  const cleared = receipts
    .map((r) => r.match(CLEARED_RECEIPT))
    .find((m): m is RegExpMatchArray => !!m);
  if (cleared) {
    if (GONE_OUTCOMES.has(cleared[2]!.toLowerCase())) {
      return withEntry(after, key, null);
    }
    const fled = cleared[2]!.toLowerCase() === 'escape';
    return withEntry(after, key, {
      place: prior?.place ?? place,
      encounter: fled ? had : foeAfter ?? had,
      storedTurn: prior?.storedTurn ?? before.turn,
      parleyRefused: (prior?.parleyRefused ?? 0) + (refusedNow ? 1 : 0),
      lastOutcome: fled ? 'escaped' : 'defeat',
    });
  }

  // The live threat went away with no fight result (scene reset, preface dropped): it is still here.
  if (liveThreat(before)) {
    return withEntry(after, key, {
      place: prior?.place ?? place,
      encounter: had,
      storedTurn: prior?.storedTurn ?? before.turn,
      parleyRefused: (prior?.parleyRefused ?? 0) + (refusedNow ? 1 : 0),
      lastOutcome: 'unsettled',
    });
  }
  return after;
}

const FIGHT_CHIP = /\b(press the attack|attack|strike|engage|fight)\b/i;
const NOT_FIGHT = /\b(flee|parley|look for a fight)\b/i;

export function isFightChip(chip: string): boolean {
  return FIGHT_CHIP.test(chip) && !NOT_FIGHT.test(chip);
}

/** A parked threat is here: the card carries the existing fight chip. */
export function withRememberedThreatChip(state: GameState, choices: string[]): string[] {
  if (!parkedThreatHere(state)) return choices;
  if (choices.some(isFightChip)) return choices;
  return [REMEMBERED_FIGHT_CHIP, ...choices].slice(0, 6);
}

const LOITER_PICK = /\b(look around|look over|survey|scout|scan|inspect|examine|study|wait|watch|ready yourself|hold still|keep watch)\b/i;

/**
 * Auto player only (a person can still tap any chip). With a remembered threat here and a fight chip on the
 * card, a look / wait / inspect pick, or a parley the threat already refused, becomes the fight chip.
 */
export function applyRememberedThreatPick(
  state: GameState,
  offered: string[],
  pick: string
): { pick: string; rule: 'remembered-threat' | null } {
  const threat = rememberedThreatHere(state);
  if (!threat) return { pick, rule: null };
  const fight =
    offered.find((c) => c.trim().toLowerCase() === REMEMBERED_FIGHT_CHIP.toLowerCase())
    ?? offered.find(isFightChip);
  if (!fight || fight === pick || isFightChip(pick)) return { pick, rule: null };
  const loiter = LOITER_PICK.test(pick) && !/\b(flee|travel|leave)\b/i.test(pick);
  const reParley = /\bparley\b/i.test(pick) && (threat.parleyRefused ?? 0) > 0;
  if (loiter || reParley) return { pick: fight, rule: 'remembered-threat' };
  return { pick, rule: null };
}
