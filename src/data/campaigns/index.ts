import type { CampaignBible } from './types';
import type { ContentMode, EngineMode } from '@/game/types';
import { allowsNsfwCatalog } from '@/game/distributionChannel';
export type { CampaignBible, LoreSnippet, KeyNPC, StarterQuest, StarterItem, Difficulty, OpeningPrompt, MysteryCulprit } from './types';

import { systemIntegration } from './systemIntegration';
import { voidAudience } from './voidAudience';
import { dungeonTransport } from './dungeonTransport';
import { fabledLegacy } from './fabledLegacy';
import { shatteredCoast } from './shatteredCoast';
import { cursedKeep } from './cursedKeep';
import { summonedPact } from './summonedPact';
import { thornferryRoad } from './thornferryRoad';
import { vesperGlassCipher } from './vesperGlassCipher';
import { erebusNine } from './erebusNine';
import { roseGoldUltimatum } from './roseGoldUltimatum';
import { giltwoodEstate } from './giltwoodEstate';
import { nullParameterProtocol } from './nullParameterProtocol';
import { resinSonata } from './resinSonata';
import { umbraProtocol } from './umbraProtocol';
import { crimsonNocturne } from './crimsonNocturne';
import { onyxBloodCovenant } from './onyxBloodCovenant';
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
  summonedPact,
  thornferryRoad,
  vesperGlassCipher,
  erebusNine,
  roseGoldUltimatum,
  giltwoodEstate,
  nullParameterProtocol,
  resinSonata,
  umbraProtocol,
  crimsonNocturne,
  onyxBloodCovenant,
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
  summonedPact,
  gatebreakWard,
  ascendingSpire,
  inkboundAcademy,
  hollowCore,
  voidAudience,
  dungeonTransport,
  fabledLegacy,
  blankCanvas,
  // Pick Your Own Adventure (main spine + forks)
  thornferryRoad,
  vesperGlassCipher,
  erebusNine,
  roseGoldUltimatum,
  giltwoodEstate,
  nullParameterProtocol,
  resinSonata,
  umbraProtocol,
  crimsonNocturne,
  onyxBloodCovenant,
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
  // Tabletop fantasy
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

/** True when this bible is adult/explicit and must stay out of Kid Mode. */
export function isNsfwCampaign(bible: Pick<CampaignBible, 'nsfw'> | undefined): boolean {
  return bible?.nsfw === true;
}

/** Kid Mode hides NSFW campaigns. Adult mode shows the NSFW chip. Store builds hide NSFW entirely. */
export function filterBiblesForContentMode(
  bibles: CampaignBible[],
  contentMode?: ContentMode,
): CampaignBible[] {
  let pool = bibles;
  if (!allowsNsfwCatalog()) {
    pool = pool.filter((b) => !isNsfwCampaign(b));
  }
  if (contentMode === 'kid') {
    pool = pool.filter((b) => !isNsfwCampaign(b));
  }
  return pool;
}

export function getCampaignBiblesByEngineMode(
  mode: EngineMode,
  contentMode?: ContentMode,
): CampaignBible[] {
  const exact = ALL_CAMPAIGN_BIBLES.filter((c) => c.engineMode === mode);
  const pool = exact.length > 0
    ? exact
    : mode === 'pyoa'
      ? ALL_CAMPAIGN_BIBLES.filter((c) => c.engineMode === 'rpg')
      : mode === 'rpg'
        ? ALL_CAMPAIGN_BIBLES.filter((c) => c.engineMode === 'litrpg')
        : exact;
  return filterBiblesForContentMode(pool, contentMode);
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
