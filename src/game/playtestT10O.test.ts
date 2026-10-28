/**
 * T10O — typed free text never collapses to observe; stubs / truncate / chip speech / place runs.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { validateActionHard } from './actionValidation';
import { findHardItemUseClaims } from './suggestionValidation';
import { placeShortForm, polishMentions } from './mentionVariety';
import { chipWantFromMotiveLine, npcChipWant } from './openThreads';
import { classifyTokenLine, type TokenBeat, type TokenLine } from './tokenProse';
import { stripUnauthorizedNpcSpeech } from './intentParser';
import { normalizeCommittedProse, type DraftCheck } from './writerTurn';
import type { GameState, NpcMemory } from './types';
import type { LedgerRef } from './completedEventPacket';

const KICK =
  "I kick a loose stone toward Dain's boots while picking at a splinter with my thumbnail.";
const NAIL =
  'I spin a rusty nail I picked up from the gate post between my fingers while staring at the taller militia man. "You look like you need a drink more than I do, friend.';
const MAP =
  "I glance at the muscle to see if he's wiped his face or just standing there fuming. I kick the map back toward the crate with my boot heel. What's it gonna be, boss?";
const HOP =
  'I hop on one foot and dramatically clutch my chest. "Tell me you have a magic chair that fixes feet or I\'m fainting right here.';

function base(mode: GameState['engineMode'] = 'dnd'): GameState {
  const s0 = createInitialState(undefined, mode) as GameState;
  return {
    ...s0,
    engineMode: mode,
    turn: 3,
    character: { ...s0.character, name: 'Jax' },
    openingEstablishment: {
      complete: true,
      pending: [],
      answers: { name: 'Jax' },
      aloneArrival: false,
    },
    sceneFacts: {
      ...(s0.sceneFacts ?? {}),
      present: mode === 'dnd' ? ['Dain Holt', 'militia'] : ['muscle', 'crew'],
      props: mode === 'dnd' ? ['gate post', 'stone', 'splinter'] : ['map', 'crate'],
      crowd: 'present',
      noise: 'quiet',
      lastBeat: '',
      updatedTurn: 3,
    },
  } as GameState;
}

function checkOf(state: GameState, playerInput: string, engineFact = ''): DraftCheck {
  return {
    state,
    playerInput,
    intent: { kind: 'other', label: 'Free action', targets: [] },
    engineFact,
    previousGm: '',
  };
}

describe('T10O typed free text never collapses to observe', () => {
  it('evidence lines: kick / nail / map / hop pass the hard gate (no bag false claims)', () => {
    const dnd = base('dnd');
    const rpg = base('rpg');
    expect(findHardItemUseClaims(KICK, dnd)).toEqual([]);
    expect(validateActionHard(KICK, dnd, 'Dain Holt stands at Barred Oak Gate.').valid).toBe(true);
    expect(findHardItemUseClaims(NAIL, dnd)).toEqual([]);
    expect(validateActionHard(NAIL, dnd, 'Militia at the gate.').valid).toBe(true);
    expect(findHardItemUseClaims(MAP, rpg)).toEqual([]);
    expect(validateActionHard(MAP, rpg, 'A map lies on the crate.').valid).toBe(true);
    expect(validateActionHard(HOP, dnd, 'Gate.').valid).toBe(true);
  });

  it('true missing crowbar with-instrument still hard-refuses (q75 L6-T19)', () => {
    const s = base('litrpg');
    const refused = validateActionHard('I pry it open with my crowbar', s, 'A sealed chest.');
    expect(refused.valid).toBe(false);
    expect(refused.violations.join(' ')).toMatch(/crowbar/i);
  });
});

describe('T10O stub / truncate / chip / place', () => {
  it('token line truncated mid-word with ellipsis fails classifyTokenLine', () => {
    const line: TokenLine = {
      fn: 'react',
      text: 'The crew watched from the floor below and kept their distance, q...',
    };
    const beat: TokenBeat = { refs: [], lines: [line] };
    const v = classifyTokenLine(line, beat, [], [], '', undefined, 'Jax', 'Search the rafters');
    expect(v.ok).toBe(false);
    expect(v.reason).toBe('truncated');
  });

  it('stripUnauthorizedNpcSpeech drops empty speech shells and double stops', () => {
    const out = stripUnauthorizedNpcSpeech(
      'Jax turned toward the crew and spoke.. The crew did not laugh.',
      'I kick a rusted crate toward Jax and ask if he\'s seen any rats.',
      'Jax',
      'Must narrate: kick a rusted crate. Speech event: you address the crew.',
    );
    expect(out).not.toMatch(/spoke\.\./i);
    expect(out).not.toMatch(/\bsaw?\s*$/i);
    expect(out).toMatch(/crew did not laugh/i);
  });

  it('normalizeCommittedProse drops "said what they had come to say" stub and stray ?".', () => {
    const state = base('rpg');
    const stub =
      'Jax stepped up to the table and said what they had come to say to the crew. A lantern flickered low.';
    const cleaned = normalizeCommittedProse(stub, checkOf(state, 'Talk to the crew'));
    expect(cleaned).not.toMatch(/said what they had come to say/i);
    expect(cleaned).toMatch(/lantern flickered/i);

    const q =
      'Jax said, "Loyalty or just a warm body to bleed for?". The crew went still.';
    const qOut = normalizeCommittedProse(q, checkOf(state, 'I snatch the map. "Loyalty or just a warm body to bleed for?'));
    expect(qOut).not.toMatch(/\?"\./);
    expect(qOut).toMatch(/bleed for\?"/);
  });

  it('chip want strips first-person I need/want into an action topic', () => {
    expect(chipWantFromMotiveLine('I need someone steady watching that keep gate')).toBe(
      'someone steady watching that keep gate',
    );
    const mem = {
      npcName: 'Dain Holt',
      goal: { motivation: 'duty', target: 'I need someone steady watching that keep gate' },
    } as unknown as NpcMemory;
    const want = npcChipWant(mem);
    expect(want).toBe('someone steady watching that keep gate');
    expect(want).not.toMatch(/^I need\b/i);
  });

  it('Barred Oak Gate short form is the gate; polishMentions shortens later runs', () => {
    expect(placeShortForm('Barred Oak Gate')).toBe('the gate');
    const refs: LedgerRef[] = [
      { tok: 't1', id: 'here', display: 'Barred Oak Gate', klass: 'place' },
    ];
    const prose =
      'Jax hopped at Barred Oak Gate. Both watched Barred Oak Gate wait. The bars behind Barred Oak Gate threw shadows.';
    const out = polishMentions(prose, refs);
    const full = (out.match(/Barred Oak Gate/g) ?? []).length;
    expect(full).toBe(1);
    expect(out).toMatch(/the gate/i);
  });
});
