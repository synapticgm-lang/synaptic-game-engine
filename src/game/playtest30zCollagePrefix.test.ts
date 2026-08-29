/**
 * Leading-sentence collage — Josie door/panel + ozone/earth stitch + new man.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { applyGovernanceToProse } from './qualityGovernance';
import { isNearClone, beatFingerprint, maxBeatSimilarity } from './beatFingerprint';
import {
  detectLeadingCollage,
  shouldRetryUnaskedCollage,
  stripRecycledPrefix,
} from './semanticLoopDetector';
import type { GameState, LogEntry } from './types';

const BEAT_OZONE =
  'The air in the room hangs heavy, thick with the smell of damp earth and the faint, sharp tang of ozone, a lingering scent from the bombardment. Dust motes dance in the weak light filtering from the doorway you just passed through, illuminating the stark, unfinished nature of this space. Cracked stone walls rise around you, rough-hewn and unadorned, suggesting this is a foundational or utilitarian area rather than a place of comfort. A few scattered, unidentifiable debris items litter the uneven floor, testament to the recent violence.';

const BEAT_DOOR =
  'The heavy door groans in protest as you push the blue panel, its hinges protesting with a sound like a dying beast. The worn fabric of your clothes snags on a splintered edge, a sharp tug that makes your heart leap into your throat. Beyond the threshold lies not an immediate escape, but a dimly lit space that smells of damp earth and something faintly metallic, the air still heavy with the recent violence of the bombardment.';

const TAIL_MAN =
  'A man with a stern, weathered face, clad in travel-stained wool, watches from the far wall without offering a name.';

const COLLAGE = `${BEAT_DOOR.split('.')[0]}. ${BEAT_OZONE.split('A few scattered')[0].trim()} ${TAIL_MAN}`;

function gm(id: string, turn: number, content: string): LogEntry {
  return { id, turn, role: 'gm', content, timestamp: turn };
}

function stateWithPriorBeats(): GameState {
  const state = createInitialState('Pact', 'litrpg');
  state.turn = 7;
  state.log = [gm('g1', 5, BEAT_DOOR), gm('g2', 6, BEAT_OZONE)];
  return state;
}

describe('playtest30z — leading-sentence collage', () => {
  it('stamp is 2026-08-30Z / 30s and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30s').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-30Z').toBe(true);
  });

  it('30R whole-beat near-clone misses the Josie stitch (prefix + new tail)', () => {
    const fps = [beatFingerprint(BEAT_DOOR), beatFingerprint(BEAT_OZONE)];
    expect(isNearClone(COLLAGE, fps)).toBe(false);
    expect(maxBeatSimilarity(COLLAGE, fps)).toBeLessThan(0.85);
  });

  it('detects stitch of two prior beats and strips the recycled prefix', () => {
    const hit = detectLeadingCollage(COLLAGE, [BEAT_DOOR, BEAT_OZONE]);
    expect(hit.hit).toBe(true);
    expect(hit.kind).toBe('stitch');
    expect(hit.tailHasNewContent).toBe(true);
    expect(hit.sourceBeats.length).toBeGreaterThanOrEqual(2);
    const stripped = stripRecycledPrefix(COLLAGE, hit);
    expect(stripped).toMatch(/stern, weathered face/i);
    expect(stripped).not.toMatch(/heavy door groans/i);
    expect(stripped).not.toMatch(/tang of ozone/i);
  });

  it('applyGovernanceToProse strips Josie-like collage and keeps the new man', () => {
    const { prose, notes, rejectClone } = applyGovernanceToProse(
      stateWithPriorBeats(),
      COLLAGE,
      'I look around the room'
    );
    expect(rejectClone).toBeFalsy();
    expect(prose).toMatch(/man with a stern/i);
    expect(prose).not.toMatch(/heavy door groans/i);
    expect(prose).not.toMatch(/damp earth and the faint/i);
    expect(notes.some((n) => /collage strip/i.test(n))).toBe(true);
  });

  it('rejects a prefix-only collage with no new tail (retry path)', () => {
    const noTail = `${BEAT_DOOR.split('.')[0]}. ${BEAT_OZONE.split('A few scattered')[0].trim()}`;
    const { rejectClone, notes } = applyGovernanceToProse(
      stateWithPriorBeats(),
      noTail,
      'Examine the room'
    );
    expect(rejectClone).toBe(true);
    expect(notes.some((n) => /collage reject/i.test(n))).toBe(true);
    expect(shouldRetryUnaskedCollage(noTail, [BEAT_DOOR, BEAT_OZONE], 'Examine the room')).toBe(
      true
    );
  });

  it('allows collage when the player asked to repeat', () => {
    const { prose, rejectClone } = applyGovernanceToProse(
      stateWithPriorBeats(),
      COLLAGE,
      'Say that again'
    );
    expect(rejectClone).toBeFalsy();
    expect(prose).toMatch(/heavy door groans/i);
    expect(shouldRetryUnaskedCollage(COLLAGE, [BEAT_DOOR, BEAT_OZONE], 'Repeat what you said')).toBe(
      false
    );
  });

  it('ignores short shared phrases like “the door”', () => {
    const fresh =
      'You rest a palm on the door and listen. Water ticks somewhere ahead. Nobody answers.';
    const hit = detectLeadingCollage(fresh, [BEAT_DOOR, BEAT_OZONE]);
    expect(hit.hit).toBe(false);
    const { prose, rejectClone } = applyGovernanceToProse(
      stateWithPriorBeats(),
      fresh,
      'Listen at the door'
    );
    expect(rejectClone).toBeFalsy();
    expect(prose).toMatch(/palm on the door/i);
  });
});
