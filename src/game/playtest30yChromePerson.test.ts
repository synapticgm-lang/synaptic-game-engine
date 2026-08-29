/**
 * Site-wide: UI chrome / cover slots are not people.
 * Josie T5: "the blue panel, Place, remains at the threshold, his posture tense."
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyProseWarden, scrubChromeAsPerson } from './proseWarden';
import {
  applyCommittedNarrative,
  extractSceneFacts,
  seedOpeningSceneFacts,
} from './sceneFacts';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { extractNamesFromHookText } from './openingPin';
import { filterInventedContextChoices } from './choiceWarden';
import { formatSceneSnapshotForPrompt } from './situationPacket';
import { formatSceneArtLock } from './sceneArtLock';
import { isChromeTalkChoice } from './chromeAuthority';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import type { GameState } from './types';

const JOSIE_LEAK =
  'the blue panel, Place, remains at the threshold, his posture tense.';
const RAW_OFFICIAL =
  'The official, Place, remains at the threshold, his posture tense.';

function withPresent(present: string[]): GameState {
  const state = createInitialState(undefined, 'litrpg');
  return {
    ...state,
    openingEstablishment: {
      pending: [],
      answers: {},
      complete: false,
      aloneArrival: false,
    },
    sceneFacts: {
      crowd: 'present',
      noise: 'voices',
      present,
      props: ['blue panel'],
      lastBeat: 'A blue panel hangs.',
      updatedTurn: 1,
    },
  };
}

describe('playtest30y — chrome is not a person', () => {
  it('stamp is 2026-08-30Y / 30r and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-30r').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-30Y').toBe(true);
  });

  it('scrubs the exact Josie sentence (chrome + slot + his posture)', () => {
    const cleaned = applyProseWarden(JOSIE_LEAK, { presentNames: [] });
    expect(cleaned.toLowerCase()).not.toMatch(/blue panel,\s*place/i);
    expect(cleaned.toLowerCase()).not.toMatch(/his posture/i);
    expect(scrubChromeAsPerson(JOSIE_LEAK, [])).not.toMatch(/Place/);
  });

  it('scrubs the raw official, Place hop before the panel rewrite', () => {
    const cleaned = applyProseWarden(RAW_OFFICIAL, { presentNames: ['the Warden'] });
    expect(cleaned).not.toMatch(/Place/);
    expect(cleaned.toLowerCase()).not.toMatch(/the official,\s*place/i);
    expect(cleaned).toMatch(/Warden/i);
  });

  it('talk-to-Place pad drops when Place is only a cover slot', () => {
    const state = withPresent(['blue panel', 'Place']);
    expect(isChromeTalkChoice('Talk to Place')).toBe(true);
    expect(isChromeTalkChoice('Ask Place what this room is.')).toBe(true);
    expect(isChromeTalkChoice('Call out to Place, who is still at the threshold.')).toBe(true);
    expect(isChromeTalkChoice('Examine the blue panel.')).toBe(false);

    const kept = filterInventedContextChoices(
      [
        'Examine the room you have just entered.',
        'Talk to Place',
        'Ask Place what this room is.',
        'Call out to Place, who is still at the threshold.',
        'Examine the blue panel.',
      ],
      {
        ...state,
        log: [
          {
            id: 'g1',
            turn: 1,
            role: 'gm',
            content: 'Stone walls. A blue panel hangs. A man waits.',
            timestamp: 1,
          },
        ],
      }
    );
    expect(kept.join(' ')).not.toMatch(/\bPlace\b/);
    expect(kept.some((c) => /examine the blue panel/i.test(c))).toBe(true);
  });

  it('present[] does not include Place or blue panel after harvest / seed / commit', () => {
    const seeded = seedOpeningSceneFacts(withPresent([]));
    expect(seeded.present).not.toContain('blue panel');
    expect(seeded.present).not.toContain('Place');
    expect(seeded.props).toContain('blue panel');

    const extracted = extractSceneFacts(
      'A blue panel hangs at eye level. Place remains at the threshold, his posture tense.',
      undefined,
      1
    );
    expect(extracted.present).not.toContain('blue panel');
    expect(extracted.present).not.toContain('Place');
    expect(extracted.props).toContain('blue panel');

    const committed = applyCommittedNarrative(
      withPresent(['blue panel', 'Place']),
      'Dust. A blue panel hangs. The official, Place, remains at the threshold, his posture tense.',
      2
    );
    expect(committed.present).not.toContain('blue panel');
    expect(committed.present).not.toContain('Place');

    const harvested = harvestNarrativeIntoLedger(
      withPresent([]),
      'Place remains at the threshold. Mira says nothing.',
      3
    );
    expect(harvested.sceneFacts?.present ?? []).not.toContain('Place');
    expect(harvested.sceneFacts?.present.some((p) => /mira/i.test(p))).toBe(true);
  });

  it('hook Place: label is not pinned as an NPC name', () => {
    const names = extractNamesFromHookText(
      'Place: The Sevenfold Circle\nA blue panel hangs at eye level — private, yours.'
    );
    expect(names.map((n) => n.toLowerCase())).not.toContain('place');
    expect(names.join(' ')).not.toMatch(/blue panel/i);
  });

  it('scrubs blue panel states / their voice / has need; hum stays', () => {
    const hum =
      'Your words contrast with the steady hum of the blue System panel and the muffled bombardment.';
    expect(applyProseWarden(hum)).toMatch(/steady hum of the blue System panel/i);

    const leak =
      '"Pawn or not," blue panel states, their voice a low, even monotone that cuts through the tension, "you were summoned. the blue panel has need. the court grows bolder."';

    const unattributed = applyProseWarden(leak, { presentNames: [] });
    expect(unattributed.toLowerCase()).not.toMatch(/blue panel states/);
    expect(unattributed.toLowerCase()).not.toMatch(/their voice/);
    expect(unattributed.toLowerCase()).not.toMatch(/blue panel has need/);
    expect(unattributed).toMatch(/Pawn or not/);
    expect(unattributed).toMatch(/there is a need/i);

    const named = applyProseWarden(leak, { presentNames: ['Mira'] });
    expect(named).toMatch(/Mira says/i);
    expect(named.toLowerCase()).not.toMatch(/blue panel states/);

    const handlersOnly = applyProseWarden(leak, { presentNames: ['handlers', 'blue panel'] });
    expect(handlersOnly.toLowerCase()).not.toMatch(/blue panel states/);
    expect(handlersOnly).not.toMatch(/\bhandlers says/i);

    const withHandlersProse = applyProseWarden(
      `handlers in dark attire wait by the door. ${leak}`,
      { presentNames: ['handlers'] }
    );
    expect(withHandlersProse).toMatch(/the handler says/i);
    expect(withHandlersProse).not.toMatch(/\bhandlers says/i);
    expect(withHandlersProse.toLowerCase()).not.toMatch(/blue panel states/);
  });

  it('SNAPSHOT + art lock do not list chrome as presence', () => {
    const state = withPresent(['blue panel', 'Place', 'the Warden']);
    const snap = formatSceneSnapshotForPrompt(state);
    expect(snap).toMatch(/COVER CHROME \(BINDING\)/);
    expect(snap).not.toMatch(/Presence:.*\bPlace\b/);
    expect(snap).not.toMatch(/Presence:.*blue panel/);

    const art = formatSceneArtLock({
      storyText: 'You stand on cracked tiles. A blue panel hangs.',
      location: 'The Sevenfold Circle',
      sceneFacts: state.sceneFacts,
    });
    expect(art).not.toMatch(/PRESENCE:.*\bPlace\b/);
    expect(art).not.toMatch(/PRESENCE:.*blue panel/);
  });
});
