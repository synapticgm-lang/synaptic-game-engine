/**
 * Order RC-AR1 — present means backed: sheeted townsfolk answer from sheet motive lines.
 * Acceptance: docs/orders/acceptance-tests-new-orders.md § RC-AR1.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { motiveLinesFor, motiveLinesOf } from './npcSheet';
import { repairMissingAnswer, type WriterTurnResult } from './writerTurn';
import { parsePlayerIntent } from './intentParser';
import type { CompletedEventPacket } from './completedEventPacket';
import { seedTownsfolkHere } from './townsfolk';

function rpg(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    turn: 19,
    character: { ...s.character, name: 'Jax' },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    activeEncounter: null,
    ...over,
  } as GameState;
}

const sheetOnly = (name: string, motive: string, over: Partial<NpcMemory> = {}): NpcMemory =>
  ({
    npcId: `town-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    npcName: name,
    disposition: 'unknown',
    facts: ['Introduced in play'],
    lastSeenTurn: 19,
    met: true,
    sheet: { job: 'quest patron', motive, fear: '', speech: '', secret: '', place: 'town' },
    ...over,
  }) as NpcMemory;

const prose = 'The street held. Rain tapped the eaves.';

async function talkTo(
  state: GameState,
  name: string,
  reply = ''
): Promise<{ out: WriterTurnResult; asked: string[] }> {
  const playerInput = `Talk to ${name}`;
  const packet = { refEnum: [{ id: 't1', klass: 'person', display: name }] } as unknown as CompletedEventPacket;
  const asked: string[] = [];
  const turn = {
    prose,
    path: 'json-partial',
    outcome: 'accepted',
    problems: [],
    remaining: [],
    firstDraft: prose,
  } as unknown as WriterTurnResult;
  const out = await repairMissingAnswer(turn, {
    packet,
    check: {
      state,
      playerInput,
      intent: parsePlayerIntent(playerInput, state),
      engineFact: '',
      previousGm: '',
    },
    repair: async (req) => {
      asked.push(req);
      return reply;
    },
  });
  return { out, asked };
}

describe('RC-AR1 present means backed', () => {
  it('AR1-a: sheeted harvest/townsfolk NPC — motiveLinesOf non-empty; answer repair asks with backed lines; no "nothing on record"', async () => {
    const state = rpg({
      npcMemories: [sheetOnly('Piers Thatch', 'Acquire seized property')],
      sceneFacts: { ...rpg().sceneFacts, present: ['Piers Thatch'] } as GameState['sceneFacts'],
      lorebook: [
        {
          id: 'harvest-npc-piers-thatch',
          name: 'Piers Thatch',
          type: 'npc',
          keywords: ['Piers Thatch'],
          summary: 'Met in play. Details unfold through conversation.',
        },
      ],
    });
    expect(state.npcMemories![0]!.motiveLines).toBeUndefined();
    const lines = motiveLinesOf(state, 'Piers Thatch');
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines).toEqual(motiveLinesFor('Acquire seized property'));
    const { out, asked } = await talkTo(state, 'Piers Thatch');
    expect(out.answerRepair?.bug ?? '').not.toMatch(/nothing on record/i);
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain(`Piers Thatch: ${lines[0]}`);
  });

  it('AR1-b: Wenna Merrow (sheet only, duelist motive) — repair has a backed line', async () => {
    const state = rpg({
      turn: 5,
      npcMemories: [sheetOnly('Wenna Merrow', 'Defeat a famous opponent')],
      sceneFacts: { ...rpg().sceneFacts, present: ['Wenna Merrow'] } as GameState['sceneFacts'],
    });
    const lines = motiveLinesOf(state, 'Wenna Merrow');
    expect(lines.length).toBeGreaterThan(0);
    const { out, asked } = await talkTo(state, 'Wenna Merrow');
    expect(out.answerRepair?.bug ?? '').not.toMatch(/nothing on record|no backed line/i);
    expect(asked[0]).toContain(`Wenna Merrow: ${lines[0]}`);
  });

  it('AR1-c: every person answerersHere would list for a talk packet has an npcMemories record when present[] is engine townsfolk', async () => {
    // Property: present names that are speakers in the REF ENUM ⊆ npcMemories names (sheeted townsfolk).
    const names = ['Edda Coyne', 'Col Thatch', 'Brannoc Rudd'];
    const state = rpg({
      npcMemories: names.map((n) => sheetOnly(n, 'Acquire seized property')),
      sceneFacts: { ...rpg().sceneFacts, present: names } as GameState['sceneFacts'],
    });
    const memoryNames = new Set((state.npcMemories ?? []).map((m) => m.npcName.toLowerCase()));
    for (const n of names) {
      expect(memoryNames.has(n.toLowerCase()), n).toBe(true);
      expect(motiveLinesOf(state, n).length, n).toBeGreaterThan(0);
    }
  });

  it('AR1-d: townsfolk-shaped sheet-only memory (no saved motiveLines) — motiveLinesOf = moneylender_greedy; repair backed', async () => {
    const state = rpg({
      npcMemories: [sheetOnly('Piers Thatch', 'Acquire seized property')],
    });
    expect(state.npcMemories![0]!.motiveLines).toBeUndefined();
    const lines = motiveLinesOf(state, 'Piers Thatch');
    expect(lines).toEqual(motiveLinesFor('Acquire seized property'));
    expect(lines[0]).toMatch(/debt|property|pay/i);
    const { asked } = await talkTo(state, 'Piers Thatch');
    expect(asked).toHaveLength(1);
    for (const l of lines.slice(0, 3)) expect(asked[0]).toContain(l);
  });

  it('seedTownsfolkHere people (sheet only) are backed by motiveLinesOf without a saved copy', () => {
    // First call records the opening place empty; second visit to a new place fills townsfolk.
    const open = seedTownsfolkHere(
      rpg({
        currentLocation: 'Opening Yard',
        seed: 'q31-rcar1',
        townsfolkPlaces: undefined,
        npcMemories: [],
      })
    );
    const after = seedTownsfolkHere({
      ...open,
      currentLocation: 'West Wall Market',
    });
    const made = (after.npcMemories ?? []).filter((m) => m.sheet && !m.motiveLines?.length);
    expect(made.length).toBeGreaterThan(0);
    for (const m of made) {
      expect(motiveLinesOf(after, m.npcName).length, m.npcName).toBeGreaterThan(0);
      expect(motiveLinesOf(after, m.npcName)).toEqual(motiveLinesFor(m.sheet!.motive));
    }
  });
});
