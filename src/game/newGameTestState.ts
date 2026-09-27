/**
 * Test helper: build GameState the way New Game does (bible roster records seeded,
 * opening card picked by seed, castNpcIds / pickedHook copied from that card).
 */
import { getCampaignBibleById } from '@/data/campaigns';
import type { CampaignBible } from '@/data/campaigns/types';
import { seedStateFromCampaignBible } from './campaignSeed';
import { createInitialState } from './defaults';
import { resolveOpeningHookPick } from './openingEstablishment';
import type { GameState, NpcMemory } from './types';

/** First seed whose New Game card pick names `npcId`, the same picker useGame / fateAutoplay use. */
export function seedPickingCast(bible: CampaignBible, npcId: string) {
  for (let i = 0; i < 500; i++) {
    const seed = String(i);
    const picked = resolveOpeningHookPick(bible, seed);
    if (picked?.castNpcIds?.includes(npcId)) return { seed, picked };
  }
  throw new Error(`no opening card for ${npcId} on ${bible.id}`);
}

export function newGameState(
  bibleId: string,
  opts: { npcId?: string; seed?: string; storyName?: string; engineMode?: GameState['engineMode'] } = {}
): GameState {
  const bible = getCampaignBibleById(bibleId)!;
  const hit = opts.npcId ? seedPickingCast(bible, opts.npcId) : undefined;
  const seed = hit?.seed ?? opts.seed ?? '0';
  const picked = hit?.picked ?? resolveOpeningHookPick(bible, seed);
  const seeded = seedStateFromCampaignBible(
    { ...createInitialState(opts.storyName ?? bible.title, opts.engineMode ?? bible.engineMode), seed },
    bible
  );
  return {
    ...seeded,
    openingEstablishment: {
      pending: [],
      answers: {},
      complete: true,
      pickedHook: picked?.text,
      pickedHookFallback: picked?.page1 || picked?.fallback,
      castNpcIds: picked?.castNpcIds ?? [],
    },
  };
}

/** Bible roster record by name or alias, optionally marked as met. */
export function rosterRecord(state: GameState, name: string, met = false): NpcMemory {
  const key = name.toLowerCase();
  const m = (state.npcMemories ?? []).find((r) =>
    [r.npcName, ...(r.aliases ?? [])].some((n) => n.toLowerCase() === key)
  );
  if (!m) throw new Error(`no roster record for ${name} on ${state.campaignBibleId}`);
  return met ? { ...m, met: true } : m;
}
