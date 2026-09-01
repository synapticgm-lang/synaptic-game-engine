/**
 * Batch S — Gemini Pro Summoned Pact T50 P0s (seed 42).
 * Root-cause ledger / compiler / warden — not CRAFT patches. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  applyProseWarden,
  scrubChoicePadPersonNames,
  scrubFactionAsLootOrTarget,
  scrubFalseArrivalWhenHere,
} from './proseWarden';
import {
  scrubInventedCrowdSize,
  normalizeCrowdRewriteArtifacts,
} from './crowdAuthority';
import {
  isChoicePadPersonToken,
  isFactionOrOrgToken,
  filterChromeFromPresent,
  realPresentPeople,
} from './chromeAuthority';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { compileChoices } from './choiceCompiler';
import { recordNpcTopic, presentNpcForPads } from './npcTopicFsm';
import { classifyBeatCommit } from './beatCommitGate';
import { detectDialogueTreadmillHard } from './semanticLoopDetector';
import { filterSystemLogForEngine } from './systemLog';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import type { GameState } from './types';

describe('playtest31sGeminiT50P0', () => {
  it('stamp is 2026-08-31s / 31k and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(HUD_BUILD_STAMP >= '2026-08-31s').toBe(true);
    expect(BUILD_STAMP >= '2026-08-31k').toBe(true);
  });

  describe('P0-A — choice-pad labels never become NPCs', () => {
    it('blocks They / One / Press from present and harvest', () => {
      expect(isChoicePadPersonToken('They')).toBe(true);
      expect(isChoicePadPersonToken('One')).toBe(true);
      expect(isChoicePadPersonToken('Press')).toBe(true);
      expect(isChoicePadPersonToken('Wall Sergeant')).toBe(false);
      expect(
        filterChromeFromPresent(['Scattered Scale', 'They', 'One', 'Press', 'Wall Sergeant'])
      ).toEqual(['Wall Sergeant']);
      expect(realPresentPeople(['They', 'One', 'Press', 'Wall Sergeant'])).toEqual(['Wall Sergeant']);

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
          updatedTurn: 22,
        },
      };
      const prose =
        'To your left, the Scattered Scale known as "They" shifts their weight. Across the narrow lane, "One" and "Press" stand a respectful distance away.';
      const next = harvestNarrativeIntoLedger(state, prose, 22);
      expect(next.sceneFacts?.present ?? []).not.toContain('They');
      expect(next.sceneFacts?.present ?? []).not.toContain('One');
      expect(next.sceneFacts?.present ?? []).not.toContain('Press');
    });

    it('scrubs quoted pad-name NPCs from prose', () => {
      const raw =
        'the Scattered Scale known as "They" shifts their weight. "One" and "Press" stand a respectful distance away.';
      const cleaned = scrubChoicePadPersonNames(raw);
      expect(cleaned).not.toMatch(/"They"/i);
      expect(cleaned).not.toMatch(/"One"/i);
      expect(cleaned).not.toMatch(/"Press"/i);
      expect(
        applyProseWarden(raw, { currentLocation: 'Lowmarket' })
      ).not.toMatch(/known as "They"/i);
    });
  });

  describe('P0-B — Scattered Scale entity type lock', () => {
    it('treats Scattered Scale as faction, not loot noun', () => {
      expect(isFactionOrOrgToken('Scattered Scale')).toBe(true);
      expect(isFactionOrOrgToken('the Scattered Scale')).toBe(true);
      const loot =
        'Inside, nestled amongst straw, lies a single, tarnished the Scattered Scale.';
      expect(scrubFactionAsLootOrTarget(loot)).toMatch(/tarnished silver token/i);
      expect(scrubFactionAsLootOrTarget(loot)).not.toMatch(/tarnished the Scattered Scale/i);
      expect(
        scrubFactionAsLootOrTarget('Before you can even take a Scattered Scale, a blur')
      ).toMatch(/take a step/i);
      expect(
        applyProseWarden(
          'Beside it, a small, crudely drawn the Scattered Scale is folded loosely.',
          {}
        )
      ).toMatch(/crudely drawn sketch/i);
    });
  });

  describe('P0-C — crowd here here token corruption', () => {
    it('does not double-apply canonical crowd phrases', () => {
      const sparse = 'He glances at the sparse crowd milling about.';
      const once = scrubInventedCrowdSize(sparse, 9, true);
      expect(once).not.toMatch(/here\s*here/i);
      expect(once).not.toMatch(/sparse the crowd/i);
      const twice = scrubInventedCrowdSize(once, 9, true);
      expect(twice).not.toMatch(/here\s*here/i);
      expect(twice).toBe(normalizeCrowdRewriteArtifacts(twice));
    });

    it('normalizes already-corrupted crowd tokens', () => {
      const bad =
        'The sparse the crowd here here, the crowd here here huddled against the weather.';
      const fixed = normalizeCrowdRewriteArtifacts(bad);
      expect(fixed).not.toMatch(/here\s*here/i);
      expect(fixed).not.toMatch(/sparse the crowd/i);
      expect(scrubInventedCrowdSize(bad, 9, true)).not.toMatch(/here\s*here/i);
    });

    it('fixes people herehere from T28', () => {
      const t28 = 'The people herehere, a burly individual in stained leather armor';
      expect(normalizeCrowdRewriteArtifacts(t28)).toMatch(/The people here,/);
      expect(normalizeCrowdRewriteArtifacts(t28)).not.toMatch(/herehere/i);
    });
  });

  describe('P0-D — Wall Sergeant dialogue treadmill', () => {
    it('Talk to Wall Sergeant binds topic to Wall Sergeant (case-insensitive)', () => {
      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
        currentLocation: 'West Wall',
        sceneFacts: {
          crowd: 'present',
          noise: 'voices',
          present: ['Scattered Scale', 'They', 'One', 'Press', 'Wall Sergeant'],
          props: [],
          lastBeat: '',
          updatedTurn: 43,
          crowdCount: 9,
        },
      };
      // After chrome filter, presentNpc prefers Wall Sergeant
      state = {
        ...state,
        sceneFacts: {
          ...state.sceneFacts!,
          present: filterChromeFromPresent(state.sceneFacts!.present),
        },
      };
      expect(presentNpcForPads(state)).toBe('Wall Sergeant');
      const first = recordNpcTopic(state, 'Talk to Wall Sergeant');
      expect(first.npc).toBe('Wall Sergeant');
      const second = recordNpcTopic(first.state, 'Press for leverage');
      expect(second.npc).toBe('Wall Sergeant');
      expect(second.exhausted || (second.state.arcDirector?.npcTopics?.['wall-sergeant']?.length ?? 0) >= 1).toBe(
        true
      );
    });

    it('detects dialogue recycle and forces Leave/Travel pads', () => {
      const rain1 =
        'The Wall Sergeant shifts his weight, the worn leather creaking. "Names and business," he repeats in the rain.';
      const rain2 =
        'He shifts his weight, the worn leather of his uniform creaking. "Leverage? You\'re in the West Wall, not some throne room. Speak plainly."';
      expect(detectDialogueTreadmillHard(rain2, [rain1, rain1], 'Talk to Wall Sergeant')).toBe(true);
      expect(classifyBeatCommit(
        {
          ...createInitialState(undefined, 'litrpg'),
          openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
          turn: 46,
          log: [
            { id: '1', turn: 44, role: 'gm', content: rain1, timestamp: 1 },
            { id: '2', turn: 45, role: 'gm', content: rain1, timestamp: 2 },
          ],
        } as GameState,
        rain2,
        'Talk to Wall Sergeant'
      ).accept).toBe(false);

      let state = createInitialState(undefined, 'litrpg');
      state = {
        ...state,
        openingEstablishment: { pending: [], answers: {}, complete: true, aloneArrival: false },
        currentLocation: 'West Wall',
        campaignBibleId: 'summoned-pact',
        turn: 46,
        sceneFacts: {
          crowd: 'present',
          noise: 'voices',
          present: ['Wall Sergeant'],
          props: [],
          lastBeat: '',
          updatedTurn: 46,
        },
        arcDirector: {
          ...createInitialState(undefined, 'litrpg').arcDirector,
          npcTopics: { 'wall-sergeant': ['ask:general', 'dialogue:general'] },
        },
      };
      const compiled = compileChoices(
        state,
        ['Press for leverage', 'Ask a direct question', 'Ready yourself and watch', 'Scout for danger'],
        undefined,
        'Talk to Wall Sergeant'
      );
      expect(compiled.notes.some((n) => /Dialogue treadmill/i.test(n))).toBe(true);
      expect(compiled.choices.some((c) => /leave|travel|walk away/i.test(c))).toBe(true);
      expect(compiled.choices.every((c) => !/press for leverage/i.test(c))).toBe(true);
    });
  });

  describe('P1 — location prefix + dead SOCIAL CRISIS', () => {
    it('scrubs You reach Sevenfold Circle under bombardment when at West Wall', () => {
      const prose =
        'You reach The Sevenfold Circle under bombardment. The rain continues on the West Wall.';
      const cleaned = scrubFalseArrivalWhenHere(prose, 'West Wall', [
        'The Sevenfold Circle under bombardment',
        'Lowmarket',
      ]);
      expect(cleaned).not.toMatch(/You reach The Sevenfold Circle/i);
      expect(
        applyProseWarden(prose, {
          currentLocation: 'West Wall',
          knownPlaces: ['The Sevenfold Circle under bombardment', 'Lowmarket', 'West Wall'],
        })
      ).not.toMatch(/You reach The Sevenfold Circle/i);
    });

    it('filters SOCIAL CRISIS / NPC TOPIC mandates from STATUS', () => {
      const lines = filterSystemLogForEngine(
        [
          'SOCIAL CRISIS (SC-05): Resource Competition',
          'NPC TOPIC EXHAUSTED (Scattered Scale / dialogue:environment)',
          'NPC STAGE ADVANCE (Scattered Scale)',
          'XP Gained: 15 (talk)',
        ],
        'litrpg'
      );
      expect(lines.some((l) => /SOCIAL CRISIS/i.test(l))).toBe(false);
      expect(lines.some((l) => /NPC TOPIC/i.test(l))).toBe(false);
      expect(lines.some((l) => /XP Gained/i.test(l))).toBe(true);
    });
  });
});
