/**
 * FOURSLOT6 — T50 leftover root fixes (exactly-4 after filters, hurt Rest, present-only Talk,
 * echo Talk/Ask, tabletop same-family streak ≤2).
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { commitOfferedPad } from './playTranscript';
import {
  assembleFourSlotPads,
  consecutiveSameFamilyPicks,
  FAMILY_STREAK_CAP,
  fourSlotEngineLabels,
  isFourSlotLegal,
  isFourSlotRepeat,
  shouldSkipFourSlot,
  talkChipTarget,
} from './fourSlotPads';
import { padChoicesToCount } from './choicePipeline';
import { canOutdoorShortRest } from './recoveryRules';
import { emptySceneFacts } from './sceneFacts';
import { settleOrigin, ORIGIN_QUICK_START_CHIP } from './rules/rpgOrigin';
import { OUTDOOR_REST_CHIP, isHurtHp } from './rules/wildlifeConfig';
import { enumerateLegalEdges } from './graphChoices';
import type { EngineMode, GameState } from './types';

const SWEEP_MS = 90_000;
const SIM_MS = 120_000;

function playReady(state: GameState): GameState {
  let s: GameState = {
    ...state,
    openingEstablishment: {
      ...(state.openingEstablishment ?? { pending: [], answers: {}, complete: false }),
      pending: [],
      complete: true,
      sceneWritten: true,
    },
  };
  if (s.engineMode === 'rpg') {
    if (!s.character?.origin) {
      const settled = settleOrigin(s, ORIGIN_QUICK_START_CHIP);
      s = settled.state;
    }
    if (!s.character?.origin) {
      s = { ...s, character: { ...s.character!, origin: 'sage' } };
    }
  }
  return s;
}

function withPlayerLog(state: GameState, picks: string[]): GameState {
  const baseTurn = state.turn ?? 20;
  const log = [
    ...(state.log ?? []),
    ...picks.map((content, i) => ({
      id: `fs6-${i}`,
      role: 'player' as const,
      content,
      turn: baseTurn - picks.length + i,
      timestamp: i + 1,
    })),
  ];
  return { ...state, log };
}

/** 8101 T15 — road journey with parked stranger meeting; pad was Walk/Gather/Hunt (n=3). */
function gatebreakRoadMeeting(seed = 8101): GameState {
  const built = buildNewGameState({
    bibleId: 'gatebreak-ward',
    characterName: 'Jax',
    seed,
    personality: 'cold-system',
    engineMode: 'litrpg',
  });
  const opened = playReady(stampOpening(built.state));
  return {
    ...opened,
    turn: 15,
    currentLocation: 'On the road between Militia Post and Subway Gate',
    journey: {
      from: 'Militia Post',
      to: 'Subway Gate',
      legsDone: 1,
      legsTotal: 3,
      hoursPerLeg: 1,
      terrain: 'road',
      ground: 'road',
      encounter: {
        kind: 'traveler',
        level: 5,
        stretch: 1,
        dangerous: false,
        want: 'to know your business here',
        distanceFt: 60,
        name: 'a stranger',
      },
      quietStretches: 0,
    } as GameState['journey'],
    character: { ...opened.character!, hp: 31, maxHp: 31 },
    sceneFacts: { ...emptySceneFacts(15), indoor: false, present: [] },
    firstFightGateDone: true,
    activeEncounter: null,
  };
}

/** 8102 hurt after Rest cooldown — HP ≤50%, safe, Rest missing on pad. */
function rainglassHurtAfterRest(seed = 8102): GameState {
  const built = buildNewGameState({
    bibleId: 'rainglass-case',
    characterName: 'Jax',
    seed,
    personality: 'chilled-gm',
    engineMode: 'rpg',
  });
  const opened = playReady(stampOpening(built.state));
  const maxHp = opened.character?.maxHp ?? 24;
  const hp = Math.max(1, Math.floor(maxHp * 0.5));
  return withPlayerLog(
    {
      ...opened,
      turn: 16,
      currentLocation: 'Rear Car of the Night Tram',
      character: { ...opened.character!, hp, maxHp },
      outdoorShortRestCooldownUntilTurn: 19,
      sceneFacts: {
        ...emptySceneFacts(16),
        indoor: true,
        present: ['Col Aske', 'Nell Rudd'],
      },
      activeEncounter: null,
      journey: null,
    },
    [OUTDOOR_REST_CHIP]
  );
}

/** 8103 T35 — Talk to Grash while only Elara is present. */
function brokenCrownAbsentGrash(seed = 8103): GameState {
  const built = buildNewGameState({
    bibleId: 'broken-crown-keep',
    characterName: 'Jax',
    seed,
    personality: 'chilled-gm',
    engineMode: 'dnd',
  });
  const opened = playReady(stampOpening(built.state));
  const mems = [
    ...(opened.npcMemories ?? []),
    {
      npcId: 'npc:grash-the-splitter',
      npcName: 'Grash the Splitter',
      disposition: 'neutral' as const,
      facts: [],
      lastSeenTurn: 34,
      location: 'Ernost gatehouse',
      present: false,
    },
    {
      npcId: 'npc:elara-locke',
      npcName: 'Elara Locke',
      disposition: 'friendly' as const,
      facts: [],
      lastSeenTurn: 35,
      location: 'Ernost gatehouse',
      present: true,
    },
  ];
  return {
    ...opened,
    turn: 35,
    currentLocation: 'Ernost gatehouse',
    character: { ...opened.character!, hp: 13, maxHp: 13 },
    npcMemories: mems,
    sceneFacts: {
      ...emptySceneFacts(35),
      indoor: true,
      present: ['Elara Locke'],
      crowd: 'sparse',
      crowdCount: 1,
    },
    activeEncounter: null,
    journey: null,
  };
}

describe('FOURSLOT6 item1 exactly-4 (8101 journey / box / T38)', () => {
  it('replay FAIL shape: parked road meeting used to skip four-slot — now fills 4', () => {
    const state = gatebreakRoadMeeting();
    // Old exclusive path returned the short list as-is.
    const raw = ['Walk on', 'Gather herbs and resources nearby', 'Hunt the wildlife nearby'];
    expect(raw).toHaveLength(3);
    expect(shouldSkipFourSlot(state)).toBe(false);
    const pads = assembleFourSlotPads(state, raw);
    const eng = fourSlotEngineLabels(pads);
    expect(eng).toHaveLength(4);
    expect(new Set(eng.map((c) => c.toLowerCase())).size).toBe(4);
    expect(eng[0]).toMatch(/^(?:Walk on|Face|Talk)/i);
  });

  it('replay: 5-chip box/stat road list trims to 4', () => {
    const state = gatebreakRoadMeeting(8112);
    const pads = assembleFourSlotPads(state, [
      'Walk on',
      '+1 DEX',
      'Help them',
      '+1 CON',
      'Pass them by',
    ]);
    expect(fourSlotEngineLabels(pads)).toHaveLength(4);
  });

  it('replay: lone Look-for-a-fight tops up to 4 (8103 T38)', () => {
    const built = buildNewGameState({
      bibleId: 'broken-crown-keep',
      characterName: 'Jax',
      seed: 8103,
      personality: 'chilled-gm',
      engineMode: 'dnd',
    });
    const opened = playReady(stampOpening(built.state));
    const state: GameState = {
      ...opened,
      turn: 38,
      currentLocation: 'Ernost gatehouse',
      character: { ...opened.character!, hp: 13, maxHp: 13 },
      sceneFacts: { ...emptySceneFacts(38), indoor: true, present: [], crowd: 'none', crowdCount: 0 },
      activeEncounter: null,
      journey: null,
    };
    const pads = assembleFourSlotPads(state, ['Look for a fight']);
    expect(fourSlotEngineLabels(pads)).toHaveLength(4);
  });

  it('pipeline finalize: padChoicesToCount ends at exactly 4 after filters', () => {
    const state = gatebreakRoadMeeting(8115);
    // Mimic post-filter short list (what seal / journey ownership used to leave).
    const pads = padChoicesToCount(
      ['Walk on', 'Hunt the wildlife nearby'],
      state,
      '',
      3,
      'Gather herbs and resources nearby'
    );
    const eng = fourSlotEngineLabels(pads);
    expect(eng.length).toBe(4);
  });

  it('final-pad exactly-4 sweep over premades x modes (non-origin, non-forced)', () => {
    const holes: string[] = [];
    const modes: EngineMode[] = ['litrpg', 'rpg', 'dnd'];
    for (const mode of modes) {
      const bibles = ALL_CAMPAIGN_BIBLES.filter((b) => {
        if (/blank|umbra|pyoa|thornferry|giltwood|onyx|crimson|resin|null-parameter|erebus|vesper|rose-gold/i.test(b.id)) {
          return false;
        }
        if (mode === 'litrpg') {
          return (
            b.engineMode === 'litrpg'
            || /hollow|summoned|hero|inkbound|void|gatebreak|ascending|fabled|system|dungeon|integration/i.test(b.id)
          );
        }
        if (mode === 'rpg') {
          return b.engineMode === 'rpg' || /embercourt|salt|cape|rainglass|greyhollow/i.test(b.id);
        }
        return b.engineMode === 'dnd' || /millstone|cursed|stillroot|verdant|shattered|broken|crown/i.test(b.id);
      }).slice(0, 8);
      for (const bible of bibles) {
        const built = buildNewGameState({
          bibleId: bible.id,
          characterName: 'Jax',
          seed: 8101,
          personality: mode === 'litrpg' ? 'cold-system' : 'chilled-gm',
          engineMode: mode,
        });
        const opened = playReady(stampOpening(built.state));
        if (shouldSkipFourSlot(opened)) continue;
        const committed = commitOfferedPad({ ...opened, offeredPad: null });
        const labels = fourSlotEngineLabels(committed.offeredPad?.choices ?? committed.choices ?? []);
        // Empty open pad = exclusive/cover owner outside four-slot (not a short-pad miss).
        if (!labels.length) continue;
        if (labels.length !== 4 || new Set(labels.map((c) => c.toLowerCase())).size !== 4) {
          holes.push(`${mode}:${bible.id}:open=${labels.length}:${labels.join('|')}`);
        }
        const road: GameState = {
          ...opened,
          turn: 15,
          currentLocation: `On the road between A and B`,
          journey: {
            from: 'A',
            to: 'B',
            legsDone: 1,
            legsTotal: 3,
            hoursPerLeg: 1,
            terrain: 'road',
            ground: 'road',
            encounter: {
              kind: 'traveler',
              level: 1,
              stretch: 1,
              dangerous: false,
              want: 'directions',
              distanceFt: 40,
            },
            quietStretches: 0,
          } as GameState['journey'],
          sceneFacts: { ...emptySceneFacts(15), indoor: false, present: [] },
          activeEncounter: null,
          firstFightGateDone: true,
        };
        if (shouldSkipFourSlot(road)) {
          holes.push(`${mode}:${bible.id}:road-still-skips`);
          continue;
        }
        const roadPads = assembleFourSlotPads(road, [
          'Walk on',
          'Hunt the wildlife nearby',
          'Gather herbs and resources nearby',
        ]);
        const eng = fourSlotEngineLabels(roadPads);
        if (eng.length !== 4 || new Set(eng.map((c) => c.toLowerCase())).size !== 4) {
          holes.push(`${mode}:${bible.id}:road=${eng.length}:${eng.join('|')}`);
        }
      }
    }
    expect(holes, holes.join('\n')).toEqual([]);
  }, SWEEP_MS);
});

describe('FOURSLOT6 item2 hurt Rest (8102 T16-17 / T24-26)', () => {
  it('replay FAIL shape: Rest cooldown after Rest pick still allows Rest while hurt+safe', () => {
    const state = rainglassHurtAfterRest();
    expect(isHurtHp(state.character!.hp, state.character!.maxHp)).toBe(true);
    expect(canOutdoorShortRest(state, OUTDOOR_REST_CHIP)).toBe(true);
    expect(isFourSlotRepeat(state, OUTDOOR_REST_CHIP, OUTDOOR_REST_CHIP)).toBe(false);
    const pads = assembleFourSlotPads(state, [
      'Travel toward Cold Storage Slab',
      'Talk to Col Aske',
      'Gather herbs and resources nearby',
      'Travel toward a rain-glass detective office',
    ]);
    expect(pads.some((c) => /rest|make camp|bind .* wounds/i.test(c))).toBe(true);
  });

  it('hurt-and-safe Rest-offered sweep over premades x modes', () => {
    const holes: string[] = [];
    const modes: EngineMode[] = ['litrpg', 'rpg', 'dnd'];
    const placeVariants = [
      { loc: 'Quiet Inn Common Room', indoor: true, present: ['the innkeep'] },
      { loc: 'Market Square', indoor: false, present: ['a vendor'] },
      { loc: 'Wooded Trail', indoor: false, present: [] },
      { loc: 'Candlelit Chapel', indoor: true, present: ['Sister Mare'] },
    ];
    for (const mode of modes) {
      const bibles = ALL_CAMPAIGN_BIBLES.filter((b) => {
        if (/blank|umbra|pyoa/i.test(b.id)) return false;
        if (mode === 'litrpg') return /hollow|summoned|hero|gatebreak|inkbound/i.test(b.id);
        if (mode === 'rpg') return /embercourt|salt|cape|rainglass/i.test(b.id);
        return /millstone|cursed|stillroot|broken|verdant/i.test(b.id);
      }).slice(0, 4);
      for (const bible of bibles) {
        for (const place of placeVariants) {
          const built = buildNewGameState({
            bibleId: bible.id,
            characterName: 'Jax',
            seed: 16,
            personality: mode === 'litrpg' ? 'cold-system' : 'chilled-gm',
            engineMode: mode,
          });
          const opened = playReady(stampOpening(built.state));
          if (shouldSkipFourSlot(opened)) continue;
          const maxHp = opened.character?.maxHp ?? 20;
          const hurt: GameState = {
            ...opened,
            turn: 24,
            currentLocation: place.loc,
            character: {
              ...opened.character!,
              hp: Math.max(1, Math.floor(maxHp * 0.4)),
              maxHp,
            },
            outdoorShortRestCooldownUntilTurn: 30,
            activeEncounter: null,
            journey: null,
            sceneFacts: {
              ...emptySceneFacts(24),
              indoor: place.indoor,
              present: place.present,
              crowd: place.present.length ? 'present' : 'none',
              crowdCount: place.present.length,
            },
          };
          const pads = assembleFourSlotPads(hurt, [
            'Look around',
            'Wait',
            'Leave the scene',
            place.present[0] ? `Talk to ${place.present[0]}` : 'Search the area',
            'Travel toward Somewhere Else',
          ]);
          const hasRest = pads.some((c) => /rest|make camp|bind .* wounds/i.test(c));
          if (!hasRest && mode !== 'dnd') {
            holes.push(`${mode}:${bible.id}:${place.loc}:no-rest:${pads.join('|')}`);
          }
          if (!hasRest && mode === 'dnd') {
            // Tabletop Rest only at safe hub — inn/chapel/market should; trail may Leave instead.
            if (/inn|chapel|market|square|tavern|moot/i.test(place.loc) && !pads.some((c) => /leave|rest|camp/i.test(c))) {
              holes.push(`dnd:${bible.id}:${place.loc}:no-rest-or-leave:${pads.join('|')}`);
            }
          }
        }
      }
    }
    expect(holes, holes.join('\n')).toEqual([]);
  }, SWEEP_MS);
});

describe('FOURSLOT6 item3 present-only Talk (8103 T34-35)', () => {
  it('replay FAIL shape: Talk to Grash illegal when only Elara is present', () => {
    const state = brokenCrownAbsentGrash();
    expect(isFourSlotLegal(state, 'Talk to Grash the Splitter')).toBe(false);
    expect(isFourSlotLegal(state, 'Ask Grash the Splitter about a secret worth selling')).toBe(false);
    expect(isFourSlotLegal(state, 'Talk to Elara Locke')).toBe(true);
    const pads = assembleFourSlotPads(state, [
      'Look around',
      'Talk to Grash the Splitter',
      'Read the innkeep',
      'Wait',
      'Talk to Elara Locke',
    ]);
    expect(pads.some((c) => /grash/i.test(c))).toBe(false);
    expect(pads.some((c) => /elara/i.test(c)) || pads.some((c) => /look|wait|travel|rest/i.test(c))).toBe(true);
  });

  it('graph edges do not emit Talk for location-stamped absent NPCs', () => {
    const state = brokenCrownAbsentGrash();
    const talks = enumerateLegalEdges(state)
      .filter((e) => e.type === 'talk')
      .map((e) => e.label);
    expect(talks.some((c) => /grash/i.test(c))).toBe(false);
  });

  it('present-NPC-only Talk/Ask sweep over premades x modes', () => {
    const holes: string[] = [];
    const modes: EngineMode[] = ['litrpg', 'rpg', 'dnd'];
    for (const mode of modes) {
      const bibles = ALL_CAMPAIGN_BIBLES.filter((b) => {
        if (/blank|umbra|pyoa/i.test(b.id)) return false;
        if (mode === 'litrpg') return /hollow|summoned|gatebreak|hero/i.test(b.id);
        if (mode === 'rpg') return /embercourt|rainglass|salt/i.test(b.id);
        return /broken|millstone|cursed/i.test(b.id);
      }).slice(0, 4);
      for (const bible of bibles) {
        const built = buildNewGameState({
          bibleId: bible.id,
          characterName: 'Jax',
          seed: 35,
          personality: mode === 'litrpg' ? 'cold-system' : 'chilled-gm',
          engineMode: mode,
        });
        const opened = playReady(stampOpening(built.state));
        const here = opened.currentLocation || 'Town Square';
        const state: GameState = {
          ...opened,
          turn: 20,
          currentLocation: here,
          npcMemories: [
            ...(opened.npcMemories ?? []),
            {
              npcId: 'npc:absent-ghost',
              npcName: 'Absent Ghost',
              disposition: 'neutral',
              facts: [],
              lastSeenTurn: 1,
              location: here,
              present: false,
            },
          ],
          sceneFacts: {
            ...emptySceneFacts(20),
            indoor: true,
            present: ['Only One Here'],
            crowd: 'sparse',
            crowdCount: 1,
          },
          activeEncounter: null,
        };
        if (isFourSlotLegal(state, 'Talk to Absent Ghost')) {
          holes.push(`${mode}:${bible.id}:legal-absent`);
        }
        const pads = assembleFourSlotPads(state, [
          'Talk to Absent Ghost',
          'Ask Absent Ghost about the job they need done',
          'Talk to Only One Here',
          'Look around',
          'Wait',
        ]);
        if (pads.some((c) => /absent ghost/i.test(c))) {
          holes.push(`${mode}:${bible.id}:pad-absent:${pads.join('|')}`);
        }
        for (const edge of enumerateLegalEdges(state)) {
          if (edge.type === 'talk' && /absent ghost/i.test(edge.label)) {
            holes.push(`${mode}:${bible.id}:graph-absent`);
          }
        }
      }
    }
    expect(holes, holes.join('\n')).toEqual([]);
  }, SWEEP_MS);
});

describe('FOURSLOT6 item4 no echo Talk/Ask', () => {
  it('replay: Ask Grash after Talk Grash pick is an echo (8103 T4 shape)', () => {
    expect(talkChipTarget('Ask Grash the Splitter about a secret worth selling')).toMatch(/grash/i);
    expect(talkChipTarget('Talk to Grash the Splitter')).toMatch(/grash/i);
    const built = buildNewGameState({
      bibleId: 'broken-crown-keep',
      characterName: 'Jax',
      seed: 8103,
      personality: 'chilled-gm',
      engineMode: 'dnd',
    });
    const opened = playReady(stampOpening(built.state));
    const state = withPlayerLog(
      {
        ...opened,
        turn: 4,
        currentLocation: 'Ernost gatehouse',
        sceneFacts: {
          ...emptySceneFacts(4),
          indoor: true,
          present: ['Grash the Splitter', 'the innkeep'],
        },
      },
      ['Talk to Grash the Splitter']
    );
    expect(isFourSlotRepeat(state, 'Ask Grash the Splitter about a secret worth selling')).toBe(true);
    const pads = assembleFourSlotPads(state, [
      'Ask Grash the Splitter about a secret worth selling',
      'Talk to the innkeep',
      'Look around',
      'Wait',
    ]);
    expect(pads.some((c) => /grash/i.test(c))).toBe(false);
  });

  it('replay: Ask Idra after Ask Idra pick is an echo (8102 T49)', () => {
    const built = buildNewGameState({
      bibleId: 'rainglass-case',
      characterName: 'Jax',
      seed: 8102,
      personality: 'chilled-gm',
      engineMode: 'rpg',
    });
    const opened = playReady(stampOpening(built.state));
    const state = withPlayerLog(
      {
        ...opened,
        turn: 49,
        currentLocation: 'VIP Booth in the Club',
        sceneFacts: {
          ...emptySceneFacts(49),
          indoor: true,
          present: ['Idra Brack'],
        },
      },
      ['Ask Idra Brack about the job they need done']
    );
    expect(
      isFourSlotRepeat(state, 'Ask Idra Brack about the job they need done')
    ).toBe(true);
    const pads = assembleFourSlotPads(state, [
      'Search the area',
      'Ask Idra Brack about the job they need done',
      'Travel toward Cold Storage Slab',
      'Travel toward Rear Car of the Night Tram',
    ]);
    expect(pads.some((c) => /ask idra/i.test(c))).toBe(false);
  });

  it('echo-repeat sweep: next pad after Talk/Ask pick drops same family+target', () => {
    const holes: string[] = [];
    const cases: Array<{ mode: EngineMode; bible: string; who: string }> = [
      { mode: 'dnd', bible: 'broken-crown-keep', who: 'Grash the Splitter' },
      { mode: 'rpg', bible: 'rainglass-case', who: 'Idra Brack' },
      { mode: 'litrpg', bible: 'gatebreak-ward', who: 'Sergeant Rill' },
    ];
    for (const c of cases) {
      const built = buildNewGameState({
        bibleId: c.bible,
        characterName: 'Jax',
        seed: 49,
        personality: c.mode === 'litrpg' ? 'cold-system' : 'chilled-gm',
        engineMode: c.mode,
      });
      const opened = playReady(stampOpening(built.state));
      const state = withPlayerLog(
        {
          ...opened,
          turn: 20,
          sceneFacts: {
            ...emptySceneFacts(20),
            indoor: true,
            present: [c.who],
          },
        },
        [`Talk to ${c.who}`]
      );
      const ask = `Ask ${c.who} about the job they need done`;
      if (!isFourSlotRepeat(state, ask)) holes.push(`${c.mode}:repeat-miss`);
      const pads = assembleFourSlotPads(state, [
        ask,
        `Talk to ${c.who}`,
        'Look around',
        'Wait',
        'Travel toward Elsewhere',
      ]);
      if (pads.some((p) => new RegExp(c.who.split(/\s+/)[0]!, 'i').test(p) && /^(?:talk|ask)\b/i.test(p))) {
        holes.push(`${c.mode}:pad-echo:${pads.join('|')}`);
      }
    }
    expect(holes, holes.join('\n')).toEqual([]);
  });
});

describe('FOURSLOT6 item5 tabletop same-family streak ≤2', () => {
  it('replay: after 2 talk picks, slots 1-3 starve talk (8103 T40-42 shape)', () => {
    const built = buildNewGameState({
      bibleId: 'broken-crown-keep',
      characterName: 'Jax',
      seed: 8103,
      personality: 'chilled-gm',
      engineMode: 'dnd',
    });
    const opened = playReady(stampOpening(built.state));
    const state = withPlayerLog(
      {
        ...opened,
        turn: 42,
        currentLocation: 'Ernost gatehouse',
        sceneFacts: {
          ...emptySceneFacts(42),
          indoor: true,
          present: ['Grash the Splitter', 'the innkeep', 'Elara Locke'],
        },
        activeEncounter: null,
      },
      ['Talk to Grash the Splitter', 'Talk to the innkeep']
    );
    expect(consecutiveSameFamilyPicks(state, 'talk')).toBeGreaterThanOrEqual(FAMILY_STREAK_CAP);
    const pads = assembleFourSlotPads(state, [
      'Report back to Elara Locke',
      'Talk to Grash the Splitter',
      'Talk to the innkeep',
      'Talk to Elara Locke',
      'Look around',
      'Wait',
    ]);
    const eng = fourSlotEngineLabels(pads);
    expect(eng).toHaveLength(4);
    // Slots 1-3 must not be talk-family after two talk picks (slot 4/back may still be).
    const front = eng.slice(0, 3);
    expect(front.every((c) => !/^(?:talk|ask|answer|follow up)\b/i.test(c))).toBe(true);
    expect(eng[0]).not.toMatch(/^(?:look around|wait|read)\b/i);
  });

  it('tabletop same-family streak sim: always-slot-1 / filler / Travel / Talk over dnd premades', () => {
    const holes: string[] = [];
    const profiles = ['always-slot-1', 'always-filler', 'always-Travel', 'always-Talk'] as const;
    const bibles = ALL_CAMPAIGN_BIBLES.filter(
      (b) =>
        !/blank|umbra|pyoa/i.test(b.id)
        && (b.engineMode === 'dnd' || /millstone|cursed|stillroot|verdant|shattered|broken|crown/i.test(b.id))
    ).slice(0, 6);
    for (const bible of bibles) {
      for (const profile of profiles) {
        const built = buildNewGameState({
          bibleId: bible.id,
          characterName: 'Jax',
          seed: 8103,
          personality: 'chilled-gm',
          engineMode: 'dnd',
        });
        let state = playReady(stampOpening(built.state));
        if (shouldSkipFourSlot(state)) continue;
        state = {
          ...state,
          turn: 10,
          sceneFacts: {
            ...emptySceneFacts(10),
            indoor: true,
            present: state.sceneFacts?.present?.length
              ? state.sceneFacts.present
              : ['the innkeep', 'a guide'],
          },
          activeEncounter: null,
          firstFightGateDone: true,
        };
        const picks: string[] = [];
        for (let t = 0; t < 64; t++) {
          if (shouldSkipFourSlot(state)) break;
          const cand = [
            'Look around',
            'Wait',
            'Read the board',
            'Search the area',
            ...(state.sceneFacts?.present ?? []).flatMap((p) => [`Talk to ${p}`, `Ask ${p} about the lead`]),
            'Travel toward Millstone Ford',
            'Travel toward the next village',
            'Report back to the guide',
            'Study the report',
          ];
          const pads = assembleFourSlotPads(state, cand);
          const eng = fourSlotEngineLabels(pads);
          if (eng.length !== 4) {
            holes.push(`${bible.id}:${profile}:t${t}:len=${eng.length}`);
            break;
          }
          const streakTalk = consecutiveSameFamilyPicks(state, 'talk');
          const streakMove = consecutiveSameFamilyPicks(state, 'move');
          const streakFiller = consecutiveSameFamilyPicks(state, 'look');
          if (streakTalk >= FAMILY_STREAK_CAP) {
            const front = eng.slice(0, 3);
            if (front.some((c) => /^(?:talk|ask)\b/i.test(c))) {
              holes.push(`${bible.id}:${profile}:t${t}:talk-front:${front.join('|')}`);
              break;
            }
          }
          if (streakMove >= FAMILY_STREAK_CAP) {
            const front = eng.slice(0, 3);
            if (front.some((c) => /^(?:travel|head toward|go to)\b/i.test(c))) {
              holes.push(`${bible.id}:${profile}:t${t}:travel-front:${front.join('|')}`);
              break;
            }
          }
          if (streakFiller >= FAMILY_STREAK_CAP) {
            const front = eng.slice(0, 3);
            if (front.every((c) => /^(?:look|wait|read|search|inspect)\b/i.test(c))) {
              holes.push(`${bible.id}:${profile}:t${t}:filler-front:${front.join('|')}`);
              break;
            }
          }
          let pick = eng[0]!;
          if (profile === 'always-filler') {
            pick = eng.find((c) => /^(?:look|wait|read|search)\b/i.test(c)) ?? eng[0]!;
          } else if (profile === 'always-Travel') {
            pick = eng.find((c) => /^(?:travel|head toward)\b/i.test(c)) ?? eng[0]!;
          } else if (profile === 'always-Talk') {
            pick = eng.find((c) => /^(?:talk|ask)\b/i.test(c)) ?? eng[0]!;
          }
          picks.push(pick);
          state = withPlayerLog(
            { ...state, turn: (state.turn ?? 10) + 1, log: state.log },
            [pick]
          );
          // Simulate Travel changing place so Travel→HERE never locks forever.
          if (/^travel\b/i.test(pick)) {
            const dest = pick.replace(/^travel\s+(?:toward|to)\s+/i, '').trim();
            state = {
              ...state,
              currentLocation: dest || state.currentLocation,
              circling: {
                ...(state.circling ?? { stale: {}, lastProgressTurn: state.turn ?? 0 }),
                movedTurn: state.turn ?? 0,
                prevPlace: state.currentLocation,
                lastProgressTurn: state.turn ?? 0,
              },
            };
          }
        }
        if (picks.length < 60) {
          // Origin / exclusive breaks are OK; otherwise record.
          if (picks.length < 20) holes.push(`${bible.id}:${profile}:short-sim=${picks.length}`);
        }
      }
    }
    expect(holes, holes.join('\n')).toEqual([]);
  }, SIM_MS);
});
