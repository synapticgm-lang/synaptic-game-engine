/**
 * FOURSLOT SWEEP — every premade in every engine mode: after opening (+ origin for Story RPG),
 * first scene has exactly 4 distinct legal slots. Then stall the scene and assert again.
 * Deterministic (fixed seeds, no network, no AI). Explicit timeout under full-suite load.
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
import type { EngineMode, GameState } from './types';

const SEED = 4201;
const SWEEP_MS = 60_000;

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
    // Force origin closed even if settle no-ops (some bibles seed oddly).
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

function stallState(state: GameState): GameState {
  return {
    ...state,
    character: {
      ...state.character!,
      hp: Math.max(1, Math.floor((state.character?.maxHp ?? 20) * 0.4)),
    },
    sceneFacts: {
      ...emptySceneFacts(state.turn ?? 12),
      ...(state.sceneFacts ?? {}),
      present: [],
      indoor: state.sceneFacts?.indoor ?? false,
    },
    log: [
      ...(state.log ?? []),
      {
        id: 'stall-player',
        turn: state.turn ?? 12,
        role: 'player',
        content: 'Search here for signs',
        timestamp: Date.now(),
      },
    ],
  };
}

describe('FOURSLOT premade sweep', () => {
  it(
    'every premade × mode: first post-origin scene has 4 valid slots; stall still has 4',
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
            const built = buildNewGameState({
              bibleId: bible.id,
              characterName: 'Jax',
              seed: SEED + checked,
              personality: mode === 'litrpg' ? 'cold-system' : 'chilled-gm',
              engineMode: mode,
            });
            opened = playReady(stampOpening(built.state));
          } catch (err) {
            holes.push(`${mode}:${bible.id}:open:${(err as Error).message ?? err}`);
            continue;
          }
          if (shouldSkipFourSlot(opened)) {
            holes.push(`${mode}:${bible.id}:still-exclusive-after-origin`);
            continue;
          }
          const pad = commitOfferedPad({ ...opened, offeredPad: null });
          // Assembler is the contract owner; feed committed labels (or empty) through it.
          const committed = pad.offeredPad?.choices ?? pad.choices ?? [];
          const labels = assembleFourSlotPads(pad, committed);
          try {
            assertFour(pad, labels, `${mode}:${bible.id}:open`);
          } catch (err) {
            holes.push(
              `${mode}:${bible.id}:open:${(err as Error).message ?? err} committed=[${committed.join(' | ')}] assembled=[${labels.join(' | ')}]`
            );
          }

          const stalled = stallState(pad);
          const stalledPads = assembleFourSlotPads(stalled, [
            'Search here for signs',
            'Open the bronze reward box',
            'Talk to the leaving courier',
            'Travel toward ' + (stalled.currentLocation ?? 'Here'),
            'Look around',
            'Wait',
          ]);
          try {
            assertFour(stalled, stalledPads, `${mode}:${bible.id}:stall`);
          } catch (err) {
            holes.push(
              `${mode}:${bible.id}:stall:${(err as Error).message ?? err} offered=[${stalledPads.join(' | ')}]`
            );
          }
        }
      }
      expect(checked, 'expected premades checked').toBeGreaterThan(10);
      expect(holes, holes.join('\n') || 'ok').toEqual([]);
    },
    SWEEP_MS
  );
});
