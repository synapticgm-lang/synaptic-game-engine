/**
 * Social milestone XP — listen/overhear/negotiate once-awards (15–25 XP).
 */

import type { GameState } from './types';

export type SocialMilestoneKind = 'overhear' | 'talk' | 'negotiate' | 'listen';

export interface SocialMilestoneAward {
  amount: number;
  reason: string;
  kind: SocialMilestoneKind;
  key: string;
}

function milestoneKey(kind: SocialMilestoneKind, target: string, loc: string): string {
  return `social:${kind}:${target.toLowerCase().slice(0, 32)}@${loc.toLowerCase().slice(0, 32)}`;
}

export function detectSocialMilestone(
  input: string,
  state: GameState
): SocialMilestoneAward | null {
  const lower = input.toLowerCase();
  const loc = state.currentLocation ?? 'unknown';
  const awarded = new Set(state.arcDirector?.socialMilestones ?? []);

  let kind: SocialMilestoneKind | null = null;
  if (/\b(overhear|eavesdrop)\b/i.test(lower)) kind = 'overhear';
  else if (/\b(negotiate|bargain|deal|haggle)\b/i.test(lower)) kind = 'negotiate';
  else if (/\b(listen(?:\s+(?:at|to|from))?)\b/i.test(lower)) kind = 'listen';
  else if (/\b(ask|talk to|speak with|tell)\b/i.test(lower)) kind = 'talk';

  if (!kind) return null;

  const npcMatch = lower.match(/(?:talk to|speak with|ask|tell|listen to)\s+([a-z][a-z\s'-]{2,30})/i);
  const target = (npcMatch?.[1] ?? 'scene').trim();
  const key = milestoneKey(kind, target, loc);

  if (awarded.has(key)) return null;

  const amount = kind === 'negotiate' ? 25 : kind === 'overhear' ? 20 : 15;
  return {
    amount,
    reason: `Social milestone: ${kind} (${target})`,
    kind,
    key,
  };
}

export function applySocialMilestone(
  state: GameState,
  award: SocialMilestoneAward
): GameState {
  const prev = state.arcDirector?.socialMilestones ?? [];
  return {
    ...state,
    arcDirector: {
      ...state.arcDirector,
      socialMilestones: [...prev, award.key],
    },
  };
}
