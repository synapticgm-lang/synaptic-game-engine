/**
 * s77 Root E — scene scale, mood and noise come from the committed place and the engine,
 * not from a stale camera lock or prose words.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyCommittedNarrative, emptySceneFacts } from './sceneFacts';
import { applyPresentTrimOnTravel } from './presentAuthority';
import { buildCompletedEventPacket, formatWriterFacingEvent } from './completedEventPacket';
import { formatInfoSheet } from './infoSheet';
import { placeScale } from './placeAuthority';
import type { ActiveEncounter, GameState } from './types';

const ROAD = 'On the road between places';

function pact(over: Partial<GameState> = {}): GameState {
  const base = createInitialState('The Summoned Pact', 'litrpg');
  return {
    ...base,
    campaignBibleId: 'summoned-pact',
    turn: 20,
    character: { ...base.character, name: 'Jax' },
    openingEstablishment: {
      pending: [],
      answers: { where: 'Lowmarket', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
    },
    ...over,
  };
}

const roadLock = { scale: 'outdoor' as const, label: ROAD, lockedTurn: 14 };

const bandit: ActiveEncounter = {
  name: 'Road Bandit',
  level: 1,
  hp: 6,
  maxHp: 6,
  armorClass: 12,
  strength: 12,
  dexterity: 12,
  constitution: 12,
  xpReward: 25,
  goldReward: 3,
};

describe('s77 Root E — camera lock follows the committed place', () => {
  it('road, then "Walk on" into Lowmarket: the lock is Lowmarket and the road lock is gone', () => {
    const state = pact({
      currentLocation: 'Lowmarket',
      sceneFacts: { ...emptySceneFacts(19), cameraLock: roadLock },
    });
    const facts = applyCommittedNarrative(state, 'Jax walked on until the stalls of Lowmarket closed around him.', 21, 'Walk on');
    expect(facts.cameraLock?.label).toBe('Lowmarket');
    expect(facts.cameraLock?.scale).toBe('outdoor');
    expect(JSON.stringify(facts.cameraLock)).not.toContain(ROAD);
    const sheet = formatInfoSheet({ ...state, sceneFacts: facts });
    expect(sheet).toContain('Lowmarket · outdoor');
  });

  it('"Turn back toward Lowmarket" with no player line passed (the harness commit) still rewrites the lock', () => {
    const state = pact({
      currentLocation: 'Lowmarket',
      sceneFacts: { ...emptySceneFacts(19), cameraLock: roadLock },
    });
    const facts = applyCommittedNarrative(state, 'Jax turned back and the market noise met him again.', 21);
    expect(facts.cameraLock?.label).toBe('Lowmarket');
  });

  it('The Weighing Cup reads indoor from its hub record, with no prose word and a road lock behind it', () => {
    const state = pact({
      currentLocation: 'The Weighing Cup',
      sceneFacts: { ...emptySceneFacts(19), cameraLock: roadLock },
    });
    expect(placeScale(state)).toBe('indoor');
    const facts = applyCommittedNarrative(state, 'Jax pushed the door and stood out of the rain under the open sky of the street.', 21);
    expect(facts.cameraLock?.scale).toBe('indoor');
    expect(facts.indoor).toBe(true);
    expect(formatInfoSheet({ ...state, sceneFacts: facts })).toContain('The Weighing Cup · indoor');
  });

  it('a trip HERE reads outdoor from the journey', () => {
    expect(placeScale(pact({ currentLocation: ROAD }))).toBe('outdoor');
  });
});

describe('s77 Root E — mood is the engine, not fight words', () => {
  it('combat while an encounter is live; fight words without one do not set it', () => {
    const live = pact({ currentLocation: 'Cinderflow Road', activeEncounter: bandit, sceneFacts: emptySceneFacts(19) });
    expect(applyCommittedNarrative(live, 'The bandit stepped out of the ditch.', 20).tension).toBe('combat');
    const none = pact({ currentLocation: 'Lowmarket', sceneFacts: emptySceneFacts(19) });
    expect(applyCommittedNarrative(none, 'A juggler pretended to attack a stall with a fighting stick.', 20).tension).not.toBe('combat');
  });

  it('after a victory and a move, the packet mood is not combat', () => {
    const won = pact({
      currentLocation: 'Cinderflow Road',
      activeEncounter: null,
      sceneFacts: { ...emptySceneFacts(18), tension: 'combat' },
    });
    const settled = { ...won, sceneFacts: applyCommittedNarrative(won, 'The bandit lay still in the ditch.', 19) };
    expect(settled.sceneFacts.tension).not.toBe('combat');
    const moved = applyPresentTrimOnTravel(
      { ...settled, sceneFacts: { ...settled.sceneFacts, tension: 'combat' }, currentLocation: 'Lowmarket' },
      'Cinderflow Road',
      'Lowmarket'
    );
    expect(moved.sceneFacts?.tension).not.toBe('combat');
    const packet = formatWriterFacingEvent(buildCompletedEventPacket(moved, 'Look around'));
    expect(packet).not.toMatch(/Mood: combat/);
  });
});

describe('s77 Root E — noise resets on a move, prose never writes it', () => {
  it('after leaving the infirmary, lastBeat does not say people are shouting', () => {
    const infirmary = pact({
      currentLocation: 'Ward Infirmary',
      sceneFacts: { ...emptySceneFacts(10), noise: 'shouting', crowd: 'present', lastBeat: 'people are present; people are shouting; indoors' },
    });
    const moved = applyPresentTrimOnTravel({ ...infirmary, currentLocation: 'Lowmarket' }, 'Ward Infirmary', 'Lowmarket');
    expect(moved.sceneFacts?.noise).toBe('unknown');
    expect(moved.sceneFacts?.lastBeat ?? '').not.toContain('people are shouting');
    const facts = applyCommittedNarrative(moved, 'Somewhere behind the stalls a peddler was yelling about prices.', 12);
    expect(facts.noise).not.toBe('shouting');
    expect(facts.lastBeat).not.toContain('people are shouting');
  });
});
