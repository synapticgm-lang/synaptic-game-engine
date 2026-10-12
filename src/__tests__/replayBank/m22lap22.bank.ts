/**
 * Multi lap 22 — a possessive word of a held name stands bare ("the Circle" for The Circle's Price) and is no invented
 * capital; a word a place description writes in lower case ("a harbor circle") is not that place when it is capitalised
 * inside another name ("The Circle's Price"); the System window's changed numbers ("HP 24 / 24 → 26 / 26") are handed counts.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sentenceGateProblem } from '../../game/beatCommitGate';
import type { CompletedEventPacket } from '../../game/completedEventPacket';
import { classifyTokenLine, handedCountText, lineHasUnhandedCount, refEnumOf } from '../../game/tokenProse';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

type Repair = { sentence: string; flag: string; bug?: string };
const G150 = '2026-10-12T06-02-32-023Z_summoned-pact_cold-system_s150';
const D171 = '2026-10-12T06-02-42-360Z_summoned-pact_cold-system_s171';

const repairs = (X: Replay, n: number) =>
  ((X.at(n).telemetry as { sentenceRepairs?: Repair[] }).sentenceRepairs ?? []);

let G: Replay;
let D: Replay;
beforeAll(async () => {
  [G, D] = (await Promise.all([replayWhole(G150), replayWhole(D171)])).map((s) => new Replay(s));
}, 1_800_000);

describe('replay bank multi lap 22', () => {
  it('[m22 ds171 T16 | lap 22 quest short form] Nell\'s answer naming "the Circle" is spoken, not cut as an invented capital', () => {
    expect(D.input(16)).toBe('Talk to Nell Rudd');
    expect(D.prose(16)).toMatch(/I'm Nell/);
    expect((D.turnCheck(16)?.p0 ?? []).filter((p) => p.kind === 'ignored-action')).toEqual([]);
    const s = D.before(16);
    const enumRefs = refEnumOf(s);
    const beat = { refs: [], lines: [] };
    const line = (text: string) => ({ fn: 'react' as const, text });
    const names = ["The Circle's Price", 'Nell Rudd'];
    expect(classifyTokenLine(line('Jax had come about the Circle and nothing else.'), beat, enumRefs, names)).toEqual({ ok: true });
    expect(classifyTokenLine(line('Jax had come about the Lantern Guild and nothing else.'), beat, enumRefs, names), 'an unhanded name still fails')
      .toEqual({ ok: false, reason: 'capital' });
  });

  it('[m22 g5-150 T9 | lap 22 description word] "The Circle\'s Price still waited" is not the opening "harbor circle" acting here', () => {
    expect(G.input(9)).toBe('Check Status');
    expect(repairs(G, 9).filter((r) => r.bug)).toEqual([]);
    const s = G.before(9);
    expect(s.openingEstablishment?.answers?.where).toMatch(/harbor circle/);
    expect(sentenceGateProblem(s, 'Nell Rudd watched and Col Thatch watched too, and the unanswered questions of The Circle’s Price still waited.')).toBeNull();
    expect(sentenceGateProblem(s, 'Jax stood again in the harbor circle, and the hold creaked around them.'), 'the opening place as HERE still fails')
      .toMatch(/already left/);
  });

  it('[m22 g5-150 T9 | lap 22 window counts] the window\'s changed numbers ("HP now reads 26/26") are handed counts', () => {
    // The replay of this run does not reach the level-up (replay drift), so the window is the one the recorded packet handed.
    const prompt = readFileSync(join(resolve('scripts/fate-autoplay/runs'), G150, 'writer-prompts', 'turn-08.txt'), 'utf8');
    const changes = prompt.match(/Changed since the last read: ([^\n]+)\.\s*$/m)?.[1]?.split(/;\s*/) ?? [];
    expect(changes.join('; ')).toMatch(/26 \/ 26/);
    const s = G.before(9);
    const handed = handedCountText(s, { ledgerChanges: changes } as unknown as CompletedEventPacket);
    expect(lineHasUnhandedCount('HP now reads 26/26 with XP 15/225.', handed)).toBe(false);
    expect(lineHasUnhandedCount('HP now reads 31/31.', handed), 'a number the window never showed still fails').toBe(true);
  });
});
