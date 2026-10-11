#!/usr/bin/env node
/**
 * Append every turn of fate-autoplay runs to data/writer-dataset/turns.jsonl (gitignored).
 * One line per writer per turn. `pairKey` (bible:seed:turn) groups the same turn across writers.
 * Run `npm run fact-check -- <run>` first; a run without factcheck.json is refused.
 * Each commit-gate rejection (`sentenceRepairs` on a turn) also goes to rejections.jsonl.
 *
 *   node scripts/writerDataset.mjs [--lap N] <run dir> [<run dir> ...]
 */
import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';

const OUT_DIR = resolve('data', 'writer-dataset');
const OUT = join(OUT_DIR, 'turns.jsonl');
/** Lap 13 — one line per commit-gate rejection: the sentence, the flag, the fact, the repair. */
const REJECTIONS = join(OUT_DIR, 'rejections.jsonl');
const perWriter = {};

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
  const fcPath = join(dir, 'factcheck.json');
  if (!existsSync(fcPath)) {
    console.error(`no factcheck.json in ${dir}; run npm run fact-check first`);
    process.exit(1);
  }
  const fc = JSON.parse(readFileSync(fcPath, 'utf8'));
  const fcByTurn = new Map(fc.perTurn.map((t) => [t.turn, t]));
  const writerId = meta.writer?.kind ?? 'default';
  const writerModel = meta.writer?.model ?? meta.activeOverride?.model ?? null;
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
    const row = {
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
    };
    appendFileSync(OUT, JSON.stringify(row) + '\n');
    added += 1;
    if (isGood) good += 1;
    for (const r of t.sentenceRepairs ?? []) {
      const rej = {
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
console.log(JSON.stringify({ out: OUT, added, good, rejections: REJECTIONS, perWriter }));
