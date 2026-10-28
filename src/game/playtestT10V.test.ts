/**
 * T10V — typed ask to a present NPC must keep/land an answer with content;
 * System ping returns a readout; physical I-acts are not talk turns.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState } from './types';
import { isTalkTurn } from './actionResolution';
import { isLedgerReadAction } from './completedEventPacket';
import {
  parsePlayerSteps,
  sheetContextFromState,
  stripUnauthorizedNpcSpeech,
} from './intentParser';
import { ensureSpokenAnswer } from './spokenAnswer';
import { resolveTypedFreeText } from './typedFreeText';
import { speechAddressCue } from './writerCueLines';
import { normalizeCommittedProse, type DraftCheck } from './writerTurn';

function hall(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  s.engineMode = 'litrpg';
  s.campaignBibleId = 'summoned-pact';
  s.character = { ...s.character, name: 'Jax' };
  s.currentLocation = 'Contract Hall';
  s.turn = 4;
  s.openingEstablishment = {
    pending: [],
    answers: { name: 'Jax' },
    complete: true,
    sceneWritten: true,
    aloneArrival: false,
    pickedHook:
      'Location: Contract Hall\nWho is here: Ash Court priests in soot-stained robes\nWhy: show the Mark\n',
    card: {
      place: 'Contract Hall',
      cast: 'Ash Court priests',
      castNames: ['Ash Court priests'],
      props: ['wrapped ember-blade'],
      names: [],
    },
  };
  s.sceneFacts = {
    crowd: 'present',
    noise: 'voices',
    present: ['bystanders'],
    props: ['wrapped ember-blade'],
    lastBeat: 'priests here',
    updatedTurn: 4,
    crowdCount: 4,
  };
  return { ...s, ...over };
}

function checkOf(state: GameState, playerInput: string, engineFact: string): DraftCheck {
  return {
    state,
    playerInput,
    intent: { kind: 'talk', label: 'Talk / protest', targets: [] },
    engineFact,
    previousGm: '',
  };
}

describe('T10V typed ask answers + System ping', () => {
  it('s8102 T4: crowd-slot strip keeps the priest answer (does not leave The The)', () => {
    const ask =
      "I run my thumb over the hilt's etchings and ask the priest if he knows who forged it. I let the blade hang loose in my grip.";
    const render =
      'Jax held the wrapped ember-blade in a loose grip inside Contract Hall and ran their thumb along the small etched marks cut into the hilt. The Ash Court priests said, "No one in this hall recalls the hand that forged that blade, and the mark on it is not one we keep in our records." Jax let the blade hang loose in their grip and looked from the priests to the wrapped cloth still bunched in their other hand.';
    const fact =
      'Must narrate: ask the priest if he knows who forged it. Speech event: you address bystanders. NPC reaction slot open for bystanders.';
    const out = stripUnauthorizedNpcSpeech(render, ask, 'Jax', fact);
    expect(out).toMatch(/forged that blade/i);
    expect(out).not.toMatch(/\bThe The\b/);
    const normalized = normalizeCommittedProse(render, checkOf(hall(), ask, fact));
    expect(normalized).toMatch(/forged that blade|said nothing|Ash Court priests said/i);
    expect(normalized).not.toMatch(/\bThe The\b/);
  });

  it('s8102 T4: ask the priest resolves to opening cast, not bystanders alone', () => {
    const state = hall();
    const ctx = sheetContextFromState(state);
    const present = ctx.present ?? [];
    expect(present.some((p) => /priest/i.test(p))).toBe(true);
    const read = parsePlayerSteps(
      "I run my thumb over the hilt's etchings and ask the priest if he knows who forged it.",
      ctx,
    );
    const talk = read.steps.find((st) => st.action === 'talk' || st.action === 'ask_about');
    expect(String(talk?.addressee ?? '')).toMatch(/priest/i);
    const cue = speechAddressCue(talk?.addressee ?? null, present);
    expect(cue).toMatch(/NPC reaction slot open for/i);
    expect(cue).not.toMatch(/bystanders/i);
  });

  it('s8103 T5: ensureSpokenAnswer lands content when the ask has no quote yet', () => {
    const state = hall({
      engineMode: 'rpg',
      campaignBibleId: 'salt-road-heist',
      currentLocation: 'back streets',
      sceneFacts: {
        crowd: 'present',
        noise: 'quiet',
        present: ['Idra Hollin', 'a traveler'],
        props: [],
        lastBeat: '',
        updatedTurn: 5,
      },
      npcMemories: [
        {
          npcId: 'idra',
          npcName: 'Idra Hollin',
          disposition: 'neutral',
          facts: [],
          lastSeenTurn: 4,
          present: true,
          location: 'back streets',
          motiveLines: ['Bandits hit carts here most mornings, so stay off the low path.'],
        },
      ],
      journey: {
        from: 'Salt Road Waystation',
        to: 'Consul Caravan Camp',
        legsDone: 1,
        legsTotal: 2,
        ground: 'Back streets',
        terrain: 'streets',
        startedTurn: 4,
        encounter: {
          kind: 'traveler',
          name: 'Idra Hollin',
          engaged: false,
          escaped: false,
          lost: false,
        },
      },
    } as unknown as Partial<GameState>);
    const ask =
      "I glance at the rider beside me and ask if she's seen any ambushes on this stretch. I tighten my grip on the knife handle and keep moving forward.";
    const draft =
      'Jax walked on along the back streets next to the rider and glanced sideways at her face. Jax closed their hand tighter around the knife handle.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/["\u201c].+["\u201d]|said nothing/i);
    expect(out.prose).toMatch(/Idra|traveler|Bandits|said nothing/i);
  });

  it('s8103 T9: flick grease is not a talk turn (no motive dump)', () => {
    const line =
      "I flick the grease from my knife onto the sleeping dog's nose while leaning against a wagon wheel.";
    expect(isTalkTurn(line, { kind: 'other', label: 'Free action', targets: [] })).toBe(false);
  });

  it('s8102 T6: Ping the System for bearings is a ledger read with a System fact', () => {
    expect(isLedgerReadAction('Ping the System for bearings')).toBe(true);
    const state = hall({ turn: 6 });
    const typed = resolveTypedFreeText(state, 'Ping the System for bearings');
    expect(typed.engineResult).toMatch(/System readout|Changed since|First read|panel|Name:/i);
    expect(typed.engineResult).not.toMatch(/Must narrate: Ping the System/i);
  });

  it('speechAddressCue: sole bystanders get no reaction slot', () => {
    expect(speechAddressCue(null, ['bystanders'])).toMatch(/No one present to answer/);
    expect(speechAddressCue(null, ['bystanders', 'Ash Court priests'])).toMatch(
      /NPC reaction slot open for Ash Court priests/,
    );
  });
});



