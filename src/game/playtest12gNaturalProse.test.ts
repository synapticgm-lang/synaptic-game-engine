/**
 * Batch 12g — natural Look/Wait beats, hall-talk want/cost, lastKill pads,
 * E-talk spoken fallback, Ashrise book prose.
 * Silent Look/Wait stay Silent. No SNAPSHOT/CRAFT. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { BUILD_STAMP } from './runManifest';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { shopItemById } from './cosmeticCatalog';
import { OPENING_HOOK_DECKS } from '@/data/campaigns/openingHookDecks';
import { getCampaignBibleById } from '@/data/campaigns';
import type { OpeningBeatCard } from '@/data/campaigns/types';
import { createInitialState } from './defaults';
import { emptySceneFacts } from './sceneFacts';
import {
  assemblePacketStitch,
  buildCompletedEventPacket,
  prepareRetrospectiveWriterInput,
} from './completedEventPacket';
import {
  openingAlreadyToldLine,
  openingSpokenWant,
  resolveOpeningHookPick,
  shortCardCost,
  shortCardWant,
} from './openingEstablishment';
import { stitchOpeningContinue } from './openingStitch';
import { spokenTalkFallback } from './talkEnvelope';
import { compileChoices } from './choiceCompiler';
import { compileGraphChoiceLabels, enumerateLegalEdges } from './graphChoices';
import { hasMetBefore } from './npcMemory';
import type { GameState } from './types';

const ENGINE = /You looked through|the room waited|You waited at \S|Silence held the question|No one listed on the ledger answered/i;

function ruin(over: Partial<GameState> = {}): GameState {
  const state = createInitialState('Loiter', 'litrpg');
  return {
    ...state,
    campaignBibleId: 'summoned-pact',
    turn: 8,
    currentLocation: 'half-collapsed loft',
    openingEstablishment: { ...state.openingEstablishment!, complete: true, sceneWritten: true },
    sceneFacts: {
      ...emptySceneFacts(8),
      props: ['crate'],
      present: ['Wren Holt'],
      searchedEmpty: [],
    },
    ...over,
  };
}

function greyTavern(): GameState {
  const base = createInitialState('Cursed Keep', 'dnd', undefined, 'grey-tavern-12g');
  return {
    ...base,
    campaignBibleId: 'cursed-keep',
    engineMode: 'dnd',
    currentLocation: 'Greyhollow tavern common room',
    character: { ...base.character, name: 'Jax' },
    turn: 4,
    openingEstablishment: {
      pending: [],
      answers: { where: 'Greyhollow tavern common room', name: 'Jax' },
      complete: true,
      sceneWritten: true,
      mode: 'weave',
      aloneArrival: false,
      pickedHook: [
        'Location: Greyhollow tavern common room',
        'Who is here: the innkeep and a quiet room',
        'Why this happened: The woodcutter wants help for the missing child. The mayor wants the keep unnamed.',
        'If you refuse: Greyhollow will not help you if you name the keep.',
      ].join('\n'),
    },
    sceneFacts: { ...emptySceneFacts(4), present: ['the innkeep'] },
  };
}

describe('playtest12g — natural prose receipts', () => {
  it('HUD/BUILD are 12g, Mid writer OFF', () => {
    expect(HUD_BUILD_STAMP).toBe('2026-09-12g');
    expect(BUILD_STAMP).toBe('2026-09-12g');
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
  });

  it('Look ×1 / ×2 / ×3 names HERE + focus, not engine receipts', () => {
    const first = prepareRetrospectiveWriterInput(ruin(), 'Look around');
    const t1 = assemblePacketStitch(first.packet);
    expect(first.packet.inspectStreak).toBe(1);
    expect(t1).toMatch(/half-collapsed loft/i);
    expect(t1).toMatch(/crate|Wren/i);
    expect(t1).not.toMatch(ENGINE);

    const second = prepareRetrospectiveWriterInput(first.state, 'Inspect the room');
    const t2 = assemblePacketStitch(second.packet);
    expect(second.packet.inspectStreak).toBe(2);
    expect(t2).toMatch(/crate/i);
    expect(t2).toMatch(/half-collapsed loft/i);
    expect(t2).not.toMatch(ENGINE);

    const third = prepareRetrospectiveWriterInput(second.state, 'Look around');
    const t3 = assemblePacketStitch(third.packet);
    expect(third.packet.inspectStreak).toBe(3);
    expect(t3).toMatch(/crate|nothing else to glean|half-collapsed loft/i);
    expect(t3).not.toMatch(ENGINE);
  });

  it('Wait ×1 / ×2 is a beat, not You waited at alone', () => {
    const first = prepareRetrospectiveWriterInput(ruin(), 'Wait');
    const t1 = assemblePacketStitch(first.packet);
    expect(first.packet.waitStreak).toBe(1);
    expect(t1).toMatch(/half-collapsed loft/i);
    expect(t1).not.toMatch(/^You waited at /);
    expect(t1).not.toMatch(ENGINE);

    const second = prepareRetrospectiveWriterInput(first.state, 'Wait');
    const t2 = assemblePacketStitch(second.packet);
    expect(second.packet.waitStreak).toBe(2);
    expect(t2).toMatch(/half-collapsed loft|crate/i);
    expect(t2).not.toMatch(/^You waited at /);
    expect(t2).not.toMatch(ENGINE);
  });

  it('second who-ask is an already-told spoken variant; met-before skips intro reprint', () => {
    const state = greyTavern();
    const first = stitchOpeningContinue(state, 'Who are you?');
    const second = stitchOpeningContinue(
      {
        ...state,
        turn: 5,
        log: [
          { id: 'p', turn: 4, role: 'player', content: 'Who are you?', timestamp: 4 },
          { id: 'g', turn: 4, role: 'gm', content: first, timestamp: 5 },
        ],
      },
      'Who are you? Answer me properly.'
    );
    expect(second).toMatch(/already said|already answered/i);
    expect(second).toMatch(/"/);
    expect(second).not.toBe(first);
    expect(second).not.toMatch(/Introduced in play/i);

    const met: GameState = {
      ...state,
      npcMemories: [
        {
          npcId: 'innkeep-12g',
          npcName: 'the innkeep',
          lastSeenTurn: 3,
          introSpoken: true,
          meetCount: 2,
          disposition: 'neutral',
          relationshipStatus: 'acquaintance',
          knownPlayerName: 'Jax',
          completedTopics: ['intro'],
          facts: ['Met before'],
        },
      ],
    };
    expect(hasMetBefore(met, 'the innkeep')).toBe(true);
    const told = openingAlreadyToldLine(met, 'who');
    expect(told).toMatch(/already said|already answered/i);
    expect(told).not.toMatch(/Introduced in play/i);
  });

  it('Greyhollow / Salt / Thornferry cards have authored want; hall talk quotes them', () => {
    for (const id of ['cursed-keep', 'salt-road-heist', 'thornferry-road'] as const) {
      const deck = OPENING_HOOK_DECKS[id] ?? [];
      expect(deck.length).toBeGreaterThanOrEqual(7);
      for (const card of deck) {
        expect(typeof card).toBe('object');
        const beat = card as OpeningBeatCard;
        expect(beat.summonIntent, beat.location).toBeTruthy();
        expect(beat.openingCost, beat.location).toBeTruthy();
      }
    }

    const grey = greyTavern();
    expect(shortCardWant(grey)).toMatch(/woodcutter|missing child/i);
    expect(shortCardCost(grey)).toMatch(/name the keep/i);
    expect(openingSpokenWant(grey)).toMatch(/woodcutter|missing child/i);
    expect(openingSpokenWant(grey)).not.toMatch(/have not said what they want/i);

    const saltPick = resolveOpeningHookPick(getCampaignBibleById('salt-road-heist'), 'salt-12g');
    expect(saltPick?.summonIntent).toBeTruthy();
    const thornPick = resolveOpeningHookPick(getCampaignBibleById('thornferry-road'), 'thorn-12g');
    expect(thornPick?.summonIntent).toMatch(/Wren|charter|writ|ford/i);
  });

  it('lastKill then Look / Talk is corpse or leave; never living Talk lastKill', () => {
    const kill = {
      name: 'Pact-Hunter Skirmisher',
      turn: 7,
      outcome: 'victory' as const,
      remains: true,
    };
    const withCorpse = ruin({
      sceneFacts: {
        ...emptySceneFacts(8),
        present: ['Pact-Hunter Skirmisher', 'Wren Holt'],
        lastKill: kill,
        props: ['crate'],
      },
    });
    const look = assemblePacketStitch(buildCompletedEventPacket(withCorpse, 'Look around'));
    expect(look).toMatch(/corpse|stayed down|still on the floor|loot or leave/i);
    expect(look).not.toMatch(/Skirmisher answered|X answered/i);
    expect(look).not.toMatch(ENGINE);

    const talk = assemblePacketStitch(buildCompletedEventPacket(withCorpse, 'Talk to Pact-Hunter Skirmisher'));
    expect(talk).toMatch(/corpse|stayed down|did not speak|could not take/i);
    expect(talk).not.toMatch(/Skirmisher answered/i);
    expect(talk).not.toMatch(/Silence held|No one listed on the ledger answered/i);

    const edges = enumerateLegalEdges(withCorpse);
    expect(edges.some((e) => /Talk to .*Skirmisher/i.test(e.label))).toBe(false);
    expect(compileGraphChoiceLabels(withCorpse).some((l) => /Talk to .*Skirmisher/i.test(l))).toBe(false);
    const compiled = compileChoices(withCorpse, [
      'Talk to Pact-Hunter Skirmisher',
      'Ask Pact-Hunter Skirmisher what they want',
      'Look around',
    ]);
    expect(compiled.choices.some((c) => /Talk to .*Skirmisher/i.test(c))).toBe(false);
    expect(compiled.choices.some((c) => /Ask .*Skirmisher/i.test(c))).toBe(false);
  });

  it('E fallback with living CAST uses the spoken card pool, not Silence held', () => {
    const state = greyTavern();
    const spoken = spokenTalkFallback(state, 'Tell them I need a night before I sign.');
    expect(spoken).toMatch(/woodcutter|missing child|innkeep|answers you|already/i);
    expect(spoken).not.toMatch(/Silence held the question|No one listed on the ledger answered/i);

    const packet = buildCompletedEventPacket(state, 'Tell them I need a night before I sign.');
    const stitch = assemblePacketStitch(packet);
    expect(stitch).toMatch(/woodcutter|missing child|innkeep|heard you/i);
    expect(stitch).not.toMatch(/Silence held the question|No one listed on the ledger answered/i);

    const emptyRoom = ruin({
      sceneFacts: { ...emptySceneFacts(8), present: [], props: ['crate'] },
      openingEstablishment: {
        pending: [],
        answers: { where: 'half-collapsed loft' },
        complete: true,
        sceneWritten: true,
        mode: 'weave',
        aloneArrival: true,
        pickedHook: 'Location: half-collapsed loft\nWho is here: (none)',
      },
    });
    const hollow = spokenTalkFallback(emptyRoom, 'Hello?');
    expect(hollow).toMatch(/did not invent a speaker|empty ledger|No living name/i);
    expect(hollow).not.toMatch(/Silence held the question|No one listed on the ledger answered/i);
  });

  it('Ashrise story face is a book stack, not Playfair or Cinzel Decorative', () => {
    const theme = shopItemById('theme.phoenix-ashrise');
    expect(theme?.preview?.fontStory).toMatch(/Libre Baskerville|Georgia/i);
    expect(theme?.preview?.fontStory).not.toMatch(/Playfair Display|Cinzel Decorative/i);
  });
});
