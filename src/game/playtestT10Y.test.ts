/**
 * T10Y — salt-road-heist s8403: no crew-of-crew / doubled Jax said; present crew answers asks;
 * place labels drop plan tails; warehouse dungeons stay timber (no Coolant Trench); travel names
 * the room; addressee-less physical acts are not "nobody answers" checker fails.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { peopleHere } from './chipLegality';
import { compileOpeningCard, openingCastNames } from './openingEstablishment';
import { dropPlanClause, openingPlaceRecord, shortPlaceName } from './placeNames';
import { previewDungeonCard } from './dungeonCard';
import { ensureSpokenAnswer } from './spokenAnswer';
import { convertWriterCueFact } from './writerCueLines';
import { normalizeCommittedProse, withMoveDestination, type DraftCheck } from './writerTurn';
import { checkActionFollowed } from './turnCheck';
import { emptySceneFacts } from './sceneFacts';

function loft(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg', undefined, 't10y-8403') as GameState;
  s.engineMode = 'rpg';
  s.campaignBibleId = 'salt-road-heist';
  s.character = { ...s.character, name: 'Jax' };
  s.currentLocation = 'a warehouse loft';
  s.turn = 2;
  s.openingEstablishment = {
    pending: [],
    answers: { name: 'Jax' },
    complete: true,
    sceneWritten: true,
    aloneArrival: false,
    pickedHook:
      'Location: a warehouse loft\nWho is here: the crew\nWhy: First move is yours — the plan, the cut, or the walk.\n',
    card: {
      place: 'a warehouse loft',
      cast: 'the crew',
      castNames: ['the crew'],
      props: ['stolen map', 'crate'],
      names: [],
    },
  };
  s.sceneFacts = {
    ...emptySceneFacts(),
    crowd: 'present',
    noise: 'quiet',
    present: ['the crew'],
    props: ['crate'],
    lastBeat: 'loft',
    updatedTurn: 2,
    crowdCount: 2,
  };
  return { ...s, ...over };
}

function checkOf(state: GameState, playerInput: string, engineFact = ''): DraftCheck {
  return {
    state,
    playerInput,
    intent: { kind: 'talk', label: 'Talk / protest', targets: [] },
    engineFact,
    previousGm: '',
  };
}

describe('T10Y salt-road s8403 crew / speech / place / travel', () => {
  it('a. T1→T2: cast/present is one crew — never crew of the crew; cue convert is one said per quote', () => {
    const hook =
      'Location: a warehouse loft before the salt-tax score\nWho is here: the crew\nWhy: First move is yours — the plan, the cut, or the walk.\n';
    const card = compileOpeningCard('salt-road-heist', hook);
    expect(card?.castNames.filter((n) => /crew/i.test(n)).length).toBe(1);
    expect(card?.castNames).toContain('the crew');
    expect(card?.castNames).not.toContain('crew');

    const state = loft({
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['the crew', 'crew'],
        crowd: 'present',
        crowdCount: 2,
        props: [],
        lastBeat: '',
        updatedTurn: 2,
      },
    });
    const here = peopleHere(state);
    expect(here.filter((n) => /crew/i.test(n)).length).toBe(1);
    expect(openingCastNames(state).filter((n) => /^crew$/i.test(n) || /^the crew$/i.test(n)).length).toBe(1);

    const fact =
      'Must narrate: "You hear that?" I whisper loudly. PC says exactly: "You hear that?" (do not rewrite). Speech event: you address the crew. NPC reaction slot open for the crew. Must narrate: "The floorboards are singing in B-flat. PC says exactly: "The floorboards are singing in B-flat" (do not rewrite). Speech event: you address the crew. NPC reaction slot open for the crew.';
    const plain = convertWriterCueFact(fact, 'Jax');
    expect(plain).not.toMatch(/Jax said,\s*Jax said/i);
    expect(plain).toMatch(/Jax (?:whispered|said),\s*"You hear that\?"/i);
    expect(plain).toMatch(/Jax said,\s*"The floorboards are singing in B-flat\.?"/i);
    expect(plain).not.toMatch(/\bbed\b/i);

    const doubled =
      'The crew of the crew said nothing back. Jax said, Jax said, "You hear that?", "The floorboards are singing in B-flat."';
    const cleaned = normalizeCommittedProse(doubled, checkOf(state, 'I pull a rusty nail'));
    expect(cleaned).not.toMatch(/crew of the crew/i);
    expect(cleaned).not.toMatch(/Jax said,\s*Jax said/i);
  });

  it('b. T4→T5: ask the shadow / crew gets card want content, not stacked silence', () => {
    const state = loft({ turn: 5 });
    const ask =
      'I kick a loose piece of scrap metal across the floor and ask the shadow if they want to dance or get arrested';
    const draft =
      'Jax kicked a loose piece of scrap metal across the concrete floor. Jax turned to the crew and asked if they wanted to dance, or would rather get arrested. The crew offered nothing. The crew stayed completely quiet, and not one of them looked up from the crates.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/["\u201c].+["\u201d]/);
    expect(out.prose).toMatch(/plan|cut|walk|First move/i);
    expect(out.prose.match(/\b(?:offered nothing|stayed completely quiet|said nothing)\b/gi)?.length ?? 0).toBeLessThan(2);
  });

  it('c. place label drops plan tail; warehouse dungeon is timber not Coolant Trench', () => {
    expect(dropPlanClause('a warehouse loft before the salt-tax score')).toBe('a warehouse loft');
    expect(dropPlanClause('the ford before Millstone')).toBe('the ford before Millstone');
    const place = openingPlaceRecord(
      'salt-road-heist',
      'a warehouse loft before the salt-tax score',
      'Location: a warehouse loft before the salt-tax score\nWho is here: the crew\n',
    );
    expect(place.place).toBe('a warehouse loft');
    expect(place.place).not.toMatch(/salt-tax score/i);
    expect(shortPlaceName('salt-road-heist', 'a warehouse loft before the salt-tax score')).toBe(
      'a warehouse loft',
    );

    const card = previewDungeonCard(loft(), 'a warehouse loft');
    const rooms = (card.nodes ?? []).map((n) => n.name).join(' ');
    expect(rooms).not.toMatch(/Coolant Trench/i);
    expect(rooms).toMatch(/Loft|Crate|Catwalk|Rafter|Winch|Store|Hatch|Bay|Gallery/i);
  });

  it('d. travel toward room leaf: withMoveDestination names Coolant Trench when prose omits it', () => {
    const state = loft({
      turn: 11,
      currentLocation: 'a warehouse loft — Coolant Trench',
      circling: { movedTurn: 11 } as GameState['circling'],
    });
    const prose =
      'Jax left the walkway at a warehouse loft and stepped down onto the floor of the loft. Jax crossed the cool concrete toward the trench.';
    const out = withMoveDestination(state, prose);
    expect(out).toMatch(/Coolant Trench/i);
  });

  it('e. T3 flick/spit/eye: checker does not P0 "nobody answers" on addressee-less physical acts', () => {
    const before = loft({ turn: 4 });
    const after = loft({ turn: 4 });
    const act =
      'I flick a grain of salt off the crate and spit on it while eyeing the shadowed corner where the guard might be hiding.';
    const prose =
      'Jax flicked a grain of salt off the crate with one thumb and let it land on the floorboards. Jax spat on the spot where the salt had been, keeping their eyes on the shadowed corner where a guard might be hiding. Dust hung in the air above the crate, and the shadow in that corner did not move.';
    const res = checkActionFollowed(before, after, act, prose);
    expect(res.p0.map((f) => f.kind)).not.toContain('ignored-action');
    // Real unanswered ask still flags (do not weaken b).
    const askMiss = checkActionFollowed(
      before,
      after,
      'I ask the crew if they want to dance or get arrested',
      'Jax looked at the crates. Dust hung in the air.',
    );
    expect(askMiss.p0.map((f) => f.kind)).toContain('ignored-action');
  });
});
