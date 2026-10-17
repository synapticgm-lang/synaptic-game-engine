/**
 * Quest journal enrichment — what-next + provenance + open leads (TT-G1).
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
  const openLeads: string[] = q.openLeads?.length ? q.openLeads.slice() : [];
  if (!openLeads.length) {
    const steps = q.objectives ?? [];
    for (let i = 0; i < steps.length; i++) {
      if (steps[i]!.completed) continue;
      const routes = steps[i]!.routes ?? [];
      for (let j = 0; j < routes.length; j++) {
        const r = routes[j]!;
        if (r.revealed) continue;
        const label = (r.label ?? '').trim();
        if (label) openLeads.push(label);
      }
      break;
    }
  }
  if (q.whatNext && q.provenance) return { ...q, openLeads };
  let nextDesc = '';
  const steps = q.objectives ?? [];
  for (let i = 0; i < steps.length; i++) {
    if (!steps[i]!.completed) {
      nextDesc = steps[i]!.description;
      break;
    }
  }
  const whatNext =
    q.whatNext
    || (nextDesc
      ? `Next: ${nextDesc}`
      : q.status === 'completed'
        ? 'Complete — rewards are settled on the sheet.'
        : q.status === 'failed'
          ? 'Failed — the window for this hook has closed.'
          : q.description?.slice(0, 120) || 'Follow the story until this objective clarifies.');
  // Keep authored provenance only. Do not invent generic "Side hook revealed in play."
  // chrome — QuestLogModal hides the box when provenance is empty/generic.
  const provenance = q.provenance?.trim() || undefined;
  return { ...q, whatNext, provenance, openLeads };
}

export function enrichQuests(quests: Quest[]): Quest[] {
  const out: Quest[] = [];
  for (let i = 0; i < quests.length; i++) out.push(enrichQuestJournalFields(quests[i]!));
  return out;
}
