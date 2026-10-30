/**
 * T10Q2 — seated NPC content ask: ledger agenda is filler unless it answers;
 * reply-vs-filler owner lands a spoken reply (quote / speech verb) so turn-ignored-action drops.
 * Evidence: rpg s9601 T169 / T211; litrpg s9711 T41 / T44 (seated). Absent NPCs = RC8.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { ensureSpokenAnswer } from './spokenAnswer';
import { checkActionFollowed, openingRestatesPlayerAct } from './turnCheck';
import { emptySceneFacts } from './sceneFacts';
import { buildCompletedEventPacket, lastResortStoryBody } from './completedEventPacket';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc:${over.npcName}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    ...over,
  } as NpcMemory;
}

function rpg(over: Partial<GameState> = {}): GameState {
  return {
    ...(createInitialState(undefined, 'rpg') as GameState),
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    character: { ...(createInitialState(undefined, 'rpg') as GameState).character, name: 'Jax' },
    turn: 169,
    currentLocation: 'Salt Road Waystation',
    sceneFacts: {
      ...emptySceneFacts(),
      present: ['Vessa'],
      crowd: 'sparse',
      crowdCount: 1,
      updatedTurn: 169,
    },
    openingEstablishment: { pending: [], answers: { name: 'Jax' }, complete: true, sceneWritten: true },
    ...over,
  } as GameState;
}

describe('T10Q2 seated ask reply vs filler', () => {
  it('T169: juggling quote to seated Vessa strips shelter agenda filler and lands a spoken reply', () => {
    const state = rpg({
      npcMemories: [mem({ npcName: 'Vessa', need: 'shelter and food' })],
    });
    const ask =
      'I kick the pebble into the dirt and grin at the man in the salt coat. "Steady hands are good, but have you ever tried juggling while riding a donkey?';
    // Live miss: unrelated traveler/Vessa agenda filler, no answer to the juggling ask.
    const draft =
      'Jax kicked a pebble off the packed dirt of Salt Road Waystation and sent it skipping into the dust by the wall. A traveler stood at the edge of the firelight, cloak heavy with rain. Vessa made clear that they needed shelter and food.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.prose).not.toMatch(/made clear that they needed shelter and food/i);
    expect(out.prose).toMatch(/Vessa said,\s*["\u201c]/i);
    expect(checkActionFollowed(state, state, ask, out.prose).p0.some((f) => f.kind === 'ignored-action')).toBe(
      false,
    );
  });

  it('T211 shape: seated Ysolde content toss+quote gets a spoken reply, not unrelated need filler', () => {
    const state = rpg({
      turn: 211,
      currentLocation: 'Consul Caravan Camp',
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Ysolde Sallow'],
        crowd: 'sparse',
        crowdCount: 1,
        updatedTurn: 211,
      },
      npcMemories: [mem({ npcName: 'Ysolde Sallow', need: 'a charge who will follow' })],
    });
    const ask = 'I spin the pistol between my fingers and toss it to Ysolde. "Catch if you can, merchant.';
    const draft =
      'Jax spun the pistol once across their knuckles and flicked it toward Ysolde Sallow at Consul Caravan Camp.';
    const out = ensureSpokenAnswer(draft, state, ask);
    // Quote has no ? — not a content ask; subject reaction / ledger chip path may still voice.
    // When only a toss+imperative quote, a spoken line or acknowledging act must land.
    expect(out.prose).toMatch(/Ysolde Sallow/i);
    expect(
      /Ysolde Sallow said,\s*["\u201c]/i.test(out.prose)
      || /Ysolde Sallow (?:pressed for|made clear|held out)/i.test(out.prose)
      || /Ysolde Sallow\b[^.!?]{0,80}\b(?:caught|catch|hand|looked|watched|grinned)/i.test(out.prose),
    ).toBe(true);
    expect(checkActionFollowed(state, state, ask, out.prose).p0.some((f) => f.kind === 'ignored-action')).toBe(
      false,
    );
  });

  it('T44 shape: coin slide + stare at seated Lisle replaces silence with a spoken reply', () => {
    const state = rpg({
      turn: 44,
      engineMode: 'litrpg',
      campaignBibleId: 'summoned-pact',
      currentLocation: 'The Weighing Cup',
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Lisle Tew'],
        crowd: 'sparse',
        crowdCount: 1,
        updatedTurn: 44,
      },
      npcMemories: [mem({ npcName: 'Lisle Tew', aliases: ['Lisle'], need: 'a quiet table' })],
    });
    const ask = 'I slide a silver coin across the table toward Lisle while staring at her hands.';
    const draft =
      'Jax set one silver coin on the wood and pushed it toward Lisle Tew without taking their eyes off her hands. Lisle said nothing.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.prose).not.toMatch(/Lisle(?: Tew)? said nothing/i);
    expect(out.prose).toMatch(/Lisle Tew (?:said,\s*["\u201c]|pressed for|made clear|held out)/i);
    expect(checkActionFollowed(state, state, ask, out.prose).p0.some((f) => f.kind === 'ignored-action')).toBe(
      false,
    );
  });

  it('chip Talk still voices ledger need (not starved by reply-vs-filler)', () => {
    const state = rpg({
      npcMemories: [mem({ npcName: 'Vessa', need: 'a buyer who pays' })],
    });
    const out = ensureSpokenAnswer(
      'Jax turned to face Vessa and waited.',
      state,
      'Talk to Vessa',
    );
    expect(out.prose).toMatch(/Vessa made clear that they needed a buyer who pays/i);
  });

  it('last-resort does not echo the player juggling act', () => {
    const state = rpg({
      npcMemories: [mem({ npcName: 'Vessa', need: 'shelter and food' })],
    });
    const ask =
      'I kick the pebble into the dirt and grin at the man in the salt coat. "Steady hands are good, but have you ever tried juggling while riding a donkey?';
    const packet = buildCompletedEventPacket(state, ask, {
      engineResult:
        'Must narrate: [already shown; do not restate — write the consequence] kick the pebble. Speech event: you address Vessa. NPC reaction slot open for Vessa.',
    });
    const resort = lastResortStoryBody(state, packet, ask);
    expect(openingRestatesPlayerAct(resort.prose, ask)).toBe(false);
    expect(resort.prose).not.toMatch(/juggling while riding a donkey/i);
    expect(resort.prose).toMatch(/Vessa said,\s*["\u201c]|Vessa /i);
  });
});
