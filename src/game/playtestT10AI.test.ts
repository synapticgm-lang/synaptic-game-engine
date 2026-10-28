/**
 * T10AI — crowd / role / faction addressees get reply beats; presence clears with empty prose;
 * chips retract; typed words are not swallowed; gate agrees with honest absence.
 * Evidence: tabletop s9811 T4–T10; LitRPG s9813 T2–T5.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { ensureSpokenAnswer } from './spokenAnswer';
import { givePcTheirQuote } from './intentParser';
import { checkActionFollowed, peopleHere, placeSaysEmpty } from './turnCheck';
import { applyCommittedNarrative, emptySceneFacts, extractSceneFacts } from './sceneFacts';
import { proseSaysEmpty } from './chipRules';
import { chipAddressee, chipProblem } from './chipLegality';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `npc-${over.npcName.replace(/\s+/g, '-').toLowerCase()}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    ...over,
  } as NpcMemory;
}

function millLane(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    character: { ...s.character, name: 'Jax', hp: 12, maxHp: 12 },
    turn: 5,
    currentLocation: 'Greyhollow mill lane',
    sceneFacts: {
      ...emptySceneFacts(5),
      crowd: 'present',
      noise: 'quiet',
      present: ['the exhausted faces'],
      props: ['pack strap', "miller's cart"],
      lastBeat: 'people are present',
      crowdCount: 3,
      anonymousRoles: ['miller'],
    },
    npcMemories: [
      mem({
        npcName: 'the exhausted faces',
        need: 'a way past the hunters',
        location: 'Greyhollow mill lane',
        introSpoken: true,
      }),
    ],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

function contractHall(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'litrpg') as GameState;
  return {
    ...s,
    engineMode: 'litrpg',
    campaignBibleId: 'summoned-pact',
    character: { ...s.character, name: 'Jax' },
    turn: 4,
    currentLocation: 'Contract Hall',
    sceneFacts: {
      ...emptySceneFacts(4),
      crowd: 'present',
      noise: 'quiet',
      present: ['the Two Crown engineers', 'the engineer'],
      props: ['spark-lamp'],
      lastBeat: 'people are present',
      crowdCount: 2,
      anonymousRoles: ['engineer'],
    },
    npcMemories: [
      mem({
        npcName: 'the Two Crown engineers',
        need: 'order under their roof',
        location: 'Contract Hall',
        introSpoken: true,
      }),
    ],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
      aloneArrival: false,
      card: {
        place: 'Contract Hall',
        cast: 'the Two Crown engineers',
        castNames: ['the Two Crown engineers'],
        props: ['spark-lamp'],
        names: [],
      },
    },
    ...over,
  } as GameState;
}

describe('T10AI crowd / role reply beats (s9811 / s9813)', () => {
  it('tabletop T5: typed ask to miller / exhausted faces lands a content reply', () => {
    const state = millLane();
    const ask =
      'I press my boot against the miller\'s pack strap and yank it forward. "You said there\'s a way past them, so which direction are we taking?" I glance back at the road leading toward Keep Gate.';
    const draft =
      'Jax pressed one boot down on the pack strap near the miller\'s bundle and dragged it forward across the dirt of Greyhollow mill lane. The loose end of the strap still lay under Jax\'s boot, and the road to Keep Gate waited behind them.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/exhausted faces|miller/i);
    expect(out.prose).toMatch(/["\u201c].+["\u201d]/);
    expect(out.prose).toMatch(/way past|hunters|watching|voice|direction|need|rest/i);
    expect(checkActionFollowed(state, state, ask, out.prose).p0.some((f) => f.kind === 'ignored-action')).toBe(
      false,
    );
  });

  it('LitRPG T4: stare at the engineer replaces bare silence with ledger content', () => {
    const state = contractHall();
    const ask =
      "I tap the cold glass of the spark-lamp against my teeth while staring down the engineer who won't look away.";
    const draft =
      'Jax lifted the spark-lamp and tapped its cold glass against their teeth, once, then again, as they stared at the engineer who would not look away. The engineer kept their eyes fixed on Jax and did not speak, and their two companions stayed stiff beside them in the Contract Hall light.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/["\u201c].+["\u201d]/);
    expect(out.prose).toMatch(/order under their roof|roof/i);
    expect(out.prose.match(/\bdid not speak\b/gi)?.length ?? 0).toBe(0);
  });

  it('LitRPG T5: said the words restores the typed quote; engineer gets a reply', () => {
    const state = contractHall({ turn: 5 });
    const ask =
      'I toss the spark-lamp onto the floor and point at the frozen engineer. "You gonna move, or do I have to break you out of this?" I step closer and nudge their boot with my toe.';
    const draft =
      'Jax tossed the spark-lamp onto the stone floor of Contract Hall, and it landed with a flat clack and sat there glowing. Jax pointed at the frozen engineer and said the words, and the sound of it filled the quiet room. Jax stepped closer and nudged the engineer\'s boot with one toe.';
    const withQuote = givePcTheirQuote(draft, ask, 'Jax');
    expect(withQuote).toMatch(/You gonna move/i);
    expect(withQuote).not.toMatch(/said the words/i);
    const out = ensureSpokenAnswer(withQuote, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/["\u201c].+["\u201d]/);
    expect(out.prose).toMatch(/engineer|Two Crown|order under their roof/i);
  });
});

describe('T10AI presence + chips + gate (empty agree)', () => {
  it('honest empty prose clears occupancy; Follow-up / Ask chips ghost', () => {
    const before = millLane({ turn: 9 });
    expect(peopleHere(before).some((p) => /exhausted faces/i.test(p))).toBe(true);
    const emptyProse =
      'Jax turned to ask the crowd which way to go, but the lane behind them held nobody at all. Jax wiped both hands on their trousers and stood still, waiting for an answer that did not come.';
    expect(proseSaysEmpty(emptyProse)).toBe(true);
    expect(placeSaysEmpty(before, emptyProse)).toBe(true);
    const facts = applyCommittedNarrative(before, emptyProse, 9);
    expect(facts.crowd).toBe('none');
    expect(facts.crowdCount ?? 0).toBe(0);
    expect(facts.present ?? []).toHaveLength(0);
    const after = { ...before, turn: 9, sceneFacts: facts } as GameState;
    expect(peopleHere(after).some((p) => /exhausted faces/i.test(p))).toBe(false);
    expect(chipAddressee('Follow up with the exhausted faces: staying free of the hunt')?.who).toMatch(
      /exhausted faces/i,
    );
    expect(chipProblem(after, 'Follow up with the exhausted faces: staying free of the hunt', emptyProse)?.kind).toBe(
      'ghost-chip',
    );
    expect(chipProblem(after, 'Ask the exhausted faces about staying free of the hunt', emptyProse)?.kind).toBe(
      'ghost-chip',
    );
  });

  it('Ask Two Crown needs the engineers present (faction name = person slot)', () => {
    const live = contractHall({ turn: 3 });
    expect(chipProblem(live, 'Ask Two Crown about a secret worth selling')).toBeNull();
    const empty = {
      ...live,
      sceneFacts: {
        ...live.sceneFacts!,
        crowd: 'none' as const,
        crowdCount: 0,
        present: [],
        anonymousRoles: [],
      },
      npcMemories: (live.npcMemories ?? []).map((m) => ({ ...m, present: false })),
      openingEstablishment: {
        ...live.openingEstablishment!,
        complete: true,
        sceneWritten: true,
        aloneArrival: true,
      },
    } as GameState;
    const emptyProse = 'The Contract Hall stood empty. Nobody was here to answer.';
    expect(chipProblem(empty, 'Ask Two Crown about a secret worth selling', emptyProse)?.kind).toBe(
      'ghost-chip',
    );
  });

  it('gate does not P0 ignored-action when prose and engine agree the addressee is gone', () => {
    const emptyFacts = extractSceneFacts(
      'The lane behind them held nobody at all. Nobody stood on the lane to hear it.',
      {
        ...emptySceneFacts(10),
        crowd: 'present',
        present: ['the exhausted faces'],
        crowdCount: 3,
      },
      10,
    );
    expect(emptyFacts.crowd).toBe('none');
    expect(emptyFacts.present ?? []).toHaveLength(0);
    const before = millLane({
      turn: 10,
      sceneFacts: emptyFacts,
      npcMemories: [],
    });
    const after = before;
    const act = 'I toss a stone at the miller\'s cart and shout, "Stop staring and pick a direction!"';
    const prose =
      'Jax picked a loose stone off Greyhollow mill lane and threw it hard at the miller\'s cart. The lane stays empty in front of Jax.';
    const res = checkActionFollowed(before, after, act, prose);
    expect(res.p0.map((f) => f.kind)).not.toContain('ignored-action');
  });

  it('gate still flags a real ignore when the crowd is present and nobody answers', () => {
    const before = millLane({ turn: 5 });
    const ask = 'I ask the exhausted faces which way they think we should go.';
    const prose = 'Jax looked down the mill lane. The strap still lay in the dirt.';
    const res = checkActionFollowed(before, before, ask, prose);
    expect(res.p0.map((f) => f.kind)).toContain('ignored-action');
  });
});
