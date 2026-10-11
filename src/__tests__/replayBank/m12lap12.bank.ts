/**
 * Multi lap 12 — what the player owns (granted or looted) is neither a scene prop nor a manifest invent;
 * the way into a dungeon is "Go inside", never "Enter" the hub Jax already stands in; and inside
 * a dungeon card its way out is one of the four chips shown.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { filterInventedContextChoices } from '../../game/choiceWarden';
import { playerEntersInterior } from '../../game/enterInterior';
import { findManifestInventions } from '../../game/sceneManifest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const S79 = '2026-10-10T23-30-22-109Z_summoned-pact_cold-system_s79';
const S80 = '2026-10-10T23-51-52-084Z_summoned-pact_cold-system_s80';

let A: Replay;
let B: Replay;
const refRows = (R: Replay, n: number) => R.packet(n).split('\n').filter((l) => /^t\d+\s{2}/.test(l));
const shown = (R: Replay, n: number) => filterInventedContextChoices(R.chipsAfter(n), R.after(n)).slice(0, 4);

beforeAll(async () => {
  A = new Replay(await replayWhole(S79));
  B = new Replay(await replayWhole(S80));
}, 1_800_000);

describe('replay bank multi lap 12', () => {
  it('[m12 s79 T3,T16 | lap 12 Root A] what the player owns is neither scenery nor an invention, and the bag stays unhanded', () => {
    expect(A.input(2)).toBe('Accept the offer');
    expect(refRows(A, 3).filter((l) => /tabard/.test(l) && /\bprop\b/.test(l)), 'T3 owned tabard is no prop row').toEqual([]);
    expect(A.receiptText(15)).toMatch(/Fine Longsword/);
    const after = A.after(15);
    expect(findManifestInventions('Jax wiped the Fine Longsword clean.', after), 'loot is no invent').not.toContain('Fine Longsword');
    expect(findManifestInventions('Jax wiped the Gilded Halberd clean.', after), 'a real invent still flags').toContain('Gilded Halberd');
    expect(refRows(A, 16).filter((l) => /Fine Longsword/.test(l)), 'a bagged weapon is not handed').toEqual([]);
  });

  it('[m12 s80 T15 | lap 12 Root B] at the Undercroft the way in names its entry room, not the hub Jax stands in', () => {
    const here = B.after(15).currentLocation ?? '';
    expect(here, 'replay stands at the Undercroft on T15').toMatch(/Undercroft/);
    const chips = B.chipsAfter(15);
    expect(chips.filter((c) => /^Enter /i.test(c) && c.toLowerCase().includes(here.toLowerCase())), 'no Enter <here>').toEqual([]);
    expect(chips, 'a way in is offered').toContain('Go inside');
    expect(playerEntersInterior('Go inside', B.after(15)), 'the chip still enters').toBe(true);
  });

  it('[m12 s80 T16 | lap 12 Root C] inside the dungeon card its way out is one of the four chips shown', () => {
    expect(B.after(16).activeDungeon, 'replay is inside the card on T16').toBeTruthy();
    const four = shown(B, 16);
    expect(four).toContain('Head back to the exit');
    expect(four.filter((c) => /^Travel toward /i.test(c)), 'no road chip skips the card exit').toEqual([]);
  });
});
