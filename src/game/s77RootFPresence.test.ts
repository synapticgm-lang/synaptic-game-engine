/**
 * s77 Root F (s76 Root 4) — presence has one writer. A hub beat's contact is present only when the
 * engine placed them; meetings are written by the social ledger from the people the beat showed;
 * the lifecycle timer stays in the engine.
 */
import { describe, expect, it, vi } from 'vitest';

const writer = vi.hoisted(() => ({ payloads: [] as string[], bound: [] as { turn: number; name: string }[] }));

vi.mock('./aiService', async (orig) => {
  const real = await orig<typeof import('./aiService')>();
  return {
    ...real,
    callGm: vi.fn(async (state: { turn?: number }, payload: string) => {
      writer.payloads.push(payload);
      const person = /^(t\d+)\s+\S+\s+person\s+"([^"]+)"/m.exec(payload);
      if (!person) {
        return { text: 'Jax kept walking under a flat grey sky, and the lane ahead stayed quiet and dry underfoot.', systemLog: [] };
      }
      writer.bound.push({ turn: (state.turn ?? 0) + 1, name: person[2]! });
      return {
        text: JSON.stringify({
          refs: [{ tok: person[1], use: 'actor' }],
          lines: [
            { fn: 'action', text: 'Jax stopped beside the nearest stall and looked over the goods laid out on the boards.' },
            { fn: 'react', text: `@${person[1]} glanced up from a crate of nails and kept counting them one by one.` },
          ],
        }),
        systemLog: [],
      };
    }),
  };
});

import { buildNewGameState, headlessFateTurn, stampOpening } from './fateAutoplay';
import { createDefaultSettings, createInitialState } from './defaults';
import { mulberry32 } from './fatePick';
import { resolveHubArrival } from './hubEncounters';
import { harvestNarrativeIntoLedger, harvestNarrativePeople } from './narrativeHarvest';
import { applySocialLedgerTurn } from './npcMemory';
import { emptySceneFacts } from './sceneFacts';
import { hubBeatContactIfPresent, openVignetteFromHubBeat } from './vignetteLock';
import type { LedgerRef, TokenUseRef } from './completedEventPacket';
import type { GameState, NpcMemory, Settings } from './types';

const FENCE = 'Lowmarket Fence';
const TIMER_TEXT = /deadline: T|turns remaining|Must leave this scene|Exit window/;

function pactAtInfirmary(): GameState {
  const { state: raw } = buildNewGameState({ bibleId: 'summoned-pact', characterName: 'Jax', seed: 77, personality: 'cold-system' });
  const state = stampOpening(raw);
  return {
    ...state,
    turn: 5,
    openingEstablishment: { ...state.openingEstablishment!, pending: [], complete: true, sceneWritten: true },
  } as GameState;
}

/** Prior Lowmarket visits so the next arrival rolls the lm-social beat (the s77 T21 beat). */
function withSocialBeatDue(state: GameState): GameState {
  for (let k = 0; k < 8; k++) {
    const keys = Array.from({ length: k }, (_, i) => `hub-beat:sp-hub-lowmarket:v${i}:t0`);
    const probe = { ...state, sandboxAwardKeys: [...(state.sandboxAwardKeys ?? []), ...keys] } as GameState;
    if (resolveHubArrival({ ...probe, currentLocation: 'Lowmarket' }, 'Lowmarket')?.beat.id === 'lm-social') return probe;
  }
  throw new Error('lm-social never rolls');
}

const recordOf = (s: GameState, name: string) =>
  (s.npcMemories ?? []).find((m) => m.npcName.toLowerCase() === name.toLowerCase());

describe('s77 Root F — presence has one writer', () => {
  it('arriving in Lowmarket with lm-social open leaves the fence off present, the vignette cast and the writer; bound people are met each turn', async () => {
    writer.payloads.length = 0;
    writer.bound.length = 0;
    const settings: Settings = { ...createDefaultSettings(), subscriptionTier: 'free', classicMemorableImages: false, visualMode: 'classic' };
    const meta = { bibleId: 'summoned-pact', personalityId: 'cold-system', seed: 77, mode: 'goal' as const, aiAgentMode: 'storyfollower' as const, dryRun: false };
    const rng = mulberry32(77);

    let state = withSocialBeatDue(pactAtInfirmary());
    const lines = ['Travel toward Lowmarket', 'Walk on', 'Walk on', 'Walk on', 'Walk on', 'Walk on'];
    let arrivedAt = -1;
    for (const line of lines) {
      state = (await headlessFateTurn(state, settings, rng, { ...meta, playerInputOverride: line } as never)).state;
      if (/lowmarket/i.test(state.currentLocation ?? '')) {
        arrivedAt = writer.payloads.length;
        break;
      }
    }
    expect(arrivedAt, 'never reached Lowmarket').toBeGreaterThan(0);
    expect(state.sandboxAwardKeys?.some((k) => k.startsWith('hub-beat:sp-hub-lowmarket:'))).toBe(true);

    expect(state.sceneFacts?.openVignette?.id).toBe('sp-hub-lowmarket:lm-social');
    expect(state.sceneFacts?.present ?? []).not.toContain(FENCE);
    expect(state.sceneFacts?.openVignette?.cast ?? []).not.toContain(FENCE);

    state = (await headlessFateTurn(state, settings, rng, { ...meta, playerInputOverride: 'Look around' } as never)).state;
    const afterArrival = writer.payloads.slice(arrivedAt);
    expect(afterArrival.length).toBeGreaterThan(0);
    for (const p of afterArrival) expect(p).not.toMatch(/"Lowmarket Fence"/);
    expect(state.sceneFacts?.present ?? []).not.toContain(FENCE);

    for (const p of writer.payloads) expect(p).not.toMatch(TIMER_TEXT);

    const lastBound = new Map<string, number>();
    for (const b of writer.bound) lastBound.set(b.name, b.turn);
    let checked = 0;
    for (const [name, turn] of lastBound) {
      const rec = recordOf(state, name);
      if (!rec) continue;
      checked++;
      expect(rec.met, `${name} met`).toBe(true);
      expect(rec.lastSeenTurn, `${name} lastSeenTurn`).toBe(turn);
    }
    expect(checked, `bound: ${JSON.stringify(writer.bound)}`).toBeGreaterThan(0);
  }, 60_000);

  it('a hub beat contact is cast only when the engine already has them here', () => {
    const open = (contact?: string) =>
      openVignetteFromHubBeat({
        hubId: 'sp-hub-lowmarket',
        hubName: 'Lowmarket',
        beatId: 'lm-social',
        kind: 'social',
        contactName: contact,
        pressure: 'A fence signals from a side stall — interested in otherworld scrap.',
        turn: 21,
      });
    expect(hubBeatContactIfPresent(['Osric Coyne', 'Maud Pike'], FENCE)).toBeUndefined();
    expect(open(hubBeatContactIfPresent(['Osric Coyne', 'Maud Pike'], FENCE))?.cast ?? []).not.toContain(FENCE);
    expect(hubBeatContactIfPresent(['lowmarket fence'], FENCE)).toBe(FENCE);
    expect(open(hubBeatContactIfPresent(['lowmarket fence'], FENCE))?.cast).toContain(FENCE);
  });

  it('meetings come from the writer refs handed straight to the turn, not from the packet copy, and lastSeenTurn moves each bound turn', () => {
    const base = createInitialState('The Summoned Pact', 'litrpg');
    const townsfolk = (id: string, name: string): NpcMemory => ({
      npcId: id,
      npcName: name,
      disposition: 'neutral',
      facts: [],
      lastSeenTurn: 4,
      met: false,
      location: 'The Cup',
    });
    const refEnum: LedgerRef[] = [
      { tok: 't1', id: 'here', display: 'The Cup', klass: 'place' },
      { tok: 't2', id: 'npc:bertil-pike', display: 'Bertil Pike', klass: 'person' },
      { tok: 't3', id: 'npc:cutha-coyne', display: 'Cutha Coyne', klass: 'person' },
    ];
    let state = {
      ...base,
      campaignBibleId: 'summoned-pact',
      turn: 4,
      currentLocation: 'The Cup',
      character: { ...base.character, name: 'Jax' },
      openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
      npcMemories: [townsfolk('bertil-pike', 'Bertil Pike'), townsfolk('cutha-coyne', 'Cutha Coyne')],
      sceneFacts: { ...emptySceneFacts(4), present: ['Bertil Pike', 'Cutha Coyne'] },
      completedEvent: { refEnum },
    } as unknown as GameState;

    const turnWith = (s: GameState, turn: number, refs: TokenUseRef[], prose: string) => {
      const h = harvestNarrativePeople(s, prose, turn, { refs, refEnum });
      return applySocialLedgerTurn({ state: { ...h.state, turn }, playerAction: 'Look around', turn, talkTopics: [], gmText: prose, metNames: h.people });
    };

    const t5Prose = 'Bertil Pike wiped the bar while Cutha Coyne stacked cups by the barrel.';
    expect(recordOf(harvestNarrativeIntoLedger(state, t5Prose, 5, { refs: [{ tok: 't2', id: '', use: 'actor' }], refEnum }), 'Bertil Pike')?.met).toBe(false);

    state = turnWith(state, 5, [{ tok: 't2', id: '', use: 'actor' }, { tok: 't3', id: '', use: 'actor' }], t5Prose);
    expect(recordOf(state, 'Bertil Pike')).toMatchObject({ met: true, lastSeenTurn: 5 });
    expect(recordOf(state, 'Cutha Coyne')).toMatchObject({ met: true, lastSeenTurn: 5 });

    state = turnWith(state, 6, [{ tok: 't2', id: '', use: 'actor' }], 'Bertil Pike set a cup down in front of Jax.');
    expect(recordOf(state, 'Bertil Pike')?.lastSeenTurn).toBe(6);
    expect(recordOf(state, 'Cutha Coyne')?.lastSeenTurn).toBe(5);
  });
});
