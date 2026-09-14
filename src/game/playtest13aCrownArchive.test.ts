/**
 * Batch 13a — Crown archive: prose face, play-session thumbs, retire drought stubs.
 * Sign/read/outline the page is a card act, not Look/Wait Silent settle.
 * Mid writer OFF. No SNAPSHOT/CRAFT.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { shopItemById } from './cosmeticCatalog';
import { PLAY_PROSE_FONT_STACK, readablePlayStoryStack } from './uiTheme';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  assemblePacketStitch,
  buildCompletedEventPacket,
  classifyVerb,
  isDroughtStubProse,
} from './completedEventPacket';
import {
  isOpeningCardActLine,
  openingCardActLine,
  openingCastLabel,
  shouldStitchOpeningContinue,
} from './openingEstablishment';
import { stitchOpeningContinue } from './openingStitch';
import { isSilentReceiptAction, shouldUseSilentMudTurn } from './freeMudPresentation';
import type { GameState } from './types';

const DROUGHT = /Whatever you tried had already happened|Dust hung at landing/i;
const SIGN_READ = 'sign the book read the page. outline what the page says';

const HOOK = [
  'Location: a Crown archive stack behind iron mesh',
  'Who is here / who summoned: Archivist Lene Quill and a silent Scale witness',
  'Why this happened: They tried to summon a forbidden name out of the stack. The name arrived wearing Earth clothes.',
  'Opening offer (optional — player may refuse): Read the one page they allow and they will issue a reader’s ribbon and a copied line. Refuse the page and you keep Earth kit — Lene will lock the mesh.',
].join('\n');

function crown(over: Partial<GameState> = {}): GameState {
  const state = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...state,
    campaignBibleId: 'summoned-pact',
    seed: 'dp4yq4yh',
    turn: 7,
    currentLocation: 'a Crown archive stack behind iron mesh',
    character: { ...state.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'a Crown archive stack behind iron mesh', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook: HOOK,
      pickedHookFallback:
        'Dust and iron mesh. You are on the archive floor behind the stack, a circle of library-chalk around a pulled folio. A blue panel hangs over empty shelves. Archivist Lene Quill has one page turned face-down. A Scale witness does not speak. A reader’s ribbon lies on the folio — offered if you take the page, not if you grab the rest.',
    },
    sceneFacts: {
      ...emptySceneFacts(7),
      present: ['Archivist Lene Quill', 'a silent Scale witness'],
    },
    ...over,
  };
}

describe('playtest13a — Crown archive', () => {
  it('HUD/BUILD are 13a+, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('Ashrise play story is Libre Baskerville; display faces are stripped from story stacks', () => {
    const theme = shopItemById('theme.phoenix-ashrise');
    expect(theme?.preview?.fontStory).toMatch(/Libre Baskerville|Georgia/i);
    expect(readablePlayStoryStack(theme?.preview?.fontStory)).toMatch(/Libre Baskerville|Georgia/i);
    expect(readablePlayStoryStack('"Playfair Display", Georgia, serif')).toBe(PLAY_PROSE_FONT_STACK);
    expect(readablePlayStoryStack('"Cinzel Decorative", Cinzel, Georgia, serif')).toBe(PLAY_PROSE_FONT_STACK);
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
    expect(css).toMatch(/\.sgm-prose-face/);
    expect(css).toMatch(/html\[data-sgm-theme='phoenix-ashrise'\] \.sgm-play-story-panel/);
    const ashBlock = css.slice(css.indexOf("html[data-sgm-theme='phoenix-ashrise'] .sgm-play-story-panel"));
    expect(ashBlock).toMatch(/Libre Baskerville/);
    expect(ashBlock.slice(0, 400)).not.toMatch(/Playfair Display|Cinzel Decorative/);
  });

  it('sign / read / outline the page is a spoken card act, not Silent settle', () => {
    expect(isOpeningCardActLine(SIGN_READ)).toBe(true);
    expect(classifyVerb(SIGN_READ)).toBe('spoke');
    expect(isSilentReceiptAction(SIGN_READ)).toBe(false);
    expect(shouldUseSilentMudTurn({
      subscriptionTier: 'free',
      openingComplete: true,
      playerInput: SIGN_READ,
    })).toBe(false);
    expect(shouldStitchOpeningContinue(crown(), SIGN_READ)).toBe(false);

    const spoken = openingCardActLine(crown(), SIGN_READ);
    expect(spoken).toMatch(/Lene Quill/i);
    expect(spoken).toMatch(/page|ribbon|copied line/i);
    expect(spoken.split(/[.!?]/).filter((s) => s.trim()).length).toBeGreaterThanOrEqual(2);
    expect(spoken).not.toMatch(DROUGHT);
    expect(isDroughtStubProse(spoken)).toBe(false);

    const stitch = stitchOpeningContinue(crown(), SIGN_READ);
    expect(stitch).toMatch(/Lene Quill/i);
    expect(stitch).toMatch(/page|ribbon|copied line/i);
    expect(stitch).not.toMatch(DROUGHT);
    expect(stitch).not.toMatch(/still has the book\. They have not said more than that/i);

    const packet = buildCompletedEventPacket(crown(), SIGN_READ);
    expect(packet.verb).toBe('spoke');
    const body = assemblePacketStitch(packet);
    expect(body).not.toMatch(DROUGHT);
    expect(body).toMatch(/page|ribbon|Lene/i);
    expect(isDroughtStubProse(body)).toBe(false);
  });

  it('retired drought stub cannot be the story body; CAST is Lene not the full faction telegram', () => {
    expect(isDroughtStubProse('Dust hung at a Crown archive stack behind iron mesh. Whatever you tried had already happened.')).toBe(true);
    const wait = assemblePacketStitch(buildCompletedEventPacket(crown(), 'Wait and watch'));
    expect(wait).not.toMatch(DROUGHT);
    expect(openingCastLabel(crown())).toBe('Archivist Lene Quill');
    const told = stitchOpeningContinue(
      {
        ...crown(),
        log: [
          {
            id: 'g',
            turn: 6,
            role: 'gm',
            content:
              'Archivist Lene Quill already said it. "They tried to summon a forbidden name out of the stack. The name arrived wearing Earth clothes. Read the one page they allow and they will issue a reader’s ribbon and a copied line."',
            timestamp: 6,
          },
        ],
      },
      SIGN_READ,
    );
    expect(told).toMatch(/ /);
    expect(told).toMatch(/Lene Quill/i);
    expect(told).not.toMatch(/Archivist Lene Quill and a silent Scale witness already said it/i);
    expect(told).not.toMatch(DROUGHT);
  });

  it('feedback uses the play session JWT and a clear signed-out line', () => {
    const src = readFileSync(resolve(__dirname, '../services/gmFeedbackService.ts'), 'utf8');
    expect(src).toContain('getSession');
    expect(src).toContain('Sign in on the home screen to leave thumbs');
    expect(src).not.toContain('You must be signed in to submit feedback.');
    const ui = readFileSync(resolve(__dirname, '../components/GmResponseFeedback.tsx'), 'utf8');
    expect(ui).toContain('data-sgm-feedback');
  });
});
