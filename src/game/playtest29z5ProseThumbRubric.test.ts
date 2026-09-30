/**
 * 29z5 — the notes prompt always carries the prose-thumb rubric, and a reply that marks one turn
 * is not a full ok and invents no thumbs for the rest. No judge API call.
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
// @ts-ignore — plain .mjs script module, no types
import { PROSE_THUMB_RUBRIC, applyVerdicts, buildJudgePrompt, notesStatus, parseJudge } from '../../scripts/fate-autoplay/judgeNotes.mjs';

type Row = { turn: number; input: string; prose: string; present: string[]; chips: string[]; down: string[]; up: string[]; verdict: string; thumb: string | null };

const row = (turn: number): Row => ({
  turn,
  input: 'Look around',
  prose: `Turn ${turn}: the lamp guttered over a cracked bench.`,
  present: [],
  chips: [],
  down: [],
  up: [],
  verdict: 'neutral',
  thumb: null,
});

describe('29z5 — prose-thumb rubric is the notes contract', () => {
  it('the notes prompt contains the standard', () => {
    const prompt = buildJudgePrompt([row(1)]);
    expect(prompt).toContain(PROSE_THUMB_RUBRIC);
    expect(prompt).toContain('would I teach the next turn from this beat?');
    expect(prompt).toContain('Pretty-and-empty is not an up.');
    expect(prompt).toContain('Do not down a fair fail, a short honest empty, or a dice result you dislike.');
    expect(prompt).toContain('Most turns should be unmarked. Do not force a thumb.');
    expect(prompt).toMatch(/"verdict":"up"\|"down"\|"unmarked"/);
  });

  it('29z6 — the standard asks "good to play?" with five more downs and the fair-fail exception', () => {
    const prompt = buildJudgePrompt([row(1)]);
    expect(prompt).toContain('is this turn good to play?');
    expect(prompt).toContain('The prose plays the player: it writes their dialogue, feelings, or next decision');
    expect(prompt).toContain('The same habit, smell, light, or sentence shape comes back in new words.');
    expect(prompt).toContain('A fact appears that the scene and the info sheet never established');
    expect(prompt).toContain('a system ledger in tabletop or story RPG, or novel interiority where the mode wants a shared table');
    expect(prompt).toContain('The turn ends by lecturing, listing options, or asking "what do you do?"');
    expect(prompt).toContain('Still do not down a fair dice fail, a short honest empty, or a rules result. A failed roll is not bad writing.');
    expect(prompt).toContain('one prose crime is enough');
    expect(prompt).toContain('Never thumb a turn up for progress.');
  });

  it('a reply that marks one turn of three is not ok and leaves the rest unmarked', () => {
    const rows = [row(1), row(2), row(3)];
    const n = applyVerdicts(rows, parseJudge('[{"turn":"T2","verdict":"up","followed":true,"why":"cracked bench"}]'), []);
    expect(n).toBe(1);
    expect(rows[1]!.thumb).toBe('up');
    expect(rows[0]!.thumb).toBeNull();
    expect(rows[2]!.thumb).toBeNull();
    expect(rows[0]!.up).toEqual([]);
    expect(rows[2]!.up).toEqual([]);
    expect(rows[0]!.verdict).toBe('neutral');
    const status = notesStatus('any/model', n, 3, 0, 1, { up: 1, down: 0, unmarked: 0 });
    expect(status).not.toMatch(/^ok /);
    expect(status).toMatch(/1\/3 turns marked by the model/);
    expect(status).toMatch(/2 never marked/);
    expect(notesStatus('any/model', 2, 3, 0, 1)).toMatch(/^partial /);
    expect(notesStatus('any/model', 3, 3, 0, 1, { up: 0, down: 1, unmarked: 2 })).toMatch(/^ok \(any\/model, 3\/3 turns marked by the model: 0 up, 1 down, 2 unmarked\)/);
  });

  it('an explicit "unmarked" counts as marked but is not a thumb', () => {
    const rows = [row(1)];
    expect(applyVerdicts(rows, [{ turn: 1, verdict: 'unmarked', followed: true, why: 'plain walk' }], [])).toBe(1);
    expect(rows[0]!.thumb).toBe('unmarked');
    expect(rows[0]!.up).toEqual([]);
    expect(rows[0]!.down).toEqual([]);
  });

  it('progress (new place, XP, loot) is not a prose thumbs-up without the model', () => {
    const dir = mkdtempSync(join(tmpdir(), 'z5-thumbs-'));
    const rows = [
      { turn: 1, playerInput: 'Look', gmText: 'The gate stood open.', location: 'Lowmarket', progress: true },
      { turn: 2, playerInput: 'Travel', gmText: 'They reached the quay, wet boards underfoot.', location: 'Quay', xpGained: 20, progress: true, systemLog: ['Loot: rope'] },
    ];
    writeFileSync(join(dir, 'turns.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
    const res = spawnSync(process.execPath, [join('scripts', 'fate-autoplay', 'autoThumbs.mjs'), dir], { encoding: 'utf8' });
    expect(res.status).toBe(0);
    const thumbs = JSON.parse(readFileSync(join(dir, 'thumbs.json'), 'utf8'));
    const t2 = thumbs.turns.find((t: { turn: number }) => t.turn === 2);
    expect(t2.up).toEqual([]);
    expect(t2.verdict).not.toBe('up');
    expect(t2.thumb).toBeNull();
    expect(t2.progress.join(' ')).toMatch(/new place: Quay/);
    expect(readFileSync(join(dir, 'report.md'), 'utf8')).toMatch(/Progress turns: 1 \(T2 new place: Quay/);
  });
});
