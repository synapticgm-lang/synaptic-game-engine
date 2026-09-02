/**
 * Batch G — combat pad/FSM, crate exhaust, holds-the-beat ban, director chrome,
 * stripChoiceList + TURN JOB / world-moving pad. Mid writer OFF.
 * Stamp: HUD 2026-08-31r / BUILD 2026-08-31j.
 */
import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { compileChoices } from './choiceCompiler';
import {
  initEncounterTerminal,
  isEncounterIdleIntent,
  tickEncounterTerminal,
} from './encounterTerminalFsm';
import {
  applySearchContinuityToFacts,
  exhaustOpenedContainer,
  isOpenContainerAction,
  normalizeSearchTarget,
  shouldBlockContainerItemGain,
} from './searchContinuity';
import {
  isDirectorChromeLeak,
  isVerbatimStallStub,
  stitchCommitDelta,
} from './beatCommitGate';
import { autoFightSpawnPreface } from './combatAuthority';
import { stripChoiceList } from './parser';
import { resolveTurnJob } from './beatContract';
import { applyGovernanceToProse } from './qualityGovernance';
import { applyStructuralEvents } from './structuralEvents';
import { buildThinStoryExpandBlock } from './actionResolution';
import type { ActiveEncounter } from './types';

function engagedState(extra: Partial<ReturnType<typeof createInitialState>> = {}) {
  let state = createInitialState(undefined, 'litrpg');
  state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
  state.turn = 20;
  state.currentLocation = 'ruin chamber';
  state.sceneFacts = {
    ...(state.sceneFacts ?? {}),
    present: ['Void-Touched Scavenger'],
    props: ['crate', 'debris'],
  };
  const enc: ActiveEncounter = {
    name: 'Void-Touched Scavenger',
    hp: 12,
    maxHp: 12,
    phase: 'engaged',
    engagedTurnCount: 0,
    maxEngagedTurns: 8,
    failedFleeCount: 0,
    maxFailedFlee: 2,
  };
  state = initEncounterTerminal({ ...state, activeEncounter: enc }, enc);
  return { ...state, ...extra, activeEncounter: { ...enc, ...(extra.activeEncounter as object) } };
}

describe('playtest31rBatchG', () => {
  it('stamp is 2026-08-31r / 31j and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-31j').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31r').toBe(true);
  });

  describe('G5 — combat pad lock + idle FSM', () => {
    it('drops Open crate / Scout / Wait while encounter live', () => {
      const state = engagedState();
      const { choices, notes } = compileChoices(
        state,
        [
          'Open the crate',
          'Scout for danger',
          'Wait and watch',
          'Press the attack',
          'Try to flee',
          'Travel toward Lowmarket',
        ],
        undefined,
        'look around'
      );
      expect(choices.some((c) => /open the crate/i.test(c))).toBe(false);
      expect(choices.some((c) => /scout/i.test(c))).toBe(false);
      expect(choices.some((c) => /^wait/i.test(c))).toBe(false);
      expect(choices.some((c) => /press the attack/i.test(c))).toBe(true);
      expect(notes.some((n) => /encounter lock/i.test(n))).toBe(true);
    });

    it('idle loot/scout does not advance max_engaged victory XP', () => {
      expect(isEncounterIdleIntent('Open the crate')).toBe(true);
      expect(isEncounterIdleIntent('Scout for danger')).toBe(true);
      expect(isEncounterIdleIntent('Press the attack')).toBe(false);

      let state = engagedState();
      for (let i = 0; i < 10; i++) {
        const tick = tickEncounterTerminal(state, 'Open the crate');
        state = tick.state;
      }
      expect(state.activeEncounter).toBeTruthy();
      expect(state.activeEncounter?.phase).not.toBe('terminal');
      expect(state.activeEncounter?.engagedTurnCount ?? 0).toBe(0);

      const fight = tickEncounterTerminal(state, 'Press the attack');
      expect(fight.state.activeEncounter?.engagedTurnCount ?? 0).toBeGreaterThan(0);
    });
  });

  describe('G4 — crate exhaustion', () => {
    it('normalizes crate/chest and exhausts after one open', () => {
      expect(normalizeSearchTarget('Open the crate')).toBe('crate');
      expect(isOpenContainerAction('Open the crate')).toBe(true);

      let state = createInitialState(undefined, 'litrpg');
      state.turn = 5;
      state.currentLocation = 'ruin';
      state = exhaustOpenedContainer(state, 'Open the crate');
      expect(state.sceneFacts?.emptyContainers).toContain('crate');

      const facts = applySearchContinuityToFacts(
        state.sceneFacts,
        'Open the crate',
        'You find a brass locket.',
        state.turn,
        state.currentLocation
      );
      expect(facts?.emptyContainers).toContain('crate');

      const { choices } = compileChoices(
        { ...state, sceneFacts: facts, openingEstablishment: { ...state.openingEstablishment!, complete: true } },
        ['Open the crate', 'Leave through the nearest exit'],
        undefined,
        'wait'
      );
      expect(choices.some((c) => /open the crate/i.test(c))).toBe(false);
    });

    it('blocks duplicate bird/locket from exhausted container', () => {
      let state = createInitialState(undefined, 'litrpg');
      state.turn = 6;
      state = exhaustOpenedContainer(state, 'Open the crate');
      expect(shouldBlockContainerItemGain(state, 'Open the crate', 'brass locket')).toBe(true);

      const structural = applyStructuralEvents(
        state,
        [{ type: 'item-gain', name: 'brass locket', qty: 1 }],
        { playerInput: 'Open the crate' }
      );
      expect(structural.notes.some((n) => /blocked duplicate/i.test(n))).toBe(true);
      expect(structural.gainedItems.length).toBe(0);
    });
  });

  describe('G3 — holds the beat ban', () => {
    it('never emits holds-the-beat stitch; bans verbatim', () => {
      expect(isVerbatimStallStub('Wren holds the beat in the mill — a glance, a breath, a cost still unpaid.')).toBe(
        true
      );
      const state = createInitialState(undefined, 'litrpg');
      state.currentLocation = 'ruin chamber';
      state.sceneFacts = { present: ['bystanders'], props: ['crate'] };
      const stitch = stitchCommitDelta(state);
      expect(stitch).not.toMatch(/holds the beat/i);
      expect(stitch).not.toMatch(/a glance,\s*a breath/i);
      expect(stitch).not.toMatch(/\bbystanders\b/i);
    });
  });

  describe('G1 — director chrome', () => {
    it('preface is diegetic; director strings never commit', () => {
      const preface = autoFightSpawnPreface('Void-Touched Scavenger', 'ruin chamber');
      expect(preface).not.toMatch(/telegraph first/i);
      expect(preface).not.toMatch(/no prior cast/i);
      expect(isDirectorChromeLeak('Do not invent a welcoming NPC in this room.')).toBe(true);
      expect(isDirectorChromeLeak('CRAFT: answer first')).toBe(true);

      const state = createInitialState(undefined, 'litrpg');
      state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
      const gov = applyGovernanceToProse(
        state,
        'Do not invent a welcoming NPC. Telegraph first, then steel. Footsteps scrape the doorway.',
        'Scout for danger'
      );
      expect(gov.prose).not.toMatch(/do not invent/i);
      expect(gov.prose).not.toMatch(/telegraph first/i);
    });
  });

  describe('G2/G6/G7 — strip + TURN JOB + world-moving pad', () => {
    it('stripChoiceList catches Attempt to examine mid-body', () => {
      const stripped = stripChoiceList(
        'Dust hangs in the shaft. 1. Attempt to examine the crate carefully. Footsteps elsewhere.'
      );
      expect(stripped).not.toMatch(/attempt to examine/i);
      expect(stripped).toMatch(/dust hangs/i);
    });

    it('TURN JOB names combat lock; expand block demands delta', () => {
      const state = engagedState();
      expect(resolveTurnJob(state)).toMatch(/fight, flee, or parley/i);
      expect(buildThinStoryExpandBlock('Look around', 40)).toMatch(/DELTA/i);
    });

    it('after loiter exhaust, pad keeps a world-moving option', () => {
      const state = createInitialState(undefined, 'litrpg');
      state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
      state.turn = 15;
      state.currentLocation = 'ruin chamber';
      state.log = [
        { id: 'p1', role: 'player', content: 'Scout for danger', timestamp: 1 },
        { id: 'g1', role: 'gm', content: 'Dust.', timestamp: 2 },
        { id: 'p2', role: 'player', content: 'Wait and watch', timestamp: 3 },
        { id: 'g2', role: 'gm', content: 'Still dust.', timestamp: 4 },
        { id: 'p3', role: 'player', content: 'Examine the room', timestamp: 5 },
        { id: 'g3', role: 'gm', content: 'More dust.', timestamp: 6 },
      ];
      state.recentChoices = [
        { turn: 12, choices: ['Scout for danger'] },
        { turn: 13, choices: ['Wait and watch'] },
        { turn: 14, choices: ['Examine the room'] },
      ];
      const { choices } = compileChoices(
        state,
        ['Scout for danger', 'Wait and watch', 'Examine the room'],
        undefined,
        'Examine the room'
      );
      expect(choices.some((c) => /leave|exit|ask|press for leverage|travel/i.test(c))).toBe(true);
      expect(choices.every((c) => !/\bscout\b/i.test(c))).toBe(true);
    });
  });
});
