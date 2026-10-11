import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { LedgerRef } from '../../game/completedEventPacket';
import { classifyTokenLine, parseTokenBeat, renderTokenBeat } from '../../game/tokenProse';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const FLASH = '2026-10-11T14-37-46-677Z_summoned-pact_cold-system_s154';
const DEEPSEEK = '2026-10-11T14-37-52-578Z_summoned-pact_cold-system_s154';
let D: Replay;
beforeAll(async () => {
  D = new Replay(await replayWhole(DEEPSEEK));
}, 600_000);

describe('replay bank multi lap 6 s154', () => {
  it('[m6 s154fl T19 | lap 5 Root 2] a speech line with no speaker_tok is said by the beat\'s one declared speaker', () => {
    // The replay rolls this parley differently now, so the case reads the recorded writer JSON and REF ENUM.
    const dir = join(resolve('scripts/fate-autoplay/runs'), FLASH);
    const row = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { turn: number; playerInput: string; writerRaw: string }).find((r) => r.turn === 19)!;
    const packet = readFileSync(join(dir, 'writer-prompts', 'turn-18.txt'), 'utf8');
    const enumRefs: LedgerRef[] = [...packet.matchAll(/^(t\d+)\s+(\S+)\s+(\w+)\s+"([^"]+)"$/gm)].map((m) => ({
      tok: m[1]!, id: m[2]!, klass: m[3] as LedgerRef['klass'], display: m[4]!,
    }));
    expect(row.playerInput).toBe('Talk your way past the thugs');
    const beat = parseTokenBeat(row.writerRaw)!;
    const speech = beat.lines.find((l) => l.fn === 'speech')!;
    expect(speech).toMatchObject({ speaker_tok: 't3', spoken: true });
    expect(classifyTokenLine(speech, beat, enumRefs)).toEqual({ ok: true });
    expect(renderTokenBeat(beat, enumRefs)).toMatch(/Thugs said, "We will not bother you further\."/);
  });

  it('[m6 s154ds T19 | lap 5 Root 2] the fight paint after a failed parley follows Jax in close third and says the talk failed', () => {
    expect(D.input(19)).toBe('Talk your way past the thugs');
    expect(D.receiptText(19)).toMatch(/Parley check: .* failure/);
    expect(D.receiptText(19)).toMatch(/the thugs forces the fight/);
    const prose = D.prose(19);
    expect(prose).toMatch(/^Jax tried to talk the thugs down\b/);
    expect(prose).not.toMatch(/\b(?:you|your)\b/i);
    expect(prose).not.toMatch(/break away/);
    expect(prose).toMatch(/The thugs went down and did not get up/);
  });
});
