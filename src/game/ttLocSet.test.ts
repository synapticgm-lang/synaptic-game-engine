/**
 * q58-LOCSET — typed / free text must never become currentLocation.
 * Membership in place data decides; player input is never a harvest candidate.
 * Tabletop only. Never PYOA.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { extractNamedPlaces, isGenericMapPlace, mapAnchorName } from './questPlay';
import { commitTravel } from './travelJourney';
import {
  resolveNextLocation,
  type LocationTravelCommit,
  type WriterDeclaredPlace,
} from './travelAuthority';
import type { GameState } from './types';

const FIXTURE = JSON.parse(
  readFileSync(join(__dirname, '__fixtures__/locset/save-102e7d47.json'), 'utf8').replace(/^\uFEFF/, '')
) as {
  opening: { location: string };
  turns: Array<{ player_input: string; snapshot_location: string }>;
};

const GATE = 'Millstone Ford gate';
const FORD = 'Millstone Ford';

function millstoneGate(over: Partial<GameState> = {}): GameState {
  const s = createInitialState(undefined, 'dnd') as GameState;
  return {
    ...s,
    engineMode: 'dnd',
    campaignBibleId: 'millstone-road',
    currentLocation: GATE,
    openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true, sceneWritten: true },
    places: [
      { id: 'place_millstone-ford-gate', name: GATE, arcStatus: 'open', lastVisitedTurn: 1 },
      { id: 'place_millstone-ford', name: FORD, arcStatus: 'open', lastVisitedTurn: 0 },
    ],
    worldAtlas: null,
    activeEncounter: null,
    journey: null,
    ...over,
  } as GameState;
}

/** Same location step as useGame sendAction (harvest without player input + resolveNextLocation). */
function useGameLocationStep(
  state: GameState,
  opts: {
    sanitizedInput: string;
    cleanText?: string;
    systemLog?: string[];
    travelCommit?: LocationTravelCommit;
    writerNewPlaces?: readonly WriterDeclaredPlace[] | null;
  }
): string {
  const resolvedLocation = state.currentLocation;
  // Player input omitted on purpose (q58-LOCSET).
  const harvested = extractNamedPlaces(
    `${opts.cleanText ?? ''}\n${(opts.systemLog ?? []).join('\n')}\n${resolvedLocation ?? ''}`
  );
  const mapName = mapAnchorName(resolvedLocation, harvested);
  return resolveNextLocation(state, {
    travelCommit: opts.travelCommit,
    proposed: isGenericMapPlace(resolvedLocation) && mapName ? mapName : resolvedLocation,
    writerNewPlaces: opts.writerNewPlaces,
  });
}

describe('q58-LOCSET location membership', () => {
  it('(a) millstone-road gate: Look around / Ask Lessa… / Read Old Tam keep Millstone Ford gate', () => {
    expect(FIXTURE.opening.location).toBe(GATE);
    let state = millstoneGate();
    for (const turn of FIXTURE.turns) {
      const next = useGameLocationStep(state, {
        sanitizedInput: turn.player_input,
        cleanText: `Jax looked about at ${GATE}.`,
      });
      expect(next).toBe(GATE);
      // Even if prose/input were wrongly proposed, membership keeps the gate.
      expect(
        resolveNextLocation(state, { proposed: turn.player_input })
      ).toBe(GATE);
      state = { ...state, currentLocation: next };
    }
  });

  it('(b) travel chip from the gate to a known place moves HERE', () => {
    const state = millstoneGate();
    const travelCommit = {
      handled: true as const,
      state: { ...state, currentLocation: FORD },
    };
    const next = useGameLocationStep(state, {
      sanitizedInput: `Travel toward ${FORD}`,
      travelCommit,
    });
    expect(next).toBe(FORD);
  });

  it('(c) typed go-to a known place that commitTravel handles moves HERE', () => {
    const s = createInitialState(undefined, 'dnd') as GameState;
    const atInn = {
      ...s,
      engineMode: 'dnd' as const,
      campaignBibleId: 'cursed-keep',
      currentLocation: 'Greyhollow Inn',
      openingEstablishment: { ...(s.openingEstablishment ?? {}), complete: true },
      places: [
        { id: 'place_greyhollow-inn', name: 'Greyhollow Inn', arcStatus: 'open' as const },
        { id: 'place_keep-gate', name: 'Keep Gate', arcStatus: 'open' as const },
      ],
      worldAtlas: null,
      activeEncounter: null,
      journey: null,
    } as GameState;
    const travel = commitTravel(atInn, 'go to Keep Gate');
    expect(travel.handled).toBe(true);
    expect(travel.state.currentLocation).toBeTruthy();
    const next = resolveNextLocation(atInn, {
      travelCommit: travel,
      proposed: 'Ask Lessa Quill about the crates',
    });
    expect(next).toBe(travel.state.currentLocation);
    expect(next).not.toBe('Ask Lessa Quill about the crates');
  });

  it('(d) a proposed name that is not a known place keeps the current location', () => {
    const state = millstoneGate();
    expect(resolveNextLocation(state, { proposed: 'Ask Lessa Quill about the crates' })).toBe(GATE);
    expect(resolveNextLocation(state, { proposed: 'a glowing rift of nonsense' })).toBe(GATE);
    expect(
      useGameLocationStep(state, {
        sanitizedInput: 'Ask Lessa Quill about the crates',
        cleanText: 'Jax walked up to Ask Lessa Quill about the crates.',
      })
    ).toBe(GATE);
  });

  it('(e) structured writer-declared new place becomes location when newPlaces exists', () => {
    const state = millstoneGate();
    const writerNewPlaces: WriterDeclaredPlace[] = [{ name: 'River Crane Landing' }];
    const next = resolveNextLocation(state, {
      proposed: 'River Crane Landing',
      writerNewPlaces,
    });
    expect(next).toBe('River Crane Landing');
    // Prose-only invent without writerNewPlaces stays put.
    expect(resolveNextLocation(state, { proposed: 'River Crane Landing' })).toBe(GATE);
  });
});
