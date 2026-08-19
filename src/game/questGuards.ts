import type { GameState, Quest, QuestStatus } from './types';

const DEFAULT_MIN_ACTIVE = 1;
const DEFAULT_MIN_COMPLETE = 1;

export function canActivateQuest(q: Quest, turn: number): boolean {
  if (q.status !== 'hidden' && q.status !== 'active') {
    /* revealed path */
  }
  const revealedTurn = q.revealedTurn ?? turn;
  const min = q.minTurnsBeforeActive ?? DEFAULT_MIN_ACTIVE;
  return turn - revealedTurn >= min;
}

export function canCompleteQuest(q: Quest, turn: number): { ok: boolean; reason?: string } {
  if (q.status === 'completed' || q.status === 'failed') {
    return { ok: false, reason: 'already closed' };
  }
  const activated = q.activatedTurn ?? q.revealedTurn ?? turn;
  const min = q.minTurnsBeforeComplete ?? DEFAULT_MIN_COMPLETE;
  if (q.status === 'hidden') {
    return { ok: false, reason: 'quest still hidden' };
  }
  // Must have been active (or at least revealed) for min turns — blocks same-turn create/complete.
  if (turn - activated < min) {
    return { ok: false, reason: `min ${min} turn(s) before complete` };
  }
  return { ok: true };
}

export function markQuestRevealed(q: Quest, turn: number): Quest {
  return {
    ...q,
    revealed: true,
    status: q.status === 'hidden' ? ('active' as QuestStatus) : q.status,
    revealedTurn: q.revealedTurn ?? turn,
    activatedTurn: q.activatedTurn ?? (q.status === 'hidden' || q.status === 'active' ? turn : q.activatedTurn),
  };
}

export function applyQuestCompleteGuard(
  state: GameState,
  questId: string,
  turn: number
): { quests: Quest[]; blocked: boolean; note?: string } {
  const quests = [...(state.quests ?? [])];
  const idx = quests.findIndex((q) => q.id === questId);
  if (idx < 0) return { quests, blocked: true, note: `unknown quest ${questId}` };
  const q = quests[idx]!;
  const gate = canCompleteQuest(q, turn);
  if (!gate.ok) {
    return { quests, blocked: true, note: gate.reason };
  }
  quests[idx] = {
    ...q,
    status: 'completed',
    revealed: true,
    completedTurn: turn,
  };
  return { quests, blocked: false };
}

export function applyQuestFailGuard(
  state: GameState,
  questId: string,
  turn: number,
  reason?: string,
  objectiveId?: string
): { quests: Quest[]; blocked: boolean; note?: string; failedQuest?: Quest } {
  const quests = [...(state.quests ?? [])];
  const idx = quests.findIndex((q) => q.id === questId);
  if (idx < 0) return { quests, blocked: true, note: `unknown quest ${questId}` };
  const q = quests[idx]!;
  if (q.status === 'completed' || q.status === 'failed') {
    return { quests, blocked: true, note: 'already closed' };
  }
  const objectives = (q.objectives ?? []).map((o) =>
    objectiveId && o.id === objectiveId ? { ...o, completed: false } : o
  );
  const failed: Quest = {
    ...q,
    status: 'failed',
    revealed: true,
    objectives,
    failReason: reason ?? q.failReason,
    completedTurn: turn,
  };
  quests[idx] = failed;
  return { quests, blocked: false, failedQuest: failed };
}

/** Permadeath sweep — run-scoped quests only. */
export function failRunScopedQuests(state: GameState, turn: number): GameState {
  const quests = (state.quests ?? []).map((q) => {
    if (q.status !== 'active') return q;
    if (!q.runScoped && !q.failOnDeath) return q;
    return {
      ...q,
      status: 'failed' as QuestStatus,
      revealed: true,
      failReason: q.failReason ?? 'Run ended.',
      completedTurn: turn,
    };
  });
  return { ...state, quests };
}
