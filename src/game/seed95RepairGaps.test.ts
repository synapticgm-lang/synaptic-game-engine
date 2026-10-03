/**
 * Seed 95 repair: the travel line names the destination the journey already holds, Check Status is a
 * ledger read with no panel the writer can act on, and the committed menu offers no talk chip for a
 * named person who is not at this place. No live GM or judge call.
 */
import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState } from './types';

vi.mock('./openingEstablishment', async (orig) => ({
  ...(await orig<typeof import('./openingEstablishment')>()),
  openingCastNames: () => [],
}));

const { buildCompletedEventPacket, formatWriterFacingEvent } = await import('./completedEventPacket');
const { dropAbsentListenerChips } = await import('./chipLegality');

function pact(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 's95',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Back streets',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [],
    npcMemories: [],
    companions: [],
    log: [],
    turn: 20,
    character: { ...s.character!, name: 'Jax' },
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
    sceneFacts: { ...s.sceneFacts!, crowd: 'none', present: [], crowdCount: 0, pendingEncounter: undefined, ...(over.sceneFacts ?? {}) },
  } as GameState;
}

const shapeLine = (text: string) => text.split('\n').find((l) => l.startsWith('{"refs":')) ?? '';

describe('seed 95 — the travel line names the journey destination', () => {
  const onTheWay = (movedTurn: number) =>
    pact({
      journey: {
        from: 'Back streets',
        to: 'West Wall',
        ground: 'Back streets',
        terrain: 'road',
        legsTotal: 2,
        legsDone: 1,
        hoursPerLeg: 1,
        startedTurn: 20,
        encounter: null,
      } as unknown as GameState['journey'],
      circling: { movedTurn } as GameState['circling'],
    });

  it('a leg committed this turn binds West Wall into the writer shape', () => {
    const packet = buildCompletedEventPacket(onTheWay(20), 'Travel toward West Wall');
    expect(packet.destinationRef?.display).toBe('West Wall');
    const shape = shapeLine(formatWriterFacingEvent(packet));
    expect(shape).toContain(`"id":"${packet.destinationRef!.id}"`);
    expect(shape).toContain(`@${packet.destinationRef!.tok}`);
  });

  it('a turn on the road with no move does not', () => {
    expect(buildCompletedEventPacket(onTheWay(19), 'Wait and watch').destinationRef).toBeUndefined();
  });
});

describe('seed 95 — Check Status is a ledger read, not a panel in the room', () => {
  const withPanel = () => pact({ sceneFacts: { props: ['blue panel'] } as GameState['sceneFacts'] });

  it('the writer gets no panel ref, no panel noun and no actor slot', () => {
    const packet = buildCompletedEventPacket(withPanel(), 'Check Status');
    expect(packet.ledgerRead).toBe(true);
    expect((packet.refEnum ?? []).some((r) => r.klass === 'window')).toBe(false);
    expect(packet.allowlist.map((n) => n.toLowerCase())).not.toContain('blue panel');
    const text = formatWriterFacingEvent(packet);
    expect(text).toContain('Jax read the System window.');
    expect(shapeLine(text)).not.toMatch(/"use":"actor"|@t2/);
  });

  it('an ordinary search still sees the window ref', () => {
    const packet = buildCompletedEventPacket(withPanel(), 'Search the area');
    expect(packet.ledgerRead).toBeFalsy();
    expect((packet.refEnum ?? []).some((r) => r.klass === 'window')).toBe(true);
  });
});

describe('seed 95 — no talk chip for a named person who is elsewhere', () => {
  const tam = (location: string) =>
    ({ npcId: 'npc-brother-tam', npcName: 'Brother Tam', location, introSpoken: true, present: true }) as unknown as NonNullable<GameState['npcMemories']>[number];

  it('Brother Tam at Cathedral Close is not offered in an empty lane', () => {
    const s = pact({
      currentLocation: 'Ashfall Lane',
      npcMemories: [tam('Cathedral Close')],
      log: [{ id: 'g1', turn: 39, role: 'gm', content: 'Nobody else was in the lane. Grit blew along the gutter.', timestamp: 0 }],
    });
    expect(dropAbsentListenerChips(s, ['Ask Brother Tam what they want', 'Look around'])).toEqual(['Look around']);
  });

  it('Brother Tam standing here keeps his chip', () => {
    const s = pact({
      currentLocation: 'Cathedral Close',
      npcMemories: [tam('Cathedral Close')],
      sceneFacts: { present: ['Brother Tam'] } as GameState['sceneFacts'],
      log: [{ id: 'g1', turn: 39, role: 'gm', content: 'Brother Tam waited by the close gate.', timestamp: 0 }],
    });
    expect(dropAbsentListenerChips(s, ['Ask Brother Tam what they want', 'Look around'])).toEqual([
      'Ask Brother Tam what they want',
      'Look around',
    ]);
  });
});
