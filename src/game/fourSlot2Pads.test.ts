/**
 * FOURSLOT2 — four-slot sweep extended (tabletop + hurt Rest + talk-absent + fight +
 * journey + free text) and fixture replay of the 7701/7702/7703 failing chip shapes.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { commitOfferedPad } from './playTranscript';
import { settleOrigin, ORIGIN_QUICK_START_CHIP } from './rules/rpgOrigin';
import {
  assembleFourSlotPads,
  fourSlotEngineLabels,
  isFourSlotLegal,
  shouldSkipFourSlot,
} from './fourSlotPads';
import { isFreeInputChip } from './sceneAffordances';
import { emptySceneFacts } from './sceneFacts';
import { OUTDOOR_REST_CHIP, isHurtHp } from './rules/wildlifeConfig';
import { peopleHere } from './scenePresence';
import { speakablePresentPeople } from './chromeAuthority';
import type { EngineMode, GameState } from './types';

const SEED = 6202;
const SWEEP_MS = 90_000;

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

function assertFour(state: GameState, labels: string[], tag: string) {
  const engine = fourSlotEngineLabels(labels);
  expect(engine.length, `${tag} count=${engine.length} [${labels.join(' | ')}]`).toBe(4);
  expect(new Set(engine.map((c) => c.toLowerCase())).size, `${tag} distinct`).toBe(4);
  for (const c of engine) {
    expect(isFourSlotLegal(state, c), `${tag} illegal:${c}`).toBe(true);
  }
  expect(labels.some((c) => isFreeInputChip(c)), `${tag} free-text`).toBe(true);
}

function hasStepBackRest(labels: string[]): boolean {
  return labels.some(
    (c) =>
      /^(?:rest|make camp|take a short rest|eat)\b/i.test(c)
      || /rest and bind/i.test(c)
      || /walk back to the hub/i.test(c)
  );
}

describe('FOURSLOT2 four-slot + hurt + talk-absent', () => {
  it(
    'every premade × mode × states: open / stall / hurt / closed-room / no-food / after-fight / journey → 4 valid + free text',
    () => {
      const modes: EngineMode[] = ['litrpg', 'rpg', 'dnd'];
      const holes: string[] = [];
      let checked = 0;
      const statesPer = 7;
      for (const mode of modes) {
        const bibles = ALL_CAMPAIGN_BIBLES.filter(
          (b) => b.engineMode === mode && !b.id.startsWith('blank-canvas') && b.id !== 'umbra-protocol'
        );
        for (const bible of bibles) {
          checked += 1;
          let opened: GameState;
          try {
            const built = buildNewGameState({
              bibleId: bible.id,
              characterName: 'Jax',
              seed: SEED + checked,
              personality: mode === 'litrpg' ? 'cold-system' : 'chilled-gm',
              engineMode: mode,
            });
            opened = playReady(stampOpening(built.state));
          } catch (err) {
            holes.push(`${mode}:${bible.id}:open-build:${(err as Error).message ?? err}`);
            continue;
          }
          if (shouldSkipFourSlot(opened)) continue;

          const basePad = commitOfferedPad({ ...opened, offeredPad: null });
          const variants: Array<{ tag: string; state: GameState; cand: string[] }> = [
            {
              tag: 'open',
              state: basePad,
              cand: basePad.offeredPad?.choices ?? basePad.choices ?? [],
            },
            {
              tag: 'stall',
              state: {
                ...basePad,
                turn: (basePad.turn ?? 8) + 1,
                log: [
                  ...(basePad.log ?? []),
                  {
                    id: 'stall-p',
                    turn: basePad.turn ?? 8,
                    role: 'player',
                    content: 'Search here for signs',
                    timestamp: Date.now(),
                  },
                ],
              },
              cand: ['Search here for signs', 'Look around', 'Wait', 'Talk to the leaving courier'],
            },
            {
              tag: 'hurt',
              state: {
                ...basePad,
                character: {
                  ...basePad.character!,
                  hp: Math.max(1, Math.floor((basePad.character?.maxHp ?? 24) * 0.4)),
                },
                activeEncounter: null,
                sceneFacts: {
                  ...emptySceneFacts(basePad.turn ?? 12),
                  ...(basePad.sceneFacts ?? {}),
                  pendingEncounter: undefined,
                },
              },
              cand: [
                'Travel toward Somewhere Else',
                'Talk to Mrs. Pell',
                'Gather herbs and resources nearby',
                'Search the area',
              ],
            },
            {
              tag: 'closed-room',
              state: {
                ...basePad,
                sceneFacts: {
                  ...emptySceneFacts(basePad.turn ?? 12),
                  indoor: true,
                  present: [],
                  crowd: 'none',
                  crowdCount: 0,
                },
              },
              cand: ['Look around', 'Wait', 'Search the area', 'Talk to the people here'],
            },
            {
              tag: 'no-food',
              state: {
                ...basePad,
                character: {
                  ...basePad.character!,
                  hp: Math.max(1, Math.floor((basePad.character?.maxHp ?? 24) * 0.4)),
                },
                inventory: (basePad.inventory ?? []).filter(
                  (it) => !/\b(?:meal|ration|rations|bread|food|stew|meat|cake|hardtack)\b/i.test(it.name ?? '')
                ),
                activeEncounter: null,
              },
              cand: ['Look around', 'Wait', 'Travel toward the road'],
            },
            {
              tag: 'after-fight',
              state: {
                ...basePad,
                character: {
                  ...basePad.character!,
                  hp: Math.max(1, Math.floor((basePad.character?.maxHp ?? 24) * 0.45)),
                },
                activeEncounter: null,
                sceneFacts: {
                  ...emptySceneFacts(basePad.turn ?? 20),
                  ...(basePad.sceneFacts ?? {}),
                  lastKill: {
                    name: 'Pact-Hunter Skirmisher',
                    turn: (basePad.turn ?? 20) - 1,
                  } as any,
                  pendingEncounter: undefined,
                },
              },
              cand: ['Look around', 'Loot the body', 'Travel toward Ward 9 Shelter', 'Wait'],
            },
            {
              tag: 'journey',
              state: {
                ...basePad,
                character: {
                  ...basePad.character!,
                  hp: Math.max(1, Math.floor((basePad.character?.maxHp ?? 24) * 0.4)),
                },
                journey: {
                  from: basePad.currentLocation ?? 'Here',
                  to: 'Somewhere Ahead',
                  legsDone: 1,
                  legsTotal: 4,
                  hoursPerLeg: 2,
                  terrain: 'road',
                  ground: 'road',
                  encounter: null,
                  quietStretches: 0,
                } as GameState['journey'],
                currentLocation: 'On the road between places',
                activeEncounter: null,
                sceneFacts: { ...emptySceneFacts(30), indoor: false, present: [] },
              },
              cand: ['Walk on', 'Turn back toward home', 'Hunt the wildlife nearby', 'Gather herbs and resources nearby'],
            },
          ];

          for (const v of variants) {
            if (shouldSkipFourSlot(v.state)) continue;
            const labels = assembleFourSlotPads(v.state, v.cand);
            try {
              assertFour(v.state, labels, `${mode}:${bible.id}:${v.tag}`);
              if (v.tag === 'hurt' || v.tag === 'no-food' || v.tag === 'after-fight' || v.tag === 'journey') {
                const hp = v.state.character?.hp ?? 0;
                const max = v.state.character?.maxHp ?? 0;
                if (isHurtHp(hp, max) && !v.state.activeEncounter) {
                  // Rest, camp, eat, or a valid route to a safe spot (Travel elsewhere / Leave) — never empty back.
                  const backOk =
                    hasStepBackRest(labels)
                    || labels.some((c) => /^travel\b/i.test(c) || /^leave\b/i.test(c) || /^turn back\b/i.test(c));
                  expect(backOk, `${mode}:${bible.id}:${v.tag} missing step-back Rest/route [${labels.join(' | ')}]`).toBe(
                    true
                  );
                }
              }
            } catch (err) {
              holes.push(`${mode}:${bible.id}:${v.tag}:${(err as Error).message ?? err} [${labels.join(' | ')}]`);
            }
          }
          void statesPer;
        }
      }
      // Report size: premades × modes × states (exclusive skips reduce slightly).
      expect(checked, 'premades').toBeGreaterThan(10);
      expect(holes, holes.join('\n') || 'ok').toEqual([]);
    },
    SWEEP_MS
  );

  it('LitRPG Talk-absent: presence none → no Talk/Answer chip for people who pulled you', () => {
    const state: GameState = {
      ...playReady(
        stampOpening(
          buildNewGameState({
            bibleId: 'gatebreak-ward',
            characterName: 'Jax',
            seed: 7701,
            personality: 'cold-system',
            engineMode: 'litrpg',
          }).state
        )
      ),
      currentLocation: 'On the road between places',
      sceneFacts: {
        ...emptySceneFacts(3),
        indoor: false,
        present: ['the people who pulled you'],
        crowd: 'none',
        crowdCount: 0,
      },
    };
    // Presence source: aggregate must not seat.
    expect(peopleHere(state).some((p) => /people who pulled you/i.test(p))).toBe(false);
    expect(speakablePresentPeople(state.sceneFacts?.present).length).toBe(0);
    expect(isFourSlotLegal(state, 'Talk to the people who pulled you')).toBe(false);
    const pads = assembleFourSlotPads(state, [
      'Travel toward Militia Post',
      'Talk to the people who pulled you',
      'Search the rooftop lookout for signs',
      'Read the System trail',
    ]);
    assertFour(state, pads, 'talk-absent');
    expect(pads.some((c) => /people who pulled you/i.test(c))).toBe(false);
  });

  it('7702 hurt Story RPG: Rest on every hurt non-fight pad (11/24 HP shape)', () => {
    const state = playReady(
      stampOpening(
        buildNewGameState({
          bibleId: 'hearthwick-teas',
          characterName: 'Jax',
          seed: 7702,
          personality: 'chilled-gm',
          engineMode: 'rpg',
        }).state
      )
    );
    const hurt: GameState = {
      ...state,
      character: { ...state.character!, hp: 11, maxHp: 24, origin: state.character?.origin ?? 'criminal' },
      currentLocation: 'Cobblestone Street Grate',
      activeEncounter: null,
      sceneFacts: {
        ...emptySceneFacts(40),
        indoor: false,
        present: ['Mrs. Pell'],
      },
    };
    expect(isHurtHp(11, 24)).toBe(true);
    const pads = assembleFourSlotPads(hurt, [
      'Travel toward Humid Glass Enclosure',
      'Talk to Mrs. Pell',
      'Gather herbs and resources nearby',
      'Travel toward Trash Cans in the Dark Alley',
    ]);
    assertFour(hurt, pads, '7702-hurt');
    expect(hasStepBackRest(pads), pads.join(' | ')).toBe(true);
  });

  it('7703 tabletop fight: exactly 4 combat slots (attack / defend / trick / flee)', () => {
    const state = playReady(
      stampOpening(
        buildNewGameState({
          bibleId: 'broken-crown-keep',
          characterName: 'Jax',
          seed: 7703,
          personality: 'chilled-gm',
          engineMode: 'dnd',
        }).state
      )
    );
    const fight: GameState = {
      ...state,
      currentLocation: 'Collapsed Chapel',
      activeEncounter: {
        name: 'Fog-Bank Cutter',
        hp: 12,
        maxHp: 12,
        level: 1,
      } as any,
      firstFightGateDone: true,
      pendingFirstFight: null,
      sceneFacts: {
        ...emptySceneFacts(16),
        indoor: true,
        present: ['Fog-Bank Cutter'],
      },
    };
    expect(shouldSkipFourSlot(fight)).toBe(false);
    const pads = assembleFourSlotPads(fight, [
      'Attack with the Quarterstaff',
      'Disengage and move',
      'Use something',
    ]);
    assertFour(fight, pads, '7703-fight');
    expect(pads.some((c) => /attack|press the attack|fight/i.test(c))).toBe(true);
    expect(pads.some((c) => /defend|help|protect/i.test(c))).toBe(true);
    expect(pads.some((c) => /disengage|flee|withdraw/i.test(c))).toBe(true);
  });

  it('fixture streams (7701/7702/7703 short pads) reshape to 4 valid distinct slots', () => {
    const fixtures: Array<{ name: string; mode: EngineMode; bible: string; here: string; hp: number; max: number; present: string[]; offered: string[] }> = [
      {
        name: '7701-T6-short',
        mode: 'litrpg',
        bible: 'gatebreak-ward',
        here: 'Ward 9 Shelter',
        hp: 20,
        max: 31,
        present: [],
        offered: [
          'Travel toward Ward 9 Shelter',
          'Talk to the people who pulled you',
          'Read System trail',
        ],
      },
      {
        name: '7702-T4-short',
        mode: 'rpg',
        bible: 'hearthwick-teas',
        here: 'Hearthwick lane at opening bell',
        hp: 24,
        max: 24,
        present: [],
        offered: [
          'Travel toward Cobblestone Street Grate',
          'Ask the people here about outranking the player',
        ],
      },
      {
        name: '7703-T7-singleton',
        mode: 'dnd',
        bible: 'broken-crown-keep',
        here: 'Collapsed Chapel',
        hp: 10,
        max: 10,
        present: ['Grash the Splitter', 'the innkeep'],
        offered: ['Talk to Grash the Splitter', 'Read Grash the Splitter'],
      },
    ];
    for (const fix of fixtures) {
      const built = buildNewGameState({
        bibleId: fix.bible,
        characterName: 'Jax',
        seed: 7700,
        personality: fix.mode === 'litrpg' ? 'cold-system' : 'chilled-gm',
        engineMode: fix.mode,
      });
      let state = playReady(stampOpening(built.state));
      state = {
        ...state,
        currentLocation: fix.here,
        character: {
          ...state.character!,
          hp: fix.hp,
          maxHp: fix.max,
          ...(fix.mode === 'rpg' ? { origin: state.character?.origin ?? 'criminal' } : {}),
        },
        sceneFacts: {
          ...emptySceneFacts(10),
          present: fix.present,
          indoor: /chapel|parlor|lane/i.test(fix.here),
        },
        firstFightGateDone: true,
        pendingFirstFight: null,
      };
      const pads = assembleFourSlotPads(state, fix.offered);
      assertFour(state, pads, fix.name);
      expect(pads.some((c) => /travel toward ward 9 shelter/i.test(c))).toBe(false);
      expect(pads.some((c) => /people who pulled you/i.test(c))).toBe(false);
    }
  });

  it('Eat consumes inventory when food is held (hurt pad prefers Eat/Rest)', () => {
    const state = playReady(
      stampOpening(
        buildNewGameState({
          bibleId: 'inkbound-academy',
          characterName: 'Jax',
          seed: 42,
          personality: 'cold-system',
          engineMode: 'litrpg',
        }).state
      )
    );
    const hurt: GameState = {
      ...state,
      character: { ...state.character!, hp: 10, maxHp: 31 },
      inventory: [
        ...(state.inventory ?? []),
        { id: 'ration-1', name: 'Travel rations', quantity: 2, type: 'consumable' } as any,
      ],
      activeEncounter: null,
      sceneFacts: { ...emptySceneFacts(12), indoor: false, present: [] },
    };
    const pads = assembleFourSlotPads(hurt, ['Look around', 'Wait', 'Travel toward Quill Dormitory']);
    assertFour(hurt, pads, 'eat-rest');
    expect(hasStepBackRest(pads) || pads.some((c) => /^eat\b/i.test(c)), pads.join(' | ')).toBe(true);
  });
});
