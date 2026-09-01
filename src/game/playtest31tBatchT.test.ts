/**
 * Batch T — post–Batch-S Gemini T50 P0s (seed 42).
 * Root-cause ledger / compiler / warden — not CRAFT piles. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyProseWarden,
  scrubUnresolvedDeixisNouns,
  scrubFalseArrivalWhenHere,
} from './proseWarden';
import {
  scrubInventedCrowdSize,
  normalizeCrowdRewriteArtifacts,
  syncPresentToCount,
} from './crowdAuthority';
import {
  isChoicePadPersonToken,
  isUnresolvedDeixisToken,
  filterChromeFromPresent,
  realPresentPeople,
} from './chromeAuthority';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { stripChoiceList } from './parser';
import { compileChoices } from './choiceCompiler';
import {
  stitchCommitDelta,
  isVerbatimStallStub,
  repairRejectedBeat,
} from './beatCommitGate';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import type { GameState } from './types';

describe('playtest31tBatchT', () => {
  it('stamp is 2026-08-31t / 31l and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(HUD_BUILD_STAMP).toBe('2026-08-31t');
    expect(BUILD_STAMP).toBe('2026-08-31l');
  });

  describe('P0-1 — ban unresolved deixis / occupancy nouns', () => {
    it('blocks Ahead / Behind / figure N from present and harvest', () => {
      expect(isUnresolvedDeixisToken('Ahead')).toBe(true);
      expect(isUnresolvedDeixisToken('Behind')).toBe(true);
      expect(isUnresolvedDeixisToken('figure 1')).toBe(true);
      expect(isChoicePadPersonToken('Ahead')).toBe(true);
      expect(isChoicePadPersonToken('Ascend')).toBe(true);
      expect(isChoicePadPersonToken('Wall Sergeant')).toBe(false);
      expect(
        filterChromeFromPresent(['Ahead', 'figure 1', 'Behind', 'Wall Sergeant'])
      ).toEqual(['Wall Sergeant']);
      expect(realPresentPeople(['Ahead', 'figure 1', 'Wall Sergeant'])).toEqual(['Wall Sergeant']);
      expect(syncPresentToCount(['Wall Sergeant'], 4)).toEqual(['Wall Sergeant']);
      expect(syncPresentToCount(['Wall Sergeant'], 4).some((p) => /figure/i.test(p))).toBe(false);

      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
        currentLocation: 'Lowmarket',
        sceneFacts: {
          crowd: 'present',
          noise: 'voices',
          present: [],
          props: [],
          lastBeat: '',
          updatedTurn: 8,
        },
      };
      const prose =
        'You faced the Lowmarket Fence, the Ahead half-hidden by the overflowing stall. Silhouette of figure 1.';
      const next = harvestNarrativeIntoLedger(state, prose, 8);
      expect(next.sceneFacts?.present ?? []).not.toContain('Ahead');
      expect(next.sceneFacts?.present ?? []).not.toContain('figure 1');
    });

    it('scrubs the Ahead / figure 1 from committed prose (tape quotes)', () => {
      const t8 = 'You faced the Lowmarket Fence, the Ahead half-hidden by the overflowing stall.';
      expect(scrubUnresolvedDeixisNouns(t8, 'Lowmarket')).not.toMatch(/\bthe Ahead\b/i);
      const t2 = 'from the figures who performed the ritual—figure 1 priests—continues';
      expect(scrubUnresolvedDeixisNouns(t2)).not.toMatch(/figure\s+1/i);
      const t3 = 'imposing silhouette of figure 1.';
      expect(scrubUnresolvedDeixisNouns(t3)).not.toMatch(/figure\s+1/i);
      const t44 = 'leading towards the imposing fortifications of the Ahead.';
      expect(scrubUnresolvedDeixisNouns(t44, 'West Wall')).not.toMatch(/\bthe Ahead\b/i);
      expect(
        applyProseWarden(
          'a study the Ahead. tarnished the Ahead. figure 1 ramparts.',
          { currentLocation: 'Lowmarket' }
        )
      ).not.toMatch(/\bAhead\b|\bfigure\s+1\b/i);
    });
  });

  describe('P0-2 — crowd phrases are grammar, not entities', () => {
    it('fixes people heres and personified crowd-as-monster', () => {
      const t18 = 'the murmur of passing the two people heres';
      expect(normalizeCrowdRewriteArtifacts(t18)).toMatch(/people here/);
      expect(normalizeCrowdRewriteArtifacts(t18)).not.toMatch(/heres/i);

      const t47 = 'The crowd here, hunched and bestial, break from the queue.';
      const fixed = normalizeCrowdRewriteArtifacts(t47);
      expect(fixed).not.toMatch(/hunched and bestial/i);
      expect(fixed).toMatch(/crowd here/i);
      expect(scrubInventedCrowdSize(t18, 2, true)).not.toMatch(/heres/i);
    });
  });

  describe('P0-3 — never commit stitch/chrome as the sole beat', () => {
    it('rejects old stitch bank lines and emits a scene-move stitch', () => {
      expect(
        isVerbatimStallStub(
          'The cracked street in West Wall is done yielding — speak, leave, or take a stake.'
        )
      ).toBe(true);
      expect(
        isVerbatimStallStub(
          'The crate in West Wall is empty. The room asks for an exit or a person, not another sift.'
        )
      ).toBe(true);
      expect(
        isVerbatimStallStub(
          'Ahead shifts weight in Lowmarket and leaves you one clear next move.'
        )
      ).toBe(true);

      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
        currentLocation: 'Lowmarket',
        campaignBibleId: 'summoned-pact',
        turn: 17,
        sceneFacts: {
          crowd: 'present',
          noise: 'voices',
          present: ['Ahead', 'figure 1', 'Lowmarket Fence'],
          props: ['cracked street'],
          emptyContainers: ['crate'],
          lastBeat: '',
          updatedTurn: 17,
        },
      } as GameState;
      const stitch = stitchCommitDelta(state);
      expect(stitch).not.toMatch(/\bAhead\b/);
      expect(stitch).not.toMatch(/figure\s+1/i);
      expect(stitch).not.toMatch(/is done yielding|room asks|one clear next move/i);
      expect(stitch).toMatch(/leave|speak|exit|stake|commit|face|strike|parley/i);

      const repaired = repairRejectedBeat(
        state,
        'The rain continues. The scent of damp earth hangs.',
        ['atmosphere-only']
      );
      expect(repaired.prose).toBe(stitchCommitDelta(state));
      expect(repaired.prose).not.toMatch(/is done yielding|room asks/i);
    });
  });

  describe('P0-4 — stripChoiceList completeness', () => {
    it('strips Ascend / Draw / Intervene / Peer / Give / Maintain numbered chips', () => {
      const t3 =
        'Dust falls through the chant. 1. Ascend figure 1 ramparts. 2. Draw steel. What do you do?';
      const stripped = stripChoiceList(t3);
      expect(stripped).not.toMatch(/\b1\.\s*Ascend/i);
      expect(stripped).not.toMatch(/\bDraw steel/i);
      expect(stripped).toMatch(/Dust falls/i);

      const mid =
        'The skirmisher waits. 1. Intervene now. 2. Peer through the gap. 3. Give ground. 4. Maintain cover.';
      const midOut = stripChoiceList(mid);
      expect(midOut).not.toMatch(/\b1\.\s*Intervene/i);
      expect(midOut).not.toMatch(/\bPeer through/i);
      expect(midOut).not.toMatch(/\bGive ground/i);
      expect(midOut).not.toMatch(/\bMaintain cover/i);
    });
  });

  describe('P0-5 — spatial authority + travel yo-yo lock', () => {
    it('scrubs Sevenfold false-arrival glued to real leave/reach', () => {
      const t31 =
        'You reach The Sevenfold Circle under bombardment. You leave West Wall behind and reach Lowmarket.';
      const cleaned = scrubFalseArrivalWhenHere(t31, 'Lowmarket', [
        'The Sevenfold Circle under bombardment',
        'West Wall',
      ]);
      expect(cleaned).not.toMatch(/You reach The Sevenfold Circle/i);
      expect(
        applyProseWarden(t31, {
          currentLocation: 'Lowmarket',
          knownPlaces: ['The Sevenfold Circle under bombardment', 'West Wall', 'Lowmarket'],
        })
      ).not.toMatch(/You reach The Sevenfold Circle/i);
    });

    it('locks Travel pads while fight/standoff/pending encounter is live', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
        currentLocation: 'Lowmarket',
        campaignBibleId: 'summoned-pact',
        turn: 31,
        activeEncounter: {
          name: 'Pact-Hunter Skirmisher',
          phase: 'engaged',
          encounterId: 'enc-test',
          engagedTurnCount: 2,
          failedFleeCount: 0,
          failedParleyCount: 0,
        } as GameState['activeEncounter'],
        sceneFacts: {
          crowd: 'present',
          noise: 'voices',
          present: ['Pact-Hunter Skirmisher'],
          props: [],
          lastBeat: '',
          updatedTurn: 31,
        },
      } as GameState;
      const compiled = compileChoices(
        state,
        [
          'Travel toward West Wall',
          'Travel to West Wall',
          'Press the attack',
          'Try to flee',
          'Parley',
        ],
        undefined,
        'Ready yourself'
      );
      expect(compiled.choices.every((c) => !/\btravel\b/i.test(c))).toBe(true);
      expect(compiled.notes.some((n) => /Travel yo-yo lock|Encounter lock/i.test(n))).toBe(true);
      expect(compiled.choices.some((c) => /press the attack|flee|parley/i.test(c))).toBe(true);

      // pending drought park also locks travel
      const parked = {
        ...state,
        activeEncounter: undefined,
        sceneFacts: {
          ...state.sceneFacts!,
          pendingEncounter: {
            name: 'Pact-Hunter Skirmisher',
            phase: 'engaged',
            encounterId: 'enc-park',
            engagedTurnCount: 0,
            failedFleeCount: 0,
            failedParleyCount: 0,
          },
        },
      } as GameState;
      const parkedCompiled = compileChoices(
        parked,
        ['Travel toward West Wall', 'Ask a direct question', 'Scout the exit'],
        undefined,
        'Wait and watch'
      );
      expect(parkedCompiled.choices.every((c) => !/\btravel\b/i.test(c))).toBe(true);
    });
  });
});
