/**
 * PACK 12: SMART CHOICE FILTERING
 *
 * Offered chips come only from engine builders (RC-K1). A writer label is kept
 * only when it binds to a builder chip's action + target; unbound chips are dropped.
 */

import type { GameState } from './types';
import { boundEngineChip, isBrokenChoiceLabel } from './choicePipeline';
import { coerceLogContent } from './beatFingerprint';
import { isNameOriginKitCoverChoice, isPlayDemand, playerEngagesOpeningCover } from './openingEstablishment';
import { isLookAroundAction } from './sandboxXp';
import { isChromeTalkChoice } from './chromeAuthority';
import { isJourneyPad, isJourneyUnderway } from './travelJourney';

/** Choice that is only the PC's name (not a real action). */
export function isBarePcNameChoice(choice: string, characterName?: string): boolean {
  const name = (characterName ?? '').trim();
  if (!name || name.length < 2) return false;
  const cleaned = choice.replace(/^[\s✨🎲⭐️•\-–—]+/u, '').trim();
  return cleaned.toLowerCase() === name.toLowerCase();
}

function lastGmStory(state: GameState): string {
  const log = state.log ?? [];
  const start = Math.max(0, log.length - 80);
  for (let i = log.length - 1; i >= start; i--) {
    const entry = log[i];
    const content = coerceLogContent(entry?.content);
    if (entry?.role === 'gm' && content) return content;
  }
  return '';
}

function lastPlayerAction(state: GameState): string {
  const log = state.log ?? [];
  const start = Math.max(0, log.length - 80);
  for (let i = log.length - 1; i >= start; i--) {
    const entry = log[i];
    const content = coerceLogContent(entry?.content);
    if (entry?.role === 'player' && content) return content;
  }
  return '';
}

// Circuit breaker to prevent infinite loops
let filterCallCount = 0;
let lastFilterResetTime = Date.now();
const MAX_FILTER_CALLS_PER_SECOND = 100;

/**
 * Offered list = engine chips only (RC-K1).
 * Writer wording is kept when it binds to a builder action + target; unbound chips are logged and dropped.
 */
export function filterInventedContextChoices(
  choices: string[],
  state: GameState
): string[] {
  const now = Date.now();
  if (now - lastFilterResetTime > 1000) {
    filterCallCount = 0;
    lastFilterResetTime = now;
  }

  filterCallCount++;

  if (filterCallCount > MAX_FILTER_CALLS_PER_SECOND) {
    console.error(`[CIRCUIT BREAKER] filterInventedContextChoices called ${filterCallCount} times in 1 second - returning all choices to prevent infinite loop`);
    return choices;
  }

  const recentStory = lastGmStory(state);
  const pcName = state.character?.name;
  const lastPlayer = lastPlayerAction(state);
  const out: string[] = [];

  for (const choice of choices) {
    if (isJourneyUnderway(state) && isJourneyPad(state, choice)) {
      out.push(choice);
      continue;
    }
    if (isBarePcNameChoice(choice, pcName)) {
      console.log(`[Choice Filter] Removed bare PC-name choice: "${choice}"`);
      continue;
    }
    if (
      isLookAroundAction(lastPlayer)
      && !playerEngagesOpeningCover(lastPlayer)
      && isNameOriginKitCoverChoice(choice)
    ) {
      console.log(`[Choice Filter] Removed name/origin/kit cover after inspect: "${choice}"`);
      continue;
    }
    if (isPlayDemand(lastPlayer) && isNameOriginKitCoverChoice(choice)) {
      console.log(`[Choice Filter] Removed name cover after demand: "${choice}"`);
      continue;
    }
    if (isBrokenChoiceLabel(choice)) {
      console.log(`[Choice Filter] Removed broken-label choice: "${choice}"`);
      continue;
    }
    const alone =
      state.openingEstablishment?.aloneArrival === true
      || state.sceneFacts?.crowd === 'none'
      || ((state.sceneFacts?.present ?? []).length === 0
        && !state.activeEncounter
        && /\b(alone|empty|nobody|no one)\b/i.test(recentStory));
    if (
      alone
      && /\b(gate queue|watch the gate|walk the battlement|crowd|onlookers?)\b/i.test(choice)
    ) {
      console.log(`[Choice Filter] Removed alone-scene crowd pad: "${choice}"`);
      continue;
    }
    if (/\bthe official\b|\ban official\b/i.test(choice)) {
      console.log(`[Choice Filter] Removed official-placeholder choice: "${choice}"`);
      continue;
    }
    if (isChromeTalkChoice(choice)) {
      console.log(`[Choice Filter] Removed chrome/slot talk pad: "${choice}"`);
      continue;
    }
    if (/\bthe official of the official\b|\bscan the official\b|\bapproach the official\b/i.test(choice)) {
      continue;
    }
    // RC-K1: default deny — only a bound engine chip reaches the offered list.
    if (boundEngineChip(choice, state, recentStory)) {
      out.push(choice);
      continue;
    }
    console.log(`[Choice Filter] Removed unbound chip: "${choice}"`);
  }
  return out;
}
