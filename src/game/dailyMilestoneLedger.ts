/**
 * B045 — Daily milestone XP: +20 on first quest objective tick per UTC day (LitRPG retention).
 */

import type { GameState, Quest } from './types';

export const DAILY_QUEST_MILESTONE_XP = 20;

function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function hasAward(keys: string[] | undefined, key: string): boolean {
  return (keys ?? []).includes(key);
}

/** First quest objective completion of the UTC day earns a bonus milestone. */
export function applyDailyQuestMilestone(
  state: GameState,
  opts: { questsBefore: Quest[]; questsAfter: Quest[] }
): { xp: number; note: string; awardKey: string } | null {
  if (state.engineMode !== 'litrpg') return null;

  const day = utcDayKey();
  const awardKey = `daily-quest-tick:${day}`;
  if (hasAward(state.sandboxAwardKeys, awardKey)) return null;

  const beforeById = new Map(opts.questsBefore.map((q) => [q.id, q]));
  for (const after of opts.questsAfter) {
    const before = beforeById.get(after.id);
    if (!before) continue;
    const beforeDone = new Set(
      (before.objectives ?? []).filter((o) => o.completed).map((o) => o.id)
    );
    for (const obj of after.objectives ?? []) {
      if (!obj.completed || beforeDone.has(obj.id)) continue;
      return {
        xp: DAILY_QUEST_MILESTONE_XP,
        note: `XP Gained: ${DAILY_QUEST_MILESTONE_XP} (daily quest milestone)`,
        awardKey,
      };
    }
  }
  return null;
}
