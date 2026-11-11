import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { compileNounAllowlist } from './completedEventPacket';
import { buildMasterPrompt } from './masterPrompt';
import { attachOpeningInstance, type OpeningHookSnapshot } from './openingInstance';
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

  it('drops retired catalog names from the later-turn noun allowlist and system prompt', () => {
    const state = liveState();
    const inst = state.openingEstablishment!.instance!;
    expect(inst.retiredNames.join(' ')).toMatch(/Cinderwake/i);
    expect(inst.retiredNames.join(' ')).toMatch(/Pellane/i);
    const allow = compileNounAllowlist({
      ...state,
      currentLocation: inst.placeName,
    });
    const blob = allow.join(' | ');
    expect(blob).not.toMatch(/Cinderwake Trail/i);
    expect(blob).not.toMatch(/\bPellane\b/i);
    expect(blob).not.toMatch(/Pellane War Camp/i);
    expect(allow.some((n) => n === inst.placeName || n.toLowerCase() === inst.placeName.toLowerCase())).toBe(true);

    const prompt = buildMasterPrompt(state, { contentMode: 'adult' } as never, []);
    expect(formatLaterTurnNameRail(state)).toMatch(/LOCKED NAMES/);
    expect(formatLaterTurnNameRail(state)).toMatch(/Cinderwake/i);
    expect(formatLaterTurnNameRail(state)).not.toMatch(/\bWalk\b/);
    expect(prompt).toMatch(/Do not use retired catalog names/i);
    expect(prompt).toMatch(/Cinderwake/i);
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
