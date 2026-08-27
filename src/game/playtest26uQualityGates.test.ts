import { describe, expect, it } from 'vitest';
import { enforcePerspective } from './perspectiveWarden';
import {
  applyProseWarden,
  scrubPlaceholderNouns,
  scrubPronounSubjectSlips,
} from './proseWarden';
import { isBrokenChoiceLabel, sanitizeChoiceLabel } from './choicePipeline';
import { filterInventedContextChoices } from './choiceWarden';
import {
  beatFingerprint,
  countPlayerIntentStreak,
  isNearClone,
  normalizePlayerIntentKey,
} from './beatFingerprint';
import { buildStoryReviewExport } from './playTranscript';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import { createInitialState } from './defaults';
import type { LogEntry } from './types';

describe('playtest26u — Gemini P0 quality gates', () => {
  it('never replaces the stranger with bare them', () => {
    const cleaned = applyProseWarden('The stranger tilts their head and waits.', {
      presentNames: [],
    });
    expect(cleaned.toLowerCase()).not.toMatch(/\bthem tilts\b/);
    expect(cleaned).toMatch(/stranger/i);
  });

  it('scrubs imposing this place using current location', () => {
    const cleaned = scrubPlaceholderNouns(
      'The imposing this place looms before you.',
      'Contract Hall'
    );
    expect(cleaned.toLowerCase()).not.toMatch(/this place/);
    expect(cleaned).toMatch(/Contract Hall/i);
  });

  it('scrubs presence of them / surfaces of them', () => {
    const cleaned = scrubPlaceholderNouns(
      'Look for the presence of them. Your fingers brush surfaces of them in your bag.'
    );
    expect(cleaned.toLowerCase()).not.toMatch(/presence of them/);
    expect(cleaned.toLowerCase()).not.toMatch(/surfaces of them/);
  });

  it('keeps NPC tilted head as his/her after perspective', () => {
    const raw = 'He tilted his head. She tilted her head and looked at you.';
    const pov = enforcePerspective(raw, { perspective: 'second-person' }, 'Jax');
    expect(pov).toMatch(/tilted his head/i);
    expect(pov).toMatch(/tilted her head/i);
    expect(pov).not.toMatch(/tilted your head/i);
  });

  it('rewrites NPC your-eyes slips mid-clause', () => {
    const fixed = scrubPronounSubjectSlips(
      'He squints at you, a flicker of suspicion in your eyes.'
    );
    expect(fixed.toLowerCase()).toMatch(/in his eyes/);
    expect(fixed.toLowerCase()).not.toMatch(/in your eyes/);
  });

  it('rejects broken choice labels', () => {
    expect(isBrokenChoiceLabel('Look for the presence of them.')).toBe(true);
    expect(isBrokenChoiceLabel('Approach this place directly.')).toBe(true);
    expect(isBrokenChoiceLabel('Check your the merchant might help appraise these items.')).toBe(
      true
    );
    expect(isBrokenChoiceLabel('Examine the merchant, dark berries more closely.')).toBe(true);
    expect(isBrokenChoiceLabel('Ask them about the road.')).toBe(false);
    expect(sanitizeChoiceLabel('Check your the bag')).toMatch(/^Check the bag$/i);
  });

  it('filters broken labels from offered pads', () => {
    const base = createInitialState('Test', 'litrpg');
    const state = {
      ...base,
      log: [
        {
          id: 'g1',
          turn: 1,
          role: 'gm' as const,
          content: 'A flour-dusted merchant sweeps near barrels.',
          timestamp: 1,
        },
      ],
      openingEstablishment: { complete: true, pending: [], answers: {}, sceneWritten: true },
    };
    const filtered = filterInventedContextChoices(
      [
        'Ask about Earth junk prices',
        'Look for the presence of them.',
        'Check your the merchant might help',
        'Wait and listen',
      ],
      state
    );
    expect(filtered.some((c) => /them|your the/i.test(c))).toBe(false);
    expect(filtered.some((c) => /Earth junk|Wait/i.test(c))).toBe(true);
  });

  it('detects near-clone fingerprints', () => {
    const prose =
      'The stout merchant, her apron dusted with flour, paused her sweeping and tilted her head. Her brow furrowed as she considered your question about Earth junk prices in the Lowmarket throng.';
    const recent = [beatFingerprint(prose)];
    expect(isNearClone(prose, recent)).toBe(true);
  });

  it('tracks Earth-junk intent streak', () => {
    expect(normalizePlayerIntentKey('Ask about Earth junk prices')).toBe('ask_earth_junk');
    const streak = countPlayerIntentStreak({
      log: [
        { role: 'player', content: 'Ask about Earth junk prices' },
        { role: 'gm', content: '...' },
        { role: 'player', content: 'Ask about Earth junk prices' },
        { role: 'gm', content: '...' },
        { role: 'player', content: 'Ask about Earth junk prices' },
      ],
    });
    expect(streak.key).toBe('ask_earth_junk');
    expect(streak.count).toBe(3);
  });

  it('SNAPSHOT includes quest focus + stagnation + dry-wit voice check', () => {
    const base = createInitialState('Pact', 'litrpg');
    const state = {
      ...base,
      systemPersonality: 'dry-wit' as const,
      quests: [
        {
          id: 'q1',
          name: "Circle's Price",
          description: 'Survive the summoning.',
          status: 'active' as const,
          type: 'main' as const,
          revealed: true,
          objectives: [{ id: 'o1', description: 'Find who summoned you', completed: false }],
        },
      ],
      log: [
        { id: 'p1', turn: 1, role: 'player' as const, content: 'Ask about Earth junk prices', timestamp: 1 },
        { id: 'g1', turn: 1, role: 'gm' as const, content: 'Merchant shrugs.', timestamp: 2 },
        { id: 'p2', turn: 2, role: 'player' as const, content: 'Ask about Earth junk prices', timestamp: 3 },
        { id: 'g2', turn: 2, role: 'gm' as const, content: 'Merchant shrugs.', timestamp: 4 },
        { id: 'p3', turn: 3, role: 'player' as const, content: 'Ask about Earth junk prices', timestamp: 5 },
      ],
    };
    const snap = formatSceneSnapshotForPrompt(state);
    expect(snap).toMatch(/Quest focus: Circle's Price/i);
    expect(snap).toMatch(/Stagnation:.*ask_earth_junk/i);
    expect(snap).toMatch(/VOICE CHECK \(Sarcastic Patch/i);
    expect(snap).toMatch(/QUEST PRESSURE/i);
  });

  it('Gemini export includes STATUS XP lines', () => {
    const base = createInitialState('Pact', 'litrpg');
    const gm: LogEntry = {
      id: 'g1',
      turn: 1,
      role: 'gm',
      content: 'You reach Lowmarket.',
      timestamp: 1,
      systemLog: ['XP Gained: 10 (discover hub)', 'Warden: noise'],
      offeredChoices: ['Browse the nearest stall'],
    };
    const md = buildStoryReviewExport(
      { ...base, log: [gm], turn: 1, character: { ...base.character, level: 2, xp: 10 } },
      { personalityId: 'dry-wit', seed: 77 }
    );
    expect(md).toMatch(/\*\*STATUS \/ System:\*\*/);
    expect(md).toMatch(/XP Gained: 10 \(discover hub\)/);
    expect(md).not.toMatch(/Warden: noise/);
    expect(md).toMatch(/## Critic prompt/);
    expect(md).toMatch(/Scorecard \(required\)/);
    expect(md).toMatch(/Option quality/);
  });
});
