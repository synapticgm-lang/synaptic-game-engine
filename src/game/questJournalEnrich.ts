/**
 * Quest journal enrichment — what-next + provenance for player clarity.
 */

import type { Quest } from './types';

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
  const provenance =
    q.provenance
    || (q.type === 'main'
      ? 'Main spine from this campaign’s opening Guide Book.'
      : 'Side hook revealed in play.');
  return { ...q, whatNext, provenance };
}

export function enrichQuests(quests: Quest[]): Quest[] {
  return quests.map(enrichQuestJournalFields);
}
