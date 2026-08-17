import type { CampaignBible } from '@/data/campaigns/types';
import { getCampaignBibleById } from '@/data/campaigns';
import type { EngineMode } from '@/game/types';

/** Blank shell id for custom Simple/Expert starts (never silent System Integration). */
export function blankBibleIdForMode(engineMode: EngineMode): string {
  if (engineMode === 'dnd') return 'blank-canvas-dnd';
  if (engineMode === 'rpg' || engineMode === 'pyoa') return 'blank-canvas-rpg';
  return 'blank-canvas';
}

export function resolveCustomBlankBible(engineMode: EngineMode): CampaignBible {
  const id = blankBibleIdForMode(engineMode);
  const bible = getCampaignBibleById(id);
  if (!bible) {
    throw new Error(`Missing blank canvas bible: ${id}`);
  }
  return bible;
}

/** True when this archetype should prefer an empty custom shell over a full premade. */
export function archetypePrefersBlankCanvas(archetype?: string): boolean {
  return (
    !archetype
    || archetype === 'ai_random'
    || archetype === 'ai_custom'
    || archetype === 'custom_world'
  );
}
