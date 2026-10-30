/**
 * T10AF — present addressed NPCs must answer typed lines with content (ledger / deflection),
 * never stack stock motive quotes on silence, never splice "said nothing that…".
 * Evidence: cursed-keep s9501 T53/T82/T126–131; salt-road s9601 T51/T96–97/T146–150.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import type { GameState, NpcMemory } from './types';
import { ensureSpokenAnswer, stripSpeakerSilence } from './spokenAnswer';
import { stripUnauthorizedNpcSpeech } from './intentParser';
import { checkActionFollowed } from './turnCheck';
import { emptySceneFacts } from './sceneFacts';
import { seat } from './presentAuthority';

function mem(over: Partial<NpcMemory> & { npcName: string }): NpcMemory {
  return {
    npcId: over.npcId ?? `town-${over.npcName.replace(/\s+/g, '-').toLowerCase()}`,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    met: true,
    present: true,
    aliases: [],
    ...over,
  } as NpcMemory;
}

function keepGate(over: Partial<GameState> = {}): GameState {
  const steward = mem({
    npcName: 'the steward',
    npcId: 'town-the-steward',
    location: 'Keep Gate',
    roleHint: 'refugee',
    need: 'a safe place to rest',
    goal: { motivation: 'Protection', target: 'who sent you through the oak' },
    introSpoken: true,
    sheet: {
      job: 'steward',
      motive: 'Win fairly',
      fear: '',
      speech: '',
      secret: '',
      place: 'town',
    },
  });
  return {
    ...(createInitialState(undefined, 'dnd') as GameState),
    engineMode: 'dnd',
    campaignBibleId: 'cursed-keep',
    character: {
      name: 'Jax',
      hp: 12,
      maxHp: 12,
      level: 1,
      xp: 0,
      attributes: { STR: 17, DEX: 13, CON: 15, INT: 8, WIS: 12, CHA: 10 },
      srd: {
        speciesId: 'human',
        classId: 'fighter',
        backgroundId: 'soldier',
        skillProfs: [],
        expertise: [],
      },
    },
    turn: 131,
    currentLocation: 'Keep Gate',
    sceneFacts: {
      ...emptySceneFacts(),
      crowd: 'present',
      noise: 'quiet',
      present: ['the steward'],
      props: [],
      lastBeat: 'people are present; outdoors',
      updatedTurn: 131,
      crowdCount: 2,
    },
    npcMemories: [steward],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

function bribeMarket(over: Partial<GameState> = {}): GameState {
  const dunn = mem({
    npcName: 'Dunn Rudd',
    location: 'Bribe Market',
    need: 'a safe place to rest',
    introSpoken: true,
    sheet: {
      job: 'enforcer',
      motive: 'Command quiet respect',
      fear: '',
      speech: '',
      secret: '',
      place: 'town',
    },
  });
  const osric = mem({
    npcName: 'Osric Wyle',
    location: 'Bribe Market',
    need: 'the delivery in their care',
    offer: 'the parcel still in his bag',
    introSpoken: true,
  });
  return {
    ...(createInitialState(undefined, 'rpg') as GameState),
    engineMode: 'rpg',
    campaignBibleId: 'salt-road-heist',
    character: { ...(createInitialState(undefined, 'rpg') as GameState).character, name: 'Jax' },
    turn: 147,
    currentLocation: 'Bribe Market',
    sceneFacts: {
      ...emptySceneFacts(),
      crowd: 'sparse',
      present: ['Dunn Rudd', 'Osric Wyle'],
      props: [],
      lastBeat: 'market',
      updatedTurn: 147,
      crowdCount: 2,
    },
    npcMemories: [dunn, osric],
    openingEstablishment: {
      pending: [],
      answers: { name: 'Jax' },
      complete: true,
      sceneWritten: true,
    },
    ...over,
  } as GameState;
}

describe('T10AF steward silence + stock motive (s9501 T127/T131)', () => {
  it('T127 typed ask replaces "gave no answer at all" with ledger need (not stock fair-and-square)', () => {
    const state = keepGate({ turn: 127 });
    const ask =
      'I wipe my hands on my tunic and glare at the steward. "Did you find anything while I was checking for traps?" I rest my hand on my sword hilt, waiting for an answer.';
    const draft =
      'Jax wiped their hands on their tunic, looked hard at the steward, and asked if they had found anything while Jax checked the gate for traps. Jax rested one hand on their sword hilt and waited for an answer. The steward gave no answer at all and stayed where they were. The steward stood still by the gate, hands empty, eyes fixed on Jax\'s hand.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.answer.status).toBe('added');
    // T10RC1 — agenda nouns are indirect beats, not "I need…" telegram quotes.
    expect(out.prose).toMatch(/the steward (?:said,\s*["\u201c]|pressed for|made clear(?: that)? they needed|held out)/i);
    expect(out.prose).toMatch(/safe place to rest|who sent you through the oak/i);
    expect(out.prose).not.toMatch(/said,\s*["\u201c]I (?:want|need|can offer)/i);
    expect(out.prose).not.toMatch(/fair and square/i);
    expect(out.prose.match(/\b(?:gave no answer|said nothing|did not say a single word)\b/gi)?.length ?? 0).toBe(0);
    expect(checkActionFollowed(state, state, ask, out.prose).p0.some((f) => f.kind === 'ignored-action')).toBe(
      false,
    );
  });

  it('T131 does not stack stock motive on "did not say a single word"', () => {
    const state = keepGate();
    const ask =
      'I snatch the thread from his nose and tie it around my finger. "Answer me, or I start counting your teeth.';
    const draft =
      'Jax snatched the thread from the nose of the steward and tied it around their finger, then they told the steward to answer them or they would start counting teeth. The steward did not say a single word, and they only looked at Jax in silence. The knotted thread sits tight on Jax\'s finger, and the gate shadow stretches long across the road behind the steward.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.prose).toMatch(/the steward (?:said,\s*["\u201c]|pressed for|made clear(?: that)? they needed|held out)/i);
    expect(out.prose).toMatch(/safe place to rest|who sent you through the oak/i);
    expect(out.prose).not.toMatch(/said,\s*["\u201c]I (?:want|need|can offer)/i);
    expect(out.prose).not.toMatch(/fair and square/i);
    expect(out.prose).not.toMatch(/did not say a single word/i);
  });
});

describe('T10AF salt-road ask target + Follow up + splice (s9601)', () => {
  it('T51 ask Ysolde lands Ysolde\'s reply (not brick-only / offered no help)', () => {
    const ysolde = mem({
      npcName: 'Ysolde Sallow',
      location: 'Harbor Fence',
      need: 'the guard line held',
      introSpoken: true,
    });
    const state = {
      ...(createInitialState(undefined, 'rpg') as GameState),
      engineMode: 'rpg',
      campaignBibleId: 'salt-road-heist',
      character: { ...(createInitialState(undefined, 'rpg') as GameState).character, name: 'Jax' },
      turn: 51,
      currentLocation: 'Harbor Fence',
      sceneFacts: {
        ...emptySceneFacts(),
        present: ['Ysolde Sallow'],
        crowd: 'sparse',
        props: ['loose brick'],
        lastBeat: 'fence',
        updatedTurn: 51,
        crowdCount: 1,
      },
      npcMemories: [ysolde],
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax' },
        complete: true,
        sceneWritten: true,
      },
    } as GameState;
    const ask =
      'I tap the loose brick against my palm and ask Ysolde if she thinks the guard is watching me or just staring at the horizon.';
    const draft =
      'Jax reached for the loose brick at their feet, but it slipped away from their fingers and they never got it off the ground. Ysolde Sallow watched the failed grab the whole way, cold and unmoved, and offered no help.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/Ysolde Sallow (?:said,\s*["\u201c]|pressed for|made clear(?: that)? they needed|held out)/i);
    expect(out.prose).not.toMatch(/said,\s*["\u201c]I (?:want|need|can offer)/i);
    expect(out.prose).not.toMatch(/offered no help/i);
    // Content landed for the addressed NPC (indirect agenda beat is the T10RC1 owner).
    expect(out.prose).toMatch(/guard line held|said,\s*["\u201c]/i);
  });

  it('T97 Bertil ask replaces "said nothing at all" with content', () => {
    // Stale generic road stamp vs trip HERE — seat writer must stamp place to HERE (not reader trust).
    const bertil = mem({
      npcName: 'Bertil Pike',
      location: 'On the road between places',
      need: 'why the Toll Stone hums',
      introSpoken: true,
      present: false,
    });
    const here = 'On the road between Bribe Market and Checkpoint Rise';
    let state = {
      ...(createInitialState(undefined, 'rpg') as GameState),
      engineMode: 'rpg',
      character: { ...(createInitialState(undefined, 'rpg') as GameState).character, name: 'Jax' },
      turn: 97,
      currentLocation: here,
      sceneFacts: {
        ...emptySceneFacts(),
        present: [],
        crowd: 'none',
        props: [],
        lastBeat: 'road',
        updatedTurn: 97,
        crowdCount: 0,
      },
      npcMemories: [bertil],
      openingEstablishment: {
        pending: [],
        answers: { name: 'Jax' },
        complete: true,
        sceneWritten: true,
      },
    } as GameState;
    state = seat(state, 'Bertil Pike');
    expect(state.sceneFacts?.present).toContain('Bertil Pike');
    expect(state.npcMemories?.find((m) => m.npcName === 'Bertil Pike')?.location).toBe(here);
    const ask =
      "I flick a pebble at the ground near Bertil Pike's boots and ask if he knows why the Toll Stone is humming.";
    const draft =
      'Jax bent down on the open road and flicked a small pebble so it skipped once and stopped right by the boots of Bertil Pike. Jax asked Bertil if he knew why the Bribe Market Toll Stone was humming. Bertil looked down at the pebble, then back up at Jax, and said nothing at all.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.prose).toMatch(/Bertil Pike (?:said,\s*["\u201c]|pressed for|made clear(?: that)? they needed|held out)/i);
    expect(out.prose).not.toMatch(/said,\s*["\u201c]I (?:want|need|can offer)/i);
    expect(out.prose).not.toMatch(/said nothing/i);
    expect(out.prose).not.toMatch(/No one was there to answer/i);
  });

  it('T146 Follow up with Osric answers from ledger delivery (not said-nothing splice)', () => {
    const state = bribeMarket({ turn: 146 });
    const ask = 'Follow up with Osric Wyle: the delivery in their care';
    const draft =
      'Jax turned to Osric Wyle and asked about the delivery still in his care, and Osric said nothing that the parcel was still in his bag. Dunn Rudd watched the two of them and said nothing, but his eyes stayed on Osric\'s bag the whole time.';
    const scrubbed = stripUnauthorizedNpcSpeech(draft, ask, 'Jax');
    expect(scrubbed).not.toMatch(/said nothing that/i);
    const out = ensureSpokenAnswer(scrubbed, state, ask);
    expect(out.answer.status).toBe('added');
    expect(out.prose).toMatch(/Osric Wyle (?:said,\s*["\u201c]|pressed for|made clear(?: that)? they needed|held out)/i);
    expect(out.prose).toMatch(/delivery|parcel/i);
    expect(out.prose).not.toMatch(/said,\s*["\u201c]I (?:want|need|can offer)/i);
    expect(out.prose).not.toMatch(/said nothing that/i);
  });

  it('T147 strip orphan "nothing at all" after PC quote; Dunn replies from ledger not stock quiet-coming', () => {
    const state = bribeMarket();
    const ask =
      'I snatch the pale object from beneath the stone and toss it at Dunn\'s feet. "Check your pockets, Rudd, or I\'ll check them for you.';
    const draft =
      'Jax bent down and snatched the pale object out from under the loose stone at Bribe Market, then straightened and threw it so it landed right at Dunn Rudd\'s feet. Jax looked straight at Dunn and told him to check his pockets, or Jax would check them for him. Jax said, "Check your pockets, Rudd, or I\'ll check them for you." nothing at all, but his eyes dropped to the pale object on the ground and stayed there.';
    const cleaned = stripSpeakerSilence(draft, { label: 'Dunn Rudd' });
    expect(cleaned).not.toMatch(/nothing at all/i);
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.prose).toMatch(/Dunn Rudd (?:said,\s*["\u201c]|pressed for|made clear(?: that)? they needed|held out)/i);
    expect(out.prose).toMatch(/safe place to rest/i);
    expect(out.prose).not.toMatch(/said,\s*["\u201c]I (?:want|need|can offer)/i);
    expect(out.prose).not.toMatch(/go quiet when they hear I am coming/i);
    expect(out.prose).not.toMatch(/["\u201d]\s*nothing at all/i);
  });

  it('T150 Ask Dunn about rest lands content need (not gave nothing back)', () => {
    const state = bribeMarket({ turn: 150, sceneFacts: {
      ...emptySceneFacts(),
      present: ['Dunn Rudd'],
      crowd: 'sparse',
      props: [],
      lastBeat: 'market',
      updatedTurn: 150,
      crowdCount: 1,
    }});
    const ask = 'Ask Dunn Rudd about a safe place to rest';
    const draft =
      'Jax asked Dunn Rudd for a safe place to rest, pitching their voice low so it would not carry across Bribe Market. Dunn shut their mouth and gave Jax nothing back, just a hard flat look that lasted too long.';
    const out = ensureSpokenAnswer(draft, state, ask);
    expect(out.prose).toMatch(/Dunn Rudd (?:said,\s*["\u201c]|pressed for|made clear(?: that)? they needed|held out)/i);
    expect(out.prose).toMatch(/safe place to rest/i);
    expect(out.prose).not.toMatch(/said,\s*["\u201c]I (?:want|need|can offer)/i);
    expect(out.prose).not.toMatch(/gave Jax nothing back|said nothing/i);
  });
});

describe('T10AF answered→said-nothing splice', () => {
  it('rewrites whole clause when answered that… would splice', () => {
    const out = stripUnauthorizedNpcSpeech(
      'Jax turned to Osric Wyle and asked about the delivery, and Osric answered that the parcel was still in his bag.',
      'Follow up with Osric Wyle: the delivery in their care',
      'Jax',
    );
    expect(out).not.toMatch(/said nothing that/i);
    expect(out).toMatch(/Osric(?: Wyle)? said nothing\./i);
  });

  it('keeps T10S bare answered → said nothing without eating the next sentence', () => {
    const out = stripUnauthorizedNpcSpeech(
      "Silas went still in Jax's grip, and then he answered. The pew creaked.",
      'I grab Silas by the collar. "Pick your head up, Thorne."',
      'Jax',
    );
    expect(out).not.toMatch(/\banswered\b/i);
    expect(out).toMatch(/said nothing/i);
    expect(out).toMatch(/pew creaked/i);
  });
});
