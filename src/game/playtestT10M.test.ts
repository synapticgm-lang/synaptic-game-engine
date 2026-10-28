/**
 * T10M — chip/typed action must be the narrated intent (not hard_gate→Look around);
 * travel HERE is ground only (not chrome "from X toward Y"); craft ignores quoted "make";
 * speech to a populated scene is not "empty scene".
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, TravelJourney } from './types';
import { validateActionHard } from './actionValidation';
import { findHardItemUseClaims } from './suggestionValidation';
import { compileRefEnum } from './completedEventPacket';
import { resolveTypedFreeText } from './typedFreeText';
import { runTurnSpine } from './turnSpine';
import { resolveDowntimeTurn } from './tabletop/downtimeTurn';
import { buildClauseWriterFact, speechAddressCue } from './writerCueLines';
import { UNDERWAY_HERE, underwayHereLabel } from './locationName';
import { emptySceneFacts } from './sceneFacts';
import { isJourneyUnderway } from './travelJourney';

function rpg(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg', undefined, 't10m') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    character: { ...s.character, name: 'Jax' },
    turn: 9,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

function dnd(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd', undefined, 't10m-dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    character: { ...s.character, name: 'Jax' },
    turn: 8,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

const STANDING = 'Press your standing with the muscle';
const TOSS_TRAVEL =
  "I toss the chip into a puddle and look at you like you're missing something obvious. You think I came out here to play archaeologist?";
const STONE_TOSS =
  'I pick up a smooth stone and toss it at the burnt beams of the farm. "If that place is haunted, make it quicker than this heat!"';

describe('T10M hard gate keeps chip / typed act (not Look around)', () => {
  it('s3003 T9: Press standing with present person is not a missing-item hard gate', () => {
    const state = rpg({
      currentLocation: 'Safehouse Alley',
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['the muscle'],
        crowd: 'present',
        props: [],
      },
      offeredPad: {
        turn: 9,
        choices: [
          'Travel toward Salt Road Waystation',
          'Talk to the muscle',
          STANDING,
          'Say something…',
        ],
        chips: [],
      },
    });
    expect(findHardItemUseClaims(STANDING, state)).toEqual([]);
    expect(validateActionHard(STANDING, state, 'The muscle stands near the door.').valid).toBe(true);
    const spine = runTurnSpine(state, STANDING);
    expect(spine.readerStepResults.map((r) => r.tried).join(' ')).not.toMatch(/\bobserve\b/i);
    expect(spine.engineResult).not.toMatch(/Must narrate: Look around/i);
    expect(spine.engineResult.toLowerCase()).toMatch(/standing|muscle|press/);
  });

  it('s3003 T5: toss chip mid-travel is not hard-gated to Look around', () => {
    const journey: TravelJourney = {
      from: 'Safehouse Alley',
      to: 'Salt Road Waystation',
      legsDone: 1,
      legsTotal: 2,
      ground: 'Back streets',
      terrain: 'streets',
      hoursPerLeg: 0.5,
      day: 1,
      startedTurn: 4,
    } as TravelJourney;
    const state = rpg({
      turn: 5,
      currentLocation: UNDERWAY_HERE,
      journey,
      sceneFacts: { ...emptySceneFacts(), present: [], crowd: 'none', props: ['puddle'] },
      offeredPad: {
        turn: 5,
        choices: ['Walk on', 'Turn back toward Safehouse Alley'],
        chips: [],
      },
    });
    expect(isJourneyUnderway(state)).toBe(true);
    expect(findHardItemUseClaims(TOSS_TRAVEL, state)).toEqual([]);
    expect(validateActionHard(TOSS_TRAVEL, state, 'Quiet stretch of back streets.').valid).toBe(true);
    const typed = resolveTypedFreeText(state, TOSS_TRAVEL);
    expect(typed.engineResult).not.toMatch(/Must narrate: Look around/i);
    expect(typed.engineResult.toLowerCase()).toMatch(/toss|chip|puddle/);
  });
});

describe('T10M craft ignores quoted make', () => {
  it('s3001 T8: pick up / toss with quoted "make it quicker" is not Crafting', () => {
    const journey: TravelJourney = {
      from: 'Keep Gate',
      to: 'Greyhollow Church',
      legsDone: 1,
      legsTotal: 2,
      ground: 'Open road',
      terrain: 'road',
      hoursPerLeg: 2,
      day: 1,
      startedTurn: 7,
    } as TravelJourney;
    const base = dnd({
      currentLocation: UNDERWAY_HERE,
      journey,
      sceneFacts: { ...emptySceneFacts(), present: [], props: ['smooth stone', 'burnt beams'] },
      gold: 50,
    });
    const state = {
      ...base,
      character: {
        ...base.character,
        srd: {
          classId: 'wizard',
          speciesId: 'elf',
          backgroundId: 'sage',
          method: 'standard',
          baseScores: { STR: 8, DEX: 13, CON: 15, INT: 17, WIS: 12, CHA: 10 },
          bonus: {},
          skillProfs: ['Arcana'],
          expertise: [],
          languages: ['Common'],
          originFeats: [],
          kitId: 'A',
          source: 'build',
        },
      },
    } as GameState;
    expect(isJourneyUnderway(state)).toBe(true);
    const down = resolveDowntimeTurn(state, STONE_TOSS);
    expect(down).toBeNull();
  });
});

describe('T10M travel HERE is ground only', () => {
  it('underway label and placeTok omit from/toward chrome', () => {
    const journey: TravelJourney = {
      from: 'Safehouse Alley',
      to: 'Salt Road Waystation',
      legsDone: 1,
      legsTotal: 2,
      ground: 'Back streets',
      terrain: 'streets',
      hoursPerLeg: 0.5,
      day: 1,
      startedTurn: 4,
    } as TravelJourney;
    const state = rpg({
      currentLocation: UNDERWAY_HERE,
      journey,
      sceneFacts: { ...emptySceneFacts(), present: [], crowd: 'none' },
    });
    expect(underwayHereLabel(state).toLowerCase()).toBe('the back streets');
    expect(underwayHereLabel(state)).not.toMatch(/from|toward/i);
    const here = compileRefEnum(state).find((r) => r.id === 'here');
    expect(here?.display.toLowerCase()).toBe('the back streets');
    expect(here?.display.toLowerCase()).not.toMatch(/from|toward/);
    expect(compileRefEnum(state).some((r) => /safehouse alley/i.test(r.display))).toBe(true);
    expect(compileRefEnum(state).some((r) => /salt road waystation/i.test(r.display))).toBe(true);
  });
});

describe('T10M populated scene is not empty', () => {
  it('s3001 T2: Ask what they want with cast present is not empty-scene cue', () => {
    expect(speechAddressCue(null, ['the woodcutter', 'the mayor'])).not.toMatch(/empty scene/i);
    expect(speechAddressCue(null, ['the woodcutter', 'the mayor'])).toMatch(/people here/i);
    expect(speechAddressCue(null, [])).toMatch(/empty scene/i);
    const cue = buildClauseWriterFact('Ask what they want', true, {
      said: 'Ask what they want',
      addressee: null,
      presentHere: ['the woodcutter', 'Silas Thorne'],
    });
    expect(cue).not.toMatch(/empty scene/i);
    expect(cue).toMatch(/people here|woodcutter|Silas/i);

    const state = dnd({
      turn: 2,
      currentLocation: 'Greyhollow Inn',
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['the woodcutter', 'Silas Thorne'],
        crowd: 'present',
      },
    });
    const typed = resolveTypedFreeText(state, 'Ask what they want');
    expect(typed.engineResult).not.toMatch(/empty scene/i);
  });
});
