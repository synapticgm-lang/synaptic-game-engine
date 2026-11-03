/**
 * FOURSLOT2 — alias sweep: every premade × mode, after opening (+ origin for Story RPG),
 * no Travel chip targets the place the player stands in under any alias/id/display name.
 * Then simulate a move along each exit and re-assert. Deterministic, no network.
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
import { isTravelDestHere, canonicalPlaceKey, placeExitRows } from './placeRegistry';
import { travelChipTarget } from './questPlay';
import type { EngineMode, GameState } from './types';

const SEED = 5202;
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

function travelDest(label: string): string | null {
  return (
    travelChipTarget(label)
    ?? label.match(/^(?:travel|head|go|walk|return|make for|set out)\s+(?:to|toward|towards|for|into)\s+(.+)$/i)?.[1]
      ?.replace(/^(?:the|a|an)\s+/i, '')
      .trim()
    ?? null
  );
}

function assertNoTravelHere(state: GameState, labels: string[], tag: string) {
  for (const c of fourSlotEngineLabels(labels)) {
    const dest = travelDest(c);
    if (!dest) continue;
    expect(
      isTravelDestHere(state, dest),
      `${tag} Travel-HERE:${c} here=${state.currentLocation} key=${canonicalPlaceKey(state, state.currentLocation)} destKey=${canonicalPlaceKey(state, dest)}`
    ).toBe(false);
    expect(isFourSlotLegal(state, c), `${tag} illegal travel kept:${c}`).toBe(true);
  }
}

describe('FOURSLOT2 alias sweep', () => {
  it(
    'all premades × modes: no Travel-to-HERE after opening and after simulated exit moves',
    () => {
      const modes: EngineMode[] = ['litrpg', 'rpg', 'dnd'];
      const holes: string[] = [];
      let checked = 0;
      let moveChecks = 0;
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
            // Origin / dying / first-fight exclusive — skip alias assert on exclusive pad.
            continue;
          }
          const pad = commitOfferedPad({ ...opened, offeredPad: null });
          const committed = pad.offeredPad?.choices ?? pad.choices ?? [];
          const labels = assembleFourSlotPads(pad, committed);
          try {
            assertNoTravelHere(pad, labels, `${mode}:${bible.id}:open`);
          } catch (err) {
            holes.push(`${mode}:${bible.id}:open:${(err as Error).message ?? err}`);
          }

          // Synthetic opening id must resolve to the same key as HERE when HERE is the opener.
          const openKey = canonicalPlaceKey(pad, 'where this tale opens');
          const hereKey = canonicalPlaceKey(pad, pad.currentLocation);
          if (openKey && hereKey && openKey === hereKey) {
            expect(
              isTravelDestHere(pad, 'place_where-this-tale-opens'),
              `${mode}:${bible.id}:synthetic-id`
            ).toBe(true);
            const bogus = assembleFourSlotPads(pad, [
              ...committed,
              'Travel toward place_where-this-tale-opens',
              'Travel toward where this tale opens',
            ]);
            expect(bogus.some((c) => /place_where-this-tale-opens|where this tale opens/i.test(c))).toBe(
              false
            );
          }

          const exits = placeExitRows(pad, pad.currentLocation ?? '').slice(0, 3);
          for (const ex of exits) {
            const dest = (ex.label || ex.id || '').trim();
            if (!dest || isTravelDestHere(pad, dest)) continue;
            moveChecks += 1;
            const moved: GameState = {
              ...pad,
              currentLocation: dest,
              turn: (pad.turn ?? 1) + 1,
            };
            const movedPads = assembleFourSlotPads(moved, [
              `Travel toward ${pad.currentLocation}`,
              `Travel toward ${dest}`,
              'Look around',
              'Wait',
              'Search the area',
            ]);
            try {
              assertNoTravelHere(moved, movedPads, `${mode}:${bible.id}:move→${dest}`);
              expect(
                movedPads.some((c) => {
                  const d = travelDest(c);
                  return d && isTravelDestHere(moved, d);
                }),
                `${mode}:${bible.id}:move still offers HERE`
              ).toBe(false);
            } catch (err) {
              holes.push(`${mode}:${bible.id}:move→${dest}:${(err as Error).message ?? err}`);
            }
          }
        }
      }
      expect(checked, 'premades checked').toBeGreaterThan(10);
      expect(moveChecks, 'simulated moves').toBeGreaterThan(5);
      expect(holes, holes.join('\n') || 'ok').toEqual([]);
    },
    SWEEP_MS
  );
});
