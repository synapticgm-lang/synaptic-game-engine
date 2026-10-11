import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { LedgerRef } from '../../game/completedEventPacket';
import { classifyTokenLine, parseTokenBeat, renderTokenBeat } from '../../game/tokenProse';
import { checkPlayCrimes } from '../../game/turnCheck';
import { Replay } from './bank';
import { replayWhole } from './replayRun';

vi.mock('../../game/aiService', async (orig) => (await import('./writerQueue')).mockAiService(await orig()));

const RUNS = resolve('scripts/fate-autoplay/runs');
const MINI151 = '2026-10-11T15-19-19-667Z_summoned-pact_cold-system_s151';
const DS151 = '2026-10-11T15-19-16-540Z_summoned-pact_cold-system_s151';
const FLASH150 = '2026-10-11T15-19-13-586Z_summoned-pact_cold-system_s150';
const FLASH155 = '2026-10-11T15-19-31-982Z_summoned-pact_cold-system_s155';

type Row = { turn: number; playerInput: string; writerRaw: string; gmText: string };

function recorded(run: string, turn: number): { row: Row; enumRefs: LedgerRef[] } {
  const dir = join(RUNS, run);
  const row = readFileSync(join(dir, 'turns.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Row).find((r) => r.turn === turn)!;
  const packet = readFileSync(join(dir, 'writer-prompts', `turn-${String(turn - 1).padStart(2, '0')}.txt`), 'utf8');
  const enumRefs: LedgerRef[] = [...packet.matchAll(/^(t\d+)\s+(\S+)\s+(\w+)\s+"([^"]+)"$/gm)].map((m) => ({
    tok: m[1]!, id: m[2]!, klass: m[3] as LedgerRef['klass'], display: m[4]!,
  }));
  return { row, enumRefs };
}

let M: Replay;
let D: Replay;
beforeAll(async () => {
  M = new Replay(await replayWhole(MINI151));
  D = new Replay(await replayWhole(DS151));
}, 600_000);

describe('replay bank multi lap 6', () => {
  it('[m6 s151mini T19,T20 | lap 6 Root A] a dungeon room is no place: no room card, no self exit, travel leaves from the dungeon', () => {
    expect(M.input(19)).toBe('Enter Cathedral Undercroft');
    expect(M.after(19).currentLocation ?? '').toMatch(/^Cathedral Undercroft [—–] /);
    const places = M.packet(19).split('\n').find((l) => l.startsWith('PLACES:')) ?? '';
    expect(places, 'PLACES line').not.toBe('');
    expect(places.split(/exits:/)[1] ?? '', 'the room does not exit to its own dungeon').not.toMatch(/Cathedral Undercroft/);
    for (const n of M.turns()) {
      for (const p of M.after(n).places ?? []) expect(p.name, `T${n} place`).not.toMatch(/ [—–] /);
    }
    if (/^Travel toward/.test(M.input(20))) expect(M.after(20).journey?.from).toBe('Cathedral Undercroft');
  });

  it('[m6 s155fl T21 | lap 6 Root B] an untagged speech line is said by the beat\'s one declared person', () => {
    const { row, enumRefs } = recorded(FLASH155, 21);
    const beat = parseTokenBeat(row.writerRaw)!;
    const speech = beat.lines.find((l) => l.fn === 'speech')!;
    expect(speech).toMatchObject({ speaker_tok: 't3', spoken: true });
    expect(classifyTokenLine(speech, beat, enumRefs)).toEqual({ ok: true });
    expect(renderTokenBeat(beat, enumRefs)).toMatch(/[Tt]raveler said, "Do not worry about the path, it will lead you to Contract Hall\."/);
  });

  it('[m6 s150fl T7 | lap 6 Root B] words right after "Jax spoke" are the PC\'s, so the line has no speaker and is not painted as narration', () => {
    const { row, enumRefs } = recorded(FLASH150, 7);
    expect(row.playerInput).toBe('Talk your way past the thugs');
    const beat = parseTokenBeat(row.writerRaw)!;
    const speech = beat.lines.find((l) => l.fn === 'speech')!;
    expect(speech.speaker_tok ?? '').toBe('');
    expect(classifyTokenLine(speech, beat, enumRefs)).toEqual({ ok: false, reason: 'speech-no-speaker' });
  });

  it('[m6 s151ds T5 | lap 6 Root C] "Nell said, \\"…person.\\" Jax said they were new" is not the player\'s words', () => {
    const { row } = recorded(DS151, 5);
    expect(row.gmText).toMatch(/a person\." Jax said they were new/);
    const kinds = checkPlayCrimes(D.before(5), D.after(5), row.playerInput, row.gmText).p0.map((f) => f.kind);
    expect(kinds).not.toContain('plays-player');
  });
});
