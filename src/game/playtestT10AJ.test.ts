/**
 * T10AJ — writer miss paints narration (not ledger); presence truth; cue garble.
 * Evidence: story RPG s9822 T5–T9; tabletop s9821 T10–T11; LitRPG s9823 T3–T4.
 * T10RC2 — receipt telegrams never book-passthrough; absence does not discard a usable writer page.
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
import { ledgerLineToBookProse } from './ledgerToProse';
import { parsePlayerIntent } from './intentParser';
import { runWriterTurnWithFightRetry } from './writerTurn';

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

/** Producers of STATUS receipt telegrams → book converter (table-driven, not a scrub list). */
const RC2_RECEIPT_KINDS: { name: string; ledger: string; forbid?: boolean }[] = [
  { name: 'steal-fail', ledger: 'Failed to take the stray feather; someone here noticed.' },
  { name: 'steal-fail-half', ledger: 'Failed to take the stray feather.' },
  { name: 'took-quiet', ledger: 'Took the silver pouch unnoticed.' },
  { name: 'move-not-done', ledger: 'Move not done: no destination named.', forbid: true },
  {
    name: 'attempt-noted',
    ledger: 'Attempt noted (observe); no built character sheet to resolve a check.',
    forbid: true,
  },
  { name: 'action-resolved', ledger: 'Action resolved: Athletics — failure.', forbid: true },
];

describe('T10RC2 receipts never paste into book prose', () => {
  it.each(RC2_RECEIPT_KINDS)('$name → diegetic or STATUS-only (never telegram passthrough)', ({ ledger, forbid }) => {
    if (forbid) {
      expect(isBookForbiddenLedgerLine(ledger)).toBe(true);
      expect(ledgerLineToBookProse(ledger, 'Jax')).toBe('');
    } else {
      const plain = ledgerLineToBookProse(ledger, 'Jax');
      expect(plain).not.toMatch(/^Failed to take/i);
      expect(plain).not.toMatch(/^Took the /i);
      expect(plain).not.toMatch(/Move not done/i);
      expect(plain).not.toMatch(/Attempt noted/i);
      expect(plain).not.toMatch(/no built character sheet/i);
      expect(plain.length).toBeGreaterThan(0);
    }
  });

  it('T240 Waystation feather steal-fail: writerEngineResult / lastResort have no receipt telegram', () => {
    const engineFact =
      "Failed to take the stray feather; someone here noticed. Must narrate: toss it into Vessa's lap while asking if she knows anything about the missing caravan supplies. Speech event: you address the empty scene. No one present to answer.";
    const plain = writerEngineResult(engineFact, 'Jax');
    expect(plain).not.toMatch(/Failed to take/i);
    expect(plain).not.toMatch(/Move not done/i);
    expect(plain).not.toMatch(/Attempt noted/i);
    expect(plain).not.toMatch(/no built character sheet/i);
    expect(plain).not.toMatch(/Speech event/i);
    expect(plain).toMatch(/stayed put|attempt on the stray feather|No one was there|not there/i);

    const state = rpgLoft({
      turn: 240,
      currentLocation: 'Salt Road Waystation',
      sceneFacts: {
        crowd: 'none',
        crowdCount: 0,
        noise: 'quiet',
        present: [],
        props: ['stray feather'],
        lastBeat: '',
        updatedTurn: 240,
      },
      completedEvent: { engineResult: engineFact } as GameState['completedEvent'],
    });
    const ask =
      "I pick up a stray feather from the floor and toss it into Vessa's lap while asking if she knows anything about the missing caravan supplies.";
    const pkt = buildCompletedEventPacket(state, ask);
    const painted = lastResortStoryBody(state, pkt, ask);
    expect(painted.prose).not.toMatch(/Failed to take/i);
    expect(painted.prose).not.toMatch(/Move not done/i);
    expect(painted.prose).not.toMatch(/Attempt noted/i);
    expect(painted.prose).not.toMatch(/no built character sheet/i);
    expect(painted.prose).not.toMatch(/Speech event/i);
  });
});

describe('T10RC2 usable writer page survives absence blocking (T291)', () => {
  const T291_FACT =
    'Must narrate: I grip the hilt of my knife tight. The story must show this act. Must narrate: look at Oda. Are you coming or just going to stand there. Speech event: you address Oda Hask. No one present to answer. Attempt noted (observe); no built character sheet to resolve a check. Must narrate: I shift my weight forward, ready to step out into the light. The story must show this act.';
  const T291_RENDER =
    'Jax closed their hand tight around the hilt of their knife and held it there without pulling the blade free. '
    + 'Jax turned and looked straight at Oda, but the waystation stood empty and nobody was there to answer the question. '
    + 'Jax shifted their weight forward and got ready to step out into the light that fell across the floor.';
  const T291_PLAYER =
    'I grip the hilt of my knife tight and look at Oda. Are you coming or just going to stand there? I shift my weight forward, ready to step out into the light.';

  it('convertWriterCueFact quotes the PC question; Attempt noted stays off the book', () => {
    const plain = convertWriterCueFact(T291_FACT, 'Jax');
    expect(plain).not.toMatch(/Attempt noted/i);
    expect(plain).not.toMatch(/no built character sheet/i);
    expect(plain).not.toMatch(/Are you coming or just going to stand there(?!\?")/i);
    expect(plain).toMatch(/Jax said, "Are you coming or just going to stand there\?"/);
    expect(plain).toMatch(/No one was there to answer|not there to answer/i);
  });

  it('runWriterTurnWithFightRetry keeps the empty-room render (not Must-narrate echo)', async () => {
    const base = rpgLoft({
      turn: 291,
      currentLocation: 'Salt Road Waystation',
      sceneFacts: {
        crowd: 'none',
        crowdCount: 0,
        noise: 'quiet',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 291,
      },
    });
    const packet = buildCompletedEventPacket(base, T291_PLAYER, { engineResult: T291_FACT });
    const state = { ...base, completedEvent: packet } as GameState;
    const turn = await runWriterTurnWithFightRetry({
      firstRaw: T291_RENDER,
      packet,
      check: {
        state,
        playerInput: T291_PLAYER,
        intent: parsePlayerIntent(T291_PLAYER, state),
        engineFact: T291_FACT,
        previousGm: '',
      },
      rewrite: async () =>
        'Jax gripped the hilt of their knife tight. Jax looked at Oda. Are you coming or just going to stand there. No one was there to answer.',
    });
    expect(turn.path).not.toBe('last-resort');
    expect(turn.problems.some((p) => p.includes('fell back to engine-fact page'))).toBe(false);
    expect(turn.prose).toMatch(/waystation stood empty|nobody was there/i);
    expect(turn.prose).not.toMatch(
      /^Jax gripped the hilt of their knife tight\. Jax looked at Oda\. Are you coming/i,
    );
  });
});
