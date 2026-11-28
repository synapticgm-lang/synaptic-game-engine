/**
 * Critic Batch A+B — kill fallback-as-story + Pellane contagion + dead choice pad.
 * Stamp: HUD 2026-08-31i / BUILD 2026-08-31b. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import {
  consecutiveRecoveryExceeded,
  isBannedFallbackStub,
  markEngineRecoveryCommit,
} from './sealedManifest';
import { runArcDirectorBeforeGm } from './arcDirector';
import { scrubOfficialPlaceholder } from './narrativeScrub';
import {
  isPolityFactionOrPlaceToken,
  realPresentPeople,
} from './chromeAuthority';
import {
  rewriteInvalidReferences,
  type InvalidReferenceReport,
  type TypedEntityContext,
} from './typedEntityValidator';
import { enumerateLegalEdges } from './choiceEdge';
import { compileChoices } from './choiceCompiler';
import {
  isDnsResolutionFailure,
  shouldAutoRetryTurn,
  transportRetryBackoffMs,
  TURN_TRANSPORT_RATE_LIMIT_BACKOFF_MS,
} from './errorRepairWarden';
import type { ActiveEncounter } from './types';

const T16_REGISTRATION =
  'REGISTRATION — the Pellane: the Pellane: the Pellane: [Pactborn] · [the sign]\n\nClass: Pactborn\nHP: 26/26';

function stubEncounter(name: string, hp: number, maxHp: number): ActiveEncounter {
  return {
    name,
    level: 1,
    hp,
    maxHp,
    armorClass: 10,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    xpReward: 10,
    goldReward: 0,
    phase: 'engaged',
  };
}

describe('playtest31iCriticBatchAB', () => {
  it('stamp is 2026-08-31i / 31b and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-31b').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31i').toBe(true);
  });

  describe('Batch A — HUD stub detect + recovery streak (deterministic fallback deleted)', () => {
    it('isBannedFallbackStub catches HUD fact bleed (banned stub bank deleted)', () => {
      expect(
        isBannedFallbackStub(
          'At Lowmarket, something shifts — a footstep, a call, a door — forcing the moment forward. PC: Jax L2. HP: 26/26. XP: 75.'
        )
      ).toBe(true);
    });

    it('consecutiveRecoveryExceeded after one mark', () => {
      let state = createInitialState(undefined, 'litrpg');
      expect(consecutiveRecoveryExceeded(state)).toBe(false);
      state = markEngineRecoveryCommit(state);
      expect(consecutiveRecoveryExceeded(state)).toBe(true);
    });

    it('rate_limit retries with longer backoff; DNS detected', () => {
      expect(shouldAutoRetryTurn('rate_limit')).toBe(true);
      expect(transportRetryBackoffMs(0, 'rate_limit')).toBe(TURN_TRANSPORT_RATE_LIMIT_BACKOFF_MS[0]);
      expect(transportRetryBackoffMs(1, 'rate_limit')).toBeGreaterThan(transportRetryBackoffMs(1));
      expect(isDnsResolutionFailure(new Error('getaddrinfo ENOTFOUND ai-gateway.vercel.sh'))).toBe(
        true
      );
      expect(isDnsResolutionFailure(new Error('timeout'))).toBe(false);
    });
  });

  describe('Batch B — Pellane contagion + dead pad', () => {
    it('polity tokens are not person slots', () => {
      expect(isPolityFactionOrPlaceToken('Pellane')).toBe(true);
      expect(isPolityFactionOrPlaceToken('Lowmarket')).toBe(true);
      expect(isPolityFactionOrPlaceToken('Ash Court')).toBe(true);
      expect(isPolityFactionOrPlaceToken('Silas')).toBe(false);
      expect(realPresentPeople(['Pellane', 'blue panel', 'Mira'])).toEqual(['Mira']);
    });

    it('T16 registration chrome never becomes the Pellane: spam via official scrub', () => {
      const state = createInitialState(undefined, 'litrpg');
      state.sceneFacts = {
        crowd: 'present',
        noise: 'voices',
        present: ['Pellane'],
        props: [],
        lastBeat: 'A door hangs open.',
        updatedTurn: 16,
      };
      const scrubbed = scrubOfficialPlaceholder(
        `Approach the official.\n\n${T16_REGISTRATION}`,
        state
      );
      expect(scrubbed).not.toMatch(/the Pellane/i);
      expect(scrubbed).toMatch(/REGISTRATION/i);
      expect(scrubbed).not.toMatch(/blue panel/i);
      expect(scrubbed).toMatch(/^Approach the official\./);
    });

    it('typedEntityValidator never maps panel/mark onto Pellane; REGISTRATION frozen', () => {
      const context: TypedEntityContext = {
        presentNpcs: ['Pellane'],
        companions: [],
        locationName: 'Lowmarket',
        inventoryItems: [],
        sceneObjects: [],
        aloneArrival: false,
        encounterName: undefined,
        lastSpeaker: undefined,
      };
      const report: InvalidReferenceReport = {
        themCount: 0,
        thisPlaceCount: 0,
        strangerCount: 1,
        brokenChoiceCount: 0,
        references: [],
        shouldRegenerate: false,
      };
      const out = rewriteInvalidReferences(
        `You touch the panel.\n\n${T16_REGISTRATION}`,
        context,
        report
      );
      expect(out).not.toMatch(/the Pellane/i);
      expect(out).toMatch(/REGISTRATION/i);
      expect(out).toMatch(/the panel/i);
    });

    it('Engage the threat only with live encounter; drought pad drops Wait/Status/Engage', () => {
      const state = createInitialState(undefined, 'litrpg');
      state.campaignBibleId = 'summoned-pact';
      state.turn = 22;
      state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
      state.currentLocation = 'Lowmarket';
      // No activeEncounter — encounter-contract edges must not say Engage
      const edges = enumerateLegalEdges(state);
      expect(edges.some((e) => /^Engage the threat$/i.test(e.label))).toBe(false);

      state.sceneFacts = {
        crowd: 'unknown',
        noise: 'unknown',
        present: [],
        props: [],
        lastBeat: 'Something happened.',
        updatedTurn: 22,
        engineRecoveryStreak: 1,
      };
      state.arcDirector = {
        committedBeatIds: [],
        lastMandate: 'DROUGHT INTERRUPT — spawn pressure',
      };
      const compiled = compileChoices(
        state,
        ['Engage the threat', 'Wait and watch', 'Check Status', 'Force a path forward', 'Scout the exit'],
        undefined,
        'Engage the threat'
      );
      expect(compiled.choices.some((c) => /^Engage the threat$/i.test(c))).toBe(false);
      expect(compiled.choices.some((c) => /^Wait and watch$/i.test(c))).toBe(false);
      expect(compiled.choices.some((c) => /^Check Status$/i.test(c))).toBe(false);
      expect(compiled.choices.some((c) => /^Force a path forward$/i.test(c))).toBe(false);
    });

    it('live encounter pad still offers Press the attack', () => {
      const state = createInitialState(undefined, 'litrpg');
      state.activeEncounter = stubEncounter('Pact-Hunter', 8, 10);
      const edges = enumerateLegalEdges(state);
      expect(edges.some((e) => /Press the attack/i.test(e.label))).toBe(true);
      expect(edges.some((e) => /^Engage the threat$/i.test(e.label))).toBe(false);
    });
  });
});
