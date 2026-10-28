/**
 * T10T — drink-ask not reframed; content-free voice shell; origin beside scene + Quick start
 * patience; Story RPG quest steps do not tick from mere presence.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import {
  groundPlayerAction,
  parsePlayerIntent,
  stripUnauthorizedNpcSpeech,
  gmFacingPlayerAction,
} from './intentParser';
import { resolveOfferedChoices, commitOfferedPad } from './playTranscript';
import { ORIGIN_QUICK_START_CHIP, ORIGIN_OFFER_PATIENCE, settleOrigin } from './rules/rpgOrigin';
import { applyStoryRpgTurn } from './storyRpgProgress';
import type { GameState, Quest } from './types';

function lowmarketTalk(turn = 8): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  s.engineMode = 'litrpg';
  s.turn = turn;
  s.character = { ...s.character, name: 'Jax' };
  s.currentLocation = 'Lowmarket';
  s.sceneFacts = {
    crowd: 'sparse',
    noise: 'quiet',
    present: ['Osric Coyne', 'Maud Pike'],
    props: ['stall', 'counter', 'nail'],
    lastBeat: 'morning',
    updatedTurn: turn,
  };
  s.npcMemories = [
    {
      npcId: 'osric',
      npcName: 'Osric Coyne',
      disposition: 'neutral',
      facts: [],
      lastSeenTurn: turn,
      present: true,
      location: 'Lowmarket',
    },
  ];
  s.inventory = [
    { id: 'coin', name: 'coin', itemType: 'misc' },
    { id: 'knife', name: 'knife', itemType: 'weapon' },
  ] as GameState['inventory'];
  s.offeredPad = { turn: turn - 1, choices: ['Talk to Osric Coyne'] };
  return s;
}

function saltOriginOpen(turn = 3): GameState {
  const state = createInitialState(undefined, 'rpg') as GameState;
  state.campaignBibleId = 'salt-road-heist';
  state.engineMode = 'rpg';
  state.seed = '8003';
  state.turn = turn;
  state.currentLocation = 'Overhang on the Cliff Path';
  state.openingEstablishment = {
    ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
    complete: true,
    pending: [],
    answers: { ...(state.openingEstablishment?.answers ?? {}), name: 'Jax' },
  };
  state.character = { ...state.character, name: 'Jax', origin: undefined };
  state.activeEncounter = null;
  state.roundCombat = null;
  state.sceneFacts = {
    crowd: 'sparse',
    noise: 'wind',
    present: ['the scout'],
    props: ['loose boulders', 'ledge'],
    lastBeat: 'cliff',
    updatedTurn: turn,
  };
  return state;
}

function dropQuest(placeId: string): Quest {
  return {
    id: 'sr-drop-from-above',
    name: 'Drop from Above',
    status: 'active',
    revealed: true,
    type: 'main',
    objectives: [
      {
        id: 'o1',
        description: 'Rig the loose boulders on the overhang before the lantern-light of the cart rounds the bend.',
        completed: false,
        placeId,
      },
    ],
  } as Quest;
}

describe('T10T drink-ask reframe', () => {
  it('ask about a drink nearby stays talk and is never soft-rewritten away', () => {
    const line =
      'I lean against the stall post and ask if he knows any decent places to grab a drink nearby. I toss a coin into the air and catch it with a smirk.';
    const state = lowmarketTalk();
    expect(parsePlayerIntent(line, state).kind).toBe('talk');
    const grounded = groundPlayerAction(line, state, 'Osric Coyne wiped the stall.');
    expect(grounded.rewritten).toBe(false);
    expect(grounded.text).toBe(line);
    expect(grounded.text).not.toMatch(/instead of assuming|was not there|focus on what is actually here/i);
    expect(gmFacingPlayerAction(line, grounded)).toBe(line);

    const spin = 'I spin the nail between my fingers and ask if you know any decent spots to grab a drink nearby.';
    expect(parsePlayerIntent(spin, state).kind).toBe('talk');
    const g2 = groundPlayerAction(spin, state, '');
    expect(g2.rewritten).toBe(false);
    expect(g2.text).toBe(spin);
  });

  it('Attack from hiding still soft-rewrites when there is no ask', () => {
    const s = lowmarketTalk();
    const g = groundPlayerAction('Attack from hiding', s);
    expect(g.text).toMatch(/instead of assuming/);
  });
});

describe('T10T content-free voice shell', () => {
  it('voice rasped out / could not quite catch → said nothing', () => {
    const prose =
      "Jax let the nail fall. Osric Coyne's voice rasped out, words he could not quite catch. Osric did not look down.";
    const out = stripUnauthorizedNpcSpeech(
      prose,
      'I drop the nail and ask Maud if Osric has seen that ring.',
      'Jax',
      'Must narrate: drop the nail. Speech event: you address Osric Coyne. NPC reaction slot open for Osric Coyne.',
    );
    expect(out).not.toMatch(/rasped out|could not quite catch/i);
    expect(out).toMatch(/Osric Coyne said nothing/i);
    expect(out).toMatch(/did not look down/i);
  });
});

describe('T10T origin beside scene + patience', () => {
  it('origin chips sit beside scene options while open', () => {
    const open = saltOriginOpen(3);
    const offered = resolveOfferedChoices(open);
    expect(offered.some((c) => /^Origin:/i.test(c))).toBe(true);
    expect(offered).toContain(ORIGIN_QUICK_START_CHIP);
    expect(offered.some((c) => !/^Origin:/i.test(c) && c !== ORIGIN_QUICK_START_CHIP)).toBe(true);

    const committed = commitOfferedPad({ ...open, offeredPad: null });
    const labels = committed.offeredPad?.choices ?? [];
    expect(labels.some((c) => /^Origin:/i.test(c))).toBe(true);
    expect(labels.some((c) => !/^Origin:/i.test(c) && c !== ORIGIN_QUICK_START_CHIP)).toBe(true);
  });

  it(`Quick start auto-assigns after ${ORIGIN_OFFER_PATIENCE} turns without swallowing free play`, () => {
    let s = saltOriginOpen(3);
    s = settleOrigin(s, 'I glance at the scout').state;
    expect(s.originOfferTurn).toBe(3);
    expect(s.character.origin).toBeUndefined();

    s = { ...s, turn: 3 + ORIGIN_OFFER_PATIENCE };
    const turn = applyStoryRpgTurn(s, 'I shift my weight and glance back at the scout.');
    expect(turn.state.character.origin).toBeTruthy();
    expect(turn.receipts.some((r) => /^Origin:/i.test(r))).toBe(true);
    expect(turn.state.originOfferTurn).toBeNull();
  });
});

describe('T10T Story RPG quest presence gate', () => {
  it('being at the step placeId does not complete Rig the loose boulders on a glance', () => {
    const base = saltOriginOpen(2);
    const s = {
      ...base,
      character: { ...base.character, origin: 'soldier' as const },
      quests: [dropQuest('Overhang on the Cliff Path')],
    } as GameState;
    const out = applyStoryRpgTurn(s, 'I shift my weight and glance back at the scout.');
    expect(out.state.quests?.[0]?.objectives?.[0]?.completed).toBe(false);
    expect(out.receipts.join('\n')).not.toMatch(/Quest stage: Drop from Above/i);
  });

  it('Bring proof to Vessa does not complete from a shout at the overhang', () => {
    const base = saltOriginOpen(5);
    const s = {
      ...base,
      character: { ...base.character, origin: 'soldier' as const },
      quests: [
        {
          id: 'sr-vessa-favour',
          name: "Vessa's favour",
          status: 'active',
          revealed: true,
          type: 'main',
          objectives: [
            {
              id: 'bring',
              description: 'Bring proof to Vessa',
              completed: false,
              placeId: 'Overhang on the Cliff Path',
            },
          ],
        } as Quest,
      ],
    } as GameState;
    const out = applyStoryRpgTurn(s, 'I press my thumb against the cold stone wall and shout down.');
    expect(out.state.quests?.[0]?.objectives?.[0]?.completed).toBe(false);
    expect(out.receipts.join('\n')).not.toMatch(/Bring proof to Vessa/i);
  });
});
