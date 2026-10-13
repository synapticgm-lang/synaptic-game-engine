/**
 * Multi lap 52 — an @tN the writer never declared binds to a common thing only with the writer's own determiner
 * ("a crate of @t11" is a guessed number, s78 T20); the place card's names the info sheet prints ("Crown job
 * postings") are on the mention list, so the arrival line that uses them is not cut (s79 T19); a narrated time of
 * day the clock contradicts drops its line ("the morning light" at midday, s83 T8).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { lineHasWrongTimeOfDay } from '../../game/tokenProse';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const S78 = '2026-10-10T22-29-55-148Z_summoned-pact_cold-system_s78';
const S79 = '2026-10-10T23-30-22-109Z_summoned-pact_cold-system_s79';
const S83 = '2026-10-11T07-32-23-189Z_summoned-pact_cold-system_s83';

let A: Replay;
let B: Replay;
let C: Replay;
beforeAll(async () => {
  A = new Replay(await replayWhole(S78));
  B = new Replay(await replayWhole(S79));
  C = new Replay(await replayWhole(S83));
}, 600_000);

const mentions = (R: Replay, n: number) => R.packet(n).match(/YOU MAY ONLY MENTION:[^\n]*/)?.[0] ?? '';

describe('replay bank m52 lap 52', () => {
  it('[s78 T20 | m52 undeclared thing] a common thing used without a refs entry and without a determiner is not painted', () => {
    expect(A.input(20), 'replay turns back toward Lowmarket on T20').toBe('Turn back toward Lowmarket');
    expect(A.verdicts(20), 'the @t10/@t11 lines are still undeclared').toContain('react:unbound-tok');
    expect(A.prose(20)).not.toMatch(/a crate of the/i);
    expect(A.prose(20), 'an undeclared thing after the writer\'s own "the" still paints').toMatch(/looked up from the counter of the stall/);
  });

  it('[s79 T19 | m52 place card names] the place card\'s "Crown" is handed, so the Contract Hall arrival line stays', () => {
    expect(B.after(19).currentLocation, 'replay arrives at Contract Hall on T19').toBe('Contract Hall');
    expect(mentions(B, 19)).toMatch(/\bCrown\b/);
    expect(B.verdicts(19)).toContain('place:ok');
    expect(B.prose(19)).toMatch(/^Contract Hall was a long hall of grey stone where the Crown nailed its jobs/);
  });

  it('[s83 T8 | m52 clock time] a narrated time of day the clock contradicts drops its line', () => {
    expect(C.receiptText(8), 'T8 receipt says midday').toMatch(/now midday/);
    expect(C.after(8).sceneFacts?.timeOfDay).toBe('midday');
    expect(C.verdicts(8)).toContain('place:time');
    expect(C.prose(8)).not.toMatch(/morning/i);
    expect(C.prose(8)).toMatch(/Jax walked for half an hour/);
    const handed = 'facts\n\u0000clock\u0000midday\n\u0000page\u0000\nan earlier morning page';
    expect(lineHasWrongTimeOfDay('The morning light sat pale on the walls.', handed)).toBe(true);
    expect(lineHasWrongTimeOfDay('The noon sun sat high over the roofs.', handed)).toBe(false);
    expect(lineHasWrongTimeOfDay('Nobody had come since this morning.', handed)).toBe(false);
    expect(lineHasWrongTimeOfDay('Jax still wore the clothes from the night the light took them.', handed)).toBe(false);
    expect(lineHasWrongTimeOfDay('"Good morning," she said.', handed)).toBe(false);
    expect(lineHasWrongTimeOfDay('The morning light sat pale on the walls.', 'facts with no clock\n\u0000page\u0000')).toBe(false);
  });
});
