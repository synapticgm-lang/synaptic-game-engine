/**
 * Batch F — SP residuals after E (2026-09-01).
 * Stamp: HUD 2026-08-31q / BUILD 2026-08-31i. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import {
  classifyBeatCommit,
  repairRejectedBeat,
} from './beatCommitGate';
import {
  detectSameRoomEssayHard,
  isSameRoomLoiterIntent,
} from './semanticLoopDetector';
import {
  autoFightSpawnPreface,
  ensureEncounterSpawnPreface,
  markPendingSpawnPreface,
  scrubDroughtSpawnInvent,
} from './combatAuthority';
import {
  compileCraftRules,
  proseIgnoresCraft,
} from './craftBookCompiler';
import { applyGovernanceToProse } from './qualityGovernance';
import {
  initEncounterTerminal,
  settleParleyAfterProse,
  tickEncounterTerminal,
  detectParleySuccessInProse,
} from './encounterTerminalFsm';

const ATMOS_ESSAY =
  'The dust motes dance in the slivers of light that pierce the gloom. The air hangs heavy with the scent of damp earth and decay, a cloying perfume. Silence presses in over scattered debris and rubble. No glint of treasure.';

const ATMOS_ESSAY_2 =
  'Dust motes still dance in the gloom as damp earth and decay perfume the air. The silence hangs over debris and rubble with no new fact.';

describe('playtest31qBatchF', () => {
  it('stamp is 2026-08-31q / 31i and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-31i').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31q').toBe(true);
  });

  describe('P0 — same-room essay HARD', () => {
    it('rejects inspect/wait/scout atmosphere recycle without delta', () => {
      expect(isSameRoomLoiterIntent('Examine the room')).toBe(true);
      expect(isSameRoomLoiterIntent('Scout for danger')).toBe(true);
      expect(isSameRoomLoiterIntent('Wait and watch')).toBe(true);

      const state = createInitialState(undefined, 'litrpg');
      state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
      state.turn = 12;
      state.currentLocation = 'cathedral infirmary';
      state.log = [
        { id: 'g1', role: 'gm', content: ATMOS_ESSAY, timestamp: 1 },
        { id: 'p1', role: 'player', content: 'Examine the room', timestamp: 2 },
      ];

      expect(detectSameRoomEssayHard(ATMOS_ESSAY_2, [ATMOS_ESSAY], 'Examine the room')).toBe(
        true
      );
      const gate = classifyBeatCommit(state, ATMOS_ESSAY_2, 'Examine the room');
      expect(gate.accept).toBe(false);
      expect(gate.reasons).toContain('same-room-essay');

      const repaired = repairRejectedBeat(state, ATMOS_ESSAY_2, gate.reasons);
      expect(repaired.repaired).toBe(true);
      expect(repaired.prose).not.toMatch(/dust motes dance/i);
      expect(repaired.prose.length).toBeGreaterThan(12);
    });
  });

  describe('P0 — drought invent residual', () => {
    it('scrubs breaks-from-debris / unsupported geometry after preface', () => {
      const name = 'Calamity Remnant';
      const invent = scrubDroughtSpawnInvent(
        `${name} breaks from the debris and lunges. Steel rings.`,
        name
      );
      expect(invent.scrubbed).toBe(true);
      expect(invent.prose).not.toMatch(/breaks from the debris/i);
      expect(invent.prose).toMatch(/doorway|scrape of wrong motion/i);

      let state = createInitialState(undefined, 'litrpg');
      state.currentLocation = 'cathedral infirmary';
      state = markPendingSpawnPreface(state, name);
      const ensured = ensureEncounterSpawnPreface(
        state,
        `${name} erupts from the rubble with a snarl.`
      );
      expect(ensured.prose).not.toMatch(/erupts from the rubble/i);
      expect(ensured.prose).toMatch(/Calamity Remnant/i);
      expect(autoFightSpawnPreface(name)).not.toMatch(/already on you/i);
    });
  });

  describe('P0 — CRAFT ignore harden', () => {
    it('flags inspect-delta CRAFT when prose is atmosphere-only and stitches', () => {
      const state = createInitialState(undefined, 'litrpg');
      state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
      state.turn = 8;
      state.currentLocation = 'burnt husk';
      state.log = [
        { id: 'g0', role: 'gm', content: ATMOS_ESSAY, timestamp: 1 },
        { id: 'p0', role: 'player', content: 'Inspect the room again', timestamp: 2 },
      ];
      state.sceneFacts = {
        crowd: 'none',
        noise: 'quiet',
        present: [],
        props: ['ash'],
        lastBeat: ATMOS_ESSAY,
        updatedTurn: 7,
        lastPlayerIntent: { family: 'inspect', text: 'Inspect the room', turn: 7 },
      };

      const compiled = compileCraftRules(state, 'Inspect the room again');
      expect(compiled.ruleIds.some((id) => /inspect-delta|inspect-exhaust/i.test(id))).toBe(true);
      const ignore = proseIgnoresCraft(
        compiled.ruleIds,
        ATMOS_ESSAY_2,
        [ATMOS_ESSAY],
        compiled.when
      );
      expect(ignore.ignored).toBe(true);

      const gov = applyGovernanceToProse(state, ATMOS_ESSAY_2, 'Inspect the room again');
      expect(gov.rejectClone).toBe(true);
      expect(gov.notes.some((n) => /CRAFT ignore|same-room essay|Commit gate/i.test(n))).toBe(
        true
      );
      expect(gov.prose).not.toEqual(ATMOS_ESSAY_2);
    });
  });

  describe('P0 — parley success ledger resolve', () => {
    it('success cues clear with parleyResolved XP; refuse keeps fight', () => {
      expect(detectParleySuccessInProse('The hunter stands down and lowers his weapon.')).toBe(
        true
      );
      expect(detectParleySuccessInProse('The hunter refuses and lunges.')).toBe(false);

      const state = createInitialState(undefined, 'litrpg');
      state.activeEncounter = initEncounterTerminal(
        {
          name: 'Pact-Hunter Skirmisher',
          level: 1,
          hp: 20,
          maxHp: 20,
          armorClass: 12,
          strength: 12,
          dexterity: 12,
          constitution: 12,
          xpReward: 30,
          goldReward: 0,
        },
        state
      );

      const tick = tickEncounterTerminal(state, 'Parley');
      expect(tick.state.activeEncounter?.phase).toBe('resolving');
      expect(tick.forcedTerminal).toBe(false);

      const win = settleParleyAfterProse(
        tick.state,
        'After a tense beat, the skirmisher stands down and backs away.',
        'Parley'
      );
      expect(win.forcedTerminal).toBe(true);
      expect(win.cleared?.outcome).toBe('parleyResolved');
      expect(win.cleared?.resolutionReason).toBe('parley_success');
      expect(win.state.activeEncounter).toBeNull();
      expect(win.xpAward?.amount).toBeGreaterThan(0);

      // Refuse path (Batch E residual kept)
      state.activeEncounter = initEncounterTerminal(
        {
          name: 'Pact-Hunter Skirmisher',
          level: 1,
          hp: 20,
          maxHp: 20,
          armorClass: 12,
          strength: 12,
          dexterity: 12,
          constitution: 12,
          xpReward: 30,
          goldReward: 0,
        },
        state
      );
      const tick2 = tickEncounterTerminal(state, 'Parley');
      const refuse = settleParleyAfterProse(
        tick2.state,
        'The hunter refuses your words and holds the line.',
        'Parley'
      );
      expect(refuse.forcedTerminal).toBe(false);
      expect(refuse.state.activeEncounter).toBeTruthy();
      expect(refuse.receipts.some((r) => /exhausted|refused/i.test(r))).toBe(true);
    });

    it('opts.parleySucceeded ledger-clears without unearned auto-cap', () => {
      const state = createInitialState(undefined, 'litrpg');
      state.activeEncounter = initEncounterTerminal(
        {
          name: 'Pact-Hunter Skirmisher',
          level: 1,
          hp: 20,
          maxHp: 20,
          armorClass: 12,
          strength: 12,
          dexterity: 12,
          constitution: 12,
          xpReward: 30,
          goldReward: 0,
        },
        state
      );
      const tick = tickEncounterTerminal(state, 'Wait', { parleySucceeded: true });
      expect(tick.forcedTerminal).toBe(true);
      expect(tick.cleared?.resolutionReason).toBe('parley_success');
    });
  });
});
