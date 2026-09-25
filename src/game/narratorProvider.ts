/**
 * Day-1 thin NarratorProvider stub.
 * Free path returns playable narrations via the hosted gm-turn proxy (callGm).
 * Explicitly not comic/PYOA factory work.
 */
import type { GameState, LoreCard, Settings } from './types';
import { callGm, type GmResult } from './aiService';
import { assertNoLiveAiTurnForUmbra } from './umbraOffline';
import { countProseSentences, isFullProseNarration } from './fullProseGate';

export type NarratorTier = 'free' | 'mid' | 'high' | 'admin';

export interface NarratorRequest {
  state: GameState;
  playerInput: string;
  settings: Settings;
  loreCards?: LoreCard[];
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface NarratorResponse {
  text: string;
  imagePrompt: string | null;
  rolls: GmResult['rolls'];
  systemLog: string[];
  provider: NarratorTier;
  proseWords: number;
  proseSentences: number;
}

export interface NarratorProvider {
  readonly tier: NarratorTier;
  narrate(req: NarratorRequest): Promise<NarratorResponse>;
}

function toResponse(result: GmResult, tier: NarratorTier): NarratorResponse {
  const text = (result.text ?? '').trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  return {
    text,
    imagePrompt: result.imagePrompt ?? null,
    rolls: result.rolls ?? [],
    systemLog: result.systemLog ?? [],
    provider: tier,
    proseWords: words,
    proseSentences: countProseSentences(text),
  };
}

/**
 * Free hosted path — always goes through callGm (gm-turn when proxy is required).
 * Retries once if the model returns truncated prose; never ships a two-line stub.
 */
export function createFreeNarratorProvider(): NarratorProvider {
  return {
    tier: 'free',
    async narrate(req) {
      assertNoLiveAiTurnForUmbra(req.state, 'NarratorProvider.free');
      const freeSettings: Settings = {
        ...req.settings,
        subscriptionTier: 'free',
      };
      let result = await callGm(
        req.state,
        req.playerInput,
        freeSettings,
        req.loreCards ?? [],
        undefined,
        req.signal,
        req.timeoutMs
      );
      if (!isFullProseNarration(result.text ?? '')) {
        result = await callGm(
          req.state,
          req.playerInput,
          freeSettings,
          req.loreCards ?? [],
          undefined,
          req.signal,
          req.timeoutMs
        );
      }
      if (!isFullProseNarration(result.text ?? '')) {
        throw new Error(
          'Free NarratorProvider refused truncated prose; retry the turn (no short stub shipped).'
        );
      }
      return toResponse(result, 'free');
    },
  };
}

/** Resolve the day-1 provider. Only Free is stubbed here. */
export function resolveNarratorProvider(tier: NarratorTier | string | undefined): NarratorProvider {
  const t = String(tier ?? 'free').toLowerCase();
  if (t === 'free' || !t) return createFreeNarratorProvider();
  // Mid/High/Admin not part of day-1 stub — Free path remains the playable default.
  return createFreeNarratorProvider();
}
