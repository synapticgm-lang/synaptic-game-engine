/**
 * PYOA spine v1 — Thornferry curated nodes + ending gate.
 * Stamp: HUD 2026-08-31r / BUILD 2026-08-31j. Mid writer OFF.
 */
import { describe, expect, it } from 'vitest';
import { BUILD_STAMP } from './runManifest';
import { HUD_BUILD_STAMP } from '../components/Hud';
import { STAGNATION_MID_WRITER_ENABLED } from './writerPolicy';
import { createInitialState } from './defaults';
import {
  THORNFERRY_SPINE,
  advancePyoaSpine,
  ensurePyoaSpine,
  evaluateSpineEndingGate,
  formatPyoaSpineSnapshotLines,
  initThornferrySpine,
  legalSpineExits,
  spineChoiceLabels,
} from './pyoaSpine';
import { compileChoices } from './choiceCompiler';
import { enumerateLegalEdges } from './choiceEdge';
import { resolveTurnJob } from './beatContract';

function thornferryState() {
  let state = createInitialState(undefined, 'pyoa');
  state.campaignBibleId = 'thornferry-road';
  state.engineMode = 'pyoa';
  state.openingEstablishment = { ...state.openingEstablishment!, complete: true };
  state.turn = 3;
  state = ensurePyoaSpine(state);
  return state;
}

describe('playtest31rPyoaSpine', () => {
  it('stamp is 2026-08-31r / 31j and Mid writer stays OFF', () => {
    expect(STAGNATION_MID_WRITER_ENABLED).toBe(false);
    expect(BUILD_STAMP >= '2026-08-31j').toBe(true);
    expect(HUD_BUILD_STAMP >= '2026-08-31r').toBe(true);
  });

  it('Thornferry spine has 8–15 nodes and 2–4 major forks', () => {
    expect(THORNFERRY_SPINE.length).toBeGreaterThanOrEqual(8);
    expect(THORNFERRY_SPINE.length).toBeLessThanOrEqual(15);
    const forks = THORNFERRY_SPINE.filter((n) => n.majorFork);
    expect(forks.length).toBeGreaterThanOrEqual(2);
    expect(forks.length).toBeLessThanOrEqual(4);
    expect(THORNFERRY_SPINE.filter((n) => n.endingId).length).toBeGreaterThanOrEqual(4);
  });

  it('advances landing → streets → road on legal labels', () => {
    let state = thornferryState();
    expect(state.pyoaSpine?.currentNodeId).toBe('tf-landing');
    expect(legalSpineExits(state).length).toBe(3);

    state = advancePyoaSpine(state, 'Walk the road with Wren');
    expect(state.pyoaSpine?.currentNodeId).toBe('tf-streets');
    expect(state.pyoaSpine?.flags.wren).toBe('with');

    state = advancePyoaSpine(state, 'Keep the charter with the mill');
    expect(state.pyoaSpine?.currentNodeId).toBe('tf-road');
    expect(state.pyoaSpine?.flags.charterIntent).toBe('mill');
  });

  it('delay once then forces a legal edge', () => {
    let state = thornferryState();
    state = advancePyoaSpine(state, 'Wait and watch');
    expect(state.pyoaSpine?.delayCount).toBe(1);
    expect(state.pyoaSpine?.currentNodeId).toBe('tf-landing');

    state = advancePyoaSpine(state, 'Wait and watch');
    expect(state.pyoaSpine?.currentNodeId).not.toBe('tf-landing');
    expect(state.pyoaSpine?.delayCount).toBe(0);
  });

  it('ChoiceCompiler / choiceEdge offer spine exits; SNAPSHOT + TURN JOB name node', () => {
    const state = thornferryState();
    const edges = enumerateLegalEdges(state);
    expect(edges.some((e) => /walk the road with wren/i.test(e.label))).toBe(true);

    const { choices } = compileChoices(state, ['Wait and watch', 'Look around'], undefined, 'look');
    expect(choices.some((c) => /wren|alone|pell/i.test(c))).toBe(true);

    const snap = formatPyoaSpineSnapshotLines(state);
    expect(snap.some((l) => /PYOA SPINE: tf-landing/i.test(l))).toBe(true);
    expect(resolveTurnJob(state)).toMatch(/PYOA/i);
  });

  it('honest ending gate requires Wren + honest resolution', () => {
    let state = thornferryState();
    state = advancePyoaSpine(state, 'Walk the road with Wren');
    state = advancePyoaSpine(state, 'Keep the charter with the mill');
    state = advancePyoaSpine(state, 'Press on to the ford');
    state = advancePyoaSpine(state, 'Pass without stopping');
    state = advancePyoaSpine(state, 'Face the honest seal');
    state = advancePyoaSpine(state, 'Deliver honestly to Highmark with Wren');

    expect(state.pyoaSpine?.endingId).toBe('thornferry:honest-delivery');
    const gate = evaluateSpineEndingGate(state);
    expect(gate.ok).toBe(true);
    expect(gate.endingId).toBe('thornferry:honest-delivery');

    // Solo cannot take honest-with-Wren exit
    let solo = thornferryState();
    solo = advancePyoaSpine(solo, 'Go alone');
    solo = advancePyoaSpine(solo, 'Keep the charter with the mill');
    solo = advancePyoaSpine(solo, 'Press on to the ford');
    solo = advancePyoaSpine(solo, 'Pass without stopping');
    solo = advancePyoaSpine(solo, 'Face the honest seal');
    const exits = spineChoiceLabels(solo);
    expect(exits.some((l) => /deliver honestly/i.test(l))).toBe(false);
  });

  it('other PYOA bibles are not densified (no spine seed)', () => {
    let state = createInitialState(undefined, 'pyoa');
    state.campaignBibleId = 'vesper-glass-cipher';
    state.engineMode = 'pyoa';
    state = ensurePyoaSpine(state);
    expect(state.pyoaSpine).toBeUndefined();
    expect(initThornferrySpine().bibleId).toBe('thornferry-road');
  });
});
