/**
 * 00:40 decision: one root rule for skipped votes. A skip is wrong only when the reply the vote rates is a
 * GM reply (identified by replyKey) that has not been rated yet, whatever the turn type. Replaces the
 * 00:00 no_reply exemption and any setup-step excuse.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
// @ts-expect-error untyped .mjs
import { replyKey, shouldThumb, voteSkipWrong, skippedVoteOnNewReply, runVerdict } from '../../scripts/ai-player-browser/runVerdict.mjs';

const opening = { lastGm: 'Father Aldous stands by the graves. What do you call yourself here?', gmStoryCount: 1 };
const reply2 = { lastGm: 'Mayor Helga Brask intercepts you at the churchyard.', gmStoryCount: 2 };

/** Plays a sequence of votes the way run.mjs does: target = the reply on screen before acting. */
function play(targets: Array<{ lastGm: string; gmStoryCount: number } | null>, forceSkipAt = -1) {
  const rated = new Set<string>();
  return targets.map((snap, i) => {
    const targetKey = snap ? replyKey(snap) : null;
    let gate = shouldThumb({ targetKey, ratedKeys: rated });
    if (i === forceSkipAt) gate = { vote: false, reason: 'already_voted' }; // a harness bug that skips a fresh reply
    const wrong = !gate.vote && voteSkipWrong({ skipped: gate.reason, targetKey, ratedKeys: rated });
    if (gate.vote && targetKey) rated.add(targetKey);
    return { voted: gate.vote, skipped: gate.vote ? null : gate.reason, wrong };
  });
}

describe('vote skips judged by reply identity', () => {
  it('replyKey: same reply = same key, a different or later reply = new key, no reply = null', () => {
    expect(replyKey(opening)).toBe(replyKey({ ...opening, lastGm: `  ${opening.lastGm}\n` }));
    expect(replyKey(reply2)).not.toBe(replyKey(opening));
    expect(replyKey({ ...opening, gmStoryCount: 3 })).not.toBe(replyKey(opening));
    expect(replyKey({ lastGm: '', gmStoryCount: 0 })).toBeNull();
  });
  it('creation step: the opening is rated once; the creation turns that follow skip it correctly (no false alarm)', () => {
    const rows = play([opening, opening, opening, reply2]); // T1 Quick start, T2 Begin play, T3 name, T4
    expect(rows.map((r) => r.voted)).toEqual([true, false, false, true]);
    expect(rows.some((r) => r.wrong)).toBe(false);
  });
  it('no-reply turn: the previous reply was rated, so skipping it after a timeout is fine', () => {
    const rows = play([opening, reply2, reply2]); // T3 follows a timed-out T2
    expect(rows[2]).toEqual({ voted: false, skipped: 'already_voted', wrong: false });
  });
  it('normal turns: each new GM reply is rated exactly once', () => {
    const rows = play([opening, reply2, { lastGm: 'The sentries lower their crossbows.', gmStoryCount: 3 }]);
    expect(rows.every((r) => r.voted && !r.wrong)).toBe(true);
  });
  it('a genuinely skipped vote on an unrated GM reply still fails the run', () => {
    const rows = play([opening, reply2], 1);
    expect(rows[1].wrong).toBe(true);
    expect(skippedVoteOnNewReply({ voteSkipWrong: true })).toBe(true);
    const v = runVerdict([{ bibleId: 'cursed-keep', ok: true, harnessErrors: 0, unverified: 0, turnLog: [{ newGmBubble: true, thumbSkipped: 'already_voted', voteSkipWrong: true }] }]);
    expect(v.problems).toContain('skipped_vote_on_new_reply');
  });
  it('the 00:34 smoke shape passes: setup skips on the already-rated opening are not flagged', () => {
    const turnLog = [
      { newGmBubble: false, thumbSkipped: null, voteSkipWrong: false, verified: true },
      { newGmBubble: false, thumbSkipped: 'already_voted', voteSkipWrong: false },
      { newGmBubble: true, thumbSkipped: 'already_voted', voteSkipWrong: false },
      { newGmBubble: true, thumbSkipped: null, voteSkipWrong: false, verified: true },
    ];
    const v = runVerdict([{ bibleId: 'cursed-keep', ok: true, harnessErrors: 0, unverified: 0, turnLog, verifyOn: true }]);
    expect(v.problems).not.toContain('skipped_vote_on_new_reply');
  });
  it('run.mjs has no per-case exemptions left and uses the identity rule', () => {
    const src = fs.readFileSync('scripts/ai-player-browser/run.mjs', 'utf8');
    expect(src).not.toContain("thumb.skipped !== 'no_reply'");
    expect(src).toMatch(/voteSkipWrong\(\{ skipped: thumb\?\.skipped, targetKey: voteTarget, ratedKeys \}\)/);
    expect(src).toMatch(/shouldThumb\(\{ targetKey: voteTarget, ratedKeys \}\)/);
  });
});
