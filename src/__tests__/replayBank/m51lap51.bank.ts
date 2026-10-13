/**
 * Multi lap 51 — a person the opening card names ("Stay with Joss") is no never-cast title, so the accept beat
 * hands Joss to the writer (ds200 / fl200 T2); bare words in a speech slot that tell the scene from outside
 * ("The traveler paused…", "The outlaw's words hung…") are narration, never the speaker's quote (fl200 T8/T10,
 * fl151 T18); a chip from this turn's committed pad is not rewritten as an ungrounded claim (ds151 T20, g5-200 T21).
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { compileRefEnum } from '../../game/completedEventPacket';
import { groundPlayerAction } from '../../game/intentParser';
import { isNeverCastTitle } from '../../game/neverCast';
import { parseTokenBeat, tellsSpeechFromOutside } from '../../game/tokenProse';
import type { GameState } from '../../game/types';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const DS200 = '2026-10-13T04-54-09-063Z_summoned-pact_cold-system_s200';
const FL200 = '2026-10-13T04-54-12-972Z_summoned-pact_cold-system_s200';
const DS151 = '2026-10-13T04-53-56-793Z_summoned-pact_cold-system_s151';

/** The page before turn n, with turn n's own packet. */
const atTurn = (R: Replay, n: number) => ({ ...R.before(n), completedEvent: R.after(n).completedEvent }) as GameState;

let D: Replay;
let F: Replay;
let S: Replay;
beforeAll(async () => {
  D = new Replay(await replayWhole(DS200));
  F = new Replay(await replayWhole(FL200));
  S = new Replay(await replayWhole(DS151));
}, 1_800_000);

describe('replay bank m51 lap 51', () => {
  it('[ds200 T2, fl200 T2 | m51 card person no title] Joss, named on the offer line, is a person ref on the accept beat', () => {
    for (const R of [D, F]) {
      expect(R.input(2)).toBe('Accept the offer');
      const s = atTurn(R, 2);
      expect(isNeverCastTitle('Joss', s)).toBe(false);
      expect(isNeverCastTitle('Weighing Cup', s), 'a card place stays a title').toBe(true);
      const refs = compileRefEnum(s, [], { engineResult: 'Offer accepted: the offer from Joss' });
      expect(refs.find((r) => r.display === 'Joss')?.klass).toBe('person');
      expect(R.packet(2)).toMatch(/^t\d+\s+\S+\s+person\s+"Joss"/m);
    }
  });

  it('[fl200 T8/T10, fl151 T18 | m51 speech from outside] narration in a speech slot is no quote', () => {
    expect(F.input(8)).toBe('Talk to someone in the street');
    expect(F.prose(8)).not.toMatch(/said, "The traveler paused/);
    expect(F.prose(8)).toMatch(/The traveler paused their pacing and looked over at Jax\./);
    expect(F.input(10)).toBe('Ask what is going on');
    expect(F.prose(10)).not.toMatch(/said, "The outlaw's words/);
    const s = atTurn(F, 8);
    const refs = compileRefEnum(s);
    const traveler = refs.find((r) => /traveler/.test(r.display))!;
    const beat = (text: string) =>
      tellsSpeechFromOutside(
        parseTokenBeat(JSON.stringify({
          refs: [{ tok: traveler.tok, id: traveler.id, use: 'speaker' }],
          lines: [{ fn: 'speech', speaker_tok: traveler.tok, text }],
        }))!,
        refs,
        s,
      ).lines[0]!;
    for (const t of [
      'The traveler paused their own quiet errand and turned towards Jax.',
      'A traveler paused their journey, looking toward Jax with mild curiosity.',
      'She asked Jax if they were looking for something specific.',
    ]) expect(beat(t), t).toMatchObject({ fn: 'react' });
    for (const t of [
      'Well met again, Jax! Still keeping those hands clean?',
      'This place holds secrets, Jax, and that trap proves it.',
      'Records were sealed by the Ledger and some hands still burn.',
      '"The traveler before me went that way," I said.',
    ]) expect(beat(t), t).toMatchObject({ fn: 'speech', spoken: true });
  });

  it('[ds151 T20 | m51 offered chip grounded] "Attack from hiding" from the pad is the action the writer gets', () => {
    expect(S.input(20)).toBe('Attack from hiding');
    expect(S.packet(20)).toMatch(/^PLAYER: Attack from hiding$/m);
    expect(S.packet(20)).not.toMatch(/instead of assuming/);
    const s = S.before(20);
    expect(groundPlayerAction('Attack from hiding', s).rewritten).toBe(false);
    const off = { ...s, offeredPad: { turn: (s.turn ?? 0) - 1, choices: ['Attack from hiding'] } } as GameState;
    expect(groundPlayerAction('Attack from hiding', off).text, 'a stale pad grounds nothing').toMatch(/instead of assuming/);
  });
});
