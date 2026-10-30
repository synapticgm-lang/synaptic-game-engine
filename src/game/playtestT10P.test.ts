/**
 * T10P — fight pad ≤4 + scene-valid; fallback narrates 3rd-person from Must narrate (no raw I-paste);
 * invented PC quotes blocked; absent NPC → no one to answer; no stub "spoke the warning".
 */
import { describe, expect, it } from 'vitest';
import { applyOptionCooldown } from './sceneAffordances';
import { createInitialState } from './defaults';
import { resolveTypedFreeText } from './typedFreeText';
import { writerEngineResult } from './travelJourney';
import { stripUnauthorizedNpcSpeech } from './intentParser';
import { checkPlayCrimes } from './turnCheck';
import { FIGHT_CHIP_CAP } from './tabletop/combatChips';
import { WRITER_CUE_CHROME } from './writerCueLines';
import type { GameState } from './types';

function rpgFight(present: string[] = ['the thugs']): GameState {
  const s0 = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s0,
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    turn: 8,
    currentLocation: 'back streets',
    character: { ...s0.character, name: 'Jax' },
    sceneFacts: { ...(s0.sceneFacts ?? {}), present },
    activeEncounter: {
      name: 'the thugs',
      hp: 12,
      maxHp: 12,
      level: 1,
      phase: 'active',
      source: 'toll',
    } as unknown as GameState['activeEncounter'],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
  } as unknown as GameState;
}

function roadAlone(stalePresent: string[] = ['Edda Merrow']): GameState {
  const s0 = createInitialState(undefined, 'rpg') as GameState;
  return {
    ...s0,
    engineMode: 'rpg',
    campaignBibleId: 'cursed-keep',
    turn: 11,
    currentLocation: 'On the road between places',
    character: { ...s0.character, name: 'Jax' },
    sceneFacts: { ...(s0.sceneFacts ?? {}), present: stalePresent },
    journey: {
      from: 'Greyhollow Inn',
      to: 'Greyhollow Church',
      ground: 'back streets',
      legsDone: 1,
      legsTotal: 2,
      terrain: 'road',
      weather: 'clear',
      pace: 'normal',
    },
    npcMemories: [
      {
        npcId: 'edda',
        npcName: 'Edda Merrow',
        disposition: 'neutral',
        facts: [],
        lastSeenTurn: 9,
        location: 'Greyhollow Inn',
      },
    ],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
  } as unknown as GameState;
}

describe('T10P fight pads', () => {
  it('live fight pad keeps ≤4 encounter actions and drops out-of-scene affordances', () => {
    const state = rpgFight();
    const pad = applyOptionCooldown(state, [
      { label: 'Inspect chest', actionId: 'object:prop:chest:inspect', kind: 'affordance', slotCategory: 'act', rank: 40 },
      { label: 'Scout the caravan camp from cover', actionId: 'quest-route:salt:scout', kind: 'affordance', slotCategory: 'scene', rank: 50 },
      { label: 'Call on a standing contact for caravan word', actionId: 'quest-route:salt:contact', kind: 'affordance', slotCategory: 'scene', rank: 50 },
      { label: 'Face the thugs', actionId: 'thread:foe:the thugs:forward', kind: 'affordance', slotCategory: 'scene', rank: 90 },
      { label: 'Press the attack', actionId: 'fight:foe:the thugs:attack', kind: 'affordance', slotKind: 'fight', slotCategory: 'scene', rank: 100 },
      { label: 'Try to flee', actionId: 'fight:foe:the thugs:flee', kind: 'affordance', slotKind: 'fight', slotCategory: 'scene', rank: 99 },
      { label: 'Parley', actionId: 'fight:foe:the thugs:parley', kind: 'affordance', slotKind: 'fight', slotCategory: 'scene', rank: 98 },
      { label: 'Say something…', actionId: 'free-input:say', kind: 'free-input' },
      { label: 'Do something else…', actionId: 'free-input:do', kind: 'free-input' },
    ]);
    const labels = pad.map((c) => c.label);
    const fightish = labels.filter((l) => !/say something|do something else/i.test(l));
    expect(fightish.length).toBeLessThanOrEqual(FIGHT_CHIP_CAP);
    expect(labels).toContain('Press the attack');
    expect(labels).toContain('Try to flee');
    expect(labels).toContain('Parley');
    expect(labels.some((l) => /Inspect chest|Scout the caravan|standing contact/i.test(l))).toBe(false);
  });
});

describe('T10P fallback narration from engine fact', () => {
  it('Must narrate with an internal period does not paste raw first-person', () => {
    const fact =
      'Must narrate: I step back to avoid the knife. Speech event: you address the thugs. NPC reaction slot open for the thugs. Must narrate: ask Osric if he has a plan yet. I keep my hand near my dagger. Speech event: you address Osric Dunmore. No one present to answer.';
    const plain = writerEngineResult(fact);
    expect(plain).not.toMatch(WRITER_CUE_CHROME);
    expect(plain).not.toMatch(/\bI keep my hand\b/);
    expect(plain).toMatch(/step(?:ped)? back|avoid the knife/i);
    expect(plain).toMatch(/Osric Dunmore was not there to answer|No one was there to answer/i);
  });

  it('Face the thugs with no say narrates the act, not a stub speech line', () => {
    const typed = resolveTypedFreeText(rpgFight(), 'Face the thugs');
    // T10RC7 wraps Must narrate with already-shown; the chip act must still be the fact.
    expect(typed.engineResult).toMatch(/Must narrate:.*Face the thugs/i);
    expect(typed.engineResult).not.toMatch(/Speech event:/i);
    const plain = writerEngineResult(typed.engineResult);
    expect(plain).not.toMatch(/spoke the warning|You spoke to the thugs/i);
    expect(plain).toMatch(/[Ff]ace(?:d)? the thugs/);
  });
});

describe('T10P invented PC speech + stub shells', () => {
  it('stripUnauthorizedNpcSpeech drops invented PC quotes when the player typed none', () => {
    const line = 'I draw my dagger and point it at the nearest thug while asking if they are ready to move.';
    const prose =
      '"Well," Jax said to the thugs, keeping the blade level. "Are we going to move or are we going to stand here all day?" The nearest thug lifted both hands a little.';
    const out = stripUnauthorizedNpcSpeech(prose, line, 'Jax');
    expect(out).not.toMatch(/["“]Well["”]|Are we going to move/i);
    // Quote-led invented lines drop; a following narration sentence without quotes can remain.
    expect(out === '' || /lifted both hands|nearest thug/i.test(out)).toBe(true);
  });

  it('checkPlayCrimes flags invented PC speech for the writer gate', () => {
    const state = rpgFight();
    const prose =
      '"Well," Jax said to the thugs. "Are we going to move or are we going to stand here all day?"';
    const crimes = checkPlayCrimes(
      state,
      state,
      'I draw my dagger and ask if they are ready to move.',
      prose,
    );
    expect(crimes.p0.some((f) => f.kind === 'plays-player')).toBe(true);
  });

  it('spoke the warning with no quote is dropped as a stub shell', () => {
    const out = stripUnauthorizedNpcSpeech(
      'Jax raised their chin toward the thugs and spoke the warning plain and slow so none of them could miss it. The thugs shifted.',
      'Face the thugs',
      'Jax',
    );
    expect(out).not.toMatch(/spoke the warning/i);
    expect(out).toMatch(/thugs shifted/i);
  });
});

describe('T10P absent NPC on the road', () => {
  it('addressing Edda while she is at the inn records no one present to answer', () => {
    const typed = resolveTypedFreeText(
      roadAlone(),
      "I hold it out to Edda while asking if she's seen anything strange near the church.",
    );
    expect(typed.engineResult).toMatch(/No one present to answer/i);
    expect(typed.engineResult).not.toMatch(/NPC reaction slot open for Edda/i);
    const plain = writerEngineResult(typed.engineResult);
    expect(plain).toMatch(/not there to answer|No one was there to answer/i);
    expect(plain).not.toMatch(/Edda said/i);
  });
});
