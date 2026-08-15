import type { CampaignBible, MysteryCulprit } from '@/data/campaigns/types';
import type { GameState } from './types';

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickMysteryCulprit(bible: CampaignBible, seed: string): MysteryCulprit | undefined {
  const pool = bible.mysteryCulprits;
  if (!pool?.length) return undefined;
  const idx = hashSeed(`${seed}|${bible.id}|culprit`) % pool.length;
  return pool[idx];
}

export function resolveMysteryCulprit(state: GameState, bible: CampaignBible): MysteryCulprit | undefined {
  const pool = bible.mysteryCulprits;
  if (!pool?.length) return undefined;
  const existingId = state.hiddenStamps?.culpritId;
  if (existingId) {
    const match = pool.find((c) => c.id === existingId);
    if (match) return match;
  }
  return pickMysteryCulprit(bible, state.seed || state.saveId || bible.id);
}

export function stampMysteryCulprit(state: GameState, bible: CampaignBible): GameState['hiddenStamps'] {
  const pick = resolveMysteryCulprit(state, bible);
  if (!pick) return state.hiddenStamps;
  return {
    ...state.hiddenStamps,
    culpritId: pick.id,
    culpritName: pick.name,
    culpritRole: pick.role,
    culpritMotive: pick.motive,
  };
}

export function formatHiddenCulpritRail(stamps?: Record<string, string> | null): string {
  const name = stamps?.culpritName?.trim();
  if (!name) return '';
  const role = stamps.culpritRole?.trim();
  const motive = stamps.culpritMotive?.trim();
  return `HIDDEN CULPRIT (ENGINE AUTHORITY — never name, hint, or contradict until the player earns the reveal or the ending): The hand that killed Lord Harrington is ${name}${role ? ` (${role})` : ''}.${motive ? ` Motive: ${motive}` : ''} Others may lie or cover it up. Do not invent a different true killer.`;
}
