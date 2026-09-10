/**
 * 2026-09-10f — Treaty tent: one-line lock was Silent + perpetual stitch.
 * Talk after covers must hit the writer. Receipt verbs stay Silent.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  coverContinuePads,
  hallTalkAsksWant,
  isOpeningHallTalkTurn,
  openingCastLabel,
  openingWantLine,
  shouldStitchOpeningContinue,
} from './openingEstablishment';
import {
  isSilentReceiptAction,
  shouldUseSilentMudTurn,
} from './freeMudPresentation';
import { stitchOpeningContinue } from './openingStitch';
import {
  assemblePacketStitch,
  buildCompletedEventPacket,
} from './completedEventPacket';
import type { GameState } from './types';

const useGame = readFileSync(resolve(__dirname, './useGame.ts'), 'utf8');

const TREATY_PAGE1 =
  'Canvas walls billow. You are on your back on a timber platform in a treaty tent beside the Cinderflow road. A blue panel hangs at chin height over maps and two seals on one table. Pellane plate on one side, Ash cloaks and iron censers on the other. Both already want your name on a banner. Two kits sit on opposite chests — offered, not equipped.';

const TREATY_HOOK = [
  'Location: a treaty tent on the Cinderflow road',
  'Who is here / who summoned: Pellane and Ash Court envoys using you as a living token',
  'Why this happened: They summoned a soul to sign a pause in the war. Both sides want you named as theirs.',
  'Opening offer (optional — player may refuse): Pick a banner and that side issues kit and a seat at the table. Pick neither and you keep Earth kit while both sides freeze.',
].join('\n');

function treaty(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    seed: 'treaty-tent-10f',
    currentLocation: 'a treaty tent on the Cinderflow road',
    character: { ...base.character, name: 'Unknown Survivor' },
    openingEstablishment: {
      pending: [
        {
          id: 'name',
          kind: 'name',
          question: 'They need a name before they will say what they want. What is yours?',
        },
      ],
      answers: { where: 'a treaty tent on the Cinderflow road' },
      complete: false,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook: TREATY_HOOK,
      pickedHookFallback: TREATY_PAGE1,
    },
    sceneFacts: { ...emptySceneFacts(1), present: ['bystanders'] },
    log: [
      {
        id: 't0',
        turn: 0,
        role: 'gm',
        content: TREATY_PAGE1,
        timestamp: 1,
      },
    ],
    ...over,
  };
}

function namedJax(over: Partial<GameState> = {}): GameState {
  const t = treaty();
  return treaty({
    turn: 3,
    character: { ...t.character, name: 'Jax' },
    openingEstablishment: {
      ...t.openingEstablishment!,
      answers: { ...t.openingEstablishment!.answers, name: 'Jax' },
      pending: [],
      complete: true,
    },
    ...over,
  });
}

describe('playtest10f — treaty tent one-line lock', () => {
  it('HUD/BUILD stay on the 10 line, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-10/);
    expect(BUILD_STAMP).toMatch(/^2026-09-10/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('useGame stitches hall talk locally; fail path does not touch contentSanitized', () => {
    expect(useGame).toContain('shouldStitchOpeningContinue');
    expect(useGame).toContain('shouldUseSilentMudTurn');
    expect(useGame).not.toMatch(/await callOpeningGm\(/);
    expect(useGame).not.toMatch(/keepSentLineOnFail\(contentSanitized/);
  });

  it('Ask what they want is hall talk for pads, but not a cover stitch after name lock', () => {
    expect(hallTalkAsksWant('Ask what they want')).toBe(true);
    expect(hallTalkAsksWant('Ask Wren Holt what they want')).toBe(false);
    expect(isOpeningHallTalkTurn(namedJax(), 'Ask what they want')).toBe(true);
    expect(shouldStitchOpeningContinue(namedJax(), 'Ask what they want')).toBe(true);
    expect(shouldStitchOpeningContinue(namedJax(), 'Where am whats going on')).toBe(true);
    expect(shouldStitchOpeningContinue(treaty(), 'My name is Jax')).toBe(true);
  });

  it('cover name+where+going-on answers the card, not a telegram only', () => {
    const text = stitchOpeningContinue(
      treaty({
        character: { ...treaty().character, name: 'Jax' },
        openingEstablishment: {
          ...treaty().openingEstablishment!,
          answers: { ...treaty().openingEstablishment!.answers, name: 'Jax' },
        },
      }),
      'My name is Jax where am.whats going on'
    );
    expect(text).toMatch(/Jax/);
    expect(text).toMatch(/treaty tent|Cinderflow/i);
    expect(text).toMatch(/pause in the war|named as theirs/i);
    expect(openingCastLabel(treaty())).toMatch(/envoys at this table/i);
    expect(openingWantLine(treaty())).toMatch(/pause in the war/i);
    expect(openingWantLine(treaty())).toMatch(/banner|seat at the table/i);
  });

  it('Who are you uses plural envoys, not “people who pulled you is”', () => {
    const text = stitchOpeningContinue(namedJax(), 'Who are you');
    expect(text).toMatch(/envoys at this table/i);
    expect(text).toMatch(/are the ones asking/i);
    expect(text).not.toMatch(/people who pulled you is/i);
  });

  it('talk after complete is not a Silent receipt; Look around still is', () => {
    expect(isSilentReceiptAction('Ask what they want')).toBe(false);
    expect(isSilentReceiptAction('Who are you')).toBe(false);
    expect(isSilentReceiptAction('Whats going on')).toBe(false);
    expect(isSilentReceiptAction('Look around')).toBe(true);
    expect(isSilentReceiptAction('Wait')).toBe(true);
    expect(
      shouldUseSilentMudTurn({
        subscriptionTier: 'free',
        openingComplete: true,
        playerInput: 'Ask what they want',
      })
    ).toBe(false);
    expect(
      shouldUseSilentMudTurn({
        subscriptionTier: 'free',
        openingComplete: true,
        playerInput: 'Look around',
      })
    ).toBe(true);
  });

  it('Silent fallback for Ask what they want is not “No one listed”', () => {
    const packet = buildCompletedEventPacket(namedJax(), 'Ask what they want');
    const stitch = assemblePacketStitch(packet);
    expect(stitch).toMatch(/pause in the war|named as theirs|banner/i);
    expect(stitch).not.toMatch(/No one listed on the ledger answered|Silence held the question/i);
  });

  it('after the want-ask, pads move on — no recycle, no hub travel', () => {
    const asked = namedJax({
      log: [
        ...treaty().log,
        { id: 'p', turn: 2, role: 'player', content: 'Ask what they want', timestamp: 2 },
      ],
    });
    expect(coverContinuePads(asked)).toEqual(['Who are you', 'Inspect the panel']);
    expect(coverContinuePads(asked).join(' ')).not.toMatch(/Lowmarket|Walk away|Press for leverage/i);
  });
});
