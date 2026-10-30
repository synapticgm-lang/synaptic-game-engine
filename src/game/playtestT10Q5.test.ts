/**
 * T10Q5 — NPC object permanence: orphan present:true must not open reaction slots while
 * factSheet Present is empty; a name shown on the page stays seated until travel/exit;
 * addressing someone elsewhere carries last-seen, not a false reaction slot.
 */
import { describe, expect, it } from 'vitest';
import type { GameState, NpcMemory } from './types';
import { peopleHere } from './chipLegality';
import { presentNpcNames } from './npcRelationships';
import { applyPresenceFacts, seat } from './presentAuthority';
import { harvestNarrativePeople } from './narrativeHarvest';
import { buildFactSheet } from './factSheet';
import { compileRefEnum, type CompletedEventPacket } from './completedEventPacket';
import { resolveTypedFreeText } from './typedFreeText';
import { convertWriterCueFact, speechAddressCue } from './writerCueLines';
import { ensureSpokenAnswer } from './spokenAnswer';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? over.npcName.toLowerCase().replace(/\s+/g, '-'),
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 0,
    ...over,
  } as NpcMemory;
}

function base(over: Partial<GameState> = {}): GameState {
  return {
    character: { name: 'Jax', level: 1, xp: 0, hp: 20, maxHp: 20, attributes: {} },
    log: [],
    inventory: [],
    quests: [],
    places: [],
    npcMemories: [],
    turn: 186,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    currentLocation: 'Salt Road Waystation',
    journey: null,
    activeEncounter: null,
    sceneFacts: {
      crowd: 'unknown',
      noise: 'unknown',
      present: [],
      props: [],
      lastBeat: '',
      updatedTurn: 186,
    },
    ...over,
  } as GameState;
}

const emptyPacket = {
  turn: 186,
  verb: 'acted',
  outcome: 'unchanged',
  location: 'Salt Road Waystation',
  playerAction: 'Look for an exit',
} as CompletedEventPacket;

describe('T10Q5 seat permanence vs orphan present:true', () => {
  it('orphan present:true without location does not seat peopleHere or present: refs', () => {
    const s = base({
      npcMemories: [
        mem({ npcName: 'Yara Flint', present: true }),
        mem({ npcName: 'Gideon Ash', present: true }),
      ],
    });
    expect(peopleHere(s)).not.toContain('Yara Flint');
    expect(presentNpcNames(s)).not.toContain('Yara Flint');
    const refs = compileRefEnum(s);
    expect(refs.some((r) => /yara/i.test(r.display))).toBe(false);
    const sheet = buildFactSheet(s, emptyPacket, 'Look for an exit');
    expect(sheet.present.map((p) => p.name)).not.toContain('Yara Flint');
  });

  it('clearing present[] syncs memory present flags (no zombie seats after empty harvest)', () => {
    let s = base({
      npcMemories: [mem({ npcName: 'Yara Flint', present: false, location: 'Salt Road Waystation' })],
    });
    s = seat(s, 'Yara Flint');
    expect(peopleHere(s)).toContain('Yara Flint');
    expect(s.npcMemories?.find((m) => /yara/i.test(m.npcName))?.present).toBe(true);
    s = applyPresenceFacts(s, { present: [], crowd: 'none', crowdCount: 0 });
    expect(s.sceneFacts?.present ?? []).toHaveLength(0);
    expect(s.npcMemories?.find((m) => /yara/i.test(m.npcName))?.present).toBe(false);
    expect(peopleHere(s)).not.toContain('Yara Flint');
  });

  it('harvest of shown prose seats the name so the next turn still sees them', () => {
    const s = base({
      npcMemories: [mem({ npcName: 'Yara Flint', present: false })],
    });
    const prose =
      'Jax turned a slow circle in the middle of Salt Road Waystation. Yara Flint stood by the wall in their road clothes and did not move or speak.';
    const refEnum = [
      { tok: 't7', id: 'present:yara-flint', display: 'Yara Flint', klass: 'person' as const },
    ];
    const { state } = harvestNarrativePeople(s, prose, 186, {
      refs: [{ tok: 't7', id: 'present:yara-flint', use: 'speaker' }],
      refEnum,
    });
    expect(state.sceneFacts?.present?.some((p) => /yara/i.test(p))).toBe(true);
    expect(peopleHere(state).some((n) => /yara/i.test(n))).toBe(true);
    expect(state.npcMemories?.find((m) => /yara/i.test(m.npcName))?.location).toMatch(/Waystation/i);
  });
});

describe('T10Q5 absence carries last-seen (evidence T186→T187)', () => {
  it('addressing Yara when not seated opens no reaction slot and names last-seen place', () => {
    const s = base({
      turn: 187,
      npcMemories: [
        mem({ npcName: 'Yara Flint', present: false, location: 'Bribe Market' }),
      ],
      sceneFacts: {
        crowd: 'unknown',
        noise: 'unknown',
        present: [],
        props: [],
        lastBeat: '',
        updatedTurn: 187,
      },
    });
    expect(peopleHere(s).some((n) => /yara/i.test(n))).toBe(false);
    const res = resolveTypedFreeText(
      s,
      'I lean in close to Yara and whisper that I am a salt shaker. Then I ask if they have seen any pepper.',
    );
    expect(res.engineResult).toMatch(/address Yara Flint/i);
    expect(res.engineResult).toMatch(/last seen at Bribe Market/i);
    expect(res.engineResult).toMatch(/last seen at Bribe Market; not present to answer/i);
    expect(res.engineResult).not.toMatch(/NPC reaction slot open for Yara/i);
  });

  it('convertWriterCueFact paints last-seen, not a bare empty-room telegram for a named who', () => {
    const plain = convertWriterCueFact(
      'Speech event: you address Yara Flint. Yara Flint was last seen at Bribe Market; not present to answer.',
    );
    expect(plain).toMatch(/Yara Flint was last seen at Bribe Market/i);
    expect(plain).not.toMatch(/^No one was there to answer\.?$/);
  });

  it('speechAddressCue embeds last-seen when supplied', () => {
    const cue = speechAddressCue('Yara Flint', [], 'Bribe Market');
    expect(cue).toMatch(/last seen at Bribe Market/i);
    expect(cue).toMatch(/not present to answer/i);
    expect(cue).not.toMatch(/reaction slot/i);
  });

  it('ensureSpokenAnswer empty seats still paints one absence line (RC6 keep-green)', () => {
    const s = base({
      turn: 17,
      currentLocation: 'Lowmarket',
      npcMemories: [],
      sceneFacts: {
        crowd: 'none',
        noise: 'unknown',
        present: [],
        props: [],
        lastBeat: '',
        crowdCount: 0,
        updatedTurn: 17,
      },
    });
    const out = ensureSpokenAnswer(
      'Jax bent down at Lowmarket and picked up the stray coin.',
      s,
      'I flip the coin between my fingers while staring at Osric.',
    );
    expect(out.answer.status).toBe('nobody-here');
    expect(out.prose).toMatch(/No one was there to answer/i);
  });
});
