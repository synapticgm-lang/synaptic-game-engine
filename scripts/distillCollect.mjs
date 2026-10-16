#!/usr/bin/env node
/**
 * Distillation collector: keeps only checker-passing turns of fate-autoplay runs.
 * Each run needs factcheck.json (npm run fact-check) and thumbs.json from `autoThumbs --notes`.
 * A turn passes when: training_ok === true, turnCheck has no P0, factCheck has no flags, the judge
 * marked it (up or unmarked; never-marked and down fail), the thumbs row is a paired training_label
 * (RC-J1: absolute single-run notes are diagnostic only), and the thumbs row has no P0 or local down flag
 * of a writer kind (judgeNotes WRITER_FLAG_KINDS; run pacing, chips and maps are not the writer's).
 *
 *   node scripts/distillCollect.mjs --batch N <run dir> [<run dir> ...]
 * Appends passing rows to data/distill/batch-N.jsonl and prints per model x mode counts as JSON.
 */
import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { rowProvenance, WELLBEING_NOTE } from '../src/game/modelIds.ts';
import { isWriterFlag } from './fate-autoplay/judgeNotes.mjs';

const argv = process.argv.slice(2);
let batch = null;
const dirs = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--batch') batch = argv[++i];
  else dirs.push(argv[i]);
}
if (!batch || !dirs.length) {
  console.error('Usage: node scripts/distillCollect.mjs --batch N <run dir> [...]');
  process.exit(1);
}
const OUT_DIR = resolve('data', 'distill');
const OUT = join(OUT_DIR, `batch-${batch}.jsonl`);
mkdirSync(OUT_DIR, { recursive: true });
const seen = new Set();
if (existsSync(OUT)) {
  for (const line of readFileSync(OUT, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const j = JSON.parse(line);
      seen.add(`${j.runId}|${j.turn}`);
    } catch {
      /* skip a bad line */
    }
  }
}

const tally = {};
const reasons = {};
const runs = [];
let writerCostUsd = 0;
for (const dir of dirs) {
  const runId = basename(dir);
  const need = ['meta.json', 'turns.jsonl', 'thumbs.json', 'factcheck.json'].filter((f) => !existsSync(join(dir, f)));
  if (need.length) {
    runs.push({ runId, skipped: `missing ${need.join(', ')}` });
    continue;
  }
  const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
  const thumbs = JSON.parse(readFileSync(join(dir, 'thumbs.json'), 'utf8'));
  const thumbsByTurn = new Map((thumbs.turns ?? []).map((o) => [o.turn, o]));
  const fc = JSON.parse(readFileSync(join(dir, 'factcheck.json'), 'utf8'));
  const fcByTurn = new Map((fc.perTurn ?? []).map((t) => [t.turn, t]));
  const turns = readFileSync(join(dir, 'turns.jsonl'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
  let attempted = 0;
  let passed = 0;
  for (const t of turns) {
    const th = thumbsByTurn.get(t.turn);
    const f = fcByTurn.get(t.turn);
    const prov = rowProvenance({
      teacherModel: t.teacher_model ?? t.writerUsage?.modelId ?? meta.writer?.model ?? null,
      mode: meta.engineMode,
      judgeModel: th?.judge_model ?? null,
      wellbeingFlagged: t.training_note === WELLBEING_NOTE,
    });
    const key = `${prov.teacher_model ?? '?'}|${prov.mode ?? '?'}`;
    const c = (tally[key] ??= { teacher_model: prov.teacher_model, mode: prov.mode, attempted: 0, passing: 0 });
    c.attempted++;
    attempted++;
    if (typeof t.writerUsage?.costUsd === 'number') writerCostUsd += t.writerUsage.costUsd;
    const why = [];
    if (prov.training_ok !== true) why.push('not training_ok');
    if (!String(t.gmText ?? '').trim()) why.push('empty prose');
    if (t.error) why.push('turn error');
    if ((t.turnCheck?.p0 ?? []).length) why.push('turnCheck P0');
    if (!f) why.push('no factcheck row');
    else if ((f.flags ?? []).length) why.push('factCheck flag');
    if (!th?.judge_model) why.push('no judge');
    else if (th.training_label !== true) why.push('not paired training label');
    else if (th.thumb == null) why.push('judge never marked');
    else if (th.thumb === 'down') why.push('judge down');
    if ((th?.p0 ?? []).length) why.push('thumbs P0 (judge ignored-action / stiff line)');
    if ((th?.down ?? []).some(isWriterFlag)) why.push('local down flag');
    if (why.length) {
      for (const w of new Set(why)) reasons[w] = (reasons[w] ?? 0) + 1;
      continue;
    }
    c.passing++;
    passed++;
    if (seen.has(`${runId}|${t.turn}`)) continue;
    const packetFile = f.packet ?? `turn-${String(t.turn - 1).padStart(2, '0')}.txt`;
    const packetPath = join(dir, 'writer-prompts', packetFile);
    appendFileSync(
      OUT,
      JSON.stringify({
        ...prov,
        batch: Number(batch),
        runId,
        buildStamp: meta.runManifest?.buildStamp ?? null,
        bible: meta.bibleId,
        seed: meta.seed,
        turn: t.turn,
        playerInput: t.playerInput ?? null,
        location: t.location ?? null,
        writerPacket: existsSync(packetPath) ? readFileSync(packetPath, 'utf8') : null,
        prose: t.gmText,
        judgeThumb: th.thumb,
        judgeNote: th.note ?? null,
        writerUsage: t.writerUsage ?? null,
      }) + '\n'
    );
  }
  runs.push({ runId, mode: meta.engineMode, bible: meta.bibleId, seed: meta.seed, attempted, passed });
}
console.log(JSON.stringify({ out: OUT, runs, tally: Object.values(tally), failReasons: reasons, writerCostUsd }, null, 1));
