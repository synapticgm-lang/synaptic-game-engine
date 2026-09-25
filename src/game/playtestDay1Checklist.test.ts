/**
 * Day-1 checklist acceptance: noun-authority hard reject, Umbra offline, Free NarratorProvider stub.
 */
import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import { buildCompletedEventPacket } from './completedEventPacket';
import {
  acceptObeyedStoryBody,
  inventedPersonNamesNotOnAllowlist,
  nounAuthorityHardRejects,
  obeyLedgerNouns,
} from './ledgerNounObey';
import { isUmbraCampaign, umbraAllowsLiveAiTurn } from './umbraOffline';
import { isAuthoredPyoaBook } from './pyoaSpine';
import { createFreeNarratorProvider, resolveNarratorProvider } from './narratorProvider';
import { isFullProseNarration } from './fullProseGate';
import type { GameState } from './types';

const HOOK = [
  'Location: a Crown archive stack behind iron mesh',
  'Who is here / who summoned: Archivist Lene Quill and a silent Scale witness',
  'Why this happened: They tried to summon a forbidden name out of the stack.',
  'Opening offer: Read the one page they allow.',
].join('\n');

const PAGE1 =
  'Dust and iron mesh. You are on the archive floor. Archivist Lene Quill has one page turned face-down.';

const T2_INVENT =
  'Archivist Lene Quill answered. High Chanter Orel Vane stood behind you, arms folded, watching you.';

function crown(over: Partial<GameState> = {}): GameState {
  const state = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...state,
    campaignBibleId: 'summoned-pact',
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
    log: [{ id: 'g0', turn: 0, role: 'gm', content: PAGE1, timestamp: 0 }],
    ...over,
  };
}

describe('day-1 — noun-authority hard reject', () => {
  it('invented High Chanter Orel Vane is detected off-allowlist', () => {
    const state = crown();
    const packet = buildCompletedEventPacket(state, 'what is the ribbon?');
    const invented = inventedPersonNamesNotOnAllowlist(T2_INVENT, packet.allowlist);
    expect(invented.some((n) => /Orel/i.test(n))).toBe(true);
  });

  it('obey path rewrites invents and hard-rejects if invents remain', () => {
    const state = crown();
    const packet = buildCompletedEventPacket(state, 'what is the ribbon?');
    const out = obeyLedgerNouns(T2_INVENT, state, packet);
    expect(out.notes).toContain('invented-name');
    expect(out.prose).not.toMatch(/Orel Vane/i);
    // After rewrite, invents should be gone (rewrite path) — not silently passed.
    const leftover = inventedPersonNamesNotOnAllowlist(out.prose, packet.allowlist);
    expect(leftover.length).toBe(0);
  });

  it('nounAuthorityHardRejects fires for raw invented prose before accept', () => {
    const state = crown();
    const packet = buildCompletedEventPacket(state, 'what is the ribbon?');
    // Force a residual invent that rewrite cannot fully scrub: stick invent mid-clause without presence verb.
    const sticky =
      'You asked about the ribbon while High Chanter Orel Vane of the Outer Choir waited in the ledger.';
    const gate = nounAuthorityHardRejects(sticky, state, packet);
    expect(gate.reject || gate.notes.includes('invented-name') || gate.invented.length > 0).toBe(
      true
    );
    const accepted = acceptObeyedStoryBody(sticky, state, packet);
    expect(accepted.prose).not.toMatch(/Orel Vane/i);
    expect(
      accepted.notes.includes('invented-name')
        || accepted.notes.includes('noun-authority-hard-reject')
        || accepted.rejected === true
        || accepted.usedLastResort
    ).toBe(true);
  });
});

describe('day-1 — Umbra offline (zero live AI turns)', () => {
  it('umbra-protocol is authored book and disallows live AI turns', () => {
    expect(isAuthoredPyoaBook('umbra-protocol')).toBe(true);
    expect(isUmbraCampaign('umbra-protocol')).toBe(true);
    expect(umbraAllowsLiveAiTurn('umbra-protocol')).toBe(false);
    const state = createInitialState('The Umbra Protocol', 'pyoa');
    state.campaignBibleId = 'umbra-protocol';
    expect(umbraAllowsLiveAiTurn(state)).toBe(false);
  });

  it('callGm throws for Umbra instead of hitting gm-turn', async () => {
    const { callGm } = await import('./aiService');
    const state = createInitialState('The Umbra Protocol', 'pyoa');
    state.campaignBibleId = 'umbra-protocol';
    await expect(
      callGm(state, 'look around', { subscriptionTier: 'free' } as never, [])
    ).rejects.toThrow(/Umbra is offline/i);
  });
});

describe('day-1 — Free NarratorProvider stub', () => {
  it('resolveNarratorProvider exposes Free path interface', () => {
    const provider = resolveNarratorProvider('free');
    expect(provider.tier).toBe('free');
    expect(typeof provider.narrate).toBe('function');
    expect(createFreeNarratorProvider().tier).toBe('free');
  });

  it('full-prose gate rejects two-line stubs', () => {
    expect(isFullProseNarration('Dust hung.\nYou waited.')).toBe(false);
    expect(
      isFullProseNarration(
        'You stepped into the pale hall and let your eyes travel the cracked stone. Dust drifted in the half-light between fallen columns. Somewhere ahead, a ribbon of blue light waited on a turned folio. Your breath slowed as you asked what this place was called.'
      )
    ).toBe(true);
  });

  it('Free narrate refuses Umbra (offline book)', async () => {
    const provider = createFreeNarratorProvider();
    const state = createInitialState('The Umbra Protocol', 'pyoa');
    state.campaignBibleId = 'umbra-protocol';
    await expect(
      provider.narrate({
        state,
        playerInput: 'look',
        settings: { subscriptionTier: 'free' } as never,
      })
    ).rejects.toThrow(/Umbra is offline/i);
  });
});
