/**
 * Batch E — Gemini + Flash Lite SP morning P0s (2026-09-01).
 * Stamp: HUD 2026-08-31p / BUILD 2026-08-31h. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { stripChoiceList } from './parser';
import {
  isVerbatimStallStub,
  repairRejectedBeat,
  stitchCommitDelta,
} from './beatCommitGate';
import { isBannedFallbackStub } from './sealedManifest';
import {
  autoFightSpawnPreface,
  ensureEncounterSpawnPreface,
  markPendingSpawnPreface,
} from './combatAuthority';
import {
  scrubFalseArrivalWhenHere,
  scrubBodyStatusDumps,
  scrubRoleAdjectivePersonSlot,
  applyProseWarden,
} from './proseWarden';
import { ensureTravelArrivalProse } from './outdoorHubs';
import {
  countLoiterFamilyStreak,
  normalizePlayerIntentKey,
} from './beatFingerprint';
import { compileChoices } from './choiceCompiler';
import { settleParleyAfterProse, tickEncounterTerminal } from './encounterTerminalFsm';
import { isRoleAdjectivePersonSlot, realPresentPeople } from './chromeAuthority';
import type { ActiveEncounter } from './types';

describe('playtest31pBatchE', () => {
  it('stamp is 2026-08-31p / 31h and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-31h').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31p').toBe(true);
  });

  describe('P0 — prompt bleed', () => {
    it('stripChoiceList removes 1. Continue observing / trailing 4. / What do you do? touch', () => {
      expect(stripChoiceList('Dust hangs. 1. Continue to observe the chirurgeons.')).not.toMatch(
        /1\.\s*Continue/i
      );
      expect(stripChoiceList('You duck. 1. Duck behind a row of cots 4.')).not.toMatch(/\b4\./);
      expect(stripChoiceList('The fog thins. What do you do? touch. ')).not.toMatch(
        /what do you do/i
      );
      expect(
        stripChoiceList('Steel rings. 1. Continue observing the Void-Touched Scavenger.')
      ).not.toMatch(/1\.\s*Continue observing/i);
    });
  });

  describe('P0 — verbatim stall ban', () => {
    it('bans moment-has-not-moved-on and never stitches that chrome', () => {
      const stub =
        'figure 1 is still here in the cathedral infirmary — the moment has not moved on.';
      expect(isVerbatimStallStub(stub)).toBe(true);
      expect(isBannedFallbackStub(stub)).toBe(true);
      const state = createInitialState(undefined, 'litrpg');
      state.currentLocation = 'cathedral infirmary';
      state.sceneFacts = {
        crowd: 'few',
        noise: 'quiet',
        present: ['figure 1'],
        props: ['cot'],
        lastBeat: '',
        updatedTurn: 2,
      };
      const stitch = stitchCommitDelta(state);
      expect(isVerbatimStallStub(stitch)).toBe(false);
      expect(stitch).not.toMatch(/moment has not moved on/i);
      expect(stitch).not.toMatch(/figure\s+1\s+is still here/i);
      const repaired = repairRejectedBeat(state, 'Antiseptic fog fills the room.', [
        'atmosphere-only',
      ]);
      expect(isVerbatimStallStub(repaired.prose)).toBe(false);
    });
  });

  describe('P0 — inspect/wait/scout treadmill', () => {
    it('scout/ready/wait count as loiter family and interrupt injects exit/talk', () => {
      expect(normalizePlayerIntentKey('Scout for danger')).toBe('scout_danger');
      expect(normalizePlayerIntentKey('Ready yourself and watch')).toBe('wait_watch');
      const state = createInitialState(undefined, 'litrpg');
      state.campaignBibleId = 'summoned-pact';
      state.currentLocation = 'cathedral infirmary';
      state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
      state.turn = 20;
      state.log = [
        { id: '1', role: 'player', content: 'Wait and watch', timestamp: 1 },
        { id: '2', role: 'gm', content: 'Fog.', timestamp: 2 },
        { id: '3', role: 'player', content: 'Scout for danger', timestamp: 3 },
        { id: '4', role: 'gm', content: 'Fog again.', timestamp: 4 },
        { id: '5', role: 'player', content: 'Ready yourself and watch', timestamp: 5 },
        { id: '6', role: 'gm', content: 'Still fog.', timestamp: 6 },
      ];
      const loiter = countLoiterFamilyStreak(state);
      expect(loiter.key).toBe('loiter');
      expect(loiter.count).toBeGreaterThanOrEqual(3);

      const compiled = compileChoices(state, [
        'Scout for danger',
        'Wait and watch',
        'Ready yourself and watch',
      ]);
      expect(compiled.notes.some((n) => /treadmill|loiter|interrupt/i.test(n))).toBe(true);
      expect(
        compiled.choices.some((c) => /exit|travel|ask|leverage/i.test(c))
      ).toBe(true);
    });
  });

  describe('P0 — location amnesia', () => {
    it('scrubs You reach X when already at X; travel arrival no-ops same hub', () => {
      const here = 'cathedral infirmary';
      expect(
        scrubFalseArrivalWhenHere('You reach the cathedral infirmary. Dust hangs.', here)
      ).not.toMatch(/you reach/i);
      expect(ensureTravelArrivalProse('Dust hangs.', here, here)).toBe('Dust hangs.');
      expect(
        applyProseWarden('You reach the cathedral infirmary. The cots wait.', {
          currentLocation: here,
        })
      ).not.toMatch(/you reach/i);
    });
  });

  describe('P0 — drought spawn preface', () => {
    it('never uses bare already-on-you; preface required before fight attach', () => {
      const name = 'Calamity Remnant';
      const preface = autoFightSpawnPreface(name, 'cathedral infirmary');
      expect(preface).not.toMatch(/already on you/i);
      expect(preface).toMatch(/Calamity Remnant/i);
      expect(preface).toMatch(/doorway|forces|pushes|scrape|commits/i);

      let state = createInitialState(undefined, 'litrpg');
      state.currentLocation = 'cathedral infirmary';
      state = markPendingSpawnPreface(state, name);
      const ensured = ensureEncounterSpawnPreface(state, `${name} is already on you. Steel rings.`);
      expect(ensured.prepended).toBe(true);
      expect(ensured.spawnReceipt).toMatch(/Calamity Remnant/i);
      expect(ensured.prose).not.toMatch(/is already on you/i);
      expect(ensured.prose).not.toMatch(/pushes into|from the edge of the room/i);
      expect(ensured.state.sceneFacts?.pendingSpawnPreface).toBeUndefined();
      expect(ensured.state.sceneFacts?.present?.some((p) => /Calamity Remnant/i.test(p))).toBe(
        true
      );
    });
  });

  describe('P1 — role adjective / HP dump / parley', () => {
    it('drops Field person slot and body HP/MP dumps', () => {
      expect(isRoleAdjectivePersonSlot('Field')).toBe(true);
      expect(realPresentPeople(['Field', 'Mira', 'chirurgeon'])).toEqual(['Mira']);
      expect(
        scrubRoleAdjectivePersonSlot('The chirurgeon, Field, watches you with stillness.')
      ).not.toMatch(/,\s*Field\b/);
      expect(
        scrubBodyStatusDumps(
          'You wait. your health is full at 24/24, your mana reserves are at 12/12. Fog.'
        )
      ).not.toMatch(/24\/24|12\/12/i);
    });

    it('parley exhausted does not free-clear the encounter', () => {
      const enc: ActiveEncounter = {
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
        phase: 'engaged',
        failedParleyCount: 0,
        maxFailedParley: 1,
      };
      const state = createInitialState(undefined, 'litrpg');
      state.activeEncounter = enc;
      const tick = tickEncounterTerminal(state, 'Parley');
      expect(tick.state.activeEncounter?.phase).toBe('resolving');
      const settled = settleParleyAfterProse(
        tick.state,
        'The hunter refuses and raises steel.',
        'Parley'
      );
      expect(settled.state.activeEncounter).toBeTruthy();
      expect(settled.state.activeEncounter?.hp).toBe(20);
      expect(settled.receipts.some((r) => /parley exhausted|parley refused/i.test(r))).toBe(true);
      expect(settled.forcedTerminal).toBe(false);
    });
  });
});
