/** Read-only quest journal: open step from the quest target record, promises from GameState.commitments. */
import type { Commitment, GameState, Quest, QuestObjective } from './types';
import { atPlace, targetSpot } from './questTargets';

export interface QuestTargetView {
  questId: string;
  step: string;
  target?: string;
  targetKind?: 'item' | 'person';
  place?: string;
  here: boolean | 'door';
  found: boolean;
}

export function questTargetViews(state: GameState, quests: Quest[] = state.quests ?? []): Record<string, QuestTargetView> {
  const out: Record<string, QuestTargetView> = {};
  for (const q of quests) {
    if (q.status !== 'active') continue;
    let step: QuestObjective | undefined;
    for (const o of q.objectives ?? []) {
      if (!o.completed && !o.optional) { step = o; break; }
    }
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
  dueTurn?: number;
  status: Commitment['status'];
}

export function promiseViews(state: GameState): PromiseView[] {
  const rows = [...(state.commitments ?? [])];
  for (let i = 1; i < rows.length; i++) {
    const b = rows[i]!;
    let j = i;
    while (j > 0) {
      const a = rows[j - 1]!;
      const openFirst = (b.status === 'open' ? 1 : 0) - (a.status === 'open' ? 1 : 0);
      if (openFirst > 0 || (openFirst === 0 && b.madeTurn > a.madeTurn)) {
        rows[j] = a;
        j--;
      } else break;
    }
    rows[j] = b;
  }
  const out: PromiseView[] = [];
  for (const c of rows) {
    out.push({
      id: c.promiseId,
      kind: c.kind === 'deal' ? 'Deal' : c.kind === 'agreement' ? 'Agreement' : 'Promise',
      to: c.to ?? 'someone',
      what: c.description,
      ...(c.dueTurn != null ? { dueTurn: c.dueTurn } : {}),
      status: c.status,
    });
  }
  return out;
}
