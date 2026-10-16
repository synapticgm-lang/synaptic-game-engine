/**
 * q31-P2 — repeated-habit masks handed REF ENUM labels (group / meeting / prop), not a handmade name list.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { checkPlayCrimes } from './turnCheck';
import { compileRefEnum, handedRefs, type CompletedEventPacket } from './completedEventPacket';
import { emptySceneFacts } from './sceneFacts';

const LABEL = 'the two drowned rite novices';

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn: 5,
    currentLocation: 'Collapsed cistern',
    character: { ...(s.character ?? {}), name: 'Jax' } as GameState['character'],
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
    activeEncounter: null,
    sceneFacts: { ...emptySceneFacts(), present: [LABEL], props: ['the iron grate'] },
    npcMemories: [
      {
        npcId: 'novices',
        npcName: LABEL,
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 1,
        location: 'Collapsed cistern',
        introSpoken: true,
      },
    ],
    ...over,
  } as GameState;
}

const gm = (content: string) =>
  ({ id: `g${content.length}`, role: 'gm', content, timestamp: 0 }) as GameState['log'][number];

describe('q31-P2 handedRefs', () => {
  it('handedRefs lists REF ENUM displays and note labels', () => {
    const s = base();
    const refs = compileRefEnum(s);
    const masks = handedRefs(s);
    expect(refs.some((r) => r.display === LABEL)).toBe(true);
    expect(masks).toContain(LABEL);
    expect(masks.some((m) => /iron grate/i.test(m))).toBe(true);
  });

  it('a handed group label named in two beats is not a repeated-habit', () => {
    const s = base({
      log: [gm(`You saw ${LABEL} at the stair ahead.`)],
    });
    const { down } = checkPlayCrimes(
      s,
      s,
      'Look around',
      `Still ${LABEL} at the stair ahead stood watch.`,
    );
    expect(down.filter((f) => f.kind === 'repeated-habit')).toEqual([]);
  });

  it('an unhanded description run still flags as repeated-habit', () => {
    const s = base({
      sceneFacts: { ...emptySceneFacts(), present: [], props: [] },
      npcMemories: [],
      log: [gm('Cold mist curled around broken headstones near the gate.')],
    });
    const { down } = checkPlayCrimes(
      s,
      s,
      'Look around',
      'Again the cold mist curled around broken headstones by the wall.',
    );
    expect(down.filter((f) => f.kind === 'repeated-habit')).toHaveLength(1);
  });

  it('handedRefs masks REF ENUM note labels (same rule factCheck handedPeople uses)', () => {
    const s = base();
    const packet = {
      refEnum: [
        { tok: 't1', id: 'road:cutha', display: 'Cutha Cotter', klass: 'meeting', note: 'a hurt traveler; met on the road' },
        { tok: 't2', id: 'cast:piers', display: 'Piers Dunmore', klass: 'person', note: 'a man in a stained apron' },
      ],
    } as CompletedEventPacket;
    const masks = handedRefs(s, packet);
    expect(masks).toContain('Cutha Cotter');
    expect(masks).toContain('a hurt traveler');
    expect(masks).toContain('Piers Dunmore');
    expect(masks).toContain('a man in a stained apron');
  });
});
