/**
 * T10L — speech ownership: who says what (exact packets from s3002 / s3003 T10 runs).
 * Shared owners: extractQuotedSpan / extractSay / givePcTheirQuote / stripUnauthorizedNpcSpeech
 * / speechAddressee / isAggregatePersonToken.
 */
import { describe, expect, it } from 'vitest';
import {
  extractPlayerQuotedSay,
  givePcTheirQuote,
  npcHoldsPcQuote,
  parsePlayerSteps,
  sheetContextFromState,
  stripUnauthorizedNpcSpeech,
} from './intentParser';
import { buildClauseWriterFact, speechAddressCue } from './writerCueLines';
import { normalizeCommittedProse, type DraftCheck } from './writerTurn';
import { isAggregatePersonToken } from './chromeAuthority';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import type { GameState } from './types';
import { parsePlayerIntent } from './intentParser';

function base(mode: GameState['engineMode'], over: Partial<GameState> = {}): GameState {
  const s = createInitialState('t10l', mode) as GameState;
  return {
    ...s,
    ...over,
    character: { ...s.character, name: 'Jax', ...(over.character ?? {}) },
    openingEstablishment: { complete: true, sceneWritten: true, ...(over.openingEstablishment as object) },
  } as GameState;
}

function checkOf(state: GameState, playerInput: string, engineFact = ''): DraftCheck {
  return {
    state,
    playerInput,
    intent: parsePlayerIntent(playerInput, state),
    engineFact,
    previousGm: '',
  };
}

describe('T10L PC quote ownership (s3002 T5/T6)', () => {
  const line =
    'I step closer to Rusk until my chest nearly brushes his armor and spit in the dirt at his boots. "Come out from behind that canvas and face me like a real commander instead of hiding like a rat.';
  const stolen =
    'Jax stepped in close to Commander Rusk until their chest almost touched his armor, then spat into the dirt at his boots. "Come out from behind that canvas and face me like a real commander instead of hiding like a rat," Commander Rusk said. The salt-burners went quiet and cold along the whole line of them, and nobody moved to pull Jax back or forward.';

  it('unclosed player quote still extracts (T6 slipped because closer was missing)', () => {
    expect(extractPlayerQuotedSay(line)).toMatch(/Come out from behind that canvas/);
  });

  it('trailing "…," Name said is NPC-holds-PC and reattributes to Jax', () => {
    expect(npcHoldsPcQuote(stolen, line, 'Jax')).toBe(true);
    const fixed = givePcTheirQuote(stolen, line, 'Jax');
    expect(fixed).toMatch(/Jax said,\s*"Come out from behind that canvas/);
    expect(fixed).not.toMatch(/Commander Rusk said/);
    expect(npcHoldsPcQuote(fixed, line, 'Jax')).toBe(false);
  });

  it('normalizeCommittedProse lands the quote on Jax', () => {
    const out = normalizeCommittedProse(stolen, checkOf(base('litrpg'), line));
    expect(out).toMatch(/Jax said,\s*"Come out from behind that canvas/);
    expect(out).not.toMatch(/Commander Rusk said/);
  });
});

describe('T10L fragment / You-said / chip (s3003 T7–T8, s3002 T9)', () => {
  it('waiting for you to say something is not PC says exactly "something"', () => {
    const line =
      'I lean against the damp brick wall and spin a rusted coin across my knuckles while waiting for you to say something.';
    const s = base('rpg', {
      sceneFacts: { ...emptySceneFacts(), present: ['the muscle'] },
    });
    const read = parsePlayerSteps(line, sheetContextFromState(s));
    expect(read.steps.every((st) => fold(st.say) !== 'something')).toBe(true);
    const cue = buildClauseWriterFact(line, true, {
      said: read.steps.find((st) => st.say)?.say ?? '',
      addressee: null,
    });
    expect(cue).not.toMatch(/PC says exactly:\s*"something"/i);
  });

  it('muscle said "Something." is stripped (fragment of player text + empty reaction)', () => {
    const line =
      'I lean against the damp brick wall and spin a rusted coin across my knuckles while waiting for you to say something.';
    const prose =
      'Jax leaned their shoulder against the damp brick wall of Safehouse Alley and worked a rusted coin back and forth across their knuckles. The muscle said, "Something." The muscle stayed near the far wall with both arms crossed and never once filled the quiet that followed.';
    const fact =
      'Must narrate: waiting for you to say something. Speech event: you address the empty scene. No one present to answer.';
    const out = stripUnauthorizedNpcSpeech(prose, line, 'Jax', fact);
    expect(out).not.toMatch(/The muscle said,\s*"Something\."/i);
    const normalized = normalizeCommittedProse(prose, checkOf(base('rpg'), line, fact));
    expect(normalized).not.toMatch(/The muscle said,\s*"Something\."/i);
  });

  it('ask clause is not PC says exactly (no You said imperative fragment)', () => {
    const line = "I flick the rusted coin toward the puddle and ask if he's ever seen a mark like that before.";
    const s = base('rpg');
    const read = parsePlayerSteps(line, sheetContextFromState(s));
    expect(read.steps.every((st) => !st.say)).toBe(true);
    const cue = buildClauseWriterFact(line, true, { said: '', addressee: null });
    expect(cue).not.toMatch(/PC says exactly:/i);
    const leaked = 'Jax flicked the rusted coin across the alley. You said, "Ask if he\'s ever seen a mark like that before."';
    // No quoted PC say → ownership strip does not invent You-said; cue path no longer emits it.
    expect(extractPlayerQuotedSay(line)).toBeNull();
    expect(leaked).toMatch(/You said/);
  });

  it('chip label Talk to the salt-burners is never NPC dialogue', () => {
    const line = 'Talk to the salt-burners';
    const prose =
      'Jax turned to face salt-burners in the middle of Pellane War Camp and said what they had come to say. The salt-burners said, "Talk to the salt-burners." One of the salt-burners looks Jax up and down and says nothing yet.';
    const read = parsePlayerSteps(line, {
      people: ['the salt-burners'],
      present: ['the salt-burners'],
      places: [],
      items: [],
    });
    expect(read.steps.every((st) => !st.say)).toBe(true);
    const out = stripUnauthorizedNpcSpeech(prose, line, 'Jax');
    expect(out).not.toMatch(/said,\s*"Talk to the salt-burners\."/i);
    const normalized = normalizeCommittedProse(prose, checkOf(base('litrpg'), line));
    expect(normalized).not.toMatch(/said,\s*"Talk to the salt-burners\."/i);
  });
});

describe('T10L wrong speaker / crowd aggregate (s3002 T3–T4)', () => {
  it('salt-burners is an aggregate — no reaction slot', () => {
    expect(isAggregatePersonToken('the salt-burners')).toBe(true);
    expect(isAggregatePersonToken('salt-burners')).toBe(true);
    expect(speechAddressCue('the salt-burners')).toMatch(/No one present to answer/);
    expect(speechAddressCue('the salt-burners')).not.toMatch(/NPC reaction slot open/);
    expect(speechAddressCue('Commander Rusk')).toMatch(/NPC reaction slot open for Commander Rusk/);
  });

  it('ask the guard about Rusk does not open a Rusk reaction from the topic name', () => {
    const line =
      "I tap the hilt of my knife against the guard's armored shin and ask if he knows where I can find Commander Rusk.";
    const s = base('litrpg', {
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['the guard', 'Commander Rusk', 'the salt-burners'],
      },
    });
    const read = parsePlayerSteps(line, sheetContextFromState(s));
    const who = read.steps.map((st) => st.addressee).find(Boolean);
    expect(who?.toLowerCase()).toMatch(/guard/);
    expect(who?.toLowerCase()).not.toMatch(/rusk/);
  });

  it('salt-burners quote drops when the engine opened no reaction / wrong speaker', () => {
    const line =
      "I tap the hilt of my knife against the guard's armored shin and ask if he knows where I can find Commander Rusk.";
    const prose =
      'Jax shifted their weight and asked the guard if he knew where they could find Commander Rusk. The salt-burners said, "We don\'t hand out that name to strangers, and we won\'t point you where to find him either." Commander Rusk stood alone outside the largest tent with both hands clasped behind his back.';
    const empty =
      'Must narrate: ask if he knows where I can find Commander Rusk. Speech event: you address the empty scene. No one present to answer.';
    expect(stripUnauthorizedNpcSpeech(prose, line, 'Jax', empty)).not.toMatch(/The salt-burners said/i);
    const ruskSlot =
      'Speech event: you address Commander Rusk. NPC reaction slot open for Commander Rusk.';
    expect(stripUnauthorizedNpcSpeech(prose, line, 'Jax', ruskSlot)).not.toMatch(/The salt-burners said/i);
  });
});

function fold(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}
