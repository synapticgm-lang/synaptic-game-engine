/**
 * Order QV: read-only quest view data for the Quest Journal. No new state: the current step's target comes from the
 * quest's own target record (placed by placeQuestTarget, found by findQuestTargets), "here" from atPlace/targetSpot,
 * and promises from Order K's commitment store.
 */
import type { Commitment, GameState, Quest } from './types';
import { atPlace, targetSpot } from './questTargets';

export interface QuestTargetView {
  questId: string;
  step: string;
  /** What or whom the step is about. */
  target?: string;
  targetKind?: 'item' | 'person';
  /** Where it is (or the step's place). */
  place?: string;
  /** The player stands at it now (true), at the door of the place that holds it ('door'), or away (false). */
  here: boolean | 'door';
  found: boolean;
}

/** QV-a: the open step of each active quest with its target and whether the player is there. */
export function questTargetViews(state: GameState, quests: Quest[] = state.quests ?? []): Record<string, QuestTargetView> {
  const out: Record<string, QuestTargetView> = {};
  for (const q of quests) {
    if (q.status !== 'active') continue;
    const step = (q.objectives ?? []).find((o) => !o.completed && !o.optional);
    if (!step) continue;
    const t = step.target;
    const place = t?.place ?? step.place;
    const spot = t ? targetSpot(state, step) : false;
    out[q.id] = {
      questId: q.id,
      step: step.description,
      ...(t ? { target: t.name, targetKind: t.kind } : {}),
      ...(place ? { place } : {}),
      here: spot === 'door' ? 'door' : spot === true || (!t && !!place && atPlace(state, place)),
      found: t?.foundTurn != null,
    };
  }
  return out;
}

export interface PromiseView {
  id: string;
  kind: 'Promise' | 'Deal' | 'Agreement';
  to: string;
  what: string;
  /** The turn it is due by, if any. */
  dueTurn?: number;
  status: Commitment['status'];
}

/** QV-b: Order K's commitments for the journal, open first, then newest. */
export function promiseViews(state: GameState): PromiseView[] {
  return [...(state.commitments ?? [])]
    .sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.madeTurn - a.madeTurn)
    .map((c) => ({
      id: c.promiseId,
      kind: c.kind === 'deal' ? 'Deal' : c.kind === 'agreement' ? 'Agreement' : 'Promise',
      to: c.to ?? 'someone',
      what: c.description,
      ...(c.dueTurn != null ? { dueTurn: c.dueTurn } : {}),
      status: c.status,
    }));
}
