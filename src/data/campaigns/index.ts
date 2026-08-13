import type { CampaignBible } from './types';
export type { CampaignBible, LoreSnippet, KeyNPC, StarterQuest, StarterItem, Difficulty, OpeningPrompt } from './types';

import { systemIntegration } from './systemIntegration';
import { voidAudience } from './voidAudience';
import { dungeonTransport } from './dungeonTransport';
import { fabledLegacy } from './fabledLegacy';
import { shatteredCoast } from './shatteredCoast';
import { cursedKeep } from './cursedKeep';
import {
  ascendingSpire,
  inkboundAcademy,
  hollowCore,
  millstoneRoad,
  brokenCrownKeep,
  verdantBlight,
  stillrootVeil,
  gatebreakWard,
  blankCanvas,
  blankCanvasDnd,
  saltRoadHeist,
  glassHarborLetters,
  embercourtOath,
  rainglassCase,
  staticHouse,
  driftwakeCrew,
  ashlineConvoy,
  twinLanterns,
  redmesaClaim,
  capeDistrictVigil,
  wayfarersMap,
  hearthwickTeas,
  blankCanvasRpg,
} from './premades';

export {
  systemIntegration,
  voidAudience,
  dungeonTransport,
  fabledLegacy,
  shatteredCoast,
  cursedKeep,
  ascendingSpire,
  inkboundAcademy,
  hollowCore,
  millstoneRoad,
  brokenCrownKeep,
  verdantBlight,
  stillrootVeil,
  gatebreakWard,
  blankCanvas,
  blankCanvasDnd,
  saltRoadHeist,
  glassHarborLetters,
  embercourtOath,
  rainglassCase,
  staticHouse,
  driftwakeCrew,
  ashlineConvoy,
  twinLanterns,
  redmesaClaim,
  capeDistrictVigil,
  wayfarersMap,
  hearthwickTeas,
  blankCanvasRpg,
};

export const ALL_CAMPAIGN_BIBLES: CampaignBible[] = [
  // LitRPG
  systemIntegration,
  gatebreakWard,
  ascendingSpire,
  inkboundAcademy,
  hollowCore,
  voidAudience,
  dungeonTransport,
  fabledLegacy,
  blankCanvas,
  // Story RPG (fiction-first, multi-genre)
  saltRoadHeist,
  glassHarborLetters,
  embercourtOath,
  rainglassCase,
  staticHouse,
  driftwakeCrew,
  ashlineConvoy,
  twinLanterns,
  redmesaClaim,
  capeDistrictVigil,
  wayfarersMap,
  hearthwickTeas,
  blankCanvasRpg,
  // 5e Fantasy (SRD)
  cursedKeep,
  millstoneRoad,
  brokenCrownKeep,
  verdantBlight,
  stillrootVeil,
  shatteredCoast,
  blankCanvasDnd,
];

export function getCampaignBibleById(id: string): CampaignBible | undefined {
  return ALL_CAMPAIGN_BIBLES.find((c) => c.id === id);
}

/** Player-facing blurb for pickers (never dump the full premise). */
export function getCampaignBlurb(bible: CampaignBible): string {
  if (bible.shortDescription?.trim()) return bible.shortDescription.trim();
  if (bible.tagline?.trim()) return bible.tagline.trim();
  const first = bible.premise.split(/(?<=[.!?])\s+/)[0]?.trim() ?? bible.premise;
  return first.length > 160 ? `${first.slice(0, 157)}…` : first;
}

/** Auto campaign save name: premade title + start date. */
export function formatCampaignStoryName(title: string, at: Date = new Date()): string {
  const date = at.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return `${title} — ${date}`;
}

export function getCampaignBiblesByEngineMode(mode: 'litrpg' | 'dnd' | 'rpg'): CampaignBible[] {
  if (mode === 'rpg') {
    const rpgOnly = ALL_CAMPAIGN_BIBLES.filter((c) => c.engineMode === 'rpg');
    if (rpgOnly.length > 0) return rpgOnly;
    return ALL_CAMPAIGN_BIBLES.filter((c) => c.engineMode === 'litrpg');
  }
  return ALL_CAMPAIGN_BIBLES.filter((c) => c.engineMode === mode);
}

/** Short catalog for UI / docs. */
export function listCampaignCatalog(): Array<{
  id: string;
  title: string;
  engineMode: string;
  shortDescription: string;
  licenseNote?: string;
}> {
  return ALL_CAMPAIGN_BIBLES.map((b) => ({
    id: b.id,
    title: b.title,
    engineMode: b.engineMode,
    shortDescription: b.shortDescription ?? b.tagline,
    licenseNote: b.licenseNote,
  }));
}
