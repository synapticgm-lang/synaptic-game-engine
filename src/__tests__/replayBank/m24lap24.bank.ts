/**
 * Multi lap 24 — a greeting or call-out ("Greet whoever is coming", "Call out to a bystander") is talk, so the
 * packet hands a speech slot to whoever is here; the opening place's own name ("Ledger Row" out of "a Scale
 * counting-house on Ledger Row") is never pinned as a person; an opening pin acts here only when one sentence
 * names it and gives it a here-verb.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import { classifyVerb } from '../../game/completedEventPacket';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Repair = { sentence: string; flag: string; bug?: string };
const F173 = '2026-10-12T07-57-58-616Z_summoned-pact_cold-system_s173';
const G173 = '2026-10-12T07-57-58-673Z_summoned-pact_cold-system_s173';

const repairs = (X: Replay, n: number) =>
  (X.at(n).telemetry as { sentenceRepairs?: Repair[] }).sentenceRepairs ?? [];

let F: Replay;
let G: Replay;
beforeAll(async () => {
  [F, G] = (await Promise.all([replayWhole(F173), replayWhole(G173)])).map((s) => new Replay(s));
}, 1_800_000);

describe('replay bank multi lap 24', () => {
  it('[m24 fl173 T19, ds173 T17 | lap 24 greeting is talk] a greeting packs as speech with the road stranger as speaker', () => {
    expect(F.input(19)).toBe('Greet whoever is coming');
    const p = F.packet(19);
    expect(p).not.toMatch(/COMPLETED EVENT:\s*Jax acted\./);
    expect(p).toMatch(/Outcome: spoke\./);
    expect(p).toMatch(/"fn":"speech","speaker_tok":"t3"/);
    expect(p).toMatch(/t3\s+road:someone-on-the-way\s+person/);
    // The hosted DeepSeek replay drifts from T1; its chip is the same talk family.
    expect(classifyVerb('Call out to a bystander')).toBe('spoke');
    expect(classifyVerb('Search the area')).not.toBe('spoke');
  });

  it('[m24 g5-173 T2 | lap 24 place pinned as a person] "Ledger Row" is not an opening pin, so "into the Ledger" is not a person in an object slot', () => {
    expect(G.input(2)).toBe('Accept the offer');
    expect(repairs(G, 2).filter((r) => r.bug)).toEqual([]);
    expect(G.prose(2)).toMatch(/wrote the exchange into the Ledger/);
    const pins = (G.after(2).openingEstablishment?.pinnedNpcNames ?? []).map((n) => n.toLowerCase());
    expect(pins).not.toContain('ledger row');
    expect(G.after(2).sceneFacts?.present ?? []).not.toContain('Ledger Row');
  });

  it('[m24 ds173 T11 | lap 24 pin and here-verb in one sentence] the trip from the counting-house is not the opening room acting as here', () => {
    // Same seed and same T11 travel from the counting-house; the hosted DeepSeek replay drifts from T1.
    expect(F.input(11)).toBe('Travel toward Cathedral Close');
    const s = F.after(11);
    expect(s.openingEstablishment?.pinnedNpcNames).toEqual(['Auditor Venn']);
    const ds = 'Jax walked away from a Scale counting-house on Ledger Row and took the narrow back streets that cut between the high walls. They kept their hands loose at their sides and walked on toward Cathedral Close, and the clock over the counting-house said midday. Ahead on the same lane, a traveler came the other way on their own errand, walking steady and watching the ground. The lane ran straight to the close, and the traveler would pass Jax in a few more steps.';
    expect(sentenceGateProblem(s, ds)).toBeNull();
    expect(
      sentenceGateProblem(s, 'Jax left Auditor Venn at the counting-house desk and walked the back streets toward Cathedral Close. A traveler came the other way, and the two would pass in a few more steps.'),
      'the traveler steps, not the pin'
    ).toBeNull();
    expect(sentenceGateProblem(s, 'Auditor Venn waits at the desk.'), 'the pin acting here still fails').toMatch(/already left/);
  });
});
