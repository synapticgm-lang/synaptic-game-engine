/**
 * Development scenarios for the companion mismatch. Deterministic engine transitions.
 * Not a replay-bank recording, not a paid model call, and not proof of story quality.
 * Live recruitment stops at PARTY_CAP (1). The two-row fixture in __fixtures__/companions.ts
 * is an unsupported live party.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applySocialLedgerTurn } from './npcMemory';
import { storedRelationshipFor } from './npcRelationships';
import { isStaleCompanionDefault } from './companionAgency';
import {
  APPROVAL_SHIFT,
  PARTY_CAP,
  recruitedCompanions,
  settleCompanions,
} from './rules/companions';
import { recalledSaidLines } from './sceneBlock';
import { buildCompletedEventPacket } from './completedEventPacket';
import { prepareWriterInputWithTownsfolk } from './townsfolk';
import type { GameState, LogEntry, NpcMemory } from './types';

const PLACE = 'The Weighing Cup';

function person(name: string, role: string): NpcMemory {
  return {
    npcId: name.toLowerCase().replace(/\s+/g, '-'),
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 4,
    roleHint: role,
    location: PLACE,
    met: true,
    present: true,
  };
}

function begun(mode: GameState['engineMode']): GameState {
  const state = createInitialState('Companion scenarios', mode, undefined, 'companion-dev-seed');
  return {
    ...state,
    currentLocation: PLACE,
    turn: 4,
    companions: [],
    activeEncounter: null,
    roundCombat: null,
    npcMemories: [person('Mara', 'guide'), person('Bram Holt', 'artisan')],
    openingEstablishment: { ...(state.openingEstablishment ?? {}), complete: true } as GameState['openingEstablishment'],
    sceneFacts: {
      ...state.sceneFacts!,
      present: ['Mara', 'Bram Holt'],
      props: [],
      lastBeat: '',
      updatedTurn: 4,
    },
  };
}

function trust(state: GameState, name: string): number {
  return storedRelationshipFor(state, name)?.trust ?? 0;
}

describe('development scenarios: one legal companion', () => {
  it('a neutral named person joins, and the second recruit is refused because the party is full', () => {
    expect(PARTY_CAP).toBe(1);
    const joined = settleCompanions(begun('rpg'), 'Ask Mara to join you');
    expect(joined.receipts.some((r) => /Mara joined you/.test(r))).toBe(true);
    expect(recruitedCompanions(joined.state).map((c) => c.name)).toEqual(['Mara']);

    const full = settleCompanions(joined.state, 'Ask Bram Holt to join you');
    expect(full.receipts).toEqual(['Companion: Bram Holt cannot join — your party is full.']);
    expect(recruitedCompanions(full.state).map((c) => c.name)).toEqual(['Mara']);
    expect(full.facts.join(' ')).toMatch(/already travels with Mara/);
  });

  it('LitRPG uses the same cap; tabletop and a live fight do not recruit', () => {
    const lit = settleCompanions(begun('litrpg'), 'Ask Mara to join you');
    expect(recruitedCompanions(lit.state)).toHaveLength(1);
    const litFull = settleCompanions(lit.state, 'Ask Bram Holt to join you');
    expect(recruitedCompanions(litFull.state)).toHaveLength(1);

    const tabletop = settleCompanions(begun('dnd'), 'Ask Mara to join you');
    expect(tabletop.receipts).toEqual([]);
    expect(recruitedCompanions(tabletop.state)).toEqual([]);

    const fighting = begun('rpg');
    fighting.activeEncounter = { name: 'Bandit' } as GameState['activeEncounter'];
    const midFight = settleCompanions(fighting, 'Ask Mara to join you');
    expect(recruitedCompanions(midFight.state)).toEqual([]);
  });

  it('a wary or hostile person refuses to join, and a neutral bystander is not copied onto the companion agenda', () => {
    const wary = begun('rpg');
    wary.arcDirector = { ...(wary.arcDirector ?? {}), npcRelationships: [{ npcName: 'Mara', trust: -20, familiarity: 0 }] };
    const refused = settleCompanions(wary, 'Ask Mara to join you');
    expect(refused.receipts).toEqual(['Companion: Mara will not join you (Wary).']);
    expect(recruitedCompanions(refused.state)).toEqual([]);

    const hostile = begun('rpg');
    hostile.arcDirector = { ...(hostile.arcDirector ?? {}), npcRelationships: [{ npcName: 'Mara', trust: -60, familiarity: 0 }] };
    const no = settleCompanions(hostile, 'Ask Mara to join you');
    expect(no.receipts[0]).toMatch(/will not join you \(Hostile\)/);
    expect(recruitedCompanions(no.state)).toEqual([]);

    const joined = settleCompanions(begun('rpg'), 'Ask Mara to join you');
    const mara = joined.state.npcMemories!.find((m) => m.npcName === 'Mara')!;
    const bram = joined.state.npcMemories!.find((m) => m.npcName === 'Bram Holt')!;
    expect(mara.goal?.motivation && mara.goal.target && mara.need && mara.offer).toBeTruthy();
    expect(isStaleCompanionDefault(mara)).toBe(false);
    expect(JSON.stringify(bram.goal ?? null)).not.toBe(JSON.stringify(mara.goal));
  });

  it('one harm moves stored relationship trust by the approval shift, and persona trust by a different nudge', () => {
    const joined = settleCompanions(begun('rpg'), 'Ask Mara to join you');
    const beforeStored = trust(joined.state, 'Mara');
    const beforePersona = joined.state.npcMemories!.find((m) => m.npcName === 'Mara')?.persona?.rel?.trust;
    const beforeAttitude = joined.state.npcMemories!.find((m) => m.npcName === 'Mara')?.attitude;
    const harmed = settleCompanions(joined.state, 'Strike Mara', { outcome: { harmed: ['Mara'] } });
    const after = harmed.state.npcMemories!.find((m) => m.npcName === 'Mara')!;
    const storedDelta = trust(harmed.state, 'Mara') - beforeStored;
    const personaDelta = after.persona!.rel.trust - beforePersona!;
    expect(storedDelta).toBe(APPROVAL_SHIFT.harmCompanion.trust);
    expect(personaDelta).not.toBe(storedDelta);
    expect(typeof after.persona!.rel.trust).toBe('number');
    expect(typeof after.attitude).toBe('string');
    expect(after.attitude).toBe(beforeAttitude);
  });

  it('three harms make the companion disagree; refusal is a later persona threshold, and a bystander is not ordered', () => {
    let state = settleCompanions(begun('rpg'), 'Ask Mara to join you').state;
    for (let i = 0; i < 3; i++) {
      state = settleCompanions(state, 'Strike Mara', { outcome: { harmed: ['Mara'] } }).state;
    }
    expect(recruitedCompanions(state).map((c) => c.name)).toEqual(['Mara']);
    const disagreed = prepareWriterInputWithTownsfolk(state, 'Mara, guard the door');
    expect(disagreed.writerFacing).toMatch(/Mara disagrees and will not go along quietly/);
    expect(disagreed.writerFacing).not.toMatch(/Mara refuses the order/);

    const left = settleCompanions(state, 'Strike Mara', { outcome: { harmed: ['Mara'] } });
    expect(left.receipts.some((r) => /Mara left your party/.test(r))).toBe(true);
    const afterLeaving = prepareWriterInputWithTownsfolk(left.state, 'Mara, guard the door');
    expect(afterLeaving.writerFacing).not.toMatch(/Mara refuses the order/);

    const stillHere = settleCompanions(begun('rpg'), 'Ask Mara to join you').state;
    stillHere.npcMemories = stillHere.npcMemories!.map((m) =>
      m.npcName === 'Mara' && m.persona
        ? { ...m, persona: { ...m.persona, rel: { ...m.persona.rel, trust: -30 } } }
        : m,
    );
    const refused = prepareWriterInputWithTownsfolk(stillHere, 'Mara, guard the door');
    expect(refused.writerFacing).toMatch(/Mara refuses the order/);
    expect(refused.writerFacing).not.toMatch(/Mara disagrees and will not go along quietly/);

    const bystander = prepareWriterInputWithTownsfolk(begun('rpg'), 'Bram Holt, guard the door');
    expect(bystander.writerFacing).not.toMatch(/Bram Holt (refuses the order|disagrees and will not)/);
  });

  it('a quote eight turns old returns through the writer packet only when the player calls it back', () => {
    const older = 'The March keeps what falls into it.';
    const tooSoon = 'Bring the blue lantern down the stair.';
    const later = [
      'Count seven, never eight.',
      'Nobody leaves the glass by the way they came.',
      'Watch needs eyes, not boasts.',
    ];
    let state = begun('litrpg');
    state = {
      ...state,
      currentLocation: 'Mireglass March',
      npcMemories: [{ ...person('Ilyra Fen', 'guide'), location: 'Mireglass March' }],
      sceneFacts: { ...state.sceneFacts!, present: ['Ilyra Fen'] },
    };
    const beats: [number, string][] = [
      [3, `Ilyra Fen answered without looking up. "${older}"`],
      [4, `Ilyra Fen said, "${tooSoon}"`],
      [5, `Ilyra Fen said, "${later[0]}"`],
      [7, `Ilyra Fen said, "${later[1]}"`],
      [9, `Ilyra Fen said, "${later[2]}"`],
    ];
    for (const [turn, gmText] of beats) {
      state = applySocialLedgerTurn({ state: { ...state, turn }, playerAction: 'Tell me about the March', turn, gmText });
    }
    state = { ...state, turn: 11 };
    const said = state.npcMemories!.find((m) => m.npcName === 'Ilyra Fen')?.said?.map((s) => s.line);
    expect(said).toContain(older);

    const quiet = prepareWriterInputWithTownsfolk(state, 'Look at the water');
    expect(quiet.writerFacing).not.toContain(older);
    expect(quiet.writerFacing).toContain(later[2]);

    const callback = prepareWriterInputWithTownsfolk(
      state,
      'You said the March keeps what falls into it, and bring the blue lantern down the stair',
    );
    expect(callback.writerFacing).toContain(older);
    expect(callback.writerFacing).toContain('T3');
    expect(callback.writerFacing).not.toContain(tooSoon);
  });
});

function saidRow(name: string, line: string, turn: number, over: Partial<NpcMemory> = {}): NpcMemory {
  return {
    ...person(name, 'guide'),
    location: PLACE,
    said: [
      { topic: 'other', turn, line },
      { topic: 'other', turn: turn + 6, line: 'One newer line about the door.' },
      { topic: 'other', turn: turn + 7, line: 'Two newer line about the lamp.' },
      { topic: 'other', turn: turn + 8, line: 'Three newer line about the stair.' },
    ],
    ...over,
  };
}

describe('development scenarios: quote callback boundaries', () => {
  it('matches four complete words after punctuation, and rejects a longer fourth word, a short quote, and a three-word prefix', () => {
    const quote = 'The March keeps what falls into it.';
    const punctuated = 'No, I will not open it tonight.';
    const state = begun('rpg');
    state.turn = 12;
    state.npcMemories = [
      saidRow('Ilyra Fen', quote, 3),
      saidRow('Sefa Crane', punctuated, 4),
      saidRow('Mara', 'Stop now please', 3),
    ];
    state.sceneFacts = { ...state.sceneFacts!, present: ['Ilyra Fen', 'Sefa Crane', 'Mara'] };

    const prefix = recalledSaidLines(state, 'The March keeps whatever the rain brings');
    expect(prefix.join('\n')).not.toContain(quote);

    const short = recalledSaidLines(state, 'Stop now please');
    expect(short.join('\n')).not.toContain('Stop now');

    const three = recalledSaidLines(state, 'The March keeps');
    expect(three.join('\n')).not.toContain(quote);

    const exact = recalledSaidLines(state, 'You said the March keeps what falls into it');
    expect(exact.join('\n')).toContain('RECALLED: Ilyra Fen already said (other, T3): "The March keeps what falls into it."');
    expect(exact.join('\n')).not.toContain('Sefa Crane');

    const commas = recalledSaidLines(state, 'No, I will not open the door');
    expect(commas.join('\n')).toContain('RECALLED: Sefa Crane already said (other, T4): "No, I will not open it tonight."');
  });

  it('age 7 stays out, age 8 returns, and a quote still inside the last three said lines is not repeated', () => {
    const aged = 'The March keeps what falls into it.';
    const stillShown = 'Count seven never eight tonight please.';
    const state = begun('rpg');
    state.turn = 11;
    state.npcMemories = [{
      ...person('Ilyra Fen', 'guide'),
      said: [
        { topic: 'other', turn: 3, line: aged },
        { topic: 'other', turn: 4, line: 'Bring the blue lantern down the stair.' },
        { topic: 'other', turn: 5, line: 'One filler about the west road.' },
        { topic: 'other', turn: 7, line: 'Two filler about the west road.' },
        { topic: 'other', turn: 9, line: stillShown },
      ],
    }];
    state.sceneFacts = { ...state.sceneFacts!, present: ['Ilyra Fen'] };
    const lines = recalledSaidLines(
      state,
      'the March keeps what falls, bring the blue lantern down, and count seven never eight',
    ).join('\n');
    expect(lines).toContain(aged);
    expect(lines).not.toContain('Bring the blue lantern');
    expect(lines).not.toContain(stillShown);
  });

  it('keeps at most two present speakers, prefers the person named this turn, and does not spend a slot on someone who left', () => {
    const wren = 'The vault key is under the third stair.';
    const ilyra = 'The March keeps what falls into it.';
    const sefa = 'Count the lamps along the west wall.';
    const state = begun('rpg');
    state.turn = 20;
    state.currentLocation = PLACE;
    state.npcMemories = [
      { ...saidRow('Wren Holt', wren, 4), shouldExit: true, location: 'Far Keep' },
      saidRow('Sefa Crane', sefa, 4),
      saidRow('Ilyra Fen', ilyra, 4),
    ];
    state.sceneFacts = { ...state.sceneFacts!, present: ['Sefa Crane', 'Ilyra Fen'] };
    const ask = 'Ilyra Fen said the March keeps what falls, the vault key is under, and count the lamps along';
    const lines = recalledSaidLines(state, ask);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('Ilyra Fen');
    expect(lines[0]).toContain(ilyra);
    expect(lines.join('\n')).not.toContain('Wren Holt');
    expect(lines.join('\n')).toContain('Sefa Crane');
  });

  it('a blank current line does not treat an older player log line as this turn\'s callback', () => {
    const quote = 'The March keeps what falls into it.';
    const state = begun('rpg');
    state.turn = 12;
    state.npcMemories = [saidRow('Ilyra Fen', quote, 3)];
    state.sceneFacts = { ...state.sceneFacts!, present: ['Ilyra Fen'] };
    state.log = [{ id: 'p1', turn: 4, role: 'player', content: 'the March keeps what falls', timestamp: 4 } as LogEntry];
    const blank = buildCompletedEventPacket(state, '');
    expect(blank.sceneBlock ?? '').not.toContain('RECALLED:');
    expect(blank.sceneBlock ?? '').not.toContain(quote);
    const typed = buildCompletedEventPacket(state, 'the March keeps what falls into it');
    expect(typed.sceneBlock ?? '').toContain('RECALLED: Ilyra Fen');
  });

  it('collapses a newline inside a recalled quote onto one packet line', () => {
    const state = begun('rpg');
    state.turn = 12;
    state.npcMemories = [saidRow('Ilyra Fen', 'The March keeps what\nfalls into it.', 3)];
    state.sceneFacts = { ...state.sceneFacts!, present: ['Ilyra Fen'] };
    const lines = recalledSaidLines(state, 'the March keeps what falls');
    expect(lines).toEqual([
      'RECALLED: Ilyra Fen already said (other, T3): "The March keeps what falls into it."',
    ]);
  });
});
