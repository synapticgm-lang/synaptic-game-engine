/**
 * Batch 02t — slot / object glue.
 * Tapes: 02r LitRPG s43 open-the-stranger; D&D s43 the Across / Strangers;
 * PYOA s43 Charter looks up.
 * Mid writer OFF. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { isFactClosedViolation } from './beatCommitGate';
import { canHarvestAsNamedPerson } from './entityRegistry';
import { applyProseWarden } from './proseWarden';
import {
  isObjectPersonPad,
  isPlotObjectName,
  isSlotGlueViolation,
  scrubSlotGlue,
} from './slotGlue';
import type { GameState } from './types';

const OPEN_STRANGER =
  'You press the latch — rust flakes off on your thumb — and the lid groans open the stranger.';

const ACROSS =
  'Across and the man by the stalls have gone very still. The fight the Across really had a second wind.';

const STRANGERS = 'the Strangers stands at the mouth of the gate arch.';

const CHARTER_PERSON =
  'Charter looks up from the grain sacks, hands resting on the lid of the chest.';

function roadState(): GameState {
  const state = createInitialState(undefined, 'pyoa') as GameState;
  return {
    ...state,
    campaignBibleId: 'thornferry-road',
    currentLocation: 'mill landing at Thornferry',
    turn: 29,
    sceneFacts: { ...emptySceneFacts(29), present: ['Wren Holt'] },
  };
}

describe('Batch 02t stamps', () => {
  it('HUD and BUILD are 2026-09-02t and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-02t');
    expect(BUILD_STAMP).toBe('2026-09-02t');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02t — slot / object glue', () => {
  it('rejects and scrubs lid-open-the-stranger glue', () => {
    expect(isSlotGlueViolation(OPEN_STRANGER)).toBe(true);
    expect(isFactClosedViolation(roadState(), OPEN_STRANGER)).toBe(true);
    const scrubbed = scrubSlotGlue(OPEN_STRANGER);
    expect(scrubbed).not.toMatch(/open the stranger/i);
    expect(applyProseWarden(OPEN_STRANGER)).not.toMatch(/open the stranger/i);
  });

  it('rewrites the Across / the Strangers slot nouns', () => {
    expect(isSlotGlueViolation(ACROSS)).toBe(true);
    expect(isSlotGlueViolation(STRANGERS)).toBe(true);
    const across = scrubSlotGlue(ACROSS);
    expect(across).not.toMatch(/\bthe Across\b/);
    expect(across).not.toMatch(/\bAcross and\b/);
    expect(scrubSlotGlue(STRANGERS)).not.toMatch(/\bthe Strangers\b/);
  });

  it('keeps a legal the-stranger speaker', () => {
    const ok = 'The stranger shouts from the stall.';
    expect(isSlotGlueViolation(ok)).toBe(false);
    expect(isFactClosedViolation(roadState(), ok)).toBe(false);
    expect(applyProseWarden(ok)).toMatch(/the stranger shouts/i);
  });

  it('rejects Charter-as-person and starves Ask Charter', () => {
    expect(isPlotObjectName('Charter')).toBe(true);
    expect(canHarvestAsNamedPerson('Charter', 'thornferry-road')).toBe(false);
    expect(isSlotGlueViolation(CHARTER_PERSON)).toBe(true);
    expect(isFactClosedViolation(roadState(), CHARTER_PERSON)).toBe(true);
    expect(scrubSlotGlue(CHARTER_PERSON)).toMatch(/^Someone looks up/);
    expect(isObjectPersonPad('Ask Charter')).toBe(true);
    expect(isObjectPersonPad('Talk to the charter')).toBe(true);
    expect(isObjectPersonPad('Ask the clerk about the charter')).toBe(false);
  });
});
