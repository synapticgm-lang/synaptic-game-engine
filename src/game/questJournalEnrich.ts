/**
 * Quest journal enrichment — what-next + provenance for player clarity.
 */

import type { Quest } from './types';

/** Designer fallbacks — hide "Why this is on file" when only these exist. */
export const GENERIC_QUEST_PROVENANCE = [
  'Side hook revealed in play.',
  'Main spine from this campaign’s opening Guide Book.',
  "Main spine from this campaign's opening Guide Book.",
] as const;

export function isGenericQuestProvenance(value: string | undefined): boolean {
  const t = (value ?? '').trim();
  if (!t) return true;
  return GENERIC_QUEST_PROVENANCE.some((g) => g.toLowerCase() === t.toLowerCase());
}

export function enrichQuestJournalFields(q: Quest): Quest {
  if (q.whatNext && q.provenance) return q;
  const nextObj = (q.objectives ?? []).find((o) => !o.completed);
  const whatNext =
    q.whatNext
    || (nextObj
      ? `Next: ${nextObj.description}`
      : q.status === 'completed'
        ? 'Complete — rewards are settled on the sheet.'
        : q.status === 'failed'
          ? 'Failed — the window for this hook has closed.'
          : q.description?.slice(0, 120) || 'Follow the story until this objective clarifies.');
  // Keep authored provenance only. Do not invent generic "Side hook revealed in play."
  // chrome — QuestLogModal hides the box when provenance is empty/generic.
  const provenance = q.provenance?.trim() || undefined;
  return { ...q, whatNext, provenance };
}

export function enrichQuests(quests: Quest[]): Quest[] {
  return quests.map(enrichQuestJournalFields);
}
