/**
 * Batch 14a — Token Prose. AI writes JSON; code paints ledger names.
 * Unparseable JSON uses 13c, never Dust-hung. Mid writer OFF. No SNAPSHOT/CRAFT.
 */
import { describe, expect, it, vi } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  buildCompletedEventPacket,
  tokenUseMatchesClass,
} from './completedEventPacket';
import {
  acceptTokenOrLedgerStory,
  classifyTokenLine,
  lineHasMidSentenceCapital,
  lineHasUnboundAnimate,
  parseTokenBeat,
  renderTokenBeat,
} from './tokenProse';
import {
  shouldStitchOpeningContinue,
  storyBeatWriterPath,
} from './openingEstablishment';
import { shouldUseSilentMudTurn } from './freeMudPresentation';
import { isDroughtStubProse } from './completedEventPacket';
import type { GameState } from './types';

const DROUGHT = /Whatever you tried had already happened|Dust hung at/i;
const SIGN_READ = 'sign the book read the page. outline what the page says';

const HOOK = [
  'Location: a Crown archive stack behind iron mesh',
  'Who is here / who summoned: Archivist Lene Quill and a silent Scale witness',
  'Why this happened: They tried to summon a forbidden name out of the stack. The name arrived wearing Earth clothes.',
  'Opening offer (optional — player may refuse): Read the one page they allow and they will issue a reader’s ribbon and a copied line.',
].join('\n');

const PAGE1 =
  'Dust and iron mesh. You are on the archive floor behind the stack, a circle of library-chalk around a pulled folio. A blue panel hangs over empty shelves. Archivist Lene Quill has one page turned face-down. A Scale witness does not speak. A reader’s ribbon lies on the folio — offered if you take the page, not if you grab the rest.';

function crown(over: Partial<GameState> = {}): GameState {
  const state = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...state,
    campaignBibleId: 'summoned-pact',
    seed: 'dp4yq4yh',
    turn: 2,
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
      pickedHookFallback: PAGE1,
    },
    sceneFacts: {
      ...emptySceneFacts(2),
      present: ['Archivist Lene Quill', 'a silent Scale witness'],
    },
    log: [
      {
        id: 'g0',
        turn: 0,
        role: 'gm',
        content: PAGE1,
        timestamp: 0,
      },
    ],
    ...over,
  };
}

describe('playtest14a — token prose', () => {
  it('HUD/BUILD are 14a, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('Look / sign-the-book / first Who still callGm after page 1 (17g)', () => {
    const state = crown();
    const callGm = vi.fn();
    for (const line of [SIGN_READ, 'Wait', 'Look around', 'Who are you'] as const) {
      expect(shouldStitchOpeningContinue(state, line)).toBe(false);
      expect(
        shouldUseSilentMudTurn({
          subscriptionTier: 'free',
          openingComplete: true,
          playerInput: line,
        })
      ).toBe(false);
      expect(storyBeatWriterPath(state, line)).toBe('callGm');
      callGm(line);
    }
    expect(callGm).toHaveBeenCalledTimes(4);
  });

  it('bind reject Lene-as-prop', () => {
    const state = crown();
    const packet = buildCompletedEventPacket(state, 'what is this readers ribbon?');
    const lene = packet.refEnum.find((r) => /Lene/i.test(r.display));
    expect(lene).toBeTruthy();
    expect(tokenUseMatchesClass('prop_used', lene!.klass)).toBe(false);
    const beat = parseTokenBeat(
      JSON.stringify({
        refs: [{ tok: lene!.tok, id: lene!.id, use: 'prop_used' }],
        lines: [{ fn: 'action', text: `@${lene!.tok} lay on the folio.` }],
      })
    );
    expect(beat).toBeTruthy();
    const verdict = classifyTokenLine(beat!.lines[0], beat!, packet.refEnum);
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toBe('use-class');
  });

  it('@t render uses ledger display — player never sees the token', () => {
    const state = crown();
    const packet = buildCompletedEventPacket(state, 'Who are you');
    const lene = packet.refEnum.find((r) => /Lene/i.test(r.display));
    const here = packet.refEnum.find((r) => r.id === 'here');
    expect(lene && here).toBeTruthy();
    const beat = parseTokenBeat(
      JSON.stringify({
        refs: [
          { tok: here!.tok, id: here!.id, use: 'place' },
          { tok: lene!.tok, id: lene!.id, use: 'speaker' },
        ],
        lines: [
          { fn: 'place', text: `dust hung in @${here!.tok}.` },
          { fn: 'speech', text: `@${lene!.tok} answered from the stack.`, speaker_tok: lene!.tok },
          { fn: 'action', text: `you kept to the page they allowed.` },
          { fn: 'react', text: `the ribbon still lay on the folio.` },
        ],
      })
    );
    expect(beat).toBeTruthy();
    const rendered = renderTokenBeat(beat!, packet.refEnum);
    expect(rendered).toMatch(/Archivist Lene Quill/);
    expect(rendered).not.toMatch(/@t\d+/);
    expect(rendered).toMatch(/Crown archive|iron mesh/i);
  });

  it('unbound “a chanter” fails that line', () => {
    expect(lineHasUnboundAnimate('a chanter stood by the mesh.')).toBe(true);
    const state = crown();
    const packet = buildCompletedEventPacket(state, SIGN_READ);
    const beat = parseTokenBeat(
      JSON.stringify({
        refs: [],
        lines: [{ fn: 'place', text: 'a chanter stood by the mesh.' }],
      })
    );
    expect(beat).toBeTruthy();
    expect(classifyTokenLine(beat!.lines[0], beat!, packet.refEnum).ok).toBe(false);
  });

  it('Orel Vane capital fails that line', () => {
    expect(lineHasMidSentenceCapital('the ribbon lay still. Orel Vane watched the folio.')).toBe(
      true
    );
    const state = crown();
    const packet = buildCompletedEventPacket(state, SIGN_READ);
    const beat = parseTokenBeat(
      JSON.stringify({
        refs: [],
        lines: [{ fn: 'react', text: 'the ribbon lay still. Orel Vane watched the folio.' }],
      })
    );
    expect(beat).toBeTruthy();
    expect(classifyTokenLine(beat!.lines[0], beat!, packet.refEnum).reason).toBe('capital');
  });

  it('unparseable JSON uses 13c, never Dust-hung', () => {
    const state = crown();
    const packet = buildCompletedEventPacket(state, SIGN_READ);
    const accepted = acceptTokenOrLedgerStory(
      '{ this is not token prose at all',
      state,
      packet
    );
    expect(accepted.path).toMatch(/13c|last-resort/);
    expect(accepted.prose).not.toMatch(DROUGHT);
    expect(isDroughtStubProse(accepted.prose)).toBe(false);
    expect(accepted.prose.length).toBeGreaterThan(40);
    expect(accepted.prose).not.toMatch(/@t\d+/);

    const invented = acceptTokenOrLedgerStory(
      'Archivist Lene Quill answered. High Chanter Orel Vane stood behind you, arms folded.',
      state,
      packet
    );
    expect(invented.path).toBe('13c');
    expect(invented.prose).not.toMatch(/Orel Vane/i);
    expect(invented.prose).not.toMatch(DROUGHT);
  });
});
