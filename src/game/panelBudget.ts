import type { PanelFrequency, Settings } from './types';

/**
 * Hard, code-enforced ceiling on images generated per turn in Illustrated Mode.
 * This is NOT a suggestion to the GM model — `sendAction` slices the parsed panel
 * list to this length before any image job is ever enqueued, so a model that ignores
 * the prompt instructions (which it will, eventually) can never blow the API budget.
 */
export const PANEL_BUDGET_BY_FREQUENCY: Record<PanelFrequency, number> = {
  minimal: 1,
  balanced: 2,
  high: 3,
};

export function resolvePanelBudget(settings: Pick<Settings, 'panelFrequency' | 'comicLayout' | 'visualMode'>): number {
  const byFreq = PANEL_BUDGET_BY_FREQUENCY[settings.panelFrequency] ?? PANEL_BUDGET_BY_FREQUENCY.balanced;
  if (settings.visualMode === 'classic') return 1;
  if (settings.comicLayout === 'webtoon') return Math.min(byFreq, 2);
  return byFreq;
}

/** At most one milestone full-page illustration per turn, regardless of panel budget. */
export const MAX_MILESTONE_IMAGES_PER_TURN = 1;

/** At most one loot-video job per turn — these are expensive and meant to be rare/legendary. */
export const MAX_LOOT_VIDEOS_PER_TURN = 1;
