import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { stitchOpeningScene } from './openingStitch';

describe('playtest29f — hide/show chrome + stitch opener variety', () => {
  it('stamp is 2026-08-29 and Mid writer stays OFF', () => {
    expect(BUILD_STAMP).toMatch(/^2026-08-29/);
    expect(HUD_BUILD_STAMP).toMatch(/^2026-08-29/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('stitch does not stack a second name-ask on a hook that already asked', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const text = stitchOpeningScene({
      ...base,
      seed: '29f-name-once',
      campaignBibleId: 'summoned-pact',
      openingEstablishment: {
        pending: [
          {
            id: 'name',
            kind: 'name',
            question: 'They will not move until you give them something to write. What name?',
          },
        ],
        answers: {},
        complete: false,
        registrar: { voice: 'inworld', label: 'THE CIRCLE', startLine: 'Light.' },
        sceneWritten: false,
        mode: 'weave',
        pickedHookFallback:
          'Light, then three other people on neighboring rings. A mass summon. What name do they write?',
        aloneArrival: false,
      },
    });
    expect(text.match(/what name/gi)?.length).toBe(1);
  });
});
