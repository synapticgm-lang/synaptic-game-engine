/**
 * Multi lap 36 — a sentence's first word in front of a known name is not part of a new name ("Behind Ila");
 * a writer line that calls Jax "you"/"your" in a beat that tells Jax by name in the third person never reaches
 * the page ("Your Mark does not match…"); the checker's lecture ending needs a question ("What now waited…" asks nothing).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { findManifestInventions } from '../../game/sceneManifest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const FL185 = '2026-10-12T14-58-04-467Z_summoned-pact_cold-system_s185';
const G5151 = '2026-10-12T14-58-04-496Z_summoned-pact_cold-system_s151';

let A: Replay;
let B: Replay;
beforeAll(async () => {
  // One at a time: every replay shares the one writer queue.
  A = new Replay(await replayWhole(FL185));
  B = new Replay(await replayWhole(G5151));
}, 900_000);

describe('replay bank multi lap 36', () => {
  it('[m36 long-open s79 #29 | lap 36 sentence start] a sentence-opening word before a known name is no invent; before an unknown name it still is', () => {
    const st = A.after(2);
    expect(st.character?.name, 'replay has the locked name').toBe('Jax');
    expect(findManifestInventions('Past Cathedral Close, the road bent.', st)).toEqual([]);
    expect(findManifestInventions('Jax said, "Wait." Past Cathedral Close, the road bent.', st)).toEqual([]);
    expect(findManifestInventions('Behind Orvald Quince, the hatch stood open.', st)).toContain('Behind Orvald Quince');
  });

  it('[m36 fl185 T2 | lap 36 third person] a narration line calling Jax "your" in a beat that names Jax never reaches the page', () => {
    expect(A.input(2)).toBe('Ask what they want');
    expect(A.verdicts(2), 'the recorded hook line fails the line gate').toContain('hook:pc-person');
    expect(A.verdicts(2)).toContain('action:ok');
    const narration = A.prose(2).replace(/["“][^"”]*["”]/g, ' ');
    expect(narration).not.toMatch(/\byour\b/i);
    expect((A.turnCheck(2)?.p0 ?? []).filter((f) => f.kind === 'broken-prose')).toEqual([]);
    for (const n of A.turns()) {
      const told = A.prose(n).replace(/["“][^"”]*["”]/g, ' ');
      if (/\bJax\b/.test(told)) expect(told, `T${n}`).not.toMatch(/\byour\b/i);
    }
  });

  it('[m36 g5-151 T3 | lap 36 lecture ending] "What now waited was a traveler" is not asking the player what they do', () => {
    expect(B.input(3)).toBe('Travel toward Cathedral Close');
    expect(B.prose(3), 'replay T3 still ends on the line').toMatch(/What now waited was a lone traveler/);
    expect((B.turnCheck(3)?.p0 ?? []).filter((f) => f.kind === 'lecture-ending')).toEqual([]);
  });
});
