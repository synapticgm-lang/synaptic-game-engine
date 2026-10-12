/**
 * Multi lap 29 — a capitalized name ending in s takes 's ("High Priest Arus's plea"), only a lowercase plural
 * ("streets's") is broken prose; a quiet road list is only its journey chips, never padded to three with
 * destination travel or a room chip; a talk chip's topic history is the history of the person it names.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { brokenProse } from '../../game/turnCheck';
import { talkChipAddressee } from '../../game/npcTopicFsm';
import type { GameState } from '../../game/types';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const F178 = '2026-10-12T11-53-51-187Z_summoned-pact_cold-system_s178';

let F: Replay;
beforeAll(async () => {
  F = new Replay(await replayWhole(F178));
}, 1_800_000);

describe('replay bank multi lap 29', () => {
  it('[m29 fl178 T6 | lap 29 a name ending in s takes \'s] "High Priest Arus\'s plea" is not broken prose', () => {
    expect(F.prose(6)).toMatch(/High Priest Arus's plea/);
    expect((F.turnCheck(6)?.p0 ?? []).map((f) => f.detail)).toEqual([]);

    expect(brokenProse('Jax walked the streets\'s length.').map((f) => f.detail)).toEqual([
      'plural with a possessive s: "streets\'s"',
    ]);
    expect(brokenProse('James\'s cart stood by the wall.')).toEqual([]);
  });

  it('[m29 fl178 road | lap 29 a quiet road list is only its journey chips] no destination travel padded onto the road', () => {
    const quiet = F.turns().filter((n) => F.after(n).journey && !F.after(n).journey!.encounter && !F.after(n).activeEncounter);
    expect(quiet.length, 'replay has quiet road legs').toBeGreaterThan(0);
    for (const n of quiet) {
      const chips = F.chipsAfter(n);
      expect(chips, `after T${n}`).toContain('Walk on');
      expect(chips.filter((c) => /^(Travel toward|Return to|Go back to|Approach the)\b/.test(c)), `after T${n}: ${chips.join(' / ')}`).toEqual([]);
    }
  });

  it('[m29 talk chip | lap 29 topic history is per person] the chip names whose history counts', () => {
    const s = { sceneFacts: { present: ['Yara Quill', 'Kade Voss'] } } as unknown as GameState;
    expect(talkChipAddressee(s, 'Talk to Kade Voss', 'Yara Quill')).toBe('Kade Voss');
    expect(talkChipAddressee(s, 'Ask Yara Quill about the ledger', 'Kade Voss')).toBe('Yara Quill');
    expect(talkChipAddressee(s, 'Ask what they want', 'Yara Quill'), 'a chip naming nobody keeps the pad person').toBe('Yara Quill');
  });
});
