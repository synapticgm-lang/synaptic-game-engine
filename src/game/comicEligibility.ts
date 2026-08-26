/**
 * Comic-lite eligibility — skip rules + sparse frequency + Klein caps + kill switches.
 * Frequency applies AFTER skips, not to raw turns.
 */

import type { GameState, Settings } from './types';
import { isStoryTooThin, storyHasBody } from './turnAsk';
import { isLookAroundChoice } from './choicePipeline';
import { imagesKilled, comicGenKilled, comicEligibleRate } from './opsKillSwitches';
import {
  canSpendComicKleinUnit,
  canSpend,
} from './capacityLedger';
import { getActiveSubscriptionTier } from './subscriptionTiers';
import { isUnsalvageableKidImagePrompt } from './visualCanon';

export type ComicSkipReason =
  | 'not_comic'
  | 'images_killed'
  | 'comic_killed'
  | 'thin_story'
  | 'look_around'
  | 'duplicate_beat'
  | 'kid_skip'
  | 'capacity'
  | 'klein_cap'
  | 'frequency'
  | 'no_focal'
  | 'ok';

export interface ComicEligibilityInput {
  settings: Pick<Settings, 'visualMode' | 'panelFrequency' | 'contentMode' | 'subscriptionTier'>;
  state: Pick<GameState, 'saveId' | 'turn' | 'currentLocation' | 'sceneFacts' | 'companions' | 'character' | 'memorableMoments'>;
  storyText: string;
  playerAction: string;
  /** Hash/fingerprint of last comic-lite spend beat (place+roster+kit). */
  lastComicBeatKey?: string | null;
  /** Proposed art prompt for Kid preflight (before capacity). */
  proposedArtPrompt?: string;
  /** Deterministic roll seed — defaults to saveId+turn. */
  frequencySeed?: string;
}

export interface ComicEligibilityResult {
  eligible: boolean;
  skipReason: ComicSkipReason;
  /** Target rate after skips (Free comic-lite ≈ 0.20). */
  targetRate: number;
  /** True when chrome/overlays may still wrap Memorable plates. */
  allowMemorableChrome: boolean;
}

const FREE_COMIC_LITE_RATE = 0.2;
const MID_RATE = 0.48;
const HIGH_RATE = 0.68;

export function comicLiteTargetRate(
  settings: Pick<Settings, 'panelFrequency'>
): number {
  const remote = comicEligibleRate();
  if (remote !== null) return Math.max(0, Math.min(1, remote));
  const tier = getActiveSubscriptionTier();
  if (tier === 'free') {
    return FREE_COMIC_LITE_RATE;
  }
  if (settings.panelFrequency === 'minimal') {
    return tier === 'high' || tier === 'admin' ? 0.35 : 0.25;
  }
  if (settings.panelFrequency === 'high') {
    return tier === 'high' || tier === 'admin' ? HIGH_RATE : MID_RATE;
  }
  return tier === 'high' || tier === 'admin' ? HIGH_RATE : MID_RATE;
}

/** Stable 0..1 from a string — for frequency sampling without Math.random in tests. */
export function hashUnitInterval(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

export function buildComicBeatDedupeKey(state: ComicEligibilityInput['state']): string {
  const place = (state.currentLocation || '').trim().toLowerCase();
  const present = (state.sceneFacts?.present ?? []).map((p) => p.toLowerCase()).sort().join(',');
  const companions = (state.companions ?? []).map((c) => c.name.toLowerCase()).sort().join(',');
  const kit = (state.character?.appearance || '').trim().toLowerCase().slice(0, 80);
  return `${place}|${present}|${companions}|${kit}`;
}

function hasFocalSubject(state: ComicEligibilityInput['state'], storyText: string): boolean {
  if (state.character?.name?.trim()) return true;
  if ((state.sceneFacts?.present?.length ?? 0) > 0) return true;
  if ((state.companions?.length ?? 0) > 0) return true;
  if ((state.currentLocation || '').trim().length >= 3 && storyHasBody(storyText)) return true;
  return false;
}

/**
 * Kid rewrite/skip BEFORE capacity/provider.
 * Unsalvageable → skip (zero spend). Salvageable rewrite happens at generateComicImage.
 */
export function kidComicPreflight(
  prompt: string | undefined,
  contentMode: Settings['contentMode'] | undefined
): { skip: boolean; reason?: ComicSkipReason } {
  if (contentMode !== 'kid') {
    return { skip: false };
  }
  if (!prompt?.trim()) return { skip: false };
  if (isUnsalvageableKidImagePrompt(prompt)) {
    return { skip: true, reason: 'kid_skip' };
  }
  return { skip: false };
}

export function evaluateComicEligibility(input: ComicEligibilityInput): ComicEligibilityResult {
  const allowMemorableChrome = true;
  if (input.settings.visualMode !== 'comic') {
    return {
      eligible: false,
      skipReason: 'not_comic',
      targetRate: 0,
      allowMemorableChrome,
    };
  }
  if (imagesKilled()) {
    return { eligible: false, skipReason: 'images_killed', targetRate: 0, allowMemorableChrome };
  }
  if (comicGenKilled()) {
    return { eligible: false, skipReason: 'comic_killed', targetRate: 0, allowMemorableChrome };
  }

  const targetRate = comicLiteTargetRate(input.settings);
  if (targetRate <= 0) {
    return { eligible: false, skipReason: 'comic_killed', targetRate: 0, allowMemorableChrome };
  }

  if (!storyHasBody(input.storyText) || isStoryTooThin(input.storyText)) {
    return { eligible: false, skipReason: 'thin_story', targetRate, allowMemorableChrome };
  }

  if (isLookAroundChoice(input.playerAction) || /\b(look around|surroundings|scout the (?:area|room))\b/i.test(input.playerAction)) {
    return { eligible: false, skipReason: 'look_around', targetRate, allowMemorableChrome };
  }

  const beatKey = buildComicBeatDedupeKey(input.state);
  if (input.lastComicBeatKey && input.lastComicBeatKey === beatKey) {
    return { eligible: false, skipReason: 'duplicate_beat', targetRate, allowMemorableChrome };
  }

  if (!hasFocalSubject(input.state, input.storyText)) {
    return { eligible: false, skipReason: 'no_focal', targetRate, allowMemorableChrome };
  }

  const kid = kidComicPreflight(input.proposedArtPrompt, input.settings.contentMode);
  if (kid.skip) {
    return { eligible: false, skipReason: 'kid_skip', targetRate, allowMemorableChrome };
  }

  if (!canSpend('illustrated')) {
    return { eligible: false, skipReason: 'capacity', targetRate, allowMemorableChrome };
  }
  if (!canSpendComicKleinUnit()) {
    return { eligible: false, skipReason: 'klein_cap', targetRate, allowMemorableChrome };
  }

  const seed =
    input.frequencySeed
    ?? `${input.state.saveId || 'save'}|${input.state.turn}|${beatKey}`;
  const roll = hashUnitInterval(seed);
  if (roll >= targetRate) {
    return { eligible: false, skipReason: 'frequency', targetRate, allowMemorableChrome };
  }

  return { eligible: true, skipReason: 'ok', targetRate, allowMemorableChrome };
}
