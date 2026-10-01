/**
 * 29z9c â€” later post-writer steps must keep a clean draft whole. Lines are quoted from
 * docs/orders/t100-29z9/MORNING-REVIEW.md (cursed-keep / salt-road-heist / summoned-pact, T100 seed 70).
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { applyProseWarden, scrubInventedCrowdSize } from './proseWarden';
import { classifyTokenLine, dropTypedNameAfterToken, knownProperNames, renderTokenBeat, type TokenBeat } from './tokenProse';
import { normalizeOpeningHookCard, openingCastNames } from './openingEstablishment';
import { SUMMONED_PACT_PHASE4_HOOKS as summonedPactPhase4Hooks } from '../data/campaigns/summonedPactPhase4Hooks';
import { applyFactLocks } from './factLocks';
import { trimRecycledSentences } from './semanticLoopDetector';
import { splitProseSentences } from './proseSentences';
import { compileRefEnum, isPaintableRefLabel } from './completedEventPacket';
import { stanceEventFromAction } from './npcStance';
import { inventedPersonNamesNotOnAllowlist, obeyLedgerNouns } from './ledgerNounObey';
import { applyGovernanceToProse } from './qualityGovernance';
import { writerWordsGuard } from './writerWords';
import { polishMentions } from './mentionVariety';
import { runWarden } from './warden';
import type { GameState, NpcMemory } from './types';

function npc(name: string, location: string): NpcMemory {
  return {
    npcId: name.toLowerCase().replace(/\s+/g, '-'),
    npcName: name,
    disposition: 'neutral',
    facts: [],
    lastSeenTurn: 1,
    location,
  } as NpcMemory;
}

function townState(here: string, people: string[]): GameState {
  const s = createInitialState(undefined, 'dnd');
  return {
    ...s,
    turn: 30,
    currentLocation: here,
    character: { ...s.character, name: 'Jax' },
    npcMemories: people.map((p) => npc(p, here)),
  };
}

describe('1 â€” a group is never turned into "no one"', () => {
  const t33 =
    'Jax straightened from the rubble and swept the whole west wall with a slow turn, cataloguing gate traffic, stairwells, and the two figures standing nearest.';
  const t46 =
    'They kept to the narrow lanes and counted the turns, letting the crowd thin until only their own steps answered back.';
  const t55 = 'Jax kept their head down and let the crowd read them as nobody worth stopping.';

  it('summoned-pact T33: "the two figures standing nearest" survives at any tracked count', () => {
    for (const n of [0, 1, 2, 3, 20]) {
      expect(scrubInventedCrowdSize(t33, n, n > 0)).toBe(t33);
      expect(applyProseWarden(t33, { crowdSize: n, crowdPresent: n > 0 })).toContain('the two figures standing nearest');
    }
  });

  it('summoned-pact T46 and salt-road T55: a bare "the crowd" is not a headcount', () => {
    for (const n of [0, 1, 3]) {
      expect(scrubInventedCrowdSize(t46, n, n > 0)).toBe(t46);
      expect(scrubInventedCrowdSize(t55, n, n > 0)).toBe(t55);
    }
  });

  it('an inflated stated headcount still shrinks, never to "no one"', () => {
    expect(scrubInventedCrowdSize('A hundred people cheer.', 3, true)).not.toMatch(/hundred/i);
    expect(scrubInventedCrowdSize('A hundred people cheer.', 0, false)).not.toMatch(/no one/i);
  });
});

describe('2 â€” "the stranger" and present townsfolk lines are kept', () => {
  const beatOf = (text: string): TokenBeat => ({ refs: [], lines: [{ fn: 'action', text }] });
  const strangerLines = [
    'The stranger stopped short, boots scuffing once, and turned a shadowed face toward the sound.',
    '"Morning," the stranger answered, slowing enough to show a weathered face and a bundle of wrapped kindling under one arm.',
    'The stranger slowed, hand resting easy on a belt-knife, and answered with a nod and a short, flat hello.',
    'Jax gave the stranger a short nod and walked on past them, keeping their eyes ahead and their hands easy at their sides.',
  ];

  it('cursed-keep T19/T39 and salt-road T39/T40 stranger lines pass the line gate', () => {
    const known = knownProperNames(townState('the Millstone road', []));
    for (const text of strangerLines) {
      const beat = beatOf(text);
      expect(classifyTokenLine(beat.lines[0]!, beat, [], known)).toEqual({ ok: true });
    }
  });

  it('cursed-keep T34 and salt-road T34: present townsfolk named in a line are not inventions', () => {
    const keep = townState('the Millstone inn', ['Edda Merrow', 'Tilde Fenwick']);
    const t34 = beatOf(
      'Edda Merrow set her cup down hard enough to slop it, and Tilde Fenwick watched Jax over the rim of hers without a word.'
    );
    expect(classifyTokenLine(t34.lines[0]!, t34, [], knownProperNames(keep)).ok).toBe(true);

    const salt = townState('the waystation yard', ['Brannoc Rudd']);
    const s34 = beatOf('Brannoc Rudd straightened as Jax came into the yard, and the afternoon light went long across the planks.');
    expect(classifyTokenLine(s34.lines[0]!, s34, [], knownProperNames(salt)).ok).toBe(true);
  });

  it('a name the ledger does not hold still fails the line', () => {
    const beat = beatOf('Jax nodded, and Orel Vane stepped out of the doorway.');
    expect(classifyTokenLine(beat.lines[0]!, beat, [], knownProperNames(townState('the yard', []))).ok).toBe(false);
  });
});

describe('3 â€” motion words are never cut out of a sentence', () => {
  const lines = [
    'They kept moving toward Consul Caravan Camp, taking the long way round instead of the open salt road.',
    'Jax looked both ways, nothing moving on either side of the road.',
    'They went slowly, turning aside from every pool of lit ground.',
    'They walked on, their eyes moving across every dark doorway.',
    'Jax turned slowly, taking the whole courtyard in at once.',
  ];

  it('salt-road T38/T35/T78/T85 and summoned-pact T65 survive the warden on a passive intent', () => {
    for (const kind of ['observe', 'rest', 'search', 'travel']) {
      for (const line of lines) {
        expect(applyProseWarden(line, { selectedIntentKind: kind })).toBe(line);
      }
    }
  });

  it('salt-road T38 survives token paint', () => {
    const beat: TokenBeat = {
      refs: [{ tok: 't2', id: 'place:consul-caravan-camp', use: 'place' }],
      lines: [{ fn: 'action', text: 'They kept moving toward @t2, taking the long way round instead of the open salt road.' }],
    };
    const out = renderTokenBeat(beat, [{ tok: 't2', id: 'place:consul-caravan-camp', klass: 'place', display: 'Consul Caravan Camp' }]);
    expect(out).toBe(lines[0]);
  });
});

describe('4 â€” no space before a closing quote, no quote cut in half', () => {
  const t57 =
    'The traveler shifted their pack, looked Jax over once, and said, "I\'ve got it, friend, but I won\'t forget you asked." The road went quiet behind them.';
  const t80 = '"I\'ve got one token and no coin," Jax said. "Take it or let me walk to the camp."';
  const t2 =
    '"What do you want from me?" they asked it, and the words came out thin in the open country with no one around to hear. The blue panel held its light. Jax waited by the wall.';

  it('salt-road T57/T80 keep `asked."` and both halves of the line through fact locks', () => {
    const state = townState('the salt road', []);
    expect(applyFactLocks(state, t57, 'Ask the traveler')).toBe(t57);
    expect(applyFactLocks(state, t80, 'Offer the token')).toBe(t80);
  });

  it('summoned-pact T2: a repeated quote never drops the half after "?"', () => {
    const recent = ['Jax had already asked, "What do you want from me?" and got nothing back.'];
    const { text } = trimRecycledSentences(t2, recent);
    expect(text).not.toMatch(/^they asked it/);
    if (text.includes('What do you want from me?')) {
      expect(text).toContain('"What do you want from me?" they asked it');
    }
    expect(text).not.toMatch(/\. "/);
  });

  it('a quoted question and its dialogue tag are one sentence', () => {
    expect(splitProseSentences(t2)[0]).toBe(
      '"What do you want from me?" they asked it, and the words came out thin in the open country with no one around to hear.'
    );
    expect(splitProseSentences(t80)).toEqual(['"I\'ve got one token and no coin," Jax said.', '"Take it or let me walk to the camp."']);
    expect(splitProseSentences(t57)[0]!.endsWith('asked."')).toBe(true);
  });
});

describe('5 â€” junk card labels are never painted as a place or a person', () => {
  const junk = ['alone on the stone outline of a building that is gone', 'Nobody here â€” only a footprint in the grass', 'the thief beside you'];
  const real = ['Consul Caravan Camp', 'Salt Road Waystation', 'Idra Fenwick', 'Oskar the Woodcutter', 'the ferry inn at Thornferry'];

  it('label shape rejects the three review labels and keeps real names', () => {
    for (const l of junk) expect(isPaintableRefLabel(l)).toBe(false);
    for (const l of real) expect(isPaintableRefLabel(l)).toBe(true);
  });

  it('a junk place name never enters the ref enum', () => {
    const s = townState('the west wall', []);
    const state: GameState = {
      ...s,
      places: [
        { name: junk[0]!, exits: [] } as unknown as NonNullable<GameState['places']>[number],
        { name: 'Consul Caravan Camp', exits: [] } as unknown as NonNullable<GameState['places']>[number],
      ],
    };
    const displays = compileRefEnum(state).map((r) => r.display);
    expect(displays).not.toContain(junk[0]);
  });
});

describe('6 â€” stance moves when the help is done, not offered', () => {
  const state = townState('the Millstone inn', ['Edda Merrow']);

  it('an offer of help is no stance event', () => {
    expect(stanceEventFromAction(state, 'Offer Edda Merrow honest help')).toBeNull();
    expect(stanceEventFromAction(state, 'Tell Edda I can help with the sacks')).toBeNull();
  });

  it('help done is', () => {
    expect(stanceEventFromAction(state, 'Help Edda carry the sacks in')?.event.kind).toBe('helped');
  });
});

/** 29z9d â€” lines from the seed-71 T10 check (docs/orders/t10-29z9c). */
describe('29z9d â€” seed-71 check lines', () => {
  it('cursed-keep T3: dropping an invented-name sentence takes its whole quote', () => {
    const body =
      'Jax rested both hands on the damp oak of the counter and asked the innkeep plainly who they were. The innkeep set down the rag and said, "Name\'s Wenna Barrow. Kept this house eleven years, and I\'ll keep it eleven more if the hill stays where it is." The rain thickened against the leaded glass.';
    const out = obeyLedgerNouns(body, townState('Greyhollow Inn', [])).prose;
    expect(out).not.toContain('Kept this house');
    expect((out.match(/"/g) ?? []).length % 2).toBe(0);
    expect(out).toContain('asked the innkeep plainly who they were.');
  });

  it('cursed-keep T2/T3: a line naming the innkeep already in the refs passes the gate', () => {
    const enumRefs = [
      { tok: 't1', id: 'here', klass: 'place' as const, display: 'Greyhollow Inn' },
      { tok: 't2', id: 'cast:the-innkeep', klass: 'person' as const, display: 'the innkeep' },
    ];
    const beat: TokenBeat = {
      refs: [{ tok: 't2', id: 'cast:the-innkeep', use: 'speaker' }],
      lines: [
        { fn: 'action', text: 'Jax set both hands flat on the wet oak counter and asked the innkeep straight what the town wanted from them.' },
        { fn: 'react', text: 'The innkeep glanced at the hearth, where three backs stayed turned, and slid a room key across the wood without being asked.' },
      ],
    };
    for (const line of beat.lines) expect(classifyTokenLine(line, beat, enumRefs, [])).toEqual({ ok: true });
    const noCast: TokenBeat = { refs: [], lines: [{ fn: 'action', text: 'The guard waved Jax through without a word.' }] };
    expect(classifyTokenLine(noCast.lines[0]!, noCast, [], []).ok).toBe(false);
  });

  it('salt-road T9: the player\'s own item name is not an invented name', () => {
    const s = townState('Salt Road Waystation', []);
    const state: GameState = {
      ...s,
      inventory: [{ id: 'crew-token', name: 'Crew Token', type: 'misc', quantity: 1 } as unknown as GameState['inventory'][number]],
    };
    const line = 'Jax moved at an easy walk with the Crew Token riding in their pocket, unhurried but reading every doorway and roofline they passed.';
    const beat: TokenBeat = { refs: [], lines: [{ fn: 'action', text: line }] };
    expect(classifyTokenLine(beat.lines[0]!, beat, [], knownProperNames(state)).ok).toBe(true);
    expect(obeyLedgerNouns(line, state).prose).toBe(line);
  });

  it('cursed-keep T4/T10: a line naming the player\'s own shortsword survives fact locks', () => {
    const s = townState('Greyhollow Inn', []);
    const armed: GameState = {
      ...s,
      inventory: [{ id: 'sw', name: 'Worn Iron Shortsword', type: 'weapon', quantity: 1, equipped: true } as unknown as GameState['inventory'][number]],
    };
    const t4 =
      "Three tables sat empty and one chair by the fire had been pulled out and never pushed back, and Jax's hand drifted to the pommel of the Worn Iron Shortsword without being told to.";
    const t10 = 'Jax walked steady for near two hours with a hand loose near Worn Iron Shortsword, watching the hedgerows thin and the light go amber and long.';
    expect(applyFactLocks(armed, t4, 'Look around')).toBe(t4);
    expect(applyFactLocks(armed, t10, 'Travel toward Greyhollow Inn')).toBe(t10);
    expect(applyFactLocks({ ...s, inventory: [] }, 'Jax drew the longsword.', 'Look around')).toBe('');
  });

  it('salt-road T5 / summoned-pact T10: "before committing" in a writer line is not the canned scan chip', () => {
    const a = 'Jax worked along the back wall of the Consul counting-house back door, reading each way out before committing to one.';
    const b = 'Jax slowed at the threshold and took the room in before committing a single step past it.';
    expect(applyProseWarden(a, { selectedIntentKind: 'observe' })).toBe(a);
    expect(applyProseWarden(b, { selectedIntentKind: 'observe' })).toBe(b);
    expect(applyProseWarden('"I scan the exits before committing," you state. The hall stays quiet.', {})).not.toMatch(/before committing/);
  });

  it('summoned-pact T7/T8: the dead-foe rewrite leaves the killing blow and other people alone', () => {
    const kill = { name: 'the thugs', outcome: 'victory' as const, turn: 7, remains: true };
    const blow = 'Jax closed the distance and pressed the attack, driving their weight forward into the last thug before he could reset his stance.';
    const nod =
      'Idra Fenwick was the first to clock them, a courier with a satchel strap across her chest, and she tipped her chin in a small, even nod as if she had been waiting on exactly this arrival.';
    expect(applyProseWarden(blow, { lastKill: kill, currentTurn: 7 })).toBe(blow);
    expect(applyProseWarden(nod, { lastKill: kill, currentTurn: 8 })).toBe(nod);
    expect(applyProseWarden('The last thug stirs and lunges at Jax.', { lastKill: kill, currentTurn: 9 })).toMatch(/fallen/);
  });

  it('salt-road T5/T6/T9: a sentence opening on a held place is not an invented person', () => {
    const allow = ['Back streets', 'Salt Road Waystation', 'Safehouse Alley', 'Consul', 'Jax'];
    for (const s of [
      'The Back streets ran narrow and cold between shuttered stalls, and morning light had only just started to reach the cobbles.',
      'The Salt Road Waystation still lay somewhere ahead past these last few turns, and the morning was already getting on.',
      'The Salt Road Waystation gap sat open and busy to the north, while Safehouse Alley ran dark and quiet off to the east.',
    ]) expect(inventedPersonNamesNotOnAllowlist(s, allow)).toEqual([]);
    expect(inventedPersonNamesNotOnAllowlist('The Orel Vane stepped out of the doorway.', allow)).toEqual(['Orel Vane']);
  });

  it('cursed-keep T6 / summoned-pact T7 check 4: the morning clock is a note on a writer turn, not a word swap', async () => {
    const base = townState('Open road', []);
    const s = { ...base, worldLedger: { ...(base.worldLedger as any), clock: { day: 0.2, week: 0 } } } as GameState;
    const t6 = 'Jax walked the whole morning with the Keep Gate somewhere ahead of them, and the two hours passed without trouble of any kind.';
    const t7 = 'Jax stood over the thugs with split knuckles and a purse of gold that had not been theirs an hour ago, and the west wall still waited ahead.';
    const repaired = await runWarden(s, [], t6, 'Walk on');
    expect(repaired.scrubbedNarrative ?? t6).not.toContain('hours passed');
    for (const line of [t6, t7]) {
      const scrub = (await runWarden(s, [], line, 'Walk on')).scrubbedNarrative ?? line;
      const guard = writerWordsGuard(true);
      expect(guard.step('runWarden', line, scrub)).toBe(line);
      if (scrub !== line) expect(guard.notes[0]).toMatch(/^Writer words kept: runWarden/);
    }
  });

  it('cursed-keep T7 / summoned-pact T8 check 6: a fact lock does not delete a writer sentence', () => {
    const base = townState('Keep Gate', ['Wenna Barrow']);
    const s = {
      ...base,
      turn: 6,
      sceneFacts: { ...(base.sceneFacts as any), crowd: 'present' },
      worldLedger: { ...(base.worldLedger as any), clock: { day: 0.2, week: 0 } },
    } as GameState;
    const t7 = 'The chain on Keep Gate was thick and old, and no one here had yet said what they wanted from a stranger at this hour.';
    const t8 = 'Tilde Crane added that the gate crews had gone quiet an hour ago, and she did not like a quiet gate.';
    for (const line of [t7, t8]) {
      const scrub = applyFactLocks(s, line, 'Walk on');
      expect(scrub).toBe('');
      const guard = writerWordsGuard(true);
      expect(guard.step('applyFactLocks', line, scrub)).toBe(line);
      expect(guard.notes[0]).toMatch(/^Writer words kept: applyFactLocks would drop "/);
      expect(writerWordsGuard(false).step('applyFactLocks', line, scrub)).toBe('');
    }
  });

  it('salt-road T10 check 6: scenery crates on a writer turn are not rewritten to "the area"', () => {
    const line = 'Jax stepped past the last crate into Safehouse Alley, where the alley narrowed to a damp brick throat between two shuttered buildings.';
    const scrub = applyProseWarden(line);
    expect(scrub).toContain('past the area');
    const guard = writerWordsGuard(true);
    expect(guard.step('applyProseWarden', line, scrub)).toBe(line);
    expect(guard.notes[0]).toMatch(/^Writer words kept: applyProseWarden would change "/);
  });

  it('salt-road T11 check 8: "@t5 Hobb Dunmore" paints the name once', () => {
    const refs = [
      { tok: 't5', id: 'present:hobb-dunmore', klass: 'person' as const, display: 'Hobb Dunmore' },
      { tok: 't6', id: 'present:sefa-crane', klass: 'person' as const, display: 'Sefa Crane' },
    ];
    const beat: TokenBeat = {
      refs: [{ tok: 't5', id: 'present:hobb-dunmore', use: 'actor' }, { tok: 't6', id: 'present:sefa-crane', use: 'speaker' }],
      lines: [
        { fn: 'react', text: "@t5 Hobb Dunmore unfolded his arms and drifted two steps closer, watching Jax's hands the way a man watches a sum he has not finished adding." },
        { fn: 'speech', text: '@t6 Sefa Crane lifted her head off the cold cup and said, low and even, that whatever was behind that door had better be worth the noise of a snapped pin.' },
      ],
    } as TokenBeat;
    const out = renderTokenBeat(beat, refs as any);
    expect(out).toContain('Hobb Dunmore unfolded his arms');
    expect(out).toContain('Sefa Crane lifted her head');
    expect(out).not.toMatch(/Hobb Dunmore Hobb Dunmore|Sefa Crane Sefa Crane/);
    expect(dropTypedNameAfterToken('@t5 nodded to Hobb Dunmore.', (t) => (t === 't5' ? 'Hobb Dunmore' : undefined)))
      .toBe('@t5 nodded to Hobb Dunmore.');
  });

  it('summoned-pact T3 check 8: the frozen-ford card never names "Cinderflow Who"', () => {
    const card = summonedPactPhase4Hooks.find((h) => typeof h !== 'string' && h.location === 'the frozen ford on the Cinderflow');
    const picked = normalizeOpeningHookCard(card!).text;
    expect(picked).toContain('Cinderflow\nWho is here');
    const base = createInitialState(undefined, 'litrpg');
    const s = {
      ...base,
      openingEstablishment: { ...(base.openingEstablishment as any), pickedHook: picked },
    } as GameState;
    expect(openingCastNames(s).map((n) => n.toLowerCase())).not.toContain('cinderflow who');
    expect(openingCastNames(s).join('|')).not.toMatch(/\bWho\b/);
  });

  it('a stage that only adds an engine line around the writer words passes through', () => {
    const line = 'Jax stepped past the last crate into Safehouse Alley.';
    const guard = writerWordsGuard(true);
    expect(guard.step('ensureEncounterSpawnPreface', line, `A shape moved at the alley mouth. ${line}`)).toBe(
      `A shape moved at the alley mouth. ${line}`
    );
    expect(guard.notes).toEqual([]);
  });

  it('summoned-pact T10 check 6: "The Weighing Cup" keeps its article after "a leaning sign marked"', () => {
    const refs = [{ tok: 't4', id: 'place:the-weighing-cup', klass: 'place' as const, display: 'The Weighing Cup' }];
    const line = 'Cinderflow Road narrowed toward the harbor and let Jax out where a leaning sign marked The Weighing Cup against the coming dark.';
    expect(polishMentions(line, refs as any)).toMatch(/marked [Tt]he Weighing Cup/);
    expect(polishMentions('Jax lingered on the mud-rutted The Weighing Cup porch.', refs as any)).toBe('Jax lingered on the mud-rutted Weighing Cup porch.');
  });

  it("cursed-keep T8 check 5: the player's held shortsword is not rewritten to fists", async () => {
    const base = townState('Open road', []);
    const line = "The traveler slowed as they passed, glanced once at Jax's sword, and offered a short nod before carrying on toward the gate.";
    const armed = {
      ...base,
      character: { ...base.character, name: 'Jax' },
      inventory: [{ id: 'w1', name: 'Worn Iron Shortsword', rarity: 'Common', quantity: 1, equipped: true, itemType: 'weapon' }],
    } as GameState;
    const kept = await runWarden(armed, [], line, 'Walk on');
    expect(kept.scrubbedNarrative ?? line).toContain("at Jax's sword");
    const unarmed = { ...armed, inventory: [] } as GameState;
    const scrubbed = await runWarden(unarmed, [], line, 'Walk on');
    expect(scrubbed.scrubbedNarrative ?? line).not.toContain("Jax's sword");
  });

  it('salt-road T10 check 3: a named person token after an article fails the gate', () => {
    const enumRefs = [
      { tok: 't1', id: 'here', klass: 'place' as const, display: 'Safehouse Alley' },
      { tok: 't2', id: 'present:hobb-dunmore', klass: 'person' as const, display: 'Hobb Dunmore' },
      { tok: 't3', id: 'cast:the-innkeep', klass: 'person' as const, display: 'the innkeep' },
    ];
    const beat = (text: string) => ({
      refs: [
        { tok: 't1', id: 'here', use: 'place' },
        { tok: 't2', id: 'present:hobb-dunmore', use: 'actor' },
        { tok: 't3', id: 'cast:the-innkeep', use: 'actor' },
      ],
      lines: [{ fn: 'place', text }],
    }) as any;
    const misuse = beat('Jax came off the @t2 run of crooked streets and into @t1, where the shade pooled deep.');
    expect(classifyTokenLine(misuse.lines[0], misuse, enumRefs as any)).toEqual({ ok: false, reason: 'article-person' });
    const named = beat('@t2 looked up from a crate where he was sorting rusted hinges.');
    expect(classifyTokenLine(named.lines[0], named, enumRefs as any).ok).toBe(true);
    const role = beat('Jax nodded to the @t3 and walked on into @t1.');
    expect(classifyTokenLine(role.lines[0], role, enumRefs as any).ok).toBe(true);
  });

  it('salt-road T7 check 2: the short form of a held name is not an invented person', () => {
    const allow = ['Brannoc Rudd', 'Salt Road Waystation', 'Jax'];
    expect(
      inventedPersonNamesNotOnAllowlist('Whatever Brannoc wanted, he had not yet decided whether Jax was worth the asking.', allow)
    ).toEqual([]);
    expect(inventedPersonNamesNotOnAllowlist('Whatever Orel Vane wanted, he kept it.', allow).length).toBeGreaterThan(0);
  });

  it('cursed-keep T2 / summoned-pact T11: a writer turn keeps "the stranger" and "a figure" in its own words', () => {
    const s = townState('Greyhollow Inn', []);
    const state: GameState = {
      ...s,
      sceneFacts: { ...(s.sceneFacts ?? {}), present: ['Wall Sergeant'] } as GameState['sceneFacts'],
    };
    const t2 = 'Jax held the innkeep\'s gaze and asked again, slower, what they wanted from the stranger who just walked in wet.';
    const t11 =
      'Half a street ahead, past a shuttered front, a figure in a travel-stained coat worked a stubborn latch with both hands, on their own errand and paying Jax no mind yet.';
    for (const [line, input] of [[t2, 'Ask what they want'], [t11, 'Walk on']]) {
      const scrub = applyGovernanceToProse(state, line, input).prose;
      expect(writerWordsGuard(true).step('applyGovernanceToProse', line, scrub)).toBe(line);
    }
  });

  it('summoned-pact T9: mention polish leaves the writer\'s own words and the word before a label', () => {
    const refs = [
      { tok: 't1', id: 'here', klass: 'place' as const, display: 'Back streets' },
      { tok: 't4', id: 'place:the-weighing-cup', klass: 'place' as const, display: 'The Weighing Cup' },
    ];
    const out = polishMentions(
      'Jax let Back streets take them. The back streets gave nothing back, and the lane bent toward The Weighing Cup, still a walk away.',
      refs
    );
    expect(out).toContain('The back streets gave nothing back');
    expect(out).toMatch(/the lane bent toward the Weighing Cup/i);
    expect(polishMentions('Jax walked the mud-rutted The Weighing Cup road.', refs)).toContain('the mud-rutted Weighing Cup');
  });
});
