/**
 * SEMANTIC MEMORY - Edge Stub
 * 
 * @xenova/transformers cannot run in Deno edge functions.
 * This stub ensures campaignMemory.ts imports don't break.
 * Semantic/hybrid search returns empty; keyword fallback is used.
 */

import type { TurnSummary } from './types.ts';

export function areEmbeddingsAvailable(): boolean {
  return false;
}

export function areEmbeddingsInitializing(): boolean {
  return false;
}

export async function embedText(_text: string): Promise<number[]> {
  return [];
}

export async function embedTurnSummary(_summary: TurnSummary): Promise<void> {
  // no-op
}

export async function embedAllTurnSummaries(_summaries: TurnSummary[]): Promise<void> {
  // no-op
}

export function semanticSearchMemories(
  _summaries: TurnSummary[],
  _query: string,
  _topK: number = 5
): TurnSummary[] {
  return [];
}

export function hybridSearchMemories(
  _summaries: TurnSummary[],
  _query: string,
  _topK: number = 5
): TurnSummary[] {
  return [];
}

export function cosineSimilarity(_a: number[], _b: number[]): number {
  return 0;
}
