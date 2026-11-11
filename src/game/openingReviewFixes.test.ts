import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { compileNounAllowlist } from './completedEventPacket';
import { buildMasterPrompt } from './masterPrompt';
import { attachOpeningInstance, type OpeningHookSnapshot } from './openingInstance';
import { campaignHubLabels, hubCanonicalNameForLocation, isCampaignHubToken } from './outdoorHubs';
import { formatLaterTurnNameRail } from './openingWriterNotes';
import type { GameState } from './types';

const here = dirname(fileURLToPath(import.meta.url));

const cinder: OpeningHookSnapshot = {
  location: 'the ash-heat of Cinderwake Trail',
  whoHere: 'Brother Oren and tracker Kessa Cinder, already mid-pursuit',
  openingOffer:
    "Brother Oren's waterskin and a scarf, or Kessa's brand-iron, or neither — both are offers, not your gear.",
  pressingNeed: 'The Pellane scouts want an answer.',
};

function liveState(): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg') as GameState;
  const next = attachOpeningInstance(
    { ...base, seed: 'review-fix', campaignBibleId: 'summoned-pact', engineMode: 'litrpg' },
    cinder,
    cinder.openingOffer
  );
  return {
    ...next,
    openingEstablishment: { ...next.openingEstablishment!, complete: true, sceneWritten: true },
  };
}

describe('PR29 review follow-up', () => {
  it('calls ensureOpeningRite only after attachOpeningInstance in startNewGame', () => {
    const src = readFileSync(resolve(here, 'useGame.ts'), 'utf8');
    const start = src.indexOf('const startNewGame = useCallbackRef');
    expect(start).toBeGreaterThan(0);
    const slice = src.slice(start, src.indexOf('updateSettings', start));
    const attach = slice.indexOf('attachOpeningInstance(');
    const firstRite = slice.indexOf('ensureOpeningRite(');
    expect(attach).toBeGreaterThan(0);
    expect(firstRite).toBeGreaterThan(attach);
    expect(slice.indexOf('ensureOpeningRite(', firstRite + 1)).toBe(-1);
  });

  it('does not fall through to authored stitchOpeningScene for non-PYOA', () => {
    const src = readFileSync(resolve(here, 'useGame.ts'), 'utf8');
    expect(src).toMatch(
      /engineMode !== 'pyoa' && openingState\.openingEstablishment\?\.sceneWritten !== true/
    );
    expect(src).toMatch(
      /openingState\.engineMode !== 'pyoa' \|\| openingState\.openingEstablishment\?\.sceneWritten \|\| lockedOpeningPcName/
    );
  });

  it('bans only this opening\'s replaced names and keeps campaign hubs allowed', () => {
    const state = liveState();
    const inst = state.openingEstablishment!.instance!;
    expect(inst.placeName).toMatch(/Cinderwake Trail/i);
    expect(inst.retiredNames.join(' ')).toMatch(/Oren/i);
    expect(inst.retiredNames.some((n) => /^cinder$/i.test(n))).toBe(false);
    expect(inst.retiredNames.join(' ')).not.toMatch(/Cinderwake|Pellane|Greyhollow|Valespire|Cinderflow/i);
    const allow = compileNounAllowlist({
      ...state,
      currentLocation: inst.placeName,
    });
    const blob = allow.join(' | ');
    expect(blob).toMatch(/Cinderwake Trail/i);
    expect(blob).toMatch(/Valespire/i);
    expect(blob).toMatch(/Cinderflow Road/i);
    expect(allow.some((n) => n === inst.placeName || n.toLowerCase() === inst.placeName.toLowerCase())).toBe(true);
    expect(blob).not.toMatch(/\bOren\b/);

    const rail = formatLaterTurnNameRail(state);
    const prompt = buildMasterPrompt(state, { contentMode: 'adult' } as never, []);
    expect(rail).toMatch(/LOCKED NAMES/);
    expect(rail).toMatch(/Cinderwake Trail/i);
    expect(rail).not.toMatch(/Do not use retired catalog names:[^\n]*(Cinderwake|Greyhollow|Valespire|Cinderflow)/i);
    expect(rail).not.toMatch(/\bWalk\b/);
    expect(prompt).toMatch(/Cinderwake Trail/i);
    expect(prompt).not.toMatch(/Do not use retired catalog names:[^\n]*(Cinderwake|Greyhollow|Valespire)/i);
  });

  it('keeps Greyhollow hubs allowed after a Cursed Keep opening at the inn', () => {
    const hook: OpeningHookSnapshot = {
      location: 'Greyhollow, at the inn',
      whoHere: 'the innkeep',
    };
    const base = createInitialState('Cursed Keep', 'dnd') as GameState;
    const state: GameState = {
      ...attachOpeningInstance(
        { ...base, seed: 'ck-hub', campaignBibleId: 'cursed-keep', engineMode: 'dnd' },
        hook
      ),
    };
    const inst = state.openingEstablishment!.instance!;
    expect(inst.placeName).toMatch(/Greyhollow Inn/i);
    expect(inst.retiredNames.join(' ')).not.toMatch(/Greyhollow/i);
    const later = { ...state, openingEstablishment: { ...state.openingEstablishment!, complete: true, sceneWritten: true } };
    const allow = compileNounAllowlist(later);
    const blob = allow.join(' | ');
    expect(blob).toMatch(/Greyhollow Inn/i);
    expect(blob).toMatch(/Greyhollow Church/i);
    expect(blob).toMatch(/Greyhollow Graveyard/i);
    const rail = formatLaterTurnNameRail(later);
    expect(rail).toMatch(/Keep using these locked names:.*Greyhollow Inn/i);
    expect(rail).not.toMatch(/Do not use retired catalog names:[^\n]*Greyhollow/i);
  });

  it('matches campaign hubs as whole names, not English stems inside other words', () => {
    expect(hubCanonicalNameForLocation('the ash-heat of Cinderwake Trail', 'summoned-pact')).toBe('Cinderwake Trail');
    expect(hubCanonicalNameForLocation('the ash-heat of Hollowmere Track', 'summoned-pact')).toBeUndefined();
    expect(hubCanonicalNameForLocation('Greyhollow, at the inn', 'cursed-keep')).toBe('Greyhollow Inn');
    expect(hubCanonicalNameForLocation('a Salt Road waystation', 'salt-road-heist')).toBe('Salt Road Waystation');
    expect(hubCanonicalNameForLocation('First move is yours', 'salt-road-heist')).toBeUndefined();

    expect(isCampaignHubToken('Cinderwake Trail', 'summoned-pact')).toBe(true);
    expect(isCampaignHubToken('Cinderwake', 'summoned-pact')).toBe(true);
    expect(isCampaignHubToken('Cinderflow Road', 'summoned-pact')).toBe(true);
    expect(isCampaignHubToken('Pellane', 'summoned-pact')).toBe(true);
    expect(isCampaignHubToken('Valespire', 'summoned-pact')).toBe(true);
    expect(isCampaignHubToken('Cinder', 'summoned-pact')).toBe(false);
    expect(isCampaignHubToken('Hollow', 'summoned-pact')).toBe(false);
    expect(isCampaignHubToken('Hollowmere', 'summoned-pact')).toBe(false);
    expect(isCampaignHubToken('Hollowmere Track', 'summoned-pact')).toBe(false);
    expect(isCampaignHubToken('Salt', 'salt-road-heist')).toBe(false);
    expect(isCampaignHubToken('Salt Road', 'salt-road-heist')).toBe(true);
    expect(isCampaignHubToken('Greyhollow', 'cursed-keep')).toBe(true);
    expect(isCampaignHubToken('Inn', 'cursed-keep')).toBe(false);

    const labels = campaignHubLabels('summoned-pact');
    const blob = labels.join(' | ');
    expect(blob).toMatch(/Cinderwake/i);
    expect(blob).toMatch(/Cinderflow/i);
    expect(labels.some((l) => /^(hollow|cinder|kitchen|march)$/i.test(l))).toBe(false);
  });

  it('drops Pell from the place-name stem bank', () => {
    const src = readFileSync(resolve(here, 'openingInstance.ts'), 'utf8');
    const stems = src.slice(src.indexOf('const PLACE_STEMS'), src.indexOf('const PLACE_MIDS'));
    expect(stems).not.toMatch(/'Pell'/);
  });

  it('restores the Another opening button for PYOA only', () => {

    const src = readFileSync(resolve(here, '../components/NewGameModal.tsx'), 'utf8');
    expect(src).toMatch(/Another opening/);
    const pyoaBranch = src.slice(src.indexOf(") : hookPreview ? ("));
    expect(pyoaBranch).toMatch(/Another opening/);
    const liveBranch = src.slice(src.indexOf("engineMode !== 'pyoa'"), src.indexOf(") : hookPreview ? ("));
    expect(liveBranch).not.toMatch(/Another opening/);
  });
});
