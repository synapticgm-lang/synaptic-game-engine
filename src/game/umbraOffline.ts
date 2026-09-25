/**
 * Day-1: Umbra Protocol is an authored offline PYOA book.
 * Live AI turn calls (gm-turn / callGm) must never run for Umbra play.
 */
import type { GameState } from './types';
import { isAuthoredPyoaBook } from './pyoaSpine';

/** True when this campaign is Umbra (authored book, chips + spine pages). */
export function isUmbraCampaign(
  stateOrBibleId: Pick<GameState, 'campaignBibleId'> | string | null | undefined
): boolean {
  const id =
    typeof stateOrBibleId === 'string' || stateOrBibleId == null
      ? stateOrBibleId
      : stateOrBibleId.campaignBibleId;
  return id === 'umbra-protocol' || isAuthoredPyoaBook(id);
}

/**
 * Umbra play must not hit the live AI turn path.
 * useGame already short-circuits via isAuthoredPyoaBook; this is the explicit gate.
 */
export function umbraAllowsLiveAiTurn(
  stateOrBibleId: Pick<GameState, 'campaignBibleId'> | string | null | undefined
): boolean {
  return !isUmbraCampaign(stateOrBibleId);
}

export function assertNoLiveAiTurnForUmbra(
  stateOrBibleId: Pick<GameState, 'campaignBibleId'> | string | null | undefined,
  context = 'callGm'
): void {
  if (!umbraAllowsLiveAiTurn(stateOrBibleId)) {
    throw new Error(
      `Umbra is offline: ${context} must not invoke the live AI turn path for umbra-protocol`
    );
  }
}
