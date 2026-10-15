#!/usr/bin/env node
/**
 * One-off backfill (15 Oct): add training_ok / teacher_model / provider / judge_model / mode to every stored writer row
 * that was saved before those fields were written at the source. Rows that already carry training_ok are kept.
 *
 *   node scripts/backfillProvenance.mjs [--dry-run] [--storyforge <storyforge root>] [--out <counts.json>]
 *
 * Covers data/writer-dataset/*.jsonl, every run folder with a turns.jsonl (its turns, meta.json and thumbs.json),
 * and, with --storyforge, the HER rows (source community_mega) of the StoryForge datasets.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, basename, relative } from 'node:path';
import { EXCLUDED_SOURCES, legacyRowProvenance, modelLicence } from '../src/game/modelIds.ts';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const opt = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const storyforge = opt('--storyforge');
const outPath = opt('--out');
const root = resolve('.');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'src', 'public', 'supabase', 'wof']);

const counts = {};
function tally(group, p) {
  const key = [group, p.teacher_model ?? '(none)', p.provider ?? '(none)', p.mode ?? '(none)'].join('|');
  const c = (counts[key] ??= { group, teacher_model: p.teacher_model ?? null, provider: p.provider ?? null, mode: p.mode ?? null, rows: 0, true: 0, false: 0, pending: 0 });
  c.rows += 1;
  c[String(p.training_ok)] += 1;
}

const PROV_KEYS = ['training_ok', 'teacher_model', 'provider', 'judge_model', 'mode', 'training_note'];
const pick = (row) => Object.fromEntries(PROV_KEYS.filter((k) => k in row).map((k) => [k, row[k]]));

function rewriteJsonl(file, fn) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  let changed = false;
  const next = lines.map((line) => {
    if (!line.trim()) return line;
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      return line;
    }
    const out = fn(row);
    if (!out) return line;
    changed = true;
    return JSON.stringify(out);
  });
  if (changed && !dryRun) writeFileSync(file, next.join('\n'));
}

function walk(dir, found) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, found);
    else if (name === 'turns.jsonl' && !p.includes(join('data', 'writer-dataset'))) found.push(dir);
  }
  return found;
}

/** Judge model of a run, from the notes status autoThumbs wrote into report.md. */
function runJudge(dir) {
  const report = join(dir, 'report.md');
  if (!existsSync(report)) return null;
  const m = readFileSync(report, 'utf8').match(/model notes: (?:ok|partial|failed) \(([^,)\s]+)/);
  return m ? m[1] : null;
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

// 1) Run folders: turns.jsonl, meta.json, thumbs.json.
const runDirs = walk(root, []);
const judgeByRunId = new Map();
for (const dir of runDirs) {
  const metaPath = join(dir, 'meta.json');
  const meta = existsSync(metaPath) ? readJson(metaPath) : null;
  const judge = runJudge(dir);
  judgeByRunId.set(basename(dir), judge);
  const runModel = meta?.writer?.model ?? meta?.activeOverride?.model ?? null;
  const hostedFree = meta?.writer?.kind === 'default';
  const byTurn = new Map();
  rewriteJsonl(join(dir, 'turns.jsonl'), (row) => {
    if ('training_ok' in row) {
      byTurn.set(row.turn, pick(row));
      tally('lap-tapes', row);
      return null;
    }
    const p = legacyRowProvenance({
      recordedModel: row.writerUsage?.modelId ?? runModel,
      hostedFree,
      judgeModel: judge,
      mode: row.engineMode ?? meta?.engineMode ?? null,
    });
    byTurn.set(row.turn, p);
    tally('lap-tapes', p);
    return { ...row, ...p };
  });
  if (meta && !('training_ok' in meta)) {
    const p = legacyRowProvenance({ recordedModel: runModel, hostedFree, judgeModel: judge, mode: meta.engineMode ?? null });
    tally('meta.json', p);
    if (!dryRun) writeFileSync(metaPath, JSON.stringify({ ...meta, ...p }, null, 2) + '\n');
  }
  const thumbsPath = join(dir, 'thumbs.json');
  const thumbs = existsSync(thumbsPath) ? readJson(thumbsPath) : null;
  if (thumbs?.turns?.length && thumbs.turns.some((o) => !('training_ok' in o))) {
    thumbs.turns = thumbs.turns.map((o) => ('training_ok' in o ? o : { ...o, ...(byTurn.get(o.turn) ?? {}), judge_model: judge }));
    for (const o of thumbs.turns) if ('training_ok' in o) tally('thumbs.json', o);
    if (!dryRun) writeFileSync(thumbsPath, JSON.stringify(thumbs, null, 1));
  }
}

// 2) Writer dataset files.
const dsDir = join(root, 'data', 'writer-dataset');
for (const name of ['turns.jsonl', 'rejections.jsonl', 'writer-quality.jsonl']) {
  const file = join(dsDir, name);
  if (!existsSync(file)) continue;
  const group = `writer-dataset/${name}`;
  rewriteJsonl(file, (row) => {
    if ('training_ok' in row) {
      tally(group, row);
      return null;
    }
    const p = legacyRowProvenance({
      recordedModel: row.writerModel,
      hostedFree: row.writerId === 'default',
      judgeModel: judgeByRunId.get(row.runId) ?? null,
      mode: row.mode ?? null,
      sourceId: row.source,
    });
    tally(group, p);
    return { ...p, ...row, ...p };
  });
}

// 3) StoryForge: HER rows are never training data.
if (storyforge) {
  const ds = join(storyforge, 'pipeline', 'fine-tuning', 'datasets');
  const herFile = 'manus-high-quality-mega-dataset.jsonl';
  for (const name of [herFile, 'storyforge-unified-sft-dataset.jsonl', 'storyforge-weighted-student-epoch.jsonl']) {
    const file = join(ds, name);
    if (!existsSync(file)) continue;
    rewriteJsonl(file, (row) => {
      const her = name === herFile || EXCLUDED_SOURCES[String(row.source ?? '').toLowerCase()];
      if (!her) return null;
      const p = { training_ok: false, training_note: EXCLUDED_SOURCES.community_mega, source: row.source ?? 'community_mega' };
      tally(`storyforge/${name}`, { ...p, teacher_model: null, provider: 'her-dataset', mode: null });
      return row.training_ok === false ? null : { ...row, ...p };
    });
  }
  // Ingested lap turns carry no writer id or run id, so they cannot be joined to a tape.
  const runsDir = join(storyforge, 'runs');
  for (const name of existsSync(runsDir) ? readdirSync(runsDir) : []) {
    const file = join(runsDir, name, 'ok_turns.jsonl');
    if (!existsSync(file)) continue;
    const group = `storyforge/runs/${name}/ok_turns.jsonl`;
    rewriteJsonl(file, (row) => {
      if ('training_ok' in row) {
        tally(group, row);
        return null;
      }
      const p = {
        ...legacyRowProvenance({ recordedModel: row.writerModel ?? null, mode: row.engineMode ?? null }),
        training_note: 'no writer model recorded; cannot be joined to a lap tape',
      };
      tally(group, p);
      return { ...row, ...p };
    });
  }
}

const rowsOut = Object.values(counts).sort((a, b) => a.group.localeCompare(b.group) || b.rows - a.rows);
for (const r of rowsOut) r.licence = r.teacher_model ? modelLicence(r.teacher_model).licence : null;
const summary = { dryRun, runDirs: runDirs.length, runDirsSample: runDirs.slice(0, 3).map((d) => relative(root, d)), counts: rowsOut };
if (outPath) writeFileSync(outPath, JSON.stringify(summary, null, 1));
console.log(`run dirs ${runDirs.length}; groups ${rowsOut.length}${dryRun ? ' (dry run, nothing written)' : ''}`);
