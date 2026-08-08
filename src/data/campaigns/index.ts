import type { CampaignBible } from './types';
export type { CampaignBible, LoreSnippet, KeyNPC, StarterQuest, StarterItem, Difficulty } from './types';

import { systemIntegration } from './systemIntegration';
import { voidAudience } from './voidAudience';
import { dungeonTransport } from './dungeonTransport';
import { fabledLegacy } from './fabledLegacy';
import { shatteredCoast } from './shatteredCoast';
import { cursedKeep } from './cursedKeep';

export { systemIntegration, voidAudience, dungeonTransport, fabledLegacy, shatteredCoast, cursedKeep };

export const ALL_CAMPAIGN_BIBLES: CampaignBible[] = [
  systemIntegration,
  voidAudience,
  dungeonTransport,
  fabledLegacy,
  shatteredCoast,
  cursedKeep,
];

export function getCampaignBibleById(id: string): CampaignBible | undefined {
  return ALL_CAMPAIGN_BIBLES.find((c) => c.id === id);
}

export function getCampaignBiblesByEngineMode(mode: 'litrpg' | 'dnd'): CampaignBible[] {
  return ALL_CAMPAIGN_BIBLES.filter((c) => c.engineMode === mode);
}
