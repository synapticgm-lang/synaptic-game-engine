/**
 * Batch X — post–Batch-W Gemini T50 P0s (seed 42 tape).
 * Hub+role mad-libs, UI/quest/spawn bleed, caught combat lock, abstract pads.
 * Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyProseWarden,
  scrubEntityMadLibs,
  scrubUiQuestVerbs,
} from './proseWarden';
import {
  classifyBeatCommit,
  isStitchBankFingerprint,
} from './beatCommitGate';
import {
  detectHubRoleMadlib,
  isHubRoleCompoundToken,
  realPresentPeople,
} from './chromeAuthority';
import {
  ensureEncounterSpawnPreface,
  scrubCombatSpawnLog,
  hasCombatSpawnLogInBody,
  autoFightSpawnPreface,
} from './combatAuthority';
import { compileChoices } from './choiceCompiler';
import {
  hasNumberedChoiceLeak,
  hasQuestTrackerLeak,
  stripChoiceList,
} from './parser';
import { scanReadabilityViolations } from './readabilityGate';
import {
  tickEncounterTerminal,
  fleeAvailable,
  initEncounterTerminal,
} from './encounterTerminalFsm';
import { validateEntityReferences, extractEntityContext } from './typedEntityValidator';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';

describe('playtest31xBatchX', () => {
  it('stamp is 2026-08-31x / 31p and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(HUD_BUILD_STAMP).toBe('2026-08-31x');
    expect(BUILD_STAMP).toBe('2026-08-31p');
  });

  describe('P0-1 — hub+role entity mad-lib collapse', () => {
    it('Lowmarket Fence is a valid NPC compound, not a polity slot', () => {
      expect(isHubRoleCompoundToken('Lowmarket Fence')).toBe(true);
      expect(isHubRoleCompoundToken('Wall Sergeant')).toBe(true);
      expect(realPresentPeople(['Lowmarket Fence', 'stall contact'])).toEqual(['Lowmarket Fence']);
    });

    it('scrubs tape quotes: lunged/to your/a Lowmarket Fence object', () => {
      expect(scrubEntityMadLibs('you lunged Lowmarket Fence, its movements surprisingly quick')).not.toMatch(
        /lunged Lowmarket Fence/i
      );
      expect(scrubEntityMadLibs('to your Lowmarket Fence, a haphazard collection')).not.toMatch(
        /to your Lowmarket Fence/i
      );
      expect(scrubEntityMadLibs('a Lowmarket Fence, greyish stones that hum')).not.toMatch(
        /a Lowmarket Fence,\s*greyish/i
      );
      expect(scrubEntityMadLibs('the bruised, overcast sky Scattered Scale.')).not.toMatch(
        /sky Scattered Scale/i
      );
      expect(scrubEntityMadLibs('scrap. "')).not.toMatch(/scrap\.\s*"/);
    });

    it('typedEntityValidator flags hub-role mad-lib misuse', () => {
      const ctx = extractEntityContext(createInitialState(undefined, 'litrpg'));
      const report = validateEntityReferences('As you lunged Lowmarket Fence, steel rang.', ctx);
      expect(report.hubRoleMadlibCount).toBe(1);
      expect(report.shouldRegenerate).toBe(true);
    });
  });

  describe('P0-2 — UI / quest / spawn bleed', () => {
    it('stripChoiceList removes Turn to numbered chip (T7)', () => {
      const t7 =
        'remained well-guarded. 1. Turn to the Lowmarket Fence and ask directly about the "otherworld scrap."';
      const stripped = stripChoiceList(t7);
      expect(stripped).not.toMatch(/\b1\.\s*Turn to/i);
      expect(hasNumberedChoiceLeak(stripped)).toBe(false);
    });

    it('scrubs quest stage tracker from GM body', () => {
      const quest =
        "the Circle's Price (Stage 2: the Reason Heard) remained a persistent thought";
      expect(scrubUiQuestVerbs(quest)).not.toMatch(/Stage 2/i);
      expect(hasQuestTrackerLeak(quest)).toBe(true);
    });

    it('spawn preface goes to STATUS receipt, not GM body (T9)', () => {
      let state = createInitialState(undefined, 'litrpg');
      state.currentLocation = 'Lowmarket';
      state = {
        ...state,
        sceneFacts: {
          ...emptySceneFacts(9),
          pendingSpawnPreface: 'Pact-Hunter Skirmisher',
        },
      } as GameState;
      const gm = 'The drizzle continued its cold, persistent descent.';
      const ensured = ensureEncounterSpawnPreface(state, gm);
      expect(ensured.spawnReceipt).toMatch(/Pact-Hunter Skirmisher pushes/i);
      expect(ensured.prose).not.toMatch(/pushes into Lowmarket from the edge/i);
      expect(hasCombatSpawnLogInBody(ensured.prose)).toBe(false);
    });

    it('opening vault hook is not a stitch fingerprint (T0)', () => {
      const opening =
        'Light, then a vault under fire. Vault under fire. Dust and ash falling through the chant.';
      expect(isStitchBankFingerprint(opening)).toBe(false);
      const state = createInitialState(undefined, 'litrpg');
      expect(classifyBeatCommit(state, opening).accept).toBe(true);
    });
  });

  describe('P0-3 — caught combat blocks inspect/travel/browse', () => {
    it('flee fail marks caught; second flee does not clear', () => {
      let state = createInitialState(undefined, 'litrpg');
      state.turn = 11;
      state.activeEncounter = initEncounterTerminal(
        {
          name: 'Pact-Hunter Skirmisher',
          level: 1,
          hp: 16,
          maxHp: 16,
          armorClass: 12,
          strength: 12,
          dexterity: 12,
          constitution: 12,
          xpReward: 25,
          goldReward: 5,
        },
        state
      );
      let tick = tickEncounterTerminal(state, 'Try to flee');
      state = tick.state;
      expect(state.activeEncounter?.caught).toBe(true);
      expect(fleeAvailable(state.activeEncounter)).toBe(false);

      tick = tickEncounterTerminal(state, 'Talk to Lowmarket Fence');
      expect(tick.state.activeEncounter).toBeTruthy();
      expect(tick.cleared).toBeUndefined();
    });

    it('starves inspect stall / talk fence under caught (T12-13 tape)', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true },
        currentLocation: 'Lowmarket',
        turn: 13,
        activeEncounter: {
          name: 'Pact-Hunter Skirmisher',
          hp: 10,
          maxHp: 16,
          level: 1,
          armorClass: 12,
          strength: 12,
          dexterity: 12,
          constitution: 12,
          xpReward: 25,
          goldReward: 5,
          phase: 'engaged',
          caught: true,
          failedFleeCount: 2,
        },
        sceneFacts: { ...emptySceneFacts(13), present: ['Lowmarket Fence'] },
      } as GameState;
      const compiled = compileChoices(
        state,
        [
          'Inspect the stalls',
          'Talk to Lowmarket Fence',
          'Press the attack',
          'Try to flee',
          'Travel toward West Wall',
        ],
        undefined,
        'Inspect the stalls'
      );
      expect(compiled.choices.some((c) => /Inspect the stalls/i.test(c))).toBe(false);
      expect(compiled.choices.some((c) => /Talk to Lowmarket Fence/i.test(c))).toBe(false);
      expect(compiled.choices.some((c) => /Press the attack/i.test(c))).toBe(true);
      expect(compiled.choices.some((c) => /^Travel toward/i.test(c))).toBe(false);
    });

    it('talk during live fight does not auto-clear on max_engaged clock alone', () => {
      const state = createInitialState(undefined, 'litrpg');
      state.turn = 16;
      state.activeEncounter = {
        ...initEncounterTerminal(
          {
            name: 'Pact-Hunter Skirmisher',
            level: 1,
            hp: 10,
            maxHp: 16,
            armorClass: 12,
            strength: 12,
            dexterity: 12,
            constitution: 12,
            xpReward: 25,
            goldReward: 5,
          },
          state
        ),
        engagedTurnCount: 8,
      };
      const tick = tickEncounterTerminal(state, 'Talk to Lowmarket Fence');
      expect(tick.cleared).toBeUndefined();
      expect(tick.state.activeEncounter).toBeTruthy();
    });
  });

  describe('P0-4 — abstract pads starved under live NPC context', () => {
    it('drops Press/Ask/Listen/Leave when NPCs present (T25 tape)', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true },
        currentLocation: 'West Wall',
        turn: 25,
        sceneFacts: { ...emptySceneFacts(25), present: ['Lowmarket Fence'] },
      } as GameState;
      const compiled = compileChoices(
        state,
        [
          'Press for leverage',
          'Ask a direct question',
          'Listen for the real answer',
          'Leave through the nearest exit',
          'Talk to Lowmarket Fence',
        ],
        undefined,
        'Press for leverage'
      );
      expect(compiled.choices.some((c) => /^Press for leverage$/i.test(c))).toBe(false);
      expect(compiled.choices.some((c) => /^Ask a direct question$/i.test(c))).toBe(false);
      expect(compiled.choices.some((c) => /Leave through the nearest exit/i.test(c))).toBe(false);
      expect(compiled.choices.some((c) => /Talk to Lowmarket Fence/i.test(c))).toBe(true);
    });
  });

  describe('readabilityGate scans Batch X violations', () => {
    it('detects hub-role mad-lib, quest tracker, spawn log', () => {
      const state = {
        ...createInitialState(undefined, 'litrpg'),
        log: [
          {
            id: '1',
            role: 'gm',
            turn: 15,
            content: 'As you lunged Lowmarket Fence, your fist met steel.',
            timestamp: 1,
          },
          {
            id: '2',
            role: 'gm',
            turn: 21,
            content: "Circle's Price (Stage 2: Reason Heard) stayed in mind.",
            timestamp: 2,
          },
          {
            id: '3',
            role: 'gm',
            turn: 9,
            content: autoFightSpawnPreface('Pact-Hunter Skirmisher', 'Lowmarket'),
            timestamp: 3,
          },
        ],
      } as GameState;
      const violations = scanReadabilityViolations(state);
      expect(violations.some((v) => v.kind === 'entity-madlib')).toBe(true);
      expect(violations.some((v) => v.kind === 'quest-tracker')).toBe(true);
      expect(violations.some((v) => v.kind === 'spawn-log')).toBe(true);
    });
  });

  describe('P1 — NPC face possessive kept on role subjects', () => {
    it('rewrites crossing your face on fence subject', () => {
      const line = 'The Lowmarket Fence shifts, a flicker crossing your face.';
      const out = applyProseWarden(line);
      expect(out).toMatch(/their face/i);
    });
  });
});
