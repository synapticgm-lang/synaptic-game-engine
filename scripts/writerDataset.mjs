#!/usr/bin/env node
/**
 * Append every turn of fate-autoplay runs to data/writer-dataset/turns.jsonl (gitignored).
 * One line per writer per turn. `pairKey` (bible:seed:turn) groups the same turn across writers.
 * Run `npm run fact-check -- <run>` first; a run without factcheck.json is refused.
 * Each commit-gate rejection (`sentenceRepairs` on a turn) and each missing talk answer (`answerRepair`) also goes to rejections.jsonl.
 *
 *   node scripts/writerDataset.mjs [--lap N] <run dir> [<run dir> ...]
 */
import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { excludedSourceReason, rowProvenance } from '../src/game/modelIds.ts';

const OUT_DIR = resolve('data', 'writer-dataset');
const OUT = join(OUT_DIR, 'turns.jsonl');
/** Lap 13 — one line per commit-gate rejection: the sentence, the flag, the fact, the repair. */
const REJECTIONS = join(OUT_DIR, 'rejections.jsonl');
const perWriter = {};
/** Lap 14 — per-writer reply ms / tokens / cost sums for this invocation. */
const perWriterCost = {};
const PRICES = JSON.parse(readFileSync(resolve('scripts', 'fate-autoplay', 'model-prices.json'), 'utf8'));

/**
 * Turn cost in USD: the provider-billed `costUsd` when the writer reported one (OpenRouter), else an
 * estimate from model-prices.json (hosted DeepSeek reports tokens only), else null.
 */
function turnCost(u) {
  if (!u) return { costUsd: null, costSource: null };
  if (typeof u.costUsd === 'number') return { costUsd: u.costUsd, costSource: 'provider' };
  const key = Object.keys(PRICES).find((k) => k !== '_note' && String(u.modelId ?? '').endsWith(k));
  if (!key || u.tokensIn == null || u.tokensOut == null) return { costUsd: null, costSource: null };
  const p = PRICES[key];
  const cached = u.tokensCached ?? 0;
  const usd = ((u.tokensIn - cached) * p.in + cached * p.cached + u.tokensOut * p.out) / 1e6;
  return { costUsd: usd, costSource: 'estimate' };
}

const argv = process.argv.slice(2);
let lap = null;
const dirs = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--lap') lap = argv[++i];
  else dirs.push(argv[i]);
}
if (!dirs.length) {
  console.error('Usage: node scripts/writerDataset.mjs [--lap N] <run dir> [...]');
  process.exit(1);
}

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

let added = 0;
let good = 0;
for (const dir of dirs) {
  const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
  const refused = excludedSourceReason(meta.source ?? meta.sourceId);
  if (refused) {
    console.error(`refused ${dir}: source ${meta.source ?? meta.sourceId} is excluded (${refused})`);
    process.exit(1);
  }
  const thumbsPath = join(dir, 'thumbs.json');
  const thumbsByTurn = new Map(
    existsSync(thumbsPath) ? (JSON.parse(readFileSync(thumbsPath, 'utf8')).turns ?? []).map((o) => [o.turn, o]) : []
  );
  const fcPath = join(dir, 'factcheck.json');
  if (!existsSync(fcPath)) {
    console.error(`no factcheck.json in ${dir}; run npm run fact-check first`);
    process.exit(1);
  }
  const fc = JSON.parse(readFileSync(fcPath, 'utf8'));
  const fcByTurn = new Map(fc.perTurn.map((t) => [t.turn, t]));
  const writerId = meta.writer?.kind ?? 'default';
  const runModel = meta.writer?.model ?? meta.activeOverride?.model ?? null;
  const runId = basename(dir);
  const turns = readFileSync(join(dir, 'turns.jsonl'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));

  for (const t of turns) {
    if (seen.has(`${runId}|${t.turn}`)) continue;
    const f = fcByTurn.get(t.turn);
    const packetFile = f?.packet ?? `turn-${String(t.turn - 1).padStart(2, '0')}.txt`;
    const packetPath = join(dir, 'writer-prompts', packetFile);
    const packet = existsSync(packetPath) ? readFileSync(packetPath, 'utf8') : null;
    const fcFlags = f?.flags ?? [];
    const p0 = t.turnCheck?.p0 ?? [];
    const isGood = fcFlags.length === 0 && p0.length === 0;
    const u = t.writerUsage ?? null;
    const writerModel = t.teacher_model ?? u?.modelId ?? runModel;
    const { costUsd, costSource } = turnCost(u);
    const prov = rowProvenance({
      teacherModel: writerModel,
      mode: meta.engineMode,
      judgeModel: thumbsByTurn.get(t.turn)?.judge_model ?? null,
    });
    const row = {
      ...prov,
      pairKey: `${meta.bibleId}:s${meta.seed}:t${t.turn}`,
      lap,
      runId,
      buildStamp: meta.runManifest?.buildStamp ?? null,
      seed: meta.seed,
      turn: t.turn,
      mode: meta.engineMode,
      bible: meta.bibleId,
      writerId,
      writerModel,
      playerInput: t.playerInput ?? null,
      location: t.location ?? null,
      writerPacket: packet,
      writerPacketFile: packet ? packetFile : null,
      prose: t.gmText ?? '',
      factCheck: { flags: fcFlags, turnScore: fcFlags.length ? 0 : 100, runScore: fc.score },
      localGate: { p0, down: t.turnCheck?.down ?? [] },
      good: isGood,
      replyMs: typeof t.writerMs === 'number' ? t.writerMs : null,
      writerCalls: typeof t.writerCalls === 'number' ? t.writerCalls : null,
      inputTokens: u?.tokensIn ?? null,
      outputTokens: u?.tokensOut ?? null,
      cachedTokens: u?.tokensCached ?? null,
      costUsd,
      costSource,
    };
    appendFileSync(OUT, JSON.stringify(row) + '\n');
    added += 1;
    if (isGood) good += 1;
    const ck = writerModel ?? writerId;
    const c = (perWriterCost[ck] ??= { turns: 0, ms: [], tin: [], tout: [], cost: [], costSources: new Set() });
    c.turns += 1;
    if (row.replyMs != null) c.ms.push(row.replyMs);
    if (row.inputTokens != null) c.tin.push(row.inputTokens);
    if (row.outputTokens != null) c.tout.push(row.outputTokens);
    if (costUsd != null) {
      c.cost.push(costUsd);
      c.costSources.add(costSource);
    }
    for (const r of [...(t.sentenceRepairs ?? []), ...(t.answerRepair ? [t.answerRepair] : [])]) {
      const rej = {
        ...prov,
        pairKey: row.pairKey,
        lap,
        runId,
        seed: meta.seed,
        turn: t.turn,
        writerId,
        writerModel,
        original: r.sentence,
        flag: r.flag,
        correctFact: r.fact ?? t.engineFact ?? null,
        repaired: r.repaired ?? null,
        repairOk: !r.bug,
        bug: r.bug ?? null,
      };
      appendFileSync(REJECTIONS, JSON.stringify(rej) + '\n');
      const k = writerModel ?? writerId;
      const w = (perWriter[k] ??= { rejections: 0, repaired: 0 });
      w.rejections += 1;
      if (!r.bug) w.repaired += 1;
    }
  }
}
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const costByWriter = {};
let lapCostUsd = 0;
for (const [k, c] of Object.entries(perWriterCost)) {
  const total = c.cost.reduce((x, y) => x + y, 0);
  lapCostUsd += total;
  costByWriter[k] = {
    turns: c.turns,
    meanReplyMs: mean(c.ms),
    meanInputTokens: mean(c.tin),
    meanOutputTokens: mean(c.tout),
    meanCostUsd: mean(c.cost),
    totalCostUsd: total,
    turnsWithCost: c.cost.length,
    costSources: [...c.costSources],
  };
}
console.log(JSON.stringify({ out: OUT, added, good, rejections: REJECTIONS, perWriter, costByWriter, lapCostUsd }, null, 1));
