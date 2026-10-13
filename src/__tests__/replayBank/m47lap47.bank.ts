/**
 * Multi lap 47 — the opening card's Location line ending in a capitalised word no longer joins the next line's
 * first word into a false person ("Close\nWho", fl195 T7); kit on a present person the scene never handed
 * ("the rope at her belt", ds150 T17; "her satchel strap across one shoulder", ds195 T14) fails the line;
 * a counted group of a role ("Two church guards", ds151 T15) is people who are not here; "split into three
 * dark ways" is a count of the ways out (ds150 T19). From this lap's runs: the dead foe's own name ("Cell-Blade") is no
 * steel after the kill (ds196 T14, fl196 T14); "the clerk" is a person here held as "Clerk Brin Holt" (fl196 T3); the
 * answer repair tells the writer the player's character never speaks (fl151 T8).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import { extractNamesFromHookText } from '../../game/openingPin';
import { ledgerSlotPeople } from '../../game/slotGlue';
import { plainLineFactProblem } from '../../game/tokenProse';
import type { GameState } from '../../game/types';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const DS150 = '2026-10-12T21-20-14-217Z_summoned-pact_cold-system_s150';
const DS151 = '2026-10-12T21-20-45-687Z_summoned-pact_cold-system_s151';
const DS195 = '2026-10-12T21-20-58-473Z_summoned-pact_cold-system_s195';
const FL195 = '2026-10-12T21-21-06-613Z_summoned-pact_cold-system_s195';
const FL196 = '2026-10-13T03-04-20-498Z_summoned-pact_cold-system_s196';
const FL151 = '2026-10-13T03-04-08-169Z_summoned-pact_cold-system_s151';

let A: Replay;
let B: Replay;
let C: Replay;
let F: Replay;
let E: Replay;
let G: Replay;
beforeAll(async () => {
  A = new Replay(await replayWhole(DS150));
  B = new Replay(await replayWhole(DS151));
  C = new Replay(await replayWhole(DS195));
  F = new Replay(await replayWhole(FL195));
  E = new Replay(await replayWhole(FL196));
  G = new Replay(await replayWhole(FL151));
}, 900_000);

const WRONG_COUNT = /^Gives the wrong number of ways out/;
const fact = (X: Replay, n: number, line: string) => {
  const s = X.after(n);
  return plainLineFactProblem(line, s, s.completedEvent ?? undefined);
};

describe('replay bank m47 lap 47', () => {
  it('[fl195 T7 | m47 card line break] the Location line\'s last word is no person, so the kitchens line passes', () => {
    expect(extractNamesFromHookText('Location: the cathedral kitchens in the Close\nWho is here: Brother Tam')).not.toContain('Close\nWho');
    const s = F.after(7);
    expect(ledgerSlotPeople(s).filter((p) => /[\r\n]/.test(p))).toEqual([]);
    expect(ledgerSlotPeople(s)).not.toContain('Close');
    expect(s.sceneFacts?.present ?? []).not.toContain('Close\nWho');
    expect(sentenceGateProblem(s, 'Jax searched the cathedral kitchens in the Close once more.', F.input(7))).toBeNull();
    expect(F.prose(7)).toMatch(/cathedral kitchens in the Close/);
  });

  it('[ds150 T17 | m47 unhanded kit on a person] "the rope at her belt" fails; the parapet line stays', () => {
    expect(fact(A, 17, 'Tilde Crane stayed back near the stair, and her hand had found the rope at her belt.')).toBe('a thing carried that the scene never handed');
    expect(A.prose(17)).not.toMatch(/rope at her belt/);
    expect(A.prose(17)).toMatch(/leaned her elbows on the parapet/);
    expect(fact(A, 17, 'Tilde Crane stayed back near the stair with her hands on her hips.')).toBeNull();
  });

  it('[ds195 T14 | m47 unhanded kit on a person] "her satchel strap across one shoulder" fails; standing by the parapet passes', () => {
    expect(fact(C, 14, 'Jax stepped back to where Idra Fenwick stood with her satchel strap across one shoulder.')).toBe('a thing carried that the scene never handed');
    expect(C.prose(14)).not.toMatch(/satchel strap/);
    expect(fact(C, 14, 'Idra Fenwick stood by the parapet.')).toBeNull();
  });

  it('[ds151 T15 | m47 counted group of a role] "Two church guards" are people who are not here', () => {
    expect(fact(B, 15, 'Two church guards stood near the far archway, and one of them had already turned his head toward Jax.')).toBe('a person who is not here');
    expect(B.prose(15)).not.toMatch(/Two church guards/);
    expect(fact(B, 15, 'Col Thatch stood near the far archway.')).toBeNull();
  });

  it('[ds196 T14, fl196 T14 | m47 foe name is no steel] the dead Ashknife Cell-Blade lying on the floor is not a reopened fight', () => {
    // The replay's T13 parley clears the foe with no kill; the recorded runs won the fight at T13 (lastKill victory).
    expect(E.at(13).recorded.engineFact ?? '').toMatch(/VICTORY vs Ashknife Cell-Blade/);
    const base = E.after(14);
    const s = { ...base, sceneFacts: { ...base.sceneFacts, lastKill: { name: 'Ashknife Cell-Blade', outcome: 'victory', turn: 13, remains: true } } } as GameState;
    expect(s.turn).toBe(14);
    for (const line of [
      'The Ashknife Cell-Blade lay on the floor between Jax and the door.',
      'Jax carefully inspected the Ashknife Cell-Blade.',
    ]) expect(sentenceGateProblem(s, line, E.input(14)), line).toBeNull();
    expect(sentenceGateProblem(s, 'The Ashknife Cell-Blade had its knife at the throat of Jax again.', E.input(14)), 'real steel after the kill still fails')
      .toMatch(/^Mixes two scenes/);
  });

  it('[fl196 T3 | m47 role title of a person here] "the clerk" is Clerk Brin Holt, not a person who is not here', () => {
    expect(E.input(3)).toBe('Refuse the work');
    expect(E.after(3).sceneFacts?.present ?? []).toContain('Clerk Brin');
    expect(fact(E, 3, 'The clerk panicked at the refused contract.')).toBeNull();
    expect(fact(E, 3, 'A guard panicked at the refused contract.'), 'a role nobody here holds still fails').toBe('a person who is not here');
  });

  it('[fl151 T8 | m47 answer repair never voices the player] the request says Jax is the player\'s character', () => {
    const asks = G.at(8).writerPackets.filter((p) => /^Your story left out the answer/.test(p));
    expect(asks.length).toBeGreaterThan(0);
    for (const a of asks) expect(a).toMatch(/Jax is the player's character: never write words, a reply or a decision for Jax\./);
  });

  it('[ds150 T19 | m47 split into ways] "the undercroft split into three dark ways" counts the ways out', () => {
    const s = A.after(19);
    expect(s.currentLocation).toBe('Cathedral Undercroft');
    const line = 'Ahead of Jax the undercroft split into three dark ways, and the middle one breathed out warm air like something living.';
    expect(sentenceGateProblem(s, line, A.input(19))).toMatch(WRONG_COUNT);
    expect(A.prose(19)).not.toMatch(/split into three dark ways/);
    expect(sentenceGateProblem(s, 'The light split into three thin beams across the floor.', A.input(19))).toBeNull();
  });
});
