/**
 * T10AE — authored openings must not trip readability ui-bleed.
 * Round 9h seed 8612 flagged the stock summoned-pact watchtower page1 as P0 ui-bleed at turn 0.
 * Root: isWriterMonologueLeak's bare "No X. No Y." shape matched narrative "No priests. No handlers."
 * UI_BLEED regex in readabilityGate did not fire on that text.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { isWriterMonologueLeak } from './beatCommitGate';
import { openingHookDeck, normalizeOpeningHookCard } from './openingEstablishment';
import { scanReadabilityViolations } from './readabilityGate';
import { createInitialState } from './defaults';
import type { GameState } from './types';

/** Transcript Turn 0 body (panel sentences stripped as in the live stitch). */
const WATCHTOWER_TURN0 =
  'A bitter wind over wild-country ash snaps you awake. You are lying on cracked blocks in the stump of a watchtower; half the circular roof is gone and the upper floor opens to grey sky. Cold finds the seams of your Earth clothes through the arrow-slits. The stair door is empty. No priests. No handlers. The circle under you is already fading.';

/** Full bible page1 including blue-panel sentences. */
const WATCHTOWER_PAGE1 =
  'A bitter wind over wild-country ash snaps you awake. You are lying on cracked blocks in the stump of a watchtower; half the circular roof is gone and the upper floor opens to grey sky. Cold finds the seams of your Earth clothes through the arrow-slits. A blue panel hangs in the freeze, untouched by weather. The stair door is empty. No priests. No handlers. The circle under you is already fading. The panel waits on a name. What do you enter?';

/** Mirror of readabilityGate UI_BLEED — kept local so the probe names both detectors. */
const UI_BLEED =
  /\b(?:invite a real move|A question hangs|ash still sifts between the stones|Wind cuts along the cracked stones|side lane toward)\b/i;

function gmState(content: string): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    log: [{ id: 't0', turn: 0, role: 'gm', content, timestamp: 1 }],
  };
}

function authoredOpeningBodies(): Array<{ bibleId: string; index: number; body: string }> {
  const out: Array<{ bibleId: string; index: number; body: string }> = [];
  for (const bible of ALL_CAMPAIGN_BIBLES) {
    const deck = openingHookDeck(bible);
    deck.forEach((card, index) => {
      const n = normalizeOpeningHookCard(card);
      for (const body of [n.page1, n.fallback, n.text]) {
        const t = body?.trim();
        if (t && t.length >= 40) out.push({ bibleId: bible.id, index, body: t });
      }
    });
  }
  return out;
}

describe('T10AE — authored opening vs ui-bleed detectors', () => {
  it('identifies which detector fires on the watchtower Turn 0 text', () => {
    // Pre-fix 02x shape (bare No + No): proves the false positive, not a guess.
    const oldBareNoNo =
      /(?:^|[.!?]\s+)(?:No|Do not|Don't)\s+[a-z][^.]{2,60}\.\s*(?:No|Do not|Don't)\s+/m;
    expect(UI_BLEED.test(WATCHTOWER_TURN0)).toBe(false);
    expect(UI_BLEED.test(WATCHTOWER_PAGE1)).toBe(false);
    expect(oldBareNoNo.test(WATCHTOWER_TURN0)).toBe(true);
    expect(oldBareNoNo.test('No priests. No handlers.')).toBe(true);
    // Live detector after root fix: monologue no longer treats narrative absence as craft voice.
    expect(isWriterMonologueLeak(WATCHTOWER_TURN0)).toBe(false);
    expect(isWriterMonologueLeak(WATCHTOWER_PAGE1)).toBe(false);
    expect(isWriterMonologueLeak('No priests. No handlers.')).toBe(false);
  });

  it('readabilityGate does not flag watchtower turn 0 as ui-bleed', () => {
    const v0 = scanReadabilityViolations(gmState(WATCHTOWER_TURN0));
    const v1 = scanReadabilityViolations(gmState(WATCHTOWER_PAGE1));
    expect(v0.filter((v) => v.kind === 'ui-bleed')).toEqual([]);
    expect(v1.filter((v) => v.kind === 'ui-bleed')).toEqual([]);
  });

  it('still catches real writer-monologue / UI-bleed leaks', () => {
    expect(isWriterMonologueLeak('No tag needed. No loot for just watching.')).toBe(true);
    expect(isWriterMonologueLeak('End with the drizzle on the stones.')).toBe(true);
    expect(isWriterMonologueLeak('No numbers, no tags, no new named people in this beat.')).toBe(true);
    expect(isWriterMonologueLeak('Do not invent names. Do not address anyone.')).toBe(true);
    expect(isWriterMonologueLeak('Let me write this with good prose and keep it clean.')).toBe(true);
    expect(UI_BLEED.test('A question hangs over the crate while ash still sifts between the stones.')).toBe(
      true
    );
    const leaks = scanReadabilityViolations(
      gmState('No tag needed. No loot for just watching. A question hangs in the lane.')
    );
    expect(leaks.some((v) => v.kind === 'ui-bleed')).toBe(true);
  });

  it('no authored opening page1/fallback/text is flagged as ui-bleed', () => {
    const bodies = authoredOpeningBodies();
    expect(bodies.length).toBeGreaterThan(20);
    const falsePositives: string[] = [];
    for (const { bibleId, index, body } of bodies) {
      const monologue = isWriterMonologueLeak(body);
      const uiRegex = UI_BLEED.test(body);
      const gate = scanReadabilityViolations(gmState(body)).some((v) => v.kind === 'ui-bleed');
      if (monologue || uiRegex || gate) {
        falsePositives.push(`${bibleId}[${index}]: ${body.slice(0, 100)}`);
      }
    }
    expect(falsePositives).toEqual([]);
  });
});
