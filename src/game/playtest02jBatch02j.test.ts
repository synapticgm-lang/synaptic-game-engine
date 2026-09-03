/**
 * Batch 02j — Lock B (CAST named-only) + Lock C (fact-closed scenes) + Lock D (entropy shape).
 * Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import {
  isChoicePadPersonToken,
  isNonPersonNameToken,
} from './chromeAuthority';
import {
  canHarvestAsNamedPerson,
  isCommonRoleNpc,
  isHubContactProperName,
} from './entityRegistry';
import { buildEntityCast } from './entityCast';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import {
  scrubDestroyedPyoaItems,
  scrubNamedCastAsObject,
  scrubDeadFoeReengage,
} from './proseWarden';
import {
  classifyBeatCommit,
  isEntropyShapeSalad,
  isFactClosedViolation,
  isTokenSaladLeak,
} from './beatCommitGate';
import { attachLastKill } from './combatAuthority';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { initPyoaBranchLedger } from './pyoaBranchLedger';
import type { GameState } from './types';

describe('Batch 02j stamps', () => {
  it('HUD and BUILD are 2026-09-02j and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-02j');
    expect(BUILD_STAMP).toBe('2026-09-02j');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02j — Lock B: CAST named-only', () => {
  it('denies role nouns and pad tokens from CAST harvest', () => {
    expect(isCommonRoleNpc('trader')).toBe(true);
    expect(isCommonRoleNpc('clerk')).toBe(true);
    expect(canHarvestAsNamedPerson('trader', 'summoned-pact')).toBe(false);
    expect(canHarvestAsNamedPerson('clerk', 'summoned-pact')).toBe(false);
    expect(isChoicePadPersonToken('Nowhere')).toBe(true);
    expect(isChoicePadPersonToken('That')).toBe(true);
    expect(isChoicePadPersonToken('Alright')).toBe(true);
    expect(isChoicePadPersonToken('Weighed')).toBe(true);
    expect(isNonPersonNameToken('Highmark')).toBe(true);
  });

  it('keeps real hub contacts and proper names', () => {
    expect(isHubContactProperName('Brother Tam')).toBe(true);
    expect(isHubContactProperName('Lowmarket Fence')).toBe(true);
    expect(isHubContactProperName('Wren Holt')).toBe(true);
    expect(canHarvestAsNamedPerson('Brother Tam', 'summoned-pact')).toBe(true);
    expect(canHarvestAsNamedPerson('Lowmarket Fence', 'summoned-pact')).toBe(true);
    expect(canHarvestAsNamedPerson('Orel Vane', 'summoned-pact')).toBe(true);
  });

  it('does not promote trader/clerk into CAST named[]', () => {
    let state = createInitialState(undefined, 'litrpg') as GameState;
    state = {
      ...state,
      campaignBibleId: 'summoned-pact',
      currentLocation: 'Lowmarket',
      sceneFacts: {
        ...emptySceneFacts(5),
        present: ['trader', 'clerk', 'Brother Tam'],
      },
    };
    const cast = buildEntityCast(state);
    expect(cast).toMatch(/Brother Tam/);
    expect(cast).not.toMatch(/NAMED CHARACTERS[^]*\btrader\b/i);
    expect(cast).not.toMatch(/NAMED CHARACTERS[^]*\bclerk\b/i);
  });

  it('harvest skips trader from prose but keeps Brother Tam', () => {
    let state = createInitialState(undefined, 'litrpg') as GameState;
    state = {
      ...state,
      bibleId: 'summoned-pact',
      campaignBibleId: 'summoned-pact',
      sceneFacts: emptySceneFacts(3),
    };
    const harvested = harvestNarrativeIntoLedger(
      state,
      'The trader waves. Brother Tam nods from the stall.',
      3
    );
    const present = harvested.sceneFacts?.present ?? [];
    expect(present.some((p) => /trader/i.test(p))).toBe(false);
    expect(present.some((p) => /Brother Tam/i.test(p))).toBe(true);
  });

  it('rewrites Brother Tam object splice', () => {
    const out = scrubNamedCastAsObject(
      'You pivot to examine the Brother Tam, your eyes drawn to the intricate patterns etched into the Brother Tam.',
      ['Brother Tam']
    );
    expect(out).not.toMatch(/examine the Brother Tam/i);
    expect(out).toMatch(/Brother Tam/);
  });
});

describe('Batch 02j — Lock C: fact-closed scenes', () => {
  it('scrubs destroyed charter clutch and unused-fate ask', () => {
    const out = scrubDestroyedPyoaItems(
      'You still clutched the Millstone Charter. Will you forge or burn the charter?',
      ['millstone-charter']
    );
    expect(out).not.toMatch(/still clutched/i);
    expect(out).not.toMatch(/will you forge/i);
  });

  it('rejects charter reopen commit when destroyed', () => {
    let state = createInitialState(undefined, 'pyoa') as GameState;
    state = {
      ...state,
      engineMode: 'pyoa',
      pyoaBranchLedger: {
        ...initPyoaBranchLedger(),
        destroyedItems: ['millstone-charter'],
      },
    };
    expect(
      isFactClosedViolation(state, 'You still clutched the charter. Will you leave its fate to the rain?')
    ).toBe(true);
    expect(
      classifyBeatCommit(state, 'You still clutched the charter. Will you leave its fate to the rain?').accept
    ).toBe(false);
  });

  it('scrubs dead skirmisher re-engage', () => {
    const out = scrubDeadFoeReengage(
      'The Pact-Hunter Skirmisher remains fixed on you, blade ready.',
      { name: 'Pact-Hunter Skirmisher', outcome: 'victory', turn: 12, remains: true },
      false
    );
    expect(out).not.toMatch(/remains fixed on you/i);
    expect(out).toMatch(/fallen/i);
  });

  it('strips killed foe from present[] on attachLastKill', () => {
    let state = createInitialState(undefined, 'litrpg') as GameState;
    state = {
      ...state,
      sceneFacts: {
        ...emptySceneFacts(10),
        present: ['Pact-Hunter Skirmisher', 'Wall Sergeant'],
      },
    };
    const next = attachLastKill(state, {
      name: 'Pact-Hunter Skirmisher',
      outcome: 'victory',
      turn: 10,
      remains: true,
    });
    expect(next.sceneFacts?.present).toContain('Wall Sergeant');
    expect(next.sceneFacts?.present?.some((p) => /skirmisher/i.test(p))).toBe(false);
  });

  it('drops Wren from present[] after travel leave', () => {
    let state = createInitialState(undefined, 'pyoa') as GameState;
    state = {
      ...state,
      sceneFacts: {
        ...emptySceneFacts(8),
        present: ['Wren Holt'],
      },
    };
    const trimmed = applyPresentTrimOnTravel(
      state,
      'mill landing at Thornferry',
      'rain road east of Thornferry'
    );
    expect(trimmed.sceneFacts?.present ?? []).toEqual([]);
  });
});

describe('Batch 02j — Lock D: entropy shape reject', () => {
  it('catches D&D T13-style dump without fingerprint literals', () => {
    const vomit =
      'lyricwe don Peck-KE •SECRETAR controlXP_next begin_of_file the rain still drums';
    expect(isEntropyShapeSalad(vomit)).toBe(true);
    expect(isTokenSaladLeak(vomit)).toBe(true);
    expect(isTokenSaladLeak('Rain drums the awning while the fence watches.')).toBe(false);
  });
});
