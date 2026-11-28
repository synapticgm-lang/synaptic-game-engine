/**
 * FOURSLOT3 — Verdant Blight travel bounce loop, Check System unrelated-chip,
 * Story RPG false deathCount, fight pad / lifeline wake regressions.
 */
import { describe, expect, it } from 'vitest';
import { ALL_CAMPAIGN_BIBLES } from '@/data/campaigns';
import { buildNewGameState, stampOpening } from './fateAutoplay';
import { chipProblem } from './chipLegality';
import { commitOfferedPad } from './playTranscript';
import {
  assembleFourSlotPads,
  fourSlotEngineLabels,
  isFourSlotLegal,
  isImmediateBounceTravel,
  shouldSkipFourSlot,
} from './fourSlotPads';
import { travelPadBlocked } from './padUniverse';
import { emptySceneFacts } from './sceneFacts';
import { settleOrigin, ORIGIN_QUICK_START_CHIP } from './rules/rpgOrigin';
import { openFirstFightGate, firstFightChoiceSet } from './rules/firstFightChoice';
import { applyOptionCooldown } from './sceneAffordances';
import { peopleHere } from './scenePresence';
import { commitDeath } from './rules/death';
import type { EngineMode, GameState } from './types';

const SEED = 7803;
const SWEEP_MS = 90_000;

/** Same deathCount shape as fateAutoplay summary (FOURSLOT3 — no foe "went down" false positives). */
function countPlayerDeaths(systemLogs: string[][]): number {
  return systemLogs.filter((lines) =>
    lines.some((l) =>
      /Fight:\s*DEFEAT|\b[Ll]ifeline:|you were defeated|went down, and the fight was lost/i.test(String(l))
    )
  ).length;
}

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

function verdantAt(here: string, prev: string, turn: number, movedTurn: number): GameState {
  const built = buildNewGameState({
    bibleId: 'verdant-blight',
    characterName: 'Jax',
    seed: SEED,
    personality: 'chilled-gm',
    engineMode: 'dnd',
  });
  const opened = playReady(stampOpening(built.state));
  return {
    ...opened,
    turn,
    currentLocation: here,
    previousLocationSheet: { name: prev } as GameState['previousLocationSheet'],
    circling: {
      ...(opened.circling ?? { stale: {}, lastProgressTurn: turn }),
      prevPlace: prev,
      lastLocation: here,
      movedTurn,
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
}

describe('FOURSLOT3 verdant travel loop + Check System + deaths', () => {
  it('7803 stream: Choked Shrine ↔ Village Moot never offers bounce Travel as legal; autoplay slot-1 cannot same-pair Travel >2', () => {
    let state = verdantAt('Choked Shrine', 'Village Moot', 42, 41);
    const picks: string[] = [];
    for (let i = 0; i < 8; i++) {
      const from = state.currentLocation ?? '';
      const prev = state.circling?.prevPlace ?? '';
      expect(isImmediateBounceTravel(state, `Travel toward ${prev}`), `bounce@${from}`).toBe(true);
      expect(isFourSlotLegal(state, `Travel toward ${prev}`), `illegal-bounce@${from}`).toBe(false);

      const cand = [
        'Bring proof to Baroness Mirelle',
        'Talk to Baroness Mirelle',
        'Read Sister Cala',
        `Travel toward ${prev}`,
        'Travel toward Overgrown Station',
        'Look around',
      ];
      const pads = assembleFourSlotPads(state, cand);
      const engine = fourSlotEngineLabels(pads);
      expect(engine.length).toBe(4);
      // Slot 1 (push) must not be Travel back to the place just left.
      expect(/^Travel\b/i.test(engine[0]!), `push=${engine[0]} after arrival at ${from}`).toBe(false);
      expect(isImmediateBounceTravel(state, engine[0]!)).toBe(false);

      // Simulate autoplay always picking slot 1 (or the first Travel if somehow push).
      const pick = engine[0]!;
      picks.push(pick);
      const dest = pick.match(/^Travel toward (.+)$/i)?.[1];
      if (dest) {
        state = {
          ...state,
          turn: (state.turn ?? 0) + 1,
          currentLocation: dest,
          previousLocationSheet: { name: from } as GameState['previousLocationSheet'],
          circling: {
            ...state.circling!,
            prevPlace: from,
            lastLocation: dest,
            movedTurn: (state.turn ?? 0) + 1,
            recentPlaces: [...(state.circling?.recentPlaces ?? []), dest].slice(-4),
          },
        };
      } else {
        // Non-Travel development — break the treadmill (what the engine must force).
        state = {
          ...state,
          turn: (state.turn ?? 0) + 1,
          log: [
            ...(state.log ?? []),
            { id: `p-${i}`, role: 'player', content: pick, turn: state.turn ?? 0, timestamp: Date.now() },
          ],
        };
        break;
      }
    }
    // Consecutive same-pair Travel picks (Choked↔Moot) must be ≤2 under slot-1 autoplay.
    let streak = 0;
    let maxPair = 0;
    for (const p of picks) {
      if (/^Travel toward (?:Choked Shrine|Village Moot)$/i.test(p)) {
        streak += 1;
        maxPair = Math.max(maxPair, streak);
      } else {
        streak = 0;
      }
    }
    expect(maxPair, `picks=${picks.join(' | ')}`).toBeLessThanOrEqual(2);
  });

  it('travel-blocked fight pad never offers Travel; Attack survives a prior Attack pick', () => {
    const base = verdantAt('Village Moot', 'Choked Shrine', 37, 30);
    const fight: GameState = {
      ...base,
      firstFightGateDone: true,
      activeEncounter: {
        name: 'Shadow Cutthroat',
        hp: 8,
        maxHp: 12,
        level: 1,
        phase: 'engaged',
      } as any,
      log: [
        { id: 'p', role: 'player', content: 'Attack with the Shortsword', turn: 36, timestamp: 1 },
      ],
      sceneFacts: {
        ...emptySceneFacts(37),
        present: ['Baroness Mirelle', 'Shadow Cutthroat'],
      },
    };
    expect(travelPadBlocked(fight)).toBe(true);
    expect(isFourSlotLegal(fight, 'Travel toward Choked Shrine')).toBe(false);
    const pads = assembleFourSlotPads(fight, [
      'Travel toward Choked Shrine',
      'Attack with the Shortsword',
      'Defend',
      'Use something',
      'Disengage and move',
    ]);
    const engine = fourSlotEngineLabels(pads);
    expect(engine.some((c) => /^Travel\b/i.test(c)), engine.join(' | ')).toBe(false);
    expect(engine.some((c) => /attack|press the attack/i.test(c))).toBe(true);
    expect(engine.some((c) => /defend/i.test(c))).toBe(true);
    expect(engine.some((c) => /disengage|flee/i.test(c))).toBe(true);
  });

  it('first-fight exclusive: applyOptionCooldown does not prepend Travel; foe is seated for Talk', () => {
    const base = {
      ...verdantAt('Village Moot', 'Choked Shrine', 33, 30),
      firstFightGateDone: false,
      character: {
        ...verdantAt('Village Moot', 'Choked Shrine', 33, 30).character!,
        level: 1,
      },
      arcDirector: { encounterClearedReceipts: [] } as GameState['arcDirector'],
    };
    const gated = openFirstFightGate(base, {
      name: 'Shadow Cutthroat',
      hp: 11,
      maxHp: 11,
      level: 1,
    } as any);
    const set = firstFightChoiceSet(gated);
    expect(set.active).toBe(true);
    expect(set.options.some((o) => /^Talk to Shadow Cutthroat$/i.test(o))).toBe(true);
    expect(peopleHere(gated).some((p) => /Shadow Cutthroat/i.test(p))).toBe(true);

    const cooled = applyOptionCooldown(
      gated,
      [
        {
          label: 'Travel toward Choked Shrine',
          actionId: 'exit:place_choked-shrine:travel',
          kind: 'exit',
          slotCategory: 'move' as const,
        },
        ...set.options.map((o) => ({
          label: o,
          actionId: `first-fight:${o.toLowerCase()}`,
          kind: 'system',
          slotCategory: 'act' as const,
        })),
      ],
    );
    expect(cooled.some((c) => /^Travel\b/i.test(c.label))).toBe(false);
    expect(cooled.some((c) => /^Fight$/i.test(c.label))).toBe(true);
  });

  it('Check System is a real notice-inbox action — not unrelated-chip', () => {
    const state = playReady(
      stampOpening(
        buildNewGameState({
          bibleId: 'ascending-spire',
          characterName: 'Jax',
          seed: 7801,
          personality: 'cold-system',
          engineMode: 'litrpg',
        }).state
      )
    );
    expect(chipProblem(state, 'Check System')).toBeNull();
    expect(chipProblem(state, 'Check System (3)')).toBeNull();
    const pads = assembleFourSlotPads(state, [
      'Travel toward Spire Gate Plaza',
      'Wait and listen',
      'Check System',
      'Look around',
    ]);
    expect(pads.some((c) => /^Check System/i.test(c))).toBe(false);
    expect(pads.filter((c) => !/^(?:Say something|Do something else)/i.test(c))).toHaveLength(4);
  });

  it('deathCount ignores foe went-down victories; counts real DEFEAT / Lifeline', () => {
    expect(
      countPlayerDeaths([
        ['The Tide Crab Matriarch went down and did not get up, and the fight was over.', 'XP Gained: 132 (defeated Tide Crab Matriarch)'],
        ['The Gull Swarm went down and did not get up, and the fight was over.'],
        ['Fight: DEFEAT vs Shadow Cutthroat in 3 rounds. The fight is over: you lost it.'],
        ['Jax went down, and the fight was lost.'],
        ['Lifeline: an old oath that will not let you go — you live; HP set to 15.'],
      ])
    ).toBe(3);
    expect(
      countPlayerDeaths([
        ['The Wardline Bandit went down and did not get up, and the fight was over.', 'XP Gained: 19 (defeated Wardline Bandit)'],
      ])
    ).toBe(0);
  });

  it('Story RPG lifeline wake: hub, HP ≥ 50% max, no live fight (not HP 1 into same fight)', () => {
    const state = playReady(
      stampOpening(
        buildNewGameState({
          bibleId: 'salt-road-heist',
          characterName: 'Jax',
          seed: 7802,
          personality: 'chilled-gm',
          engineMode: 'rpg',
        }).state
      )
    );
    const deathPlace = state.currentLocation ?? 'Harbor Fence';
    const down: GameState = {
      ...state,
      turn: 22,
      currentLocation: deathPlace,
      character: { ...state.character!, hp: 0, maxHp: 31, lifeline: state.character?.lifeline ?? 'an old oath that will not let you go' },
      activeEncounter: {
        name: 'Gull Swarm',
        hp: 5,
        maxHp: 5,
        level: 3,
        phase: 'engaged',
      } as any,
      lastSafeHub: 'Salt Road Waystation',
    };
    const out = commitDeath(down, 'danger', () => 0.5);
    expect(out.dead).toBe(false);
    expect(out.state.activeEncounter).toBeNull();
    expect(out.state.character.hp).toBeGreaterThanOrEqual(Math.floor(31 * 0.5));
    expect(out.state.character.hp).toBeGreaterThan(1);
    expect(out.state.currentLocation).not.toBe(deathPlace);
    expect(out.receipts.some((r) => /Lifeline:/i.test(r))).toBe(true);
  });

  it(
    'four-slot/travel sweep: every premade × mode — no travel-blocked Travel; arrival push is non-Travel',
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
            } as any,
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
            if (!engine.some((c) => /disengage|flee|withdraw/i.test(c))) {
              holes.push(`${mode}:${bible.id}:fight-missing-flee:${engine.join('|')}`);
            }
            if (!engine.some((c) => /defend|help|protect/i.test(c))) {
              holes.push(`${mode}:${bible.id}:fight-missing-defend:${engine.join('|')}`);
            }
          }

          // Arrival: prev ≠ here, movedTurn = turn-1 → push must not be Travel.
          const here = opened.currentLocation ?? 'Here';
          const arrived: GameState = {
            ...opened,
            turn: 10,
            firstFightGateDone: true,
            circling: {
              ...(opened.circling ?? { stale: {}, lastProgressTurn: 9 }),
              prevPlace: 'Elsewhere Gate',
              lastLocation: here,
              movedTurn: 9,
              recentPlaces: ['Elsewhere Gate', here],
            },
            previousLocationSheet: { name: 'Elsewhere Gate' } as GameState['previousLocationSheet'],
            activeEncounter: null,
          };
          if (shouldSkipFourSlot(arrived)) continue;
          const pad = commitOfferedPad({ ...arrived, offeredPad: null });
          const labels = assembleFourSlotPads(pad, [
            'Travel toward Elsewhere Gate',
            'Look around',
            'Wait and listen',
            'Talk to someone',
          ]);
          const engine = fourSlotEngineLabels(labels);
          if (engine[0] && /^Travel\b/i.test(engine[0])) {
            holes.push(`${mode}:${bible.id}:arrival-push-travel:${engine.join('|')}`);
          }
          if (isFourSlotLegal(arrived, 'Travel toward Elsewhere Gate')) {
            holes.push(`${mode}:${bible.id}:bounce-still-legal`);
          }
        }
      }
      expect(holes, holes.join('\n')).toEqual([]);
      expect(checked).toBeGreaterThan(10);
    },
    SWEEP_MS
  );
});
