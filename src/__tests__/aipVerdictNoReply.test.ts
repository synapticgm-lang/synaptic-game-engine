import { describe, it, expect } from 'vitest';
// @ts-expect-error untyped .mjs
import { skippedVoteOnNewReply, runVerdict } from '../../scripts/ai-player-browser/runVerdict.mjs';
import fs from 'node:fs';

describe('AIPOVL verdict: a no_reply skip is not a skipped vote on a new reply (23:54 smoke)', () => {
  it('no_reply skip on a row whose own action got a reply is fine', () => {
    expect(skippedVoteOnNewReply({ newGmBubble: true, thumbSkipped: 'no_reply' })).toBe(false);
  });
  it('already_voted skip on a new reply still fails', () => {
    expect(skippedVoteOnNewReply({ newGmBubble: true, thumbSkipped: 'already_voted' })).toBe(true);
  });
  it('runVerdict passes the 23:54 shape (timeout then no_reply skip, all votes verified)', () => {
    const turnLog = [
      { newGmBubble: true, verified: true, thumbSkipped: null },
      { newGmBubble: false, waitTimedOut: true, verified: true, thumbSkipped: null },
      { newGmBubble: true, verified: null, thumbSkipped: 'no_reply' },
      { newGmBubble: true, verified: true, thumbSkipped: null },
    ];
    const v = runVerdict([{ bibleId: 'summoned-pact', ok: true, turnLog, unverified: 0, harnessErrors: 0, verifyOn: true }]);
    expect(v.problems).not.toContain('skipped_vote_on_new_reply');
  });
  it('run.mjs exempts no_reply in its per-bible flag', () => {
    const src = fs.readFileSync('scripts/ai-player-browser/run.mjs', 'utf8');
    expect(src).toContain("thumb.skipped !== 'no_reply'");
  });
});
