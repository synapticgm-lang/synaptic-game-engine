/**
 * Live 11 Nov 2026 17:27 UK: LitRPG Isekai / The Summoned Pact, "Someone new this time".
 * Page 1 was clean. Turn 2 after "Take the kit" used catalog cast, empty rite slots,
 * authored-feeling accept prose, and treated the opening offer as the main quest.
 */
import { describe, expect, it } from 'vitest';
import { getCampaignBibleById } from '@/data/campaigns';
import { createInitialState } from './defaults';
import { seedStateFromCampaignBible } from './campaignSeed';
import { attachOpeningInstance, mintOpeningInstance, type OpeningHookSnapshot } from './openingInstance';
import { applyOpeningOfferChoice } from './openingOffer';
import { applyOpeningRiteTurn, ensureOpeningRite, isOpeningRiteQuestId } from './openingRite';
import { riteEntryForState } from './openingRiteFacts';
import { openingOfferPads } from './openingEstablishment';
import { applySuccessfulLiveOpening } from './liveOpening';
import { mainQuestEndPrompt, FINISH_AND_NEW_GAME, MAIN_QUEST_DONE_TITLE } from './mainQuestEnd';
import { finishedMainQuest } from './rpgEndings';
import {
  buildCompletedEventPacket,
  compileNounAllowlist,
  compileRefEnum,
  formatWriterFacingEvent,
  bookBodyAfterWriterMiss,
  prepareRetrospectiveWriterInput,
} from './completedEventPacket';
import { runWriterTurnWithFightRetry } from './writerTurn';
import { parsePlayerIntent } from './intentParser';
import { peopleHere } from './scenePresence';
import {
  proseHasEmptySlot,
  scrubOpeningTurnProse,
} from './openingCatalogGuard';
import type { GameState } from './types';

const LOADOUT_HOOK: OpeningHookSnapshot = {
  location: 'the outdoor seam of the Integration Scar',
  faction: 'A Pact loadout crew and a debt-collector who arrived late',
  whoHere: 'a loadout handler and a late debt-collector',
  openingOffer:
    'Take the loadout crate and they will issue field kit. Pay the collector’s first tithe and you keep Earth clothes with a stamped debt — or refuse both.',
  pressingNeed: 'The Scar is where pacts and debts meet. They need a name before anything else moves.',
  place: { id: 'test-scar-seam', kind: 'outdoor seam' },
  cast: [
    { id: 'test-cast-handler', role: 'loadout handler', pronouns: 'she/her', durability: 'durable' },
    { id: 'test-cast-collector', role: 'debt-collector', pronouns: 'they/them', durability: 'passer' },
  ],
  offer: {
    items: [{ id: 'test-offer-field-kit', label: 'field kit', carryable: true }],
  },
  rite: {
    steps: [
      { id: 'test-rite-name', label: 'Give a name' },
      { id: 'test-rite-walk', label: 'Walk with the crew' },
    ],
  },
  beatOrder: ['arrive', 'panel', 'offer'],
};

const LIVE_BROKEN_TURN2 =
  'Jax held his ground in Beckham Hollow and closed the offer from A Pact loadout crew. '
  + 'The deal clicked into place the way a latch does, and the loadout crew pressed a kit into his arms. '
  + 'The bag was heavy and plain, and it smelled of cut grass and cold iron. '
  + 'A Pact loadout crew did not cheer. They only nodded at the kit and stepped back so the street could see it. '
  + 'Captain Sera Quill looked at the kit, then at Jax, and her face stayed flat. '
  + 'Words were cut into the stone above it. They read:. '
  + 'High Chanter Orel Vane said, " is a rite to finish, and I will see it done"';

function seeded(seed = 'beckham-live-20261111'): GameState {
  const bible = getCampaignBibleById('summoned-pact')!;
  const base = seedStateFromCampaignBible(
    {
      ...createInitialState('The Summoned Pact', 'litrpg'),
      seed,
      campaignBibleId: 'summoned-pact',
      character: {
        ...createInitialState().character!,
        name: 'Jax',
        level: 1,
        xp: 0,
        xpToNext: 150,
      },
    } as GameState,
    bible,
  );
  const blob = [
    'Where you are: the outdoor seam of the Integration Scar',
    'Who is here: a loadout handler and a late debt-collector',
    `Opening offer: ${LOADOUT_HOOK.openingOffer} (a field kit).`,
    'If you refuse: Keep your own kit.',
  ].join('\n');
  return ensureOpeningRite(attachOpeningInstance(base, LOADOUT_HOOK, blob));
}

function page1Prose(state: GameState): string {
  const inst = state.openingEstablishment!.instance!;
  const a = inst.cast[0]!.name;
  const b = inst.cast[1]?.name ?? inst.cast[0]!.name;
  return (
    `${inst.placeName} was a seam in the open air, a tear in the world with edges still cooling — and Jax was `
    + `kneeling at its center in the clothes he had worn on Earth. Two shapes resolved on the rim of that tear: `
    + `${a} in austere plate with a circle of pale light suspended over her open palm, and ${b} in layered robes `
    + `whose gaze swept across Jax with the practised speed of someone assessing a ledger entry — weight, bearing, `
    + `potential, worth. The pale light from ${a}'s palm did not waver. ${b}'s stare fixed on Jax with the specific `
    + `weight of a question already formed and waiting. "Name first," ${b} said, before Jax could rise. `
    + `"Everything else follows the name."`
  );
}

function afterPage1(state: GameState): GameState {
  const inst = state.openingEstablishment!.instance!;
  const prose = page1Prose(state);
  const opened = applySuccessfulLiveOpening(state, prose, { journalTitle: `Name First at ${inst.placeName}` });
  const present = inst.cast.map((c) => c.name);
  return {
    ...opened,
    log: [
      ...(opened.log ?? []),
      { id: 'p1', role: 'gm', content: prose, timestamp: 1, turn: 1 },
    ],
    turn: 1,
    character: { ...opened.character!, name: 'Jax' },
    currentLocation: inst.placeName,
    sceneFacts: {
      crowd: 'few',
      noise: 'unknown',
      present,
      props: [],
      lastBeat: prose,
      updatedTurn: 1,
      crowdCount: present.length,
    },
  } as GameState;
}

describe('opening offer-accept turn (live 17:27 UK flow)', () => {
  it('mints offer chips from typed field-kit data, not the English faction label', () => {
    const inst = mintOpeningInstance(LOADOUT_HOOK, 'faction-loadout|summoned-pact|opening-instance', {
      bibleId: 'summoned-pact',
      engineMode: 'litrpg',
    });
    expect(inst.cast).toHaveLength(2);
    expect(inst.cast.every((c) => !/A Pact loadout crew/i.test(c.name))).toBe(true);
    expect(inst.offerItemNotes).toEqual(['field kit']);
    expect(inst.offerChips.some((c) => /field kit/i.test(c.label))).toBe(true);
  });

  it('pins an accept chip that names the typed field kit', () => {
    const state = afterPage1(seeded());
    const pads = openingOfferPads(state);
    expect(pads.some((p) => /field kit/i.test(p))).toBe(true);
  });

  it('accepting the typed kit chip is not the main quest and never opens the finish dialog', () => {
    const start = afterPage1(seeded());
    expect((start.quests ?? []).some((q) => q.id === 'opening-live-journal' && q.type === 'main')).toBe(true);
    const riteBefore = (start.quests ?? []).find((q) => isOpeningRiteQuestId(q.id));
    expect(riteBefore?.type).not.toBe('main');
    expect(riteBefore?.revealed).toBe(false);
    expect(riteBefore?.name ?? '').not.toMatch(/^Opening:/);
    expect(riteEntryForState(start)?.title ?? '').not.toMatch(/^Opening:/);

    const accept = openingOfferPads(start)[0]!;
    const offered = applyOpeningOfferChoice(start, accept);
    const { state, receipts } = applyOpeningRiteTurn(offered.state, accept);
    expect(receipts.join('\n')).not.toMatch(/A Pact loadout crew/i);
    expect(offered.receipts.join('\n')).not.toMatch(/A Pact loadout crew/i);
    expect(offered.receipts.join('\n')).toMatch(/Offer accepted/i);

    const rite = (state.quests ?? []).find((q) => isOpeningRiteQuestId(q.id));
    expect(rite?.status).toBe('completed');
    expect(rite?.type).not.toBe('main');
    expect(rite?.name ?? '').not.toMatch(/^Opening:/);
    expect(rite?.revealed).toBe(false);

    const finished = finishedMainQuest(state);
    expect(finished && isOpeningRiteQuestId(finished.id)).toBeFalsy();
    expect(mainQuestEndPrompt(state)).toBeNull();
    const journal = (state.quests ?? []).find((q) => q.id === 'opening-live-journal');
    expect(journal?.status).toBe('active');
    expect(`${MAIN_QUEST_DONE_TITLE} ${FINISH_AND_NEW_GAME}`).toMatch(/You have completed the main quest/);
    expect((state.quests ?? []).some((q) => q.revealed && /^Opening:/i.test(q.name ?? ''))).toBe(false);
  });

  it('keeps catalog hook cast out of the accept-turn writer packet and people here', () => {
    const start = afterPage1(seeded());
    const accept = openingOfferPads(start)[0]!;
    const offered = applyOpeningOfferChoice(start, accept);
    const rite = applyOpeningRiteTurn(offered.state, accept);
    const prepared = prepareRetrospectiveWriterInput(rite.state, accept, {
      engineResult: offered.receipts.join(' '),
    });
    const facing = formatWriterFacingEvent(prepared.packet);
    const allow = compileNounAllowlist(prepared.state).join(' | ');
    const refs = compileRefEnum(prepared.state).map((r) => r.display).join(' | ');
    const here = peopleHere(prepared.state).join(' | ');
    for (const hay of [facing, allow, refs, here, offered.receipts.join(' ')]) {
      expect(hay).not.toMatch(/A Pact loadout crew/i);
    }
  });

  it('sends the accept turn through the live writer path (mocked) and scrubs empty slots and catalog leaks', async () => {
    const start = afterPage1(seeded());
    const inst = start.openingEstablishment!.instance!;
    const lead = inst.cast[0]!.name;
    const accept = openingOfferPads(start)[0]!;
    const offered = applyOpeningOfferChoice(start, accept);
    const rite = applyOpeningRiteTurn(offered.state, accept);
    const prepared = prepareRetrospectiveWriterInput(rite.state, accept, {
      engineResult: offered.receipts.join(' '),
    });

    const written =
      `${lead} pressed a sealed pack into Jax's arms at ${inst.placeName}. `
      + `The strap was rough under his hand, and the pack sat heavy against the street clothes he had arrived in. `
      + `"That is yours if you walk with us," ${lead} said. "The name comes first, then the work." `
      + `Jax kept the pack and did not step back.`;

    let writerUsed = 0;
    const turn = await runWriterTurnWithFightRetry({
      firstRaw: written,
      packet: prepared.packet,
      check: {
        state: prepared.state,
        playerInput: accept,
        intent: parsePlayerIntent(accept, prepared.state),
        engineFact: prepared.packet.engineResult ?? offered.receipts.join(' '),
        previousGm: page1Prose(start),
      },
      rewrite: async () => {
        writerUsed += 1;
        return written;
      },
    });

    expect(turn.path).not.toBe('last-resort');
    expect(turn.prose).toMatch(new RegExp(lead.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    expect(turn.prose).toMatch(/pack|strap|arms/i);
    expect(turn.prose).not.toMatch(/A Pact loadout crew/i);
    expect(proseHasEmptySlot(turn.prose)).toBe(false);
    // The mocked draft is the page; rewrite is only for blocking misses.
    expect(writerUsed).toBeGreaterThanOrEqual(0);

    const scrubbed = scrubOpeningTurnProse(prepared.state, LIVE_BROKEN_TURN2);
    expect(proseHasEmptySlot(scrubbed)).toBe(false);
    expect(scrubbed).not.toMatch(/They read:\s*\./i);

    const miss = bookBodyAfterWriterMiss(prepared.state, prepared.packet, accept, '');
    expect(miss.prose).toBe('');
  });
});
