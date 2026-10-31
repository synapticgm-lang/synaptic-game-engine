/**
 * T10PUSH — single owner for the forced-march / push-on choice set.
 *
 * SRD 5.2.1 Exhaustion (Wizards of the Coast LLC, CC BY 4.0):
 * "While you have the Exhaustion condition, you experience its effects:
 * Level 1: Disadvantage on ability checks.
 * … Level 5: Speed reduced to 0.
 * Level 6: Death."
 * Extended Travel: each hour past 8 forces a Constitution saving throw; fail → +1 Exhaustion.
 * This choice set never offers a path that can reach level 6: at level 5 the engine forces camp.
 */
import type { GameState } from '../types';
import { choiceCountLimitOf } from './houseRules';
import { modeProfile } from './modeProfile';
import {
  CAMP_CHIP,
  EXHAUSTION_DEATH,
  PUSH_ON_CHIP,
  TRAVEL_DAY_HOURS,
  exhaustionLevel,
  travelEngineChip,
} from './travelDay';

/** Road hours on the current waking day (same ledger travelJourney.roadHoursToday reads). */
function roadHoursToday(state: Pick<GameState, 'roadDay'>): number {
  return Math.max(0, state.roadDay?.hours ?? 0);
}

/** Plain Turn back chip (commitTravel already accepts /^turn back\b/). */
export const TURN_BACK_CHIP = 'Turn back';

export const PUSH_ON_CONFIRM_CHIP = 'Confirm push on';
export const PUSH_ON_CANCEL_CHIP = 'Cancel';

/**
 * Fixed canonical order for the push-on situation.
 * Consumers take a prefix of this list via choiceCountLimitOf — never a second copy.
 */
export const PUSH_ON_OPTIONS = [PUSH_ON_CHIP, TURN_BACK_CHIP, CAMP_CHIP] as const;

/** At this Exhaustion level the engine forces camp (SRD level 6 = death; never reach it here). */
export const AUTO_CAMP_EXHAUSTION = 5;

export type PushOnIntent = 'push on' | 'turn back' | 'make camp' | 'confirm' | 'cancel';

export interface PushOnConfirmFacts {
  currentLevel: number;
  /** Exhaustion after one failed Extended Travel save. */
  nextLevel: number;
  consequence: string;
  options: string[];
}

export interface PushOnChoiceSet {
  /** Day spent on a survival journey (forced-march choice point). */
  active: boolean;
  forceCamp: boolean;
  /** Player-facing chips from this owner only (already sliced by choiceCountLimit). */
  options: string[];
  /** Writer / narration facts from the engine. */
  facts: string[];
  /** Present when the player has opened the Push-on confirm step. */
  confirm: PushOnConfirmFacts | null;
}

function survival(state: Pick<GameState, 'engineMode'>): boolean {
  return modeProfile(state.engineMode).travelSurvival;
}

function journeyDaySpent(state: GameState): boolean {
  const j = state.journey;
  if (!j || j.legsDone >= j.legsTotal) return false;
  if (j.terrain === 'streets') return false;
  return roadHoursToday(state) + j.hoursPerLeg > TRAVEL_DAY_HOURS;
}

/** Build the confirm-step consequence (engine facts; writer only narrates). */
export function pushOnConfirmFacts(state: Pick<GameState, 'character' | 'houseRules'>): PushOnConfirmFacts {
  const currentLevel = exhaustionLevel(state.character);
  const nextLevel = Math.min(EXHAUSTION_DEATH, currentLevel + 1);
  const consequence =
    `A failed Constitution save on this forced march raises Exhaustion from level ${currentLevel} to ${nextLevel}` +
    ` (SRD 5.2.1: each Exhaustion level imposes −2 on D20 Tests and −5 feet Speed; level 6 is death).`;
  const limit = choiceCountLimitOf(state);
  const options = [PUSH_ON_CONFIRM_CHIP, PUSH_ON_CANCEL_CHIP].slice(0, limit);
  return { currentLevel, nextLevel, consequence, options };
}

/**
 * ONE owner for the push-on option set. Chips, writer facts, free-text mapping, and the
 * autoplay tester all read from here — never a second list in UI/prompt/tester.
 */
export function pushOnChoiceSet(state: GameState): PushOnChoiceSet {
  const active =
    survival(state)
    && !!state.journey
    && state.journey.legsDone < state.journey.legsTotal
    && !state.activeEncounter
    && journeyDaySpent(state);
  if (!active) {
    return { active: false, forceCamp: false, options: [], facts: [], confirm: null };
  }

  const level = exhaustionLevel(state.character);
  const forceCamp = level >= AUTO_CAMP_EXHAUSTION;
  const limit = choiceCountLimitOf(state);

  if (state.pendingPushOnConfirm) {
    const confirm = pushOnConfirmFacts(state);
    return {
      active: true,
      forceCamp: false,
      options: confirm.options,
      facts: [confirm.consequence, 'Confirm to push on, or cancel to return to the three options with nothing applied.'],
      confirm,
    };
  }

  if (forceCamp) {
    return {
      active: true,
      forceCamp: true,
      options: [CAMP_CHIP].slice(0, limit),
      facts: [
        `Exhaustion is at level ${level}. The party must make camp — pushing on could reach Exhaustion 6 (death under SRD 5.2.1).`,
      ],
      confirm: null,
    };
  }

  return {
    active: true,
    forceCamp: false,
    options: PUSH_ON_OPTIONS.slice(0, limit),
    facts: ['The day\'s travel is spent. Choose: Push on, Turn back, or Make camp.'],
    confirm: null,
  };
}

/**
 * Map free text / chip label onto a push-on intent through the existing travel chip owner
 * plus the confirm chips. No new deny-lists — only positive maps into this choice point.
 */
export function mapPushOnIntent(raw: string): PushOnIntent | null {
  const t = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (/^confirm(?:\s+push(?:\s+on)?)?$/i.test(t) || /^confirm push on\b/i.test(t)) return 'confirm';
  if (/^cancel\b/i.test(t)) return 'cancel';
  const chip = travelEngineChip(t);
  if (chip === 'push on') return 'push on';
  if (chip === 'camp') return 'make camp';
  // Existing Walk-on synonyms (press on / keep going) map to Push on in the spent-day situation.
  if (/^(?:push on|walk on|keep (?:walking|going)|press on|carry on|continue (?:on|along|walking|the journey))\b/i.test(t)) {
    return 'push on';
  }
  if (/^(?:turn back|go back|head back)\b/i.test(t)) return 'turn back';
  return null;
}

/** Autoplay: never confirm a push when the next Exhaustion level would be ≥ AUTO_CAMP_EXHAUSTION. */
export function autoplayMayConfirmPushOn(state: Pick<GameState, 'character' | 'houseRules' | 'pendingPushOnConfirm'>): boolean {
  const facts = state.pendingPushOnConfirm ?? pushOnConfirmFacts(state);
  return facts.nextLevel < AUTO_CAMP_EXHAUSTION;
}
