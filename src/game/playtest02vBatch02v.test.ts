/**
 * Batch 02v — writer planning-voice, lastKill living-talk, companion slot glue.
 * Tapes: 02u 2×4 T30 (LitRPG/D&D/RPG s42 monologue; LitRPG s43 lastKill stir;
 * PYOA both seeds Wren/Dusk object glue). Mid writer OFF. No live GM call.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  classifyBeatCommit,
  isFactClosedViolation,
  isWriterMonologueLeak,
  scrubDirectorChrome,
} from './beatCommitGate';
import { attachLastKill } from './combatAuthority';
import { applyProseWarden, scrubDeadFoeReengage } from './proseWarden';
import {
  isCompanionObjectGlue,
  isObjectPersonPad,
  isSlotGlueViolation,
  ledgerSlotPeople,
  scrubSlotGlue,
} from './slotGlue';
import type { GameState } from './types';

const LITRPG_S42 =
  "--- This is a good in-character answer. It gives Jax the facts. Nice. I should present this cleanly and wait for Jax to choose.";
const DND_S42 =
  "Hmm. Under the above tiers and instructions, and per my typing obligations for Turn 3 + 4, I must pick one concrete beat. Let me re-read Pact-Hunter Skirmisher.";
const RPG_S42 =
  "The narrative tension is maybe 3/10 right now — she's patient. if I want TENSION, I would bring the bell or louder rain.";

const STIR =
  'The sergeant holds your gaze a beat longer. He glances down at the skirmisher — who stirs, a hand twitching toward a fallen blade.';
const CORPSE =
  'The rain hisses across the cobbles; the skirmisher is already down, lashed to the post.';

const TAKE_WREN = 'You take the Wren Holt pace along the mill landing.';
const PUSH_DUSK = 'You push the Dusk lane toward the ferry slip.';
const CHEST = 'Dust sits on the Wren Holt old supply chest.';

const KILL = {
  name: 'Pact-Hunter Skirmisher',
  outcome: 'victory' as const,
  turn: 17,
  remains: true,
};

function roadState(): GameState {
  const state = createInitialState(undefined, 'pyoa') as GameState;
  return {
    ...state,
    campaignBibleId: 'thornferry-road',
    currentLocation: 'mill landing at Thornferry',
    turn: 17,
    companions: [
      {
        id: 'wren',
        name: 'Wren Holt',
        type: 'party',
        role: 'guide',
        hp: 8,
        maxHp: 8,
        maintenanceCost: '',
        assignment: '',
        notes: '',
      },
      {
        id: 'dusk',
        name: 'Dusk',
        type: 'party',
        role: 'companion',
        hp: 8,
        maxHp: 8,
        maintenanceCost: '',
        assignment: '',
        notes: '',
      },
    ],
    sceneFacts: { ...emptySceneFacts(17), present: ['Wren Holt', 'Dusk'] },
  };
}

describe('Batch 02v stamps', () => {
  it('HUD and BUILD are 2026-09-02v and Mid writer stays OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-02v');
    expect(BUILD_STAMP).toBe('2026-09-02v');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });
});

describe('Batch 02v — writer planning-voice', () => {
  it('rejects the three 02u s42 monologue quotes', () => {
    expect(isWriterMonologueLeak(LITRPG_S42)).toBe(true);
    expect(isWriterMonologueLeak(DND_S42)).toBe(true);
    expect(isWriterMonologueLeak(RPG_S42)).toBe(true);
    const state = createInitialState(undefined, 'litrpg') as GameState;
    state.openingEstablishment = {
      pending: [],
      answers: {},
      complete: true,
      aloneArrival: false,
    };
    state.turn = 8;
    expect(classifyBeatCommit(state, LITRPG_S42, 'Ask a direct question').accept).toBe(false);
  });

  it('keeps legal I-speech and scrubs mixed beats', () => {
    expect(isWriterMonologueLeak('The handler wipes grit from his eyes and answers you.')).toBe(false);
    expect(isWriterMonologueLeak('"I should go," she says, already at the door.')).toBe(false);
    const scrub = scrubDirectorChrome(
      'The handler answers you. This is a good in-character answer. Dust drifts in the vault.'
    );
    expect(scrub.scrubbed).toBe(true);
    expect(scrub.prose).not.toMatch(/in-character answer/i);
    expect(scrub.prose).toMatch(/handler answers/i);
  });
});

describe('Batch 02v — lastKill living-talk after clear', () => {
  it('rejects skirmisher stir / twitch toward a fallen blade', () => {
    let state = createInitialState(undefined, 'litrpg') as GameState;
    state = { ...attachLastKill(state, KILL), turn: 18 };
    expect(isFactClosedViolation(state, STIR)).toBe(true);
    expect(isFactClosedViolation(state, CORPSE)).toBe(false);
    const out = scrubDeadFoeReengage(STIR, KILL, false);
    expect(out).not.toMatch(/\bstirs\b/i);
    expect(out).toMatch(/fallen Pact-Hunter Skirmisher/i);
    expect(scrubDeadFoeReengage(CORPSE, KILL, false)).toMatch(/already down/i);
  });
});

describe('Batch 02v — companion as object slot', () => {
  it('rejects take/push the companion and starves those pads', () => {
    const names = ledgerSlotPeople(roadState());
    expect(names).toEqual(expect.arrayContaining(['Wren Holt', 'Wren', 'Dusk']));
    expect(isCompanionObjectGlue(TAKE_WREN, names)).toBe(true);
    expect(isCompanionObjectGlue(PUSH_DUSK, names)).toBe(true);
    expect(isCompanionObjectGlue(CHEST, names)).toBe(true);
    expect(isSlotGlueViolation(TAKE_WREN, names)).toBe(true);
    expect(isFactClosedViolation(roadState(), TAKE_WREN)).toBe(true);
    expect(isObjectPersonPad('Take the Wren Holt', names)).toBe(true);
    expect(isObjectPersonPad('Push the Dusk lane', names)).toBe(true);
    expect(isObjectPersonPad('Talk to Wren Holt', names)).toBe(false);
    expect(isObjectPersonPad('Ask Dusk about the ferry', names)).toBe(false);
  });

  it('rewrites object glue and leaves legal companion prose', () => {
    const names = ledgerSlotPeople(roadState());
    expect(scrubSlotGlue(TAKE_WREN, names)).not.toMatch(/the Wren Holt/i);
    expect(scrubSlotGlue(PUSH_DUSK, names)).not.toMatch(/the Dusk lane/i);
    const legal = 'Rain drums the awning while Wren Holt watches you from the stall.';
    expect(isSlotGlueViolation(legal, names)).toBe(false);
    expect(applyProseWarden(legal, { presentNames: names })).toMatch(/Wren Holt watches/i);
    expect(applyProseWarden(TAKE_WREN, { presentNames: names })).not.toMatch(/take the Wren Holt/i);
  });
});
