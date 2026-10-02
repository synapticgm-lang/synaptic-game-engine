/**
 * 29z9j — Summoned Pact seed 72 T50: the data the writer is handed, fixed at its owner.
 * Said motives stay on the person, HERE is the committed place, a short turn-back is the same scene,
 * the panel shows ledger lines, objects stay with their place. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { buildCompletedEventPacket, formatWriterFacingEvent, movementFact } from './completedEventPacket';
import { formatInfoSheet } from './infoSheet';
import { playerFacingLocation } from './locationName';
import { applySocialLedgerTurn } from './npcMemory';
import { hallTalkTopics } from './openingEstablishment';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { recordCirclingTurn } from './choiceRanking';
import type { GameState, LogEntry, NpcMemory } from './types';

let id = 0;
const entry = (turn: number, role: LogEntry['role'], content: string): LogEntry =>
  ({ id: `e${id++}`, turn, role, content, timestamp: turn }) as LogEntry;

function base(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    seed: 'seed72',
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    currentLocation: 'Cathedral Close',
    worldAtlas: null,
    activeEncounter: null,
    activeDungeon: null,
    journey: null,
    quests: [],
    places: [
      { id: 'cathedral-close', name: 'Cathedral Close' },
      { id: 'back-streets', name: 'Back streets' },
    ],
    npcMemories: [],
    companions: [],
    log: [],
    turn: 11,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    ...over,
    sceneFacts: { ...s.sceneFacts!, crowd: 'present', present: [], ...(over.sceneFacts ?? {}) },
  } as GameState;
}

const person = (name: string): NpcMemory =>
  ({
    npcId: name.toLowerCase().replace(/\s+/g, '-'),
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 11,
    met: true,
    introSpoken: true,
    location: 'Cathedral Close',
  }) as NpcMemory;

const T11 =
  'Jax planted their feet on the flagstones of Cathedral Close. Nell Rudd unfolded her arms and spoke first, saying the cathedral owed her people bread and the church had stopped paying it. Col Thatch tapped the rim of his pot and said the seventh ring was taken from his keeping, and he wanted it back.';

describe('29z9j seed 72 — said motives stay on the person', () => {
  it('a want answered at T11 is on the sheet the writer reads after a pace-away and return', () => {
    const asked = 'Hear their reason (or demand it)';
    expect(hallTalkTopics(asked)).toContain('want');
    const t11 = applySocialLedgerTurn({
      state: base({
        npcMemories: [person('Nell Rudd'), person('Col Thatch')],
        sceneFacts: { present: ['Nell Rudd', 'Col Thatch'] } as GameState['sceneFacts'],
      }),
      playerAction: asked,
      turn: 11,
      talkTopics: hallTalkTopics(asked),
      gmText: T11,
    });
    const nell = t11.npcMemories!.find((m) => m.npcName === 'Nell Rudd')!;
    expect(nell.said?.[0]).toMatchObject({ topic: 'want', turn: 11 });
    expect(nell.completedTopics).toContain('want');

    const back = { ...t11, turn: 33, log: [entry(32, 'player', 'Walk on'), entry(32, 'gm', 'Jax came back up the lane.')] };
    const sheet = formatInfoSheet(back);
    expect(sheet).toMatch(/Nell Rudd.*already said \(want, T11\).*owed her people bread/);
    expect(sheet).toMatch(/Col Thatch.*seventh ring/);
    const writer = formatWriterFacingEvent(buildCompletedEventPacket(back, 'Ask Nell Rudd what they want'));
    expect(writer).toContain('owed her people bread');
  });

  it('a non-talk line records nothing', () => {
    const s = applySocialLedgerTurn({
      state: base({ npcMemories: [person('Nell Rudd')], sceneFacts: { present: ['Nell Rudd'] } as GameState['sceneFacts'] }),
      playerAction: 'Search the area',
      turn: 11,
      talkTopics: hallTalkTopics('Search the area'),
      gmText: T11,
    });
    expect(s.npcMemories![0]!.said).toBeUndefined();
  });
});

describe('29z9j seed 72 — HERE is the committed place', () => {
  it('a bible place card the player just walked into is the place name, not "your surroundings"', () => {
    const lore = (type: 'location' | 'lore', name: string) =>
      ({ id: name, name, type, keywords: [], summary: '', lastSeenTurn: 0 });
    expect(playerFacingLocation(base({ currentLocation: 'Cathedral Undercroft', lorebook: [lore('location', 'Cathedral Undercroft')] })))
      .toBe('Cathedral Undercroft');
    expect(playerFacingLocation(base({ currentLocation: 'Dead Zones', lorebook: [lore('lore', 'Dead Zones')] })))
      .toBe('your surroundings');
  });
});

describe('29z9j seed 72 — a short turn-back is the same scene', () => {
  it('Close → Back streets → Close within two turns is a return, not a new arrival', () => {
    let s = base({ turn: 44 });
    s = recordCirclingTurn(s, 'Hear their reason', [], s);
    const atClose = s;
    s = recordCirclingTurn({ ...s, turn: 45, currentLocation: 'Back streets' }, 'Walk away', [], atClose);
    const onStreet = s;
    s = recordCirclingTurn({ ...s, turn: 46, currentLocation: 'Cathedral Close' }, 'Turn back toward Cathedral Close', [], onStreet);
    expect(s.circling?.shortReturnTurn).toBe(46);
    expect(movementFact(s, 'Turn back toward Cathedral Close')).toMatch(/^Turned back this turn: from Back streets back to Cathedral Close/);
  });

  it('a first arrival still narrates one arrival', () => {
    let s = base({ turn: 44, currentLocation: 'Back streets' });
    s = recordCirclingTurn(s, 'Look around', [], s);
    const prev = s;
    s = recordCirclingTurn({ ...s, turn: 45, currentLocation: 'Cathedral Close' }, 'Travel toward Cathedral Close', [], prev);
    expect(s.circling?.shortReturnTurn).toBeUndefined();
    expect(movementFact(s, 'Travel toward Cathedral Close')).toMatch(/Narrate one arrival at Cathedral Close/);
  });
});

describe('29z9j seed 72 — the panel shows ledger lines', () => {
  it('Check Status hands the writer what the panel reads', () => {
    const s = base({ character: { ...base().character!, name: 'Jax' } });
    const writer = formatWriterFacingEvent(buildCompletedEventPacket(s, 'Check Status'));
    expect(writer).toMatch(/PANEL \(game chrome[^)]*\): The panel read: Name: Jax; Level/);
    expect(formatWriterFacingEvent(buildCompletedEventPacket(s, 'Look around'))).not.toContain('PANEL (');
  });
});

describe('29z9j seed 72 — objects stay with their place', () => {
  it('the close crate stays at the close; the panel goes with the player; repeat calls are safe', () => {
    const atClose = base({ sceneFacts: { props: ['crate', 'stalls', 'blue panel'] } as GameState['sceneFacts'] });
    let s = applyPresentTrimOnTravel(atClose, 'Cathedral Close', 'Back streets');
    expect(s.sceneFacts?.props).toEqual(['blue panel']);
    expect(s.places?.find((p) => p.name === 'Cathedral Close')?.props).toEqual(['crate', 'stalls']);
    s = { ...s, sceneFacts: { ...s.sceneFacts!, props: [...s.sceneFacts!.props, 'loose nail'] } };
    s = applyPresentTrimOnTravel(s, 'Cathedral Close', 'Back streets');
    expect(s.sceneFacts?.props).toEqual(['blue panel', 'loose nail']);
    expect(s.places?.find((p) => p.name === 'Cathedral Close')?.props).toEqual(['crate', 'stalls']);
    s = applyPresentTrimOnTravel(s, 'Back streets', 'Cathedral Close');
    expect(s.sceneFacts?.props).toEqual(['blue panel', 'crate', 'stalls']);
    expect(s.places?.find((p) => p.name === 'Back streets')?.props).toEqual(['loose nail']);
  });
});
