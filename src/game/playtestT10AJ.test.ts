/**
 * T10AJ — writer miss paints narration (not ledger); presence truth; cue garble.
 * Evidence: story RPG s9822 T5–T9; tabletop s9821 T10–T11; LitRPG s9823 T3–T4.
 */
import { describe, expect, it } from 'vitest';
import { clauseToThirdPerson, convertWriterCueFact } from './writerCueLines';
import { writerEngineResult, isBookForbiddenLedgerLine } from './travelJourney';
import {
  buildCompletedEventPacket,
  lastResortStoryBody,
} from './completedEventPacket';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { resolveTypedFreeText } from './typedFreeText';
import { speechAddressCue } from './writerCueLines';
import { peopleHere } from './scenePresence';

function rpgLoft(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    turn: 5,
    character: { ...s.character, name: 'Jax' },
    currentLocation: 'a warehouse loft — Locked Strong-room',
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax', where: 'a warehouse loft' },
      complete: true,
      sceneWritten: true,
    },
    sceneFacts: {
      crowd: 'none',
      crowdCount: 0,
      noise: 'quiet',
      present: [],
      props: [],
      lastBeat: '',
      updatedTurn: 5,
    },
    ...over,
  } as GameState;
}

describe('T10AJ writerEngineResult — ledger never paints as story', () => {
  it('dungeon move + trap + room + Must narrate Next → narration, not Dungeon: / nexted', () => {
    const fact =
      'Dungeon: you moved into Locked Strong-room. Dungeon: trap — you spotted a trap and stepped around it. Dungeon room: Locked Strong-room, inside a warehouse loft. A Silver chest, closed, locked (needs Thievery 1; it stays shut). A trap here is spotted. Ways on: Loading Hatch, Glass Bay (unexplored). Must narrate: Next unexplored room. The story must show this act.';
    const plain = writerEngineResult(fact, 'Jax');
    expect(plain).not.toMatch(/Dungeon(?: room)?:/i);
    expect(plain).not.toMatch(/Ways on:/i);
    expect(plain).not.toMatch(/\bnexted\b/i);
    expect(plain).toMatch(/moved into Locked Strong-room/i);
    expect(plain).toMatch(/spotted a trap|trap here was spotted/i);
    expect(plain).toMatch(/moved on to the next unexplored room/i);
  });

  it('Check failure / Look-out / lead wait are STATUS-only; travel + act stay', () => {
    expect(isBookForbiddenLedgerLine('Check failure.')).toBe(true);
    expect(isBookForbiddenLedgerLine('Look-out: Wisdom (Perception) d20 (8) + 1 WIS + 2 perception = 11 vs DC 15 — failure')).toBe(true);
    expect(isBookForbiddenLedgerLine("A lead waits here: The Circle's Price — Get your bearings.")).toBe(true);

    const fact =
      'Check failure. The way passes the Toll Stone. Look-out: Wisdom (Perception) d20 (8) + 1 WIS + 2 perception = 11 vs DC 15 — failure. On the open road toward Keep Gate. It is now midday. Must narrate: Travel toward Keep Gate. The story must show this act. Speech event: you address Silas Thorne. NPC reaction slot open for Silas Thorne.';
    const plain = writerEngineResult(fact, 'Jax');
    expect(plain).not.toMatch(/Check failure/i);
    expect(plain).not.toMatch(/Look-out:/i);
    expect(plain).not.toMatch(/A lead waits here/i);
    expect(plain).toMatch(/Keep Gate|traveled toward|headed toward/i);
  });

  it('Get your bearings → their bearings (named PC); never your bearings in third person', () => {
    expect(clauseToThirdPerson('Get your bearings in this arrival', 'Jax')).toMatch(
      /Jax got their bearings/i,
    );
    expect(clauseToThirdPerson('Get your bearings in this arrival', 'Jax')).not.toMatch(/\byour bearings\b/i);
  });
});

describe('T10AJ lastResort — coherent paragraph, no ledger body', () => {
  it('painted turn record narrates dungeon arrival; System keeps ledger labels out of prose', () => {
    const engine =
      'Dungeon: you moved into Locked Strong-room. Dungeon: trap — you spotted a trap and stepped around it. Dungeon room: Locked Strong-room, inside a warehouse loft. A trap here is spotted. Ways on: Loading Hatch, Glass Bay (unexplored). Must narrate: Next unexplored room. The story must show this act.';
    const state = rpgLoft({
      completedEvent: { engineResult: engine } as GameState['completedEvent'],
    });
    const pkt = buildCompletedEventPacket(state, 'Next unexplored room');
    const painted = lastResortStoryBody(state, pkt, 'Next unexplored room');
    expect(painted.prose).not.toMatch(/Dungeon(?: room)?:/i);
    expect(painted.prose).not.toMatch(/Ways on:/i);
    expect(painted.prose).not.toMatch(/\bnexted\b/i);
    expect(painted.prose).toMatch(/Jax|Locked Strong-room|moved/i);
    expect(painted.status).toMatch(/Writer page blocked|Writer empty/i);
  });

  it('absent crew: topic advance does not speak the opening card want', () => {
    const state = rpgLoft({
      turn: 6,
      completedEvent: {
        engineResult:
          'Dungeon room: Locked Strong-room, inside a warehouse loft. A trap here is spotted. Ways on: Loading Hatch, Glass Bay (unexplored). Must narrate: I pull a hairpin from my bun. The story must show this act.',
      } as GameState['completedEvent'],
    });
    expect(peopleHere(state)).toEqual([]);
    const pkt = buildCompletedEventPacket(state, 'I pull a hairpin from my bun and jam it into the lock.');
    const painted = lastResortStoryBody(
      state,
      pkt,
      'I pull a hairpin from my bun and jam it into the lock. "If this doesn\'t work, I\'m blaming you."',
    );
    expect(painted.prose).not.toMatch(/the crew answers you/i);
    expect(painted.prose).not.toMatch(/First move is yours/i);
  });

  it('wrench + quote with empty present: cue convert says crew was not there (not said nothing)', () => {
    const here = peopleHere(rpgLoft());
    expect(here).toEqual([]);
    const cue = speechAddressCue('the crew', here);
    expect(cue).toMatch(/No one present to answer/i);
    const plain = convertWriterCueFact(
      'Must narrate: I toss a heavy wrench onto the floor with a loud clang. The story must show this act. Speech event: you address the crew. No one present to answer.',
      'Jax',
    );
    expect(plain).toMatch(/wrench|tossed/i);
    expect(plain).toMatch(/not there to answer|No one was there/i);
    expect(plain).not.toMatch(/said nothing/i);
  });
});

describe('T10AJ typed free text uses peopleHere for reaction slots', () => {
  it('talk in empty strong-room does not open a crew reaction slot', () => {
    const state = rpgLoft();
    const typed = resolveTypedFreeText(
      state,
      'I toss a heavy wrench onto the floor. "Tick tock, crew."',
    );
    expect(typed.engineResult).toMatch(/No one present to answer/i);
    expect(typed.engineResult).not.toMatch(/NPC reaction slot open for the crew/i);
    const plain = writerEngineResult(typed.engineResult, 'Jax');
    expect(plain).not.toMatch(/the crew said nothing/i);
    expect(plain).toMatch(/not there|No one was there/i);
  });
});
