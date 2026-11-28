/**
 * FOURSLOT4 — root-fix tabletop Travel loops (7803 Verdant / 7903 Stillroot),
 * Innkeep Mara talk-presence, harness Travel cap, hubless Rest, premade sweeps.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { buildNewGameState, stampOpening, preferHurtRecoveryPick } from './fateAutoplay';
import { commitOfferedPad } from './playTranscript';
import {
  assembleFourSlotPads,
  consecutiveTravelFamilyPicks,
  fourSlotEngineLabels,
  isFourSlotLegal,
  isImmediateBounceTravel,
  isTravelFamilyChip,
  pickFromFourSlots,
  recentTravelNoDevelopment,
  shouldSkipFourSlot,
  TRAVEL_STREAK_CAP,
} from './fourSlotPads';
import { isSafeHubRest, TABLETOP_SHORT_REST_CHIP } from './recoveryRules';
import { emptySceneFacts } from './sceneFacts';
import { settleOrigin, ORIGIN_QUICK_START_CHIP } from './rules/rpgOrigin';
import { mentionsName } from './scenePresence';
import { listenerAnsweredInProse } from './spokenAnswer';
import { travelPadBlocked } from './padUniverse';
import type { EngineMode, GameState } from './types';

const SEED = 7903;
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

function withTravelLog(state: GameState, picks: string[]): GameState {
  const baseTurn = state.turn ?? 20;
  const log = [
    ...(state.log ?? []),
    ...picks.map((content, i) => ({
      id: `trav-${i}`,
      role: 'player' as const,
      content,
      turn: baseTurn - picks.length + i,
      timestamp: i + 1,
    })),
  ];
  return { ...state, log };
}

function verdantHurtAt(here: string, prev: string, turn: number, movedTurn: number, travelPicks: string[]): GameState {
  const built = buildNewGameState({
    bibleId: 'verdant-blight',
    characterName: 'Jax',
    seed: 7803,
    personality: 'chilled-gm',
    engineMode: 'dnd',
  });
  const opened = playReady(stampOpening(built.state));
  const base: GameState = {
    ...opened,
    turn,
    currentLocation: here,
    previousLocationSheet: { name: prev } as GameState['previousLocationSheet'],
    character: { ...opened.character!, hp: 1, maxHp: 10 },
    circling: {
      ...(opened.circling ?? { stale: {}, lastProgressTurn: movedTurn - 2 }),
      prevPlace: prev,
      lastLocation: here,
      movedTurn,
      lastProgressTurn: movedTurn - 2,
      recentPlaces: [prev, here],
    },
    firstFightGateDone: true,
    pendingFirstFight: null,
    activeEncounter: null,
    sceneFacts: {
      ...emptySceneFacts(turn),
      indoor: false,
      present: here === 'Choked Shrine'
        ? ['Baroness Mirelle', 'Sister Cala']
        : ['Baroness Mirelle', 'Col Brack'],
    },
  };
  return withTravelLog(base, travelPicks);
}

function stillrootHurtAt(
  here: string,
  prev: string,
  third: string,
  turn: number,
  movedTurn: number,
  travelPicks: string[]
): GameState {
  const built = buildNewGameState({
    bibleId: 'stillroot-veil',
    characterName: 'Jax',
    seed: SEED,
    personality: 'chilled-gm',
    engineMode: 'dnd',
  });
  const opened = playReady(stampOpening(built.state));
  const base: GameState = {
    ...opened,
    turn,
    currentLocation: here,
    previousLocationSheet: { name: prev } as GameState['previousLocationSheet'],
    character: { ...opened.character!, hp: 1, maxHp: 8 },
    circling: {
      ...(opened.circling ?? { stale: {}, lastProgressTurn: movedTurn - 2 }),
      prevPlace: prev,
      lastLocation: here,
      movedTurn,
      lastProgressTurn: movedTurn - 2,
      recentPlaces: [third, prev, here].filter(Boolean),
    },
    firstFightGateDone: true,
    pendingFirstFight: null,
    activeEncounter: null,
    sceneFacts: {
      ...emptySceneFacts(turn),
      indoor: /inn/i.test(here),
      present: /inn/i.test(here)
        ? ['Oda Hollin', 'Child Fenn']
        : /graveyard/i.test(here)
          ? ['Child Fenn', 'Bertil Cotter']
          : ['Cutha Dunmore', 'Wat Aske'],
    },
  };
  return withTravelLog(base, travelPicks);
}

describe('FOURSLOT4 travel loop root fixes', () => {
  it('7803 stream: hurt Choked↔Moot — Rest legal at Moot; Travel illegal after streak; slot-1 not Travel', () => {
    const state = verdantHurtAt('Village Moot', 'Choked Shrine', 42, 41, [
      'Travel toward Choked Shrine',
      'Travel toward Village Moot',
    ]);
    expect(consecutiveTravelFamilyPicks(state)).toBeGreaterThanOrEqual(TRAVEL_STREAK_CAP);
    expect(recentTravelNoDevelopment(state)).toBe(true);
    expect(isSafeHubRest(state, TABLETOP_SHORT_REST_CHIP)).toBe(true);
    expect(isImmediateBounceTravel(state, 'Travel toward Choked Shrine')).toBe(true);
    expect(isFourSlotLegal(state, 'Travel toward Choked Shrine')).toBe(false);
    expect(isFourSlotLegal(state, 'Travel toward Overgrown Station')).toBe(false);

    const pads = assembleFourSlotPads(state, [
      'Bring proof to Baroness Mirelle',
      'Talk to Baroness Mirelle',
      'Read Sister Cala',
      'Travel toward Choked Shrine',
      'Travel toward Overgrown Station',
      'Look around',
      TABLETOP_SHORT_REST_CHIP,
    ]);
    const engine = fourSlotEngineLabels(pads);
    expect(engine.length).toBe(4);
    expect(/^Travel\b/i.test(engine[0]!), `push=${engine[0]}`).toBe(false);
    expect(engine.some((c) => isTravelFamilyChip(c)), engine.join(' | ')).toBe(false);
    expect(
      engine.some((c) => /rest|talk to|bring proof|look around|search/i.test(c)),
      engine.join(' | ')
    ).toBe(true);

    // Hurt harness must pick Rest / development, never another Travel.
    const pick = preferHurtRecoveryPick(engine, engine[3] ?? engine[0]!, state);
    expect(isTravelFamilyChip(pick), `hurt-pick=${pick}`).toBe(false);
    const fourPick = pickFromFourSlots(state, pads, () => 0.99);
    expect(isTravelFamilyChip(fourPick), `four-pick=${fourPick}`).toBe(false);
  });

  it('7903 stream: Stillroot triangle — after 2 Travel picks, Travel starved; Rest at Inn; Fight/Talk can win', () => {
    const atInn = stillrootHurtAt(
      'Stillroot Inn',
      'Restless Graveyard',
      "Peat-Cutters' Camp",
      30,
      29,
      [
        'Travel toward Restless Graveyard',
        'Travel toward Peat-Cutters\' Camp',
        'Travel toward Stillroot Inn',
      ]
    );
    expect(consecutiveTravelFamilyPicks(atInn)).toBeGreaterThanOrEqual(TRAVEL_STREAK_CAP);
    expect(isSafeHubRest(atInn, TABLETOP_SHORT_REST_CHIP)).toBe(true);
    expect(isFourSlotLegal(atInn, 'Travel toward Restless Graveyard')).toBe(false);
    expect(isFourSlotLegal(atInn, "Travel toward Peat-Cutters' Camp")).toBe(false);

    const pads = assembleFourSlotPads(atInn, [
      'Look around',
      'Talk to Oda Hollin',
      'Read Oda Hollin',
      'Travel toward Restless Graveyard',
      'Leave the scene',
      TABLETOP_SHORT_REST_CHIP,
    ]);
    const engine = fourSlotEngineLabels(pads);
    expect(engine.some((c) => isTravelFamilyChip(c)), engine.join(' | ')).toBe(false);
    expect(/^Travel\b/i.test(engine[0]!)).toBe(false);
    const hurtPick = preferHurtRecoveryPick(engine, 'Leave the scene', atInn);
    expect(hurtPick).toMatch(/rest|talk|look|read|search/i);
    expect(isTravelFamilyChip(hurtPick)).toBe(false);

    // Graveyard is not a settlement Rest spot.
    const atYard = stillrootHurtAt(
      'Restless Graveyard',
      'Stillroot Inn',
      "Peat-Cutters' Camp",
      31,
      30,
      ['Travel toward Stillroot Inn', 'Travel toward Restless Graveyard']
    );
    expect(isSafeHubRest(atYard, TABLETOP_SHORT_REST_CHIP)).toBe(false);
    expect(isFourSlotLegal(atYard, 'Travel toward Stillroot Inn')).toBe(false);
    const yardPads = assembleFourSlotPads(atYard, [
      'Fight the writhing roots',
      'Talk to Child Fenn',
      'Read Child Fenn',
      'Travel toward Stillroot Inn',
      'Leave the scene',
    ]);
    const yardEngine = fourSlotEngineLabels(yardPads);
    expect(yardEngine.some((c) => /fight|talk|look|search|read/i.test(c))).toBe(true);
    expect(yardEngine.some((c) => isTravelFamilyChip(c))).toBe(false);
  });

  it('7903 Innkeep Mara: role prose counts as the named chip; Talk absent when not seated', () => {
    const prose =
      'Jax stopped in the wet grass and asked the innkeep his question straight out. The innkeep made clear that they needed order under their roof. The innkeep answered, but kept it short.';
    expect(mentionsName(prose, 'Innkeep Mara')).toBe(true);
    expect(listenerAnsweredInProse(prose, 'Innkeep Mara', 'Talk to Innkeep Mara')).toBe(true);

    const built = buildNewGameState({
      bibleId: 'stillroot-veil',
      characterName: 'Jax',
      seed: SEED,
      personality: 'chilled-gm',
      engineMode: 'dnd',
    });
    const opened = playReady(stampOpening(built.state));
    const noMara: GameState = {
      ...opened,
      turn: 3,
      currentLocation: 'a Stillroot funeral that will not stay down',
      sceneFacts: {
        ...emptySceneFacts(3),
        present: ['Child Fenn'],
      },
    };
    expect(isFourSlotLegal(noMara, 'Talk to Innkeep Mara')).toBe(false);

    const withMara: GameState = {
      ...noMara,
      sceneFacts: {
        ...emptySceneFacts(3),
        present: ['the innkeep', 'Innkeep Mara'],
      },
    };
    expect(isFourSlotLegal(withMara, 'Talk to Innkeep Mara')).toBe(true);
  });

  it('harness Travel cap: pickFromFourSlots never exceeds TRAVEL_STREAK_CAP consecutive Travels', () => {
    const state = verdantHurtAt('Village Moot', 'Choked Shrine', 44, 43, [
      'Travel toward Choked Shrine',
      'Travel toward Village Moot',
    ]);
    const pads = [
      'Bring proof to Baroness Mirelle',
      'Talk to Baroness Mirelle',
      'Look around',
      'Travel toward Choked Shrine',
      'Say something…',
      'Do something else…',
    ];
    for (let i = 0; i < 20; i++) {
      const pick = pickFromFourSlots(state, pads, () => (i % 10) / 10);
      expect(isTravelFamilyChip(pick), `i=${i} pick=${pick}`).toBe(false);
    }
  });

  it(
    'always-slot-1 + always-Travel simulation over every dnd premade (≥60 turns): travel streak ≤2, pair streak ≤2',
    () => {
      const holes: string[] = [];
      const bibles = ALL_CAMPAIGN_BIBLES.filter(
        (b) => b.engineMode === 'dnd' && !b.id.startsWith('blank-canvas')
      );
      expect(bibles.length).toBeGreaterThan(3);

      for (const bible of bibles) {
        let opened: GameState;
        try {
          opened = playReady(
            stampOpening(
              buildNewGameState({
                bibleId: bible.id,
                characterName: 'Jax',
                seed: 9000 + bible.id.length,
                personality: 'chilled-gm',
                engineMode: 'dnd',
              }).state
            )
          );
        } catch (err) {
          holes.push(`${bible.id}:open:${(err as Error).message ?? err}`);
          continue;
        }
        if (shouldSkipFourSlot(opened)) continue;

        for (const mode of ['slot1', 'alwaysTravel'] as const) {
          let state: GameState = {
            ...opened,
            turn: 2,
            firstFightGateDone: true,
            character: { ...opened.character!, hp: Math.max(1, Math.floor((opened.character?.maxHp ?? 10) * 0.4)) },
          };
          const picks: string[] = [];
          let travelStreak = 0;
          let maxTravel = 0;
          let pairStreak = 0;
          let maxPair = 0;
          let lastPair = '';
          let progressHits = 0;
          let sinceProgress = 0;

          for (let t = 0; t < 64; t++) {
            if (shouldSkipFourSlot(state)) break;
            const cand = [
              'Look around',
              'Search the area',
              'Wait and listen',
              ...(state.sceneFacts?.present ?? []).slice(0, 2).map((p) => `Talk to ${p}`),
              'Travel toward Village Moot',
              'Travel toward Choked Shrine',
              'Travel toward Stillroot Inn',
              'Travel toward Restless Graveyard',
              "Travel toward Peat-Cutters' Camp",
              'Travel toward Overgrown Station',
              TABLETOP_SHORT_REST_CHIP,
              'Bring proof to Baroness Mirelle',
              'Fight the writhing roots',
            ];
            const pads = assembleFourSlotPads(state, cand);
            const engine = fourSlotEngineLabels(pads);
            if (engine.length < 1) {
              holes.push(`${bible.id}:${mode}:empty-pad@${t}`);
              break;
            }

            let pick: string;
            if (mode === 'slot1') {
              pick = engine[0]!;
            } else {
              pick = engine.find((c) => isTravelFamilyChip(c)) ?? engine[0]!;
            }
            // Harness path (hurt + streak) must also respect the cap.
            pick = preferHurtRecoveryPick(engine, pick, state);
            pick = pickFromFourSlots(state, pads, () => 0.5);
            if (mode === 'alwaysTravel') {
              const want = engine.find((c) => isTravelFamilyChip(c));
              if (want) pick = preferHurtRecoveryPick(engine, want, state);
              pick = pickFromFourSlots(
                state,
                pads,
                // Bias toward back slot; cap must still hold.
                () => 0.95
              );
            }

            picks.push(pick);
            const from = state.currentLocation ?? '';
            if (isTravelFamilyChip(pick)) {
              travelStreak += 1;
              maxTravel = Math.max(maxTravel, travelStreak);
              const dest = pick.match(/toward\s+(.+)$/i)?.[1]?.trim() ?? '';
              const pair = [from, dest].map((x) => x.toLowerCase()).sort().join('|');
              if (dest && pair === lastPair) {
                pairStreak += 1;
              } else {
                pairStreak = dest ? 1 : 0;
                lastPair = pair;
              }
              maxPair = Math.max(maxPair, pairStreak);
              state = {
                ...state,
                turn: (state.turn ?? 0) + 1,
                currentLocation: dest || from,
                previousLocationSheet: { name: from } as GameState['previousLocationSheet'],
                log: [
                  ...(state.log ?? []),
                  { id: `p-${t}`, role: 'player', content: pick, turn: state.turn ?? 0, timestamp: t },
                ],
                circling: {
                  ...(state.circling ?? { stale: {}, lastProgressTurn: 0 }),
                  prevPlace: from,
                  lastLocation: dest || from,
                  movedTurn: (state.turn ?? 0) + 1,
                  lastProgressTurn: state.circling?.lastProgressTurn ?? 0,
                  recentPlaces: [...(state.circling?.recentPlaces ?? []), dest || from].filter(Boolean).slice(-4),
                },
              };
              sinceProgress += 1;
            } else {
              travelStreak = 0;
              pairStreak = 0;
              lastPair = '';
              progressHits += 1;
              sinceProgress = 0;
              state = {
                ...state,
                turn: (state.turn ?? 0) + 1,
                log: [
                  ...(state.log ?? []),
                  { id: `p-${t}`, role: 'player', content: pick, turn: state.turn ?? 0, timestamp: t },
                ],
                circling: {
                  ...(state.circling ?? { stale: {}, lastProgressTurn: (state.turn ?? 0) + 1 }),
                  lastProgressTurn: (state.turn ?? 0) + 1,
                },
                character: {
                  ...state.character!,
                  // Rest heals so hurt picker can leave the Travel path.
                  hp: /rest/i.test(pick)
                    ? Math.min(state.character!.maxHp, state.character!.hp + 2)
                    : state.character!.hp,
                },
              };
            }
            if (sinceProgress > 6) {
              holes.push(`${bible.id}:${mode}:no-progress-in-6 picks=${picks.slice(-8).join(' | ')}`);
              break;
            }
          }
          if (maxTravel > TRAVEL_STREAK_CAP) {
            holes.push(`${bible.id}:${mode}:travel-streak=${maxTravel} picks=${picks.slice(-12).join(' | ')}`);
          }
          if (maxPair > TRAVEL_STREAK_CAP) {
            holes.push(`${bible.id}:${mode}:pair-streak=${maxPair}`);
          }
          if (progressHits < 1 && picks.length >= 10) {
            holes.push(`${bible.id}:${mode}:zero-progress-picks`);
          }
        }
      }
      expect(holes, holes.join('\n')).toEqual([]);
    },
    SIM_MS
  );

  it(
    'premade×mode sweep: travel-blocked never offers Travel; arrival after Travel yields non-Travel development',
    () => {
      const modes: EngineMode[] = ['litrpg', 'rpg', 'dnd'];
      const holes: string[] = [];
      let checked = 0;
      for (const mode of modes) {
        const bibles = ALL_CAMPAIGN_BIBLES.filter(
          (b) => b.engineMode === mode && !b.id.startsWith('blank-canvas') && b.id !== 'umbra-protocol'
        );
        for (const bible of bibles) {
          checked += 1;
          let opened: GameState;
          try {
            opened = playReady(
              stampOpening(
                buildNewGameState({
                  bibleId: bible.id,
                  characterName: 'Jax',
                  seed: SEED + checked,
                  personality: mode === 'litrpg' ? 'cold-system' : 'chilled-gm',
                  engineMode: mode,
                }).state
              )
            );
          } catch (err) {
            holes.push(`${mode}:${bible.id}:open:${(err as Error).message ?? err}`);
            continue;
          }
          if (shouldSkipFourSlot(opened)) continue;

          const fight: GameState = {
            ...opened,
            firstFightGateDone: true,
            pendingFirstFight: null,
            activeEncounter: {
              name: 'Test Foe',
              hp: 10,
              maxHp: 10,
              level: 1,
              phase: 'engaged',
            } as GameState['activeEncounter'],
            sceneFacts: {
              ...(opened.sceneFacts ?? emptySceneFacts(1)),
              present: ['Test Foe'],
            },
          };
          if (travelPadBlocked(fight)) {
            const pads = assembleFourSlotPads(fight, [
              'Travel toward Somewhere',
              'Attack',
              'Defend',
              'Use something',
              'Disengage',
            ]);
            const engine = fourSlotEngineLabels(pads);
            if (engine.some((c) => /^Travel\b/i.test(c))) {
              holes.push(`${mode}:${bible.id}:travel-blocked-offering-Travel:${engine.join('|')}`);
            }
          }

          const here = opened.currentLocation ?? 'Here';
          const arrived: GameState = withTravelLog(
            {
              ...opened,
              turn: 10,
              firstFightGateDone: true,
              circling: {
                ...(opened.circling ?? { stale: {}, lastProgressTurn: 8 }),
                prevPlace: 'Elsewhere Gate',
                lastLocation: here,
                movedTurn: 9,
                lastProgressTurn: 8,
                recentPlaces: ['Elsewhere Gate', here],
              },
              previousLocationSheet: { name: 'Elsewhere Gate' } as GameState['previousLocationSheet'],
              activeEncounter: null,
            },
            ['Travel toward Elsewhere Gate', `Travel toward ${here}`]
          );
          if (shouldSkipFourSlot(arrived)) continue;
          const pad = commitOfferedPad({ ...arrived, offeredPad: null });
          const labels = assembleFourSlotPads(pad, [
            'Travel toward Elsewhere Gate',
            'Look around',
            'Wait and listen',
            'Talk to someone',
            TABLETOP_SHORT_REST_CHIP,
          ]);
          const engine = fourSlotEngineLabels(labels);
          if (engine[0] && /^Travel\b/i.test(engine[0])) {
            holes.push(`${mode}:${bible.id}:arrival-push-travel:${engine.join('|')}`);
          }
          // After streak, Travel family must not remain on the pad when a development exists.
          if (
            consecutiveTravelFamilyPicks(arrived) >= TRAVEL_STREAK_CAP
            && engine.some((c) => isTravelFamilyChip(c))
            && engine.some((c) => !isTravelFamilyChip(c))
          ) {
            holes.push(`${mode}:${bible.id}:streak-still-offers-Travel:${engine.join('|')}`);
          }
        }
      }
      expect(holes, holes.join('\n')).toEqual([]);
      expect(checked).toBeGreaterThan(10);
    },
    SWEEP_MS
  );
});

describe('FOURSLOT4 Story RPG 7902 P0 classification regressions', () => {
  /**
   * glass-harbor-letters s7902 P0s (from T50 summary) — classified, not all fixed here:
   * 1–2. T35 choice-leak + plays-player: Gather beat leaked "Materials: Peacebloom" + invented
   *    "Jax said…" (writer invent / chrome) — scrub invented PC speech on non-talk acts.
   * 3. T36 plays-player: Wait invented "Jax said, The docks…" — same scrub.
   * 4. T42 ignored-action: Travel toward docks never left Corner Table — Travel commit/alias
   *    (game); listed under could-still-miss if not closed by existing travel owners.
   */
  it('non-talk acts drop invented PC "Name said" quotes (7902 T35/T36 shape)', async () => {
    const { dropInventedPcSpeechOnNonTalk } = await import('./writerTurn');
    const gather =
      'Materials: Peacebloom x1. "My child is missing, and I will not stop until I find them," Jax said.';
    const cleaned = dropInventedPcSpeechOnNonTalk(gather, 'Gather herbs and resources nearby', 'Jax');
    expect(cleaned).not.toMatch(/Jax said/i);
    expect(cleaned).not.toMatch(/My child is missing/i);

    const waited =
      'Jax stayed at the cafe. Jax said, "The docks, then. That is where this ends, one way or the other."';
    const cleanedWait = dropInventedPcSpeechOnNonTalk(waited, 'Wait and listen', 'Jax');
    expect(cleanedWait).not.toMatch(/Jax said/i);
    expect(cleanedWait).toMatch(/stayed at the cafe/i);
  });
});
