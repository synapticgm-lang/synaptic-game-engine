/**
 * Writer escalation policy — Manus Option 10 explicitly disabled (Wave 5 only).
 *
 * Free stays on Gemini 2.5 Flash Lite. Mid/High tiers use their subscription writer
 * only — never auto-escalate on stagnation until John authorizes Wave 5 gates.
 *
 * 29d — optional OpenRouter failover model id for Free (same physics; swap renderer only).
 */

import type { HostedAiTier } from './testLab';
import { effectiveWriterTier } from './testLab';

/** Manus T7 Option 10 — stagnation-only Mid writer. Default NO after Wave 4. */
export const STAGNATION_MID_WRITER_ENABLED = false;

/** Cheap open-weight failover when Free Flash Lite returns empty/timeout (OpenRouter). */
export const FREE_WRITER_FAILOVER_OPENROUTER = 'meta-llama/llama-3.1-8b-instruct';

/**
 * Resolve Free failover model — never Mid/Sonnet. Returns null if primary is not Free Flash Lite.
 */
export function resolveFreeWriterFailover(primaryModelId: string): string | null {
  const id = primaryModelId.toLowerCase();
  if (id.includes('flash-lite') || id.includes('gemini-2.5-flash-lite')) {
    return FREE_WRITER_FAILOVER_OPENROUTER;
  }
  return null;
}

/**
 * Resolve writer tier for a turn. Stagnation never escalates Free → Mid while disabled.
 */
export function resolveWriterTierForTurn(
  subscriptionTier: HostedAiTier | string | undefined,
  _opts?: { stagnationLevel?: number; loopCount?: number }
): HostedAiTier {
  void _opts;
  // Stagnation Mid writer is not scheduled — see STAGNATION_MID_WRITER_ENABLED.
  if (!STAGNATION_MID_WRITER_ENABLED) {
    return effectiveWriterTier(subscriptionTier);
  }
  return effectiveWriterTier(subscriptionTier);
}
