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
import { prepareWriterInputWithTownsfolk } from './townsfolk';
import type { GameState, NpcMemory } from './types';

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

  it('harm moves stored trust by the approval shift; subtracting the attitude string does not', () => {
    const joined = settleCompanions(begun('rpg'), 'Ask Mara to join you');
    const beforeTrust = trust(joined.state, 'Mara');
    const beforeAttitude = joined.state.npcMemories!.find((m) => m.npcName === 'Mara')?.attitude;
    const harmed = settleCompanions(joined.state, 'Strike Mara', { outcome: { harmed: ['Mara'] } });
    const afterTrust = trust(harmed.state, 'Mara');
    const afterAttitude = harmed.state.npcMemories!.find((m) => m.npcName === 'Mara')?.attitude;
    expect(afterTrust - beforeTrust).toBe(APPROVAL_SHIFT.harmCompanion.trust);
    expect(afterTrust - beforeTrust).not.toBe(0);
    const attitudeDelta = ((afterAttitude as unknown as number) ?? 0) - ((beforeAttitude as unknown as number) ?? 0);
    expect(attitudeDelta).not.toBe(afterTrust - beforeTrust);
    expect(afterAttitude === undefined || typeof afterAttitude === 'string').toBe(true);
    expect(typeof harmed.state.npcMemories!.find((m) => m.npcName === 'Mara')?.persona?.rel?.trust).toBe('number');
  });

  it('an order to a companion who has been harmed reaches the writer packet as a refusal, and an order to a bystander does not', () => {
    let state = settleCompanions(begun('rpg'), 'Ask Mara to join you').state;
    for (let i = 0; i < 3; i++) {
      state = settleCompanions(state, 'Strike Mara', { outcome: { harmed: ['Mara'] } }).state;
    }
    const ordered = prepareWriterInputWithTownsfolk(state, 'Mara, guard the door');
    expect(ordered.writerFacing).toMatch(/Mara[^\n]*(refuses|disagrees)/i);
    expect(ordered.writerFacing).not.toMatch(/Mara[^\n]*obeys without/i);

    const bystander = prepareWriterInputWithTownsfolk(begun('rpg'), 'Bram Holt, guard the door');
    expect(bystander.writerFacing).not.toMatch(/Bram Holt[^\n]*(refuses the order|disagrees and will not)/i);
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
