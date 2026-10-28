/**
 * T10B — engine speech-slot facts must never become the player-visible story.
 * Evidence: Salt Road T2/T3 + Cursed Keep T3 (2026-10-27 typed-mix) painted
 * "Speech event… slot open for the writer" after missing-pointer-slot last-resort.
 */
import { describe, expect, it } from 'vitest';
import { classifyBeatCommit, missingPointerCardSlot, repairRejectedBeat } from './beatCommitGate';
import { buildCompletedEventPacket, lastResortStoryBody } from './completedEventPacket';
import { createInitialState } from './defaults';
import { applyGovernanceToProse } from './qualityGovernance';
import { writerEngineResult } from './travelJourney';
import { resolveTypedFreeText } from './typedFreeText';
import type { GameState } from './types';

const SPEECH_LEAK = /Speech event|slot open for the writer/i;

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

const SALT_WRITER =
  "Jax bent low toward the silver pouch at Vessa's belt, the way a person bows to a small king, and straightened up again inside Salt Road Waystation. Vessa said, \"The Lord of Padlocks does not see people just because they ask nicely, so tell me why he should see you at all.\" Vessa kept one hand resting flat on the pouch while they watched Jax's face and waited for the reason.";

const KEEP_WRITER =
  'Jax knelt by the opened graves and traced the deep cart ruts in the mud, then stood and turned to Father Aldous. Father Aldous said, "Someone hauled those coffins uphill toward the keep with a heavy cart, and I saw the ruts myself before dawn."';

describe('T10B speech fact never reaches the player', () => {
  it('typed speech still records the engine speech event for the writer', () => {
    const typed = resolveTypedFreeText(saltRoadAfterCovers(), 'Ask Vessa what the job pays');
    expect(typed.engineResult).toMatch(/Speech event: you address Vessa/);
    expect(typed.engineResult).toMatch(/slot open for the writer/);
  });

  it('writerEngineResult turns speech receipts into plain narration (shared last-resort form)', () => {
    const raw =
      'Speech event: you address Vessa. NPC reaction slot open for the writer. Speech event: you address the room. NPC reaction slot open for the writer.';
    const plain = writerEngineResult(raw);
    expect(plain).not.toMatch(SPEECH_LEAK);
    expect(plain).toMatch(/You spoke to Vessa/);
    expect(plain).toMatch(/You spoke to the room/);
  });

  it('tabletop mud+speech fact becomes narration, never the fact sheet', () => {
    const raw =
      'You check the mud around the opened graves for heavy cart tracks leading uphill. Speech event: you address Mayor Helga Brask. NPC reaction slot open for the writer.';
    const plain = writerEngineResult(raw);
    expect(plain).not.toMatch(SPEECH_LEAK);
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

  it('last-resort / governance never leave Speech event or slot-open on the page', () => {
    const state = saltRoadAfterCovers(2);
    const engineFact =
      'Speech event: you address Vessa. NPC reaction slot open for the writer. Speech event: you address the room. NPC reaction slot open for the writer.';
    state.completedEvent = buildCompletedEventPacket(state, 'Ask Vessa about the job', {
      engineResult: engineFact,
    });

    const resort = lastResortStoryBody(state, state.completedEvent, 'Ask Vessa about the job');
    expect(resort.prose).not.toMatch(SPEECH_LEAK);

    const repaired = repairRejectedBeat(state, 'Dust hung in the quiet hall.', ['atmosphere-only']);
    expect(repaired.prose).not.toMatch(SPEECH_LEAK);

    const gov = applyGovernanceToProse(state, engineFact, 'Ask Vessa about the job');
    expect(gov.prose).not.toMatch(SPEECH_LEAK);
  });

  it('player-visible turn bodies must not contain speech-slot chrome', () => {
    const samples = [
      writerEngineResult(
        'Speech event: you address Vessa. NPC reaction slot open for the writer.'
      ),
      lastResortStoryBody(
        (() => {
          const s = saltRoadAfterCovers(2);
          s.completedEvent = buildCompletedEventPacket(s, 'Talk to Vessa', {
            engineResult:
              'Speech event: you address Vessa. NPC reaction slot open for the writer.',
          });
          return s;
        })(),
        undefined,
        'Talk to Vessa'
      ).prose,
      applyGovernanceToProse(
        (() => {
          const s = cursedKeepAfterCovers(3);
          s.completedEvent = buildCompletedEventPacket(s, 'Ask Mayor Helga Brask about the lead', {
            engineResult:
              'You check the mud around the opened graves for heavy cart tracks leading uphill. Speech event: you address Mayor Helga Brask. NPC reaction slot open for the writer.',
          });
          return s;
        })(),
        'You check the mud around the opened graves for heavy cart tracks leading uphill. Speech event: you address Mayor Helga Brask. NPC reaction slot open for the writer.',
        'Ask Mayor Helga Brask about the lead'
      ).prose,
    ];
    for (const body of samples) {
      expect(body).not.toMatch(SPEECH_LEAK);
    }
  });
});
