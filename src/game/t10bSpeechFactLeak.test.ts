/**
 * T10B/T10E — engine speech-slot / writer-cue facts must never become the player-visible story.
 * Evidence: Salt Road T2/T3 + Cursed Keep T3 (2026-10-27 typed-mix) painted cue chrome after last-resort.
 * T10E: cue strings live in writerCueLines; T10C wording; convert via writerEngineResult.
 */
import { describe, expect, it } from 'vitest';
import { classifyBeatCommit, missingPointerCardSlot, repairRejectedBeat } from './beatCommitGate';
import { buildCompletedEventPacket, lastResortStoryBody } from './completedEventPacket';
import { createInitialState } from './defaults';
import { applyGovernanceToProse } from './qualityGovernance';
import { writerEngineResult } from './travelJourney';
import { resolveTypedFreeText } from './typedFreeText';
import { WRITER_CUE_CHROME } from './writerCueLines';
import type { GameState } from './types';

const CUE_CHROME = WRITER_CUE_CHROME;

function saltRoadAfterCovers(turn = 2): GameState {
  const s0 = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s0,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    turn,
    currentLocation: 'Salt Road Waystation',
    character: { ...s0.character, name: 'Jax' },
    sceneFacts: { ...(s0.sceneFacts ?? {}), present: ['Vessa'] },
    openingEstablishment: {
      pending: [],
      answers: { where: 'Salt Road Waystation', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      pickedHook:
        'Location: a Salt Road tavern hire\nWho is here / who summoned: Vessa\nWhy this happened: Vessa wants a cutter.',
      pickedHookId: 'salt-road-waystation',
      pickedHookFallback: 'Pipe smoke and cheap wine.',
      aloneArrival: false,
      card: { place: 'Salt Road Waystation', cast: 'Vessa', castNames: ['Vessa'], props: [], names: ['Salt', 'Road'] },
      pinnedNpcNames: ['Vessa'],
      pinnedAt: 'Salt Road Waystation',
    },
  } as unknown as GameState;
}

function cursedKeepAfterCovers(turn = 3): GameState {
  const s0 = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s0,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    turn,
    currentLocation: 'Greyhollow Graveyard',
    character: { ...s0.character, name: 'Jax' },
    sceneFacts: { ...(s0.sceneFacts ?? {}), present: ['Father Aldous', 'Mayor Helga Brask'] },
    openingEstablishment: {
      pending: [],
      answers: { where: 'Greyhollow Graveyard', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      pickedHook:
        'Location: Greyhollow churchyard\nWho is here / who summoned: Father Aldous\nWhy this happened: graves opened overnight.',
      pickedHookId: 'greyhollow-churchyard',
      pickedHookFallback: 'Opened graves and cart ruts.',
      aloneArrival: false,
      card: { place: 'Greyhollow Graveyard', cast: 'Father Aldous', castNames: ['Father Aldous'], props: [], names: [] },
      pinnedNpcNames: ['Father Aldous'],
      pinnedAt: 'Greyhollow Graveyard',
    },
  } as unknown as GameState;
}

function emptySceneSalt(turn = 2): GameState {
  const s = saltRoadAfterCovers(turn);
  return {
    ...s,
    sceneFacts: { ...(s.sceneFacts ?? {}), present: [] },
  } as GameState;
}

const SALT_WRITER =
  "Jax bent low toward the silver pouch at Vessa's belt, the way a person bows to a small king, and straightened up again inside Salt Road Waystation. Vessa said, \"The Lord of Padlocks does not see people just because they ask nicely, so tell me why he should see you at all.\" Vessa kept one hand resting flat on the pouch while they watched Jax's face and waited for the reason.";

const KEEP_WRITER =
  'Jax knelt by the opened graves and traced the deep cart ruts in the mud, then stood and turned to Father Aldous. Father Aldous said, "Someone hauled those coffins uphill toward the keep with a heavy cart, and I saw the ruts myself before dawn."';

const PRESENT_SPEECH =
  'Must narrate: Ask Vessa what the job pays. Speech event: you address Vessa. NPC reaction slot open for Vessa.';
const EMPTY_SPEECH =
  'Must narrate: call out to the empty street. PC says exactly: "Anyone home?" (do not rewrite). Speech event: you address the empty scene. No one present to answer.';
const MUD_PLUS_SPEECH =
  'You check the mud around the opened graves for heavy cart tracks leading uphill. Must narrate: ask Mayor Helga Brask about the lead. Speech event: you address Mayor Helga Brask. NPC reaction slot open for Mayor Helga Brask.';

describe('T10B/T10E speech fact never reaches the player', () => {
  it('typed speech still records the engine speech event for the writer', () => {
    const typed = resolveTypedFreeText(saltRoadAfterCovers(), 'Ask Vessa what the job pays');
    expect(typed.engineResult).toMatch(/Must narrate:/);
    expect(typed.engineResult).toMatch(/Speech event: you address Vessa/);
    expect(typed.engineResult).toMatch(/NPC reaction slot open for Vessa/);
  });

  it('typed speech to empty scene records empty-scene cue for the writer', () => {
    const typed = resolveTypedFreeText(emptySceneSalt(), 'I shout into the empty street, "Anyone home?"');
    expect(typed.engineResult).toMatch(/Speech event: you address the empty scene/);
    expect(typed.engineResult).toMatch(/No one present to answer/);
  });

  it('writerEngineResult turns speech receipts into plain narration (shared last-resort form)', () => {
    const plain = writerEngineResult(PRESENT_SPEECH);
    expect(plain).not.toMatch(CUE_CHROME);
    expect(plain).toMatch(/You spoke to Vessa/);

    const empty = writerEngineResult(EMPTY_SPEECH);
    expect(empty).not.toMatch(CUE_CHROME);
    expect(empty).toMatch(/You said, "Anyone home\?"/);
    expect(empty).toMatch(/You spoke to the empty scene/);
  });

  it('tabletop mud+speech fact becomes narration, never the fact sheet', () => {
    const plain = writerEngineResult(MUD_PLUS_SPEECH);
    expect(plain).not.toMatch(CUE_CHROME);
    expect(plain).toMatch(/opened graves|cart tracks/i);
    expect(plain).toMatch(/You spoke to Mayor Helga Brask/);
  });

  it('after covers, ledger-grounded writer prose is not killed by hook Location wording', () => {
    const salt = saltRoadAfterCovers(2);
    expect(missingPointerCardSlot(salt, SALT_WRITER)).toBe(false);
    expect(classifyBeatCommit(salt, SALT_WRITER, 'I bow to Vessa').accept).toBe(true);

    const keep = cursedKeepAfterCovers(3);
    expect(missingPointerCardSlot(keep, KEEP_WRITER)).toBe(false);
  });

  it('last-resort / governance never leave cue chrome on the page (present addressee)', () => {
    const state = saltRoadAfterCovers(2);
    state.completedEvent = buildCompletedEventPacket(state, 'Ask Vessa about the job', {
      engineResult: PRESENT_SPEECH,
    });

    const resort = lastResortStoryBody(state, state.completedEvent, 'Ask Vessa about the job');
    expect(resort.prose).not.toMatch(CUE_CHROME);

    const repaired = repairRejectedBeat(state, 'Dust hung in the quiet hall.', ['atmosphere-only']);
    expect(repaired.prose).not.toMatch(CUE_CHROME);

    const gov = applyGovernanceToProse(state, PRESENT_SPEECH, 'Ask Vessa about the job');
    expect(gov.prose).not.toMatch(CUE_CHROME);
  });

  it('last-resort / governance never leave cue chrome on the page (empty scene)', () => {
    const state = emptySceneSalt(2);
    state.completedEvent = buildCompletedEventPacket(state, 'Shout into the street', {
      engineResult: EMPTY_SPEECH,
    });

    const resort = lastResortStoryBody(state, state.completedEvent, 'Shout into the street');
    expect(resort.prose).not.toMatch(CUE_CHROME);

    const gov = applyGovernanceToProse(state, EMPTY_SPEECH, 'Shout into the street');
    expect(gov.prose).not.toMatch(CUE_CHROME);
  });

  it('player-visible turn bodies must not contain cue chrome (present and empty)', () => {
    const samples = [
      writerEngineResult(PRESENT_SPEECH),
      writerEngineResult(EMPTY_SPEECH),
      lastResortStoryBody(
        (() => {
          const s = saltRoadAfterCovers(2);
          s.completedEvent = buildCompletedEventPacket(s, 'Talk to Vessa', {
            engineResult: PRESENT_SPEECH,
          });
          return s;
        })(),
        undefined,
        'Talk to Vessa'
      ).prose,
      lastResortStoryBody(
        (() => {
          const s = emptySceneSalt(2);
          s.completedEvent = buildCompletedEventPacket(s, 'Call out', {
            engineResult: EMPTY_SPEECH,
          });
          return s;
        })(),
        undefined,
        'Call out'
      ).prose,
      applyGovernanceToProse(
        (() => {
          const s = cursedKeepAfterCovers(3);
          s.completedEvent = buildCompletedEventPacket(s, 'Ask Mayor Helga Brask about the lead', {
            engineResult: MUD_PLUS_SPEECH,
          });
          return s;
        })(),
        MUD_PLUS_SPEECH,
        'Ask Mayor Helga Brask about the lead'
      ).prose,
      applyGovernanceToProse(
        (() => {
          const s = emptySceneSalt(2);
          s.completedEvent = buildCompletedEventPacket(s, 'Call out', {
            engineResult: EMPTY_SPEECH,
          });
          return s;
        })(),
        EMPTY_SPEECH,
        'Call out'
      ).prose,
    ];
    for (const body of samples) {
      expect(body).not.toMatch(CUE_CHROME);
    }
  });
});
