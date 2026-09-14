/**
 * Batch 13c — AI writes every beat after page 1; ledger owns the nouns.
 * Invented First Last is rewritten, not swapped for a 2-line bank.
 * Mid writer OFF. No SNAPSHOT/CRAFT.
 */
import { describe, expect, it, vi } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  buildCompletedEventPacket,
  formatWriterFacingEvent,
  isDroughtStubProse,
  lastResortStoryBody,
} from './completedEventPacket';
import { harvestNarrativeIntoLedger } from './narrativeHarvest';
import { acceptObeyedStoryBody, obeyLedgerNouns } from './ledgerNounObey';
import {
  shouldStitchOpeningContinue,
  storyBeatWriterPath,
} from './openingEstablishment';
import { shouldUseSilentMudTurn } from './freeMudPresentation';
import { formatTalkWriterFacing } from './talkEnvelope';
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

const T2_INVENT =
  'Archivist Lene Quill answered. She explained that the Archivist Lene is a permit, a mark of sanctioned access: one page, read and copied, nothing more. High Chanter Orel Vane stood behind you, arms folded, watching you with the patient stillness of a man who expects the worst. The ribbon still lay on the folio.';

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

const LINES = [SIGN_READ, 'Wait', 'Who are you', 'Look around'] as const;

describe('playtest13c — writer obeys the ledger', () => {
  it('HUD/BUILD are 13c, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(BUILD_STAMP).toMatch(/^2026-09-1/);
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('Who / Look / Wait / sign-the-book still callGm, never Silent or hall stitch', () => {
    const state = crown();
    const callGm = vi.fn();
    for (const line of LINES) {
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

  it('writer packet lists card CAST only — Lene, not Orel', () => {
    const packet = buildCompletedEventPacket(
      crown(),
      'what is this readers ribbon and copied line you offer?'
    );
    const facing = formatTalkWriterFacing(packet, crown());
    expect(facing).toMatch(/YOU MAY ONLY MENTION:/);
    expect(facing).toMatch(/Lene/);
    expect(facing).not.toMatch(/Orel Vane/);
    expect(formatWriterFacingEvent(packet)).not.toMatch(/do not invent/i);
    expect(packet.allowlist.some((n) => /Lene/i.test(n))).toBe(true);
    expect(packet.allowlist.some((n) => /Orel/i.test(n))).toBe(false);
  });

  it('High Chanter Orel Vane is stripped; Lene is not a permit; legal Lene stays', () => {
    const state = crown();
    const packet = buildCompletedEventPacket(
      state,
      'what is this readers ribbon and copied line you offer?'
    );
    const out = obeyLedgerNouns(T2_INVENT, state, packet);
    expect(out.prose).not.toMatch(/Orel Vane/i);
    expect(out.prose).not.toMatch(/High Chanter/i);
    expect(out.prose).not.toMatch(/Lene is a permit/i);
    expect(out.prose).toMatch(/ribbon|folio|Archivist|answered/i);
    expect(isDroughtStubProse(out.prose)).toBe(false);
    expect(out.prose).not.toMatch(DROUGHT);
    expect(out.prose.length).toBeGreaterThan(40);

    const legal = obeyLedgerNouns(
      'Archivist Lene Quill already told you the ribbon is one page, read and copied.',
      state,
      packet
    );
    expect(legal.prose).toMatch(/Archivist Lene Quill already told you/);
    expect(legal.prose).not.toMatch(/Orel/i);
  });

  it('Dust-hung bank is not the committed body', () => {
    const drought =
      'Dust hung at a Crown archive stack behind iron mesh. Whatever you tried had already happened.';
    const accepted = acceptObeyedStoryBody(
      drought,
      crown(),
      buildCompletedEventPacket(crown(), SIGN_READ)
    );
    expect(accepted.prose).not.toMatch(DROUGHT);
    expect(isDroughtStubProse(accepted.prose)).toBe(false);
    expect(accepted.prose).toMatch(/archive floor|Lene Quill|reader’s ribbon|iron mesh/i);
    const resort = lastResortStoryBody(crown(), buildCompletedEventPacket(crown(), SIGN_READ));
    expect(isDroughtStubProse(resort.prose)).toBe(false);
  });

  it('harvest does not persist Orel Vane from hall-talk T2', () => {
    const harvested = harvestNarrativeIntoLedger(crown(), T2_INVENT, 2);
    const present = harvested.sceneFacts?.present ?? [];
    expect(present.some((p) => /Orel/i.test(p))).toBe(false);
    expect(present.some((p) => /High Chanter/i.test(p))).toBe(false);
    expect(present.some((p) => /Lene/i.test(p))).toBe(true);
  });
});
