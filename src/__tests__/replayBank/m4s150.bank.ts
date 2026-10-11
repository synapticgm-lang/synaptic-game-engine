import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const FLASH = '2026-10-11T14-04-08-255Z_summoned-pact_cold-system_s150';
const DEEPSEEK = '2026-10-11T14-04-05-460Z_summoned-pact_cold-system_s150';
let F: Replay;
let D: Replay;
beforeAll(async () => {
  F = new Replay(await replayWhole(FLASH));
  D = new Replay(await replayWhole(DEEPSEEK));
}, 600_000);

const exitsLine = (packet: string) => packet.match(/^PLACES: .*· exits: (.*)$/m)?.[1]?.split(', ') ?? [];

describe('replay bank multi lap 4 s150', () => {
  it('[m4 s150 T6 | lap 4 Root 1] the road meeting is on HERE the turn it starts', () => {
    expect(F.input(6)).toBe('Travel toward Cathedral Close');
    expect(F.receiptText(6)).toMatch(/chance meeting: thugs/);
    expect(F.packetBlock(6, 'HERE:')).toMatch(/thugs, four of them/);
    expect(F.packet(6)).toMatch(/^NOW: .* with 4 here /m);
  });

  it('[m4 s150 T7 | lap 4 Root 1] the thugs the player talks past are still on the page on the turn that settles them', () => {
    expect(F.input(7)).toBe('Talk your way past the thugs');
    expect(F.receiptText(7)).toMatch(/thugs dealt with/);
    expect(F.packetBlock(7, 'HERE:')).toMatch(/thugs/);
    expect(F.packet(7)).toMatch(/^t\d+\s+road:thugs\s+person\s+"thugs"$/m);
  });

  it('[m4 s150 T5 | lap 4 Root 3] the exits receipt names the same ways out as the writer\'s PLACES line', () => {
    expect(D.input(5)).toBe('Check the exits');
    const receipt = D.receiptText(5).match(/^Exits: .* lead to (.*)\.$/m)?.[1]?.split(', ') ?? [];
    expect(receipt.length, 'exits receipt').toBeGreaterThan(0);
    expect(receipt).toEqual(exitsLine(D.packet(5)));
  });
});
