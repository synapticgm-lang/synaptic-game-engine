/**
 * 28s — spine moves HERE, spine chips are engine edges, panel chrome is LitRPG-only,
 * kit labels read mid-sentence, echoed place labels collapse, travel sheet follows HERE.
 */
import { describe, expect, it } from 'vitest';
import { createInitialState } from './defaults';
import { advancePyoaSpine, ensurePyoaSpine, SPINE_ENDING_CHIP, spineEngineChipLabels } from './pyoaSpine';
import { filterInventedContextChoices } from './choiceWarden';
import { seedOpeningSceneFacts } from './sceneFacts';
import { kitRefDisplay } from './inventory';
import { collapseEchoedLabel } from './tokenProse';
import { syncSheetToMovedHere } from './locationMemory';
import { enforceCameraOnProse } from './travelAuthority';

function thornferryState() {
  let state = createInitialState(undefined, 'pyoa');
  state.campaignBibleId = 'thornferry-road';
  state.engineMode = 'pyoa';
  state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
  state.turn = 3;
  state.currentLocation = 'the ford below Thornferry';
  return ensurePyoaSpine(state);
}

describe('playtest28sSpineTravelKit', () => {
  it('taking a spine exit moves HERE to the destination node place', () => {
    let s = thornferryState();
    s = advancePyoaSpine(s, 'Walk the road together');
    expect(s.pyoaSpine?.currentNodeId).toBe('tf-streets');
    expect(s.currentLocation).toBe('Thornferry streets');
    s = advancePyoaSpine(s, 'Keep the charter with the mill');
    s = advancePyoaSpine(s, 'Visit the quiet chapel');
    expect(s.currentLocation).toBe('The Quiet Bell chapel');
  });

  it('spine exits and the ending chip survive the invented-context filter', () => {
    let s = thornferryState();
    s.log = [{ id: 'g1', role: 'gm', content: 'Wren wants help across the ford with the charter.' } as never];
    const exits = spineEngineChipLabels(s);
    expect(filterInventedContextChoices(exits, s)).toEqual(exits);
    s = { ...s, pyoaSpine: { ...s.pyoaSpine!, currentNodeId: 'tf-end-burn', endingId: 'thornferry:burned' } };
    expect(spineEngineChipLabels(s)).toContain(SPINE_ENDING_CHIP);
    expect(filterInventedContextChoices([SPINE_ENDING_CHIP], s)).toEqual([SPINE_ENDING_CHIP]);
  });

  it('opening scene facts carry the blue panel prop only in LitRPG', () => {
    const pyoa = thornferryState();
    expect(seedOpeningSceneFacts(pyoa).props ?? []).not.toContain('blue panel');
    const lit = createInitialState(undefined, 'litrpg');
    lit.engineMode = 'litrpg';
    expect(seedOpeningSceneFacts(lit).props ?? []).toContain('blue panel');
  });

  it('kit labels read mid-sentence', () => {
    expect(kitRefDisplay('The clothes you had on when the light took you')).toBe('clothes');
    expect(kitRefDisplay('The Iron Shield')).toBe('the Iron Shield');
    expect(kitRefDisplay('Shortbow')).toBe('Shortbow');
  });

  it('a typed echo of the place label collapses before the painted label', () => {
    const label = "a quarry circle outside Valespire's east wall";
    const out = collapseEchoedLabel(`The quarry circle outside ${label} sat cut into the chalk.`, label);
    expect(out).toBe(`${label} sat cut into the chalk.`);
    expect(collapseEchoedLabel(`Jax crossed ${label}.`, label)).toBe(`Jax crossed ${label}.`);
  });

  it('the location sheet follows HERE when it moved this turn', () => {
    const s = createInitialState(undefined, 'litrpg');
    s.currentLocation = 'Cathedral Undercroft';
    s.locationSheet = { name: "a quarry circle outside Valespire's east wall", interactables: [], exits: [], presentNpcIds: [] };
    const next = syncSheetToMovedHere(s, 'Cathedral Close');
    expect(next.locationSheet?.name).toBe('Cathedral Undercroft');
    expect(next.previousLocationSheet?.name).toBe('Cathedral Close');
    expect(syncSheetToMovedHere(s, 'Cathedral Undercroft')).toBe(s);
  });

  it('no arrival stamp on a travel turn (29u: the writer narrates it)', () => {
    const s = createInitialState(undefined, 'litrpg');
    s.currentLocation = 'Cathedral Undercroft';
    s.previousLocationSheet = { name: 'Cathedral Close', interactables: [], exits: [], presentNpcIds: [] };
    const body = 'Cold stone under the stair.';
    expect(enforceCameraOnProse(body, s, 'Travel toward Cathedral Undercroft', 'Cathedral Undercroft')).toBe(body);
  });
});
