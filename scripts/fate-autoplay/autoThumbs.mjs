#!/usr/bin/env node
/**
 * 28j — model-free thumbs review for a fate-autoplay run.
 * Usage: node scripts/fate-autoplay/autoThumbs.mjs <runDir> [--notes] [--pair <otherRunDir>]
 * Reads <runDir>/turns.jsonl, writes <runDir>/thumbs.json and <runDir>/report.md.
 * 29z2 — each row's turnCheck (who is here, the chips, the last action) adds P0 fails and thumbs-down.
 * --notes: a judge model reads every turn (batches of 20) for stiff / abstract / broken lines and for
 * prose that ignores the player's action. Stiff lines come back with a plainer rewrite and are
 * written to <runDir>/writer-lessons.jsonl. Skipped when no OPENROUTER_API_KEY / VITE_OPENROUTER_API_KEY is found.
 * 29z5 — prose thumbs come only from the notes model under PROSE_THUMB_RUBRIC (judgeNotes.mjs). Progress stays
 * in the progress section; a turn the model never marked stays unmarked.
 * RC-J1 — absolute single-run --notes is diagnostic only (not a training label). Training labels need
 * --pair <matched seat run>: blind side-by-side judge, asked twice with order swapped; keep a thumb
 * only when both asks agree; report agreement rate; training_label only when rate ≥ PAIR_AGREEMENT_FLOOR.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  PAIR_AGREEMENT_FLOOR,
  agreePairedMarks,
  applyVerdicts,
  buildJudgePrompt,
  buildPairedJudgePrompt,
  notesStatus as judgeStatus,
  pairAgreementRate,
  parseJudge,
  readOpenRouterKey,
  replyText,
  trainingOkFromAgreement,
} from './judgeNotes.mjs';
import { rowProvenance, TRAINING_JUDGE_MODEL } from '../../src/game/modelIds.ts';

const args = process.argv.slice(2);
const runDir = args.find((a) => !a.startsWith('--'));
if (!runDir) {
  console.error('usage: autoThumbs.mjs <runDir> [--notes] [--pair <otherRunDir>]');
  process.exit(1);
}
const wantNotes = args.includes('--notes');
const pairIdx = args.indexOf('--pair');
const pairDir = pairIdx >= 0 ? args[pairIdx + 1] : null;
if (pairIdx >= 0 && (!pairDir || pairDir.startsWith('--'))) {
  console.error('usage: autoThumbs.mjs <runDir> --notes --pair <otherRunDir>');
  process.exit(1);
}
const judgeModel = wantNotes ? process.env.SGM_THUMBS_MODEL || TRAINING_JUDGE_MODEL : null;
function loadTurns(dir) {
  return fs
    .readFileSync(path.join(dir, 'turns.jsonl'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.turn - b.turn);
}

const rows = loadTurns(runDir);
const pairRows = pairDir ? loadTurns(pairDir) : null;

const JUNK = [
  [/\bthe witness\b/i, 'junk label "the witness"'],
  [/\bthe Beyond\b|\bBeyond\s+[A-Z]\w+,\s+the\b/, 'junk label "Beyond <place>"'],
  [/\b(?:to|of|inside|into|at)\s+Entry\b/, 'room label "Entry" used as a place'],
  [/\bstill has the next move\b/i, 'third-person stitch closer'],
  [/@t\d+|<[^<>]{2,40}>/, 'unrendered token or placeholder'],
  [/You did it, and it showed|Rain ran off the stones/i, 'prompt example copied'],
  [/\bInterior\s+—\s+\w+[^.]{0,30}\b(?:air|walls?|floor)\b/, 'node label used as subject'],
  [/\b(?:a|the) stranger\b.*\byou take\b|\byou take a stranger\b/i, 'stand-in noun painted'],
];

const text = (r) => String(r.gmText ?? '');
const receipts = (r) => [...new Set([...(r.arcStatusReceipts ?? []), ...(r.systemLog ?? [])].map(String))];
const sentences = (t) =>
  t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length >= 28);
const isFallback = (r) =>
  JSON.stringify(r.systemLog ?? []).includes('ledger stitch') ||
  r.writerOutcome === 'fallback' ||
  r.renderFallbackUsed === true ||
  r.tokenPath === 'last-resort';

const seenLoc = new Map();
const visitsByLoc = new Map();
let lastLoc = '';
let sameLocRun = 0;
let lastXpTurn = rows[0]?.turn ?? 0;
let prevLevel = rows[0]?.level ?? 1;
let noProgress = 0;
let noProgressRun = 0;
let repeatVisits = 0;
let roomRepeatVisits = 0;
const recentSent = [];
const pacing = [];
const out = [];

for (const r of rows) {
  const t = text(r);
  const rec = receipts(r);
  const recJoin = rec.join(' | ');
  const loc = String(r.location ?? r.snapshotGist?.location ?? '');
  const down = [];
  const up = [];
  const progressBeats = [];
  const unclear = [];

  const moved = !!loc && loc !== lastLoc;
  const newPlace = !!loc && !seenLoc.has(loc);
  if (moved && !newPlace) {
    repeatVisits++;
    if (/\s[—–]\s/.test(loc)) roomRepeatVisits++;
  }
  if (loc) {
    if (!seenLoc.has(loc)) seenLoc.set(loc, r.turn);
    if (moved) visitsByLoc.set(loc, (visitsByLoc.get(loc) ?? 0) + 1);
  }
  sameLocRun = moved ? 1 : sameLocRun + 1;
  lastLoc = loc || lastLoc;

  const xp = Math.max(
    Number(r.xpGained ?? 0),
    rec.filter((x) => /^XP Gained: (\d+)/.test(x)).reduce((a, x) => a + Number(x.match(/^XP Gained: (\d+)/)[1]), 0)
  );
  const won = /Fight: VICTORY/.test(recJoin);
  const lost = /Fight: DEFEAT/.test(recJoin);
  const loot = /\bLoot:|Gold Gained/.test(recJoin);
  const quest = (r.questUnlocks ?? []).length > 0 || /Quest (?:step|stage|advanced|complete)/i.test(recJoin);
  const levelUp = (r.level ?? prevLevel) > prevLevel;
  prevLevel = r.level ?? prevLevel;
  if (xp > 0) lastXpTurn = r.turn;
  // 29z1 — the harness writes turnProgress on each row (same meaning as the loop stop); older runs fall back.
  const progress = typeof r.progress === 'boolean' ? r.progress : xp > 0 || moved || loot || quest || won;
  if (!progress) {
    noProgress++;
    noProgressRun++;
  } else noProgressRun = 0;

  // 29z5 — progress is reported, never a prose thumbs-up; only the notes model thumbs prose up.
  if (won) progressBeats.push('fight won');
  if (levelUp) progressBeats.push(`level up to L${r.level}`);
  if (newPlace && r.turn > 1) progressBeats.push(`new place: ${loc}`);
  if (loot) progressBeats.push('loot');
  if (quest) progressBeats.push('quest step');
  if (xp > 0 && !won) progressBeats.push(`+${xp} XP`);

  const p0 = (r.turnCheck?.p0 ?? []).map((f) => `P0 ${f.kind}: ${f.detail}`);
  down.push(...p0);
  for (const f of r.turnCheck?.down ?? []) down.push(`${f.kind}: ${f.detail}`);
  if (isFallback(r)) down.push('fallback / stitch');
  for (const [re, why] of JUNK) if (re.test(t)) down.push(`junk: ${why}`);
  const sents = sentences(t);
  const rep = sents.find((s) => recentSent.some((p) => p === s));
  if (rep) down.push(`repeated line: "${rep.slice(0, 60)}"`);
  recentSent.push(...sents);
  while (recentSent.length > 60) recentSent.shift();
  // Run pacing (engine + autoplay), never a turn verdict: it goes to the run's circling block.
  if (sameLocRun >= 5 && !progress && sameLocRun % 5 === 0) pacing.push({ turn: r.turn, flag: `same place ${sameLocRun} turns, no progress` });
  const stall = r.turn - lastXpTurn;
  if (stall >= 15 && stall % 15 === 0) pacing.push({ turn: r.turn, flag: `XP stall ${stall} turns` });
  if (won && /\b(attack|strike|swing|lunge)\w*\b[^.]{0,60}\b(corpse|body|remains)\b/i.test(t))
    down.push('prose: continues a fight the engine already won');
  if (won && /\b(?:fight|battle) (?:rages|continues|goes on)\b/i.test(t)) down.push('prose: continues a finished fight');
  if (lost && /\byou (?:win|won|defeat(?:ed)?)\b/i.test(t)) down.push('prose: contradicts a defeat');
  if (/Flee check:.*success/i.test(recJoin) && /\b(?:cornered|trapped|cannot escape)\b/i.test(t))
    down.push('prose: contradicts a successful flee');

  if (!down.length) {
    if (r.writerOutcome === 'retry') unclear.push('writer retry');
    if (t.length < 140) unclear.push('short beat');
    if (t && !/[.!?"”']\s*$/.test(t)) unclear.push('cut off');
    if (/\b(?:saw|see)\.\s*$/.test(t)) unclear.push('ends on an empty verb');
  }
  const verdict = down.length ? 'down' : unclear.length ? 'unclear' : 'neutral';
  out.push({
    turn: r.turn,
    input: r.playerInput,
    location: loc,
    verdict,
    thumb: null,
    ...(p0.length ? { p0 } : {}),
    down,
    up,
    progress: progressBeats,
    unclear,
    excerpt: t.replace(/\s+/g, ' ').slice(0, 220),
    prose: t,
    ...rowProvenance({ teacherModel: r.teacher_model ?? r.writerUsage?.modelId ?? null, mode: r.engineMode ?? null, judgeModel }),
    present: r.turnCheck?.presentNames ?? [],
    chips: r.offeredChoices ?? [],
    // 28l — raw writer issues (empty / reasoning-only / cut-off / recycled / unresolved) for training.
    ...(r.writerIssues?.length ? { writerIssues: r.writerIssues } : {}),
    // 28w — token use of the turn, next to the issues (same row as the live feedback record).
    ...(r.writerUsage ? { writerUsage: r.writerUsage } : {}),
  });
}

const lessons = [];
/** RC-J1 — pair agreement rate (null when not a paired run). */
let pairAgreement = null;
/** RC-J1 — 'paired' | 'diagnostic' | null. Absolute --notes is diagnostic only. */
let labelSource = null;
/** Pair-side rows written when --pair is set (other seat's training thumbs). */
let pairOut = null;

async function callJudge(key, model, prompt) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 12000, temperature: 0 }),
  });
  if (!res.ok) throw new Error(`http ${res.status}`);
  return parseJudge(replyText(await res.json()));
}

function applyPairedToSide(sideRows, mark, why, followed) {
  if (!sideRows) return;
  sideRows.note = why;
  sideRows.thumb = mark;
  if (followed === false) {
    const flag = `P0 ignored-action (judge): ${why || 'prose does not do the player action'}`;
    sideRows.p0 = [...(sideRows.p0 ?? []), flag];
    sideRows.down.push(flag);
  }
  if (mark === 'up' && !sideRows.down.length) sideRows.up.push(`judge: ${why}`);
  else if (mark === 'down' && why && !sideRows.down.some((d) => d.includes(why))) sideRows.down.push(`judge: ${why}`);
  sideRows.verdict = sideRows.down.length ? 'down' : sideRows.up.length ? 'up' : sideRows.verdict;
}

async function addPairedNotes(key) {
  for (const o of out) {
    o.labelSource = 'paired';
    o.training_label = false;
  }
  const byTurn = new Map(pairRows.map((r) => [r.turn, r]));
  const pairs = out
    .filter((o) => o.prose && o.prose.trim())
    .map((o) => {
      const other = byTurn.get(o.turn);
      const proseY = String(other?.gmText ?? '').trim();
      if (!proseY) return null;
      return {
        turn: o.turn,
        input: o.input,
        present: o.present,
        chips: o.chips,
        proseX: o.prose,
        proseY,
        left: o,
      };
    })
    .filter(Boolean)
    .slice(0, 300);
  if (!pairs.length) return 'skipped (no matched prose turns in pair)';

  // Build the other seat's local out rows (same shape) so we can write its thumbs.json.
  pairOut = pairs.map((p) => {
    const r = byTurn.get(p.turn);
    const loc = String(r.location ?? r.snapshotGist?.location ?? '');
    return {
      turn: r.turn,
      input: r.playerInput,
      location: loc,
      verdict: 'neutral',
      thumb: null,
      down: [],
      up: [],
      progress: [],
      unclear: [],
      excerpt: String(r.gmText ?? '')
        .replace(/\s+/g, ' ')
        .slice(0, 220),
      prose: String(r.gmText ?? ''),
      ...rowProvenance({
        teacherModel: r.teacher_model ?? r.writerUsage?.modelId ?? null,
        mode: r.engineMode ?? null,
        judgeModel,
      }),
      present: r.turnCheck?.presentNames ?? [],
      chips: r.offeredChoices ?? [],
    };
  });
  const pairByTurn = new Map(pairOut.map((o) => [o.turn, o]));

  const model = judgeModel;
  let failed = 0;
  let batches = 0;
  const ask1ByTurn = new Map();
  const ask2ByTurn = new Map();
  const size = 10;
  for (let i = 0; i < pairs.length; i += size) {
    const batch = pairs.slice(i, i + size);
    batches += 2;
    try {
      const v1 = await callJudge(key, model, buildPairedJudgePrompt(batch, { swapped: false }));
      for (const v of v1) ask1ByTurn.set(verdictTurnSafe(v), v);
    } catch {
      failed++;
    }
    try {
      const v2 = await callJudge(key, model, buildPairedJudgePrompt(batch, { swapped: true }));
      for (const v of v2) ask2ByTurn.set(verdictTurnSafe(v), v);
    } catch {
      failed++;
    }
  }

  const agreed = [];
  for (const p of pairs) {
    const a1 = ask1ByTurn.get(p.turn);
    const a2 = ask2ByTurn.get(p.turn);
    if (!a1 || !a2) {
      p.left.thumb = 'unmarked';
      p.left.note = 'pair ask missing';
      const right = pairByTurn.get(p.turn);
      if (right) {
        right.thumb = 'unmarked';
        right.note = 'pair ask missing';
      }
      agreed.push({ turn: p.turn, agreed0: false, agreed1: false });
      continue;
    }
    const m = agreePairedMarks(a1, a2);
    agreed.push(m);
    applyPairedToSide(p.left, m.seat0, m.why0, m.followed0);
    applyPairedToSide(pairByTurn.get(p.turn), m.seat1, m.why1, m.followed1);
  }

  pairAgreement = pairAgreementRate(agreed);
  labelSource = 'paired';
  const trainOk = trainingOkFromAgreement(pairAgreement);
  for (const o of [...pairs.map((p) => p.left), ...pairOut]) {
    o.labelSource = 'paired';
    o.pairAgreement = pairAgreement;
    // Disagreement / missing ask → unmarked and never a training label. Floor must clear for the rest.
    const disagreed = o.note === 'pair asks disagreed' || o.note === 'pair ask missing';
    o.training_label = trainOk && !disagreed && o.thumb != null;
  }

  const tally = { up: 0, down: 0, unmarked: 0 };
  let marked = 0;
  for (const p of pairs) {
    if (p.left.thumb) {
      marked++;
      tally[p.left.thumb]++;
    }
  }
  const ratePct = Math.round(100 * pairAgreement);
  const floorPct = Math.round(100 * PAIR_AGREEMENT_FLOOR);
  return (
    judgeStatus(model, marked, pairs.length, failed, batches, tally) +
    `; pair agreement ${ratePct}% (floor ${floorPct}%)${trainOk ? '' : ' — below floor, not training_ok'}`
  );
}

function verdictTurnSafe(v) {
  const m = String(v?.turn ?? '').match(/\d+/);
  return m ? Number(m[0]) : NaN;
}

async function addNotes() {
  const key = readOpenRouterKey();
  if (!key) return 'skipped (no OPENROUTER_API_KEY or VITE_OPENROUTER_API_KEY found)';
  if (pairDir) return addPairedNotes(key);

  // RC-J1 — absolute single-run notes stay diagnostic only (not a training label).
  labelSource = 'diagnostic';
  const targets = out.filter((o) => o.prose && o.prose.trim().length > 0).slice(0, 300);
  if (!targets.length) return 'skipped (no prose turns)';
  const model = judgeModel;
  let judged = 0;
  let failed = 0;
  let batches = 0;
  const ask = async (list, size) => {
    for (let i = 0; i < list.length; i += size) {
      batches++;
      const batch = list.slice(i, i + size);
      const prompt = buildJudgePrompt(batch);
      try {
        const got = applyVerdicts(batch, await callJudge(key, model, prompt), lessons);
        if (!got) failed++;
        judged += got;
      } catch {
        failed++;
      }
    }
  };
  await ask(targets, 20);
  // 29z7 — one more ask for only the turns the model skipped; whatever is still missing stays unmarked.
  const missing = targets.filter((o) => o.thumb == null);
  if (missing.length) await ask(missing, 5);
  for (const o of targets) {
    o.labelSource = 'diagnostic';
    o.training_label = false;
  }
  const tally = { up: 0, down: 0, unmarked: 0 };
  for (const o of targets) if (o.thumb) tally[o.thumb]++;
  return (
    judgeStatus(model, judged, targets.length, failed, batches, tally) +
    '; absolute notes are diagnostic only (not a training label; use --pair)'
  );
}

if (pairDir && !wantNotes) {
  console.error('RC-J1: --pair requires --notes');
  process.exit(1);
}
const notesStatus = wantNotes ? await addNotes() : 'not requested';

for (const r of rows) {
  for (const f of [...(r.turnCheck?.down ?? []), ...(r.turnCheck?.p0 ?? [])]) {
    if (f.kind === 'broken-line' || f.kind === 'broken-prose') {
      lessons.push({ turn: r.turn, action: r.playerInput, line: f.detail, better: '', why: 'broken' });
    } else if (f.kind === 'sheet-forgotten') {
      lessons.push({ turn: r.turn, action: r.playerInput, line: f.detail, better: 'greet the player as someone already met', why: 'forgot the info sheet' });
    }
  }
}
const p0Turns = out.filter((o) => o.p0?.length);
const p0Count = p0Turns.reduce((n, o) => n + o.p0.length, 0);

const cnt = (k) => out.filter((o) => o.verdict === k).length;
const thumbCnt = (k) => out.filter((o) => o.thumb === k).length;
const progressTurns = out.filter((o) => o.progress.length);
const last = rows[rows.length - 1] ?? {};
const writer = {};
const tokenPath = {};
for (const r of rows) {
  if (r.writerOutcome) writer[r.writerOutcome] = (writer[r.writerOutcome] ?? 0) + 1;
  if (r.tokenPath) tokenPath[r.tokenPath] = (tokenPath[r.tokenPath] ?? 0) + 1;
}
const fallbacks = rows.filter(isFallback).map((r) => r.turn);
const fights = rows.flatMap((r) =>
  receipts(r)
    .filter((x) => /^(Fight|Flee check|Parley check):/.test(x))
    .map((x) => `T${r.turn} ${x.slice(0, 90)}`)
);
const lootLines = rows.flatMap((r) => receipts(r).filter((x) => /^Loot:|^Gold Gained/.test(x)).map((x) => `T${r.turn} ${x.slice(0, 90)}`));
const nudges = rows.flatMap((r) => receipts(r).filter((x) => /^Nudge:/.test(x)).map((x) => `T${r.turn} ${x.slice(7, 90).trim()}`));
const dungeonLines = rows.flatMap((r) =>
  receipts(r)
    .filter((x) => /^Dungeon: (?!.*Ways on)/.test(x) && !/^Dungeon room:/.test(x))
    .map((x) => `T${r.turn} ${x.slice(9, 90).trim()}`)
);
const xpLines = rows.flatMap((r) => receipts(r).filter((x) => /^XP Gained/.test(x)).map((x) => `T${r.turn} ${x.slice(0, 80)}`));
const circling = {
  distinctPlaces: seenLoc.size,
  repeatVisits,
  roomRepeatVisits,
  noProgressTurns: noProgress,
  noProgressPct: rows.length ? Math.round((100 * noProgress) / rows.length) : 0,
  longestSamePlaceRun: (() => {
    let best = 0;
    let run = 0;
    let prev = '';
    for (const o of out) {
      run = o.location === prev ? run + 1 : 1;
      prev = o.location;
      best = Math.max(best, run);
    }
    return best;
  })(),
  mostVisited: [...visitsByLoc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
  pacing,
};
const top = (k) =>
  out
    .filter((o) => o.verdict === k)
    .sort((a, b) => (k === 'down' ? b.down.length - a.down.length : b.up.length - a.up.length))
    .slice(0, 5);

const md = [
  `# Auto-thumbs report — ${path.basename(runDir)}`,
  '',
  `Turns ${rows.length} · bible ${last.bibleId ?? '?'} · seed ${last.seed ?? '?'} · mode ${last.engineMode ?? '?'}`,
  '',
  '## Progress',
  `- Final level ${last.level ?? '?'} (${last.characterXp ?? '?'}/${last.xpToNext ?? '?'} XP); last XP at T${lastXpTurn}.`,
  `- Places seen: ${seenLoc.size}.`,
  `- Fights/checks: ${fights.length ? fights.join('; ') : 'none'}`,
  `- Loot: ${lootLines.length ? lootLines.join('; ') : 'none'}`,
  `- XP events: ${xpLines.length ? xpLines.join('; ') : 'none'}`,
  `- Dungeon events: ${dungeonLines.length ? dungeonLines.join('; ') : 'none'}`,
  `- Engine nudges: ${nudges.length}${nudges.length ? ` (${nudges.join('; ')})` : ''}`,
  `- Progress turns: ${progressTurns.length}${progressTurns.length ? ` (${progressTurns.slice(0, 15).map((o) => `T${o.turn} ${o.progress.join(', ')}`).join('; ')})` : ''}`,
  '',
  '## Thumbs',
  `- Prose thumbs (notes model, rubric): 👍 ${thumbCnt('up')} · 👎 ${thumbCnt('down')} · unmarked ${thumbCnt('unmarked')} · never marked ${out.filter((o) => o.thumb === null).length} · model notes: ${notesStatus}`,
  `- Label source: ${labelSource ?? 'none (local flags only)'}${
    pairAgreement != null
      ? ` · pair agreement ${Math.round(100 * pairAgreement)}% (floor ${Math.round(100 * PAIR_AGREEMENT_FLOOR)}%)${
          trainingOkFromAgreement(pairAgreement) ? ' · training_ok' : ' · below floor (not training_ok)'
        }`
      : labelSource === 'diagnostic'
        ? ' · diagnostic only (not a training label)'
        : ''
  }`,
  `- Turn verdicts (local flags + model): 👍 ${cnt('up')} · 👎 ${cnt('down')} · unclear ${cnt('unclear')} · neutral ${cnt('neutral')}`,
  '',
  `### P0 (turn fails): ${p0Count} on ${p0Turns.length} turn(s)`,
  ...p0Turns.slice(0, 20).map((o) => `- T${o.turn} [${String(o.input ?? '').slice(0, 50)}] ${o.p0.join('; ')}`),
  '',
  `### Writer lessons (stiff / abstract / broken lines): ${lessons.length}`,
  ...lessons.slice(0, 10).map((l) => `- T${l.turn} ${l.why}: "${l.line.slice(0, 90)}"${l.better ? ` → "${l.better.slice(0, 90)}"` : ''}`),
  '',
  '### Top 5 👍',
  ...top('up').map((o) => `- T${o.turn} ${o.up.join('; ')} — "${o.excerpt.slice(0, 110)}"`),
  '',
  '### Top 5 👎',
  ...top('down').map((o) => `- T${o.turn} ${o.down.join('; ')} — "${o.excerpt.slice(0, 110)}"`),
  '',
  '## Circling',
  `- Distinct places ${circling.distinctPlaces}; repeat visits ${circling.repeatVisits} (rooms ${circling.roomRepeatVisits}); no-progress turns ${circling.noProgressTurns} (${circling.noProgressPct}%); longest same-place run ${circling.longestSamePlaceRun}.`,
  `- Most visited: ${circling.mostVisited.map(([l, n]) => `${l} ×${n}`).join(', ') || 'n/a'}`,
  `- Pacing: ${pacing.length ? pacing.map((p) => `T${p.turn} ${p.flag}`).join('; ') : 'none'}`,
  '',
  '## Writer',
  `- Outcomes ${JSON.stringify(writer)}; token path ${JSON.stringify(tokenPath)}; fallback/stitch turns ${fallbacks.length}${fallbacks.length ? ` (${fallbacks.join(', ')})` : ''}.`,
  '',
].join('\n');

function writeThumbsBundle(dir, turns, extra = {}) {
  fs.writeFileSync(
    path.join(dir, 'thumbs.json'),
    JSON.stringify(
      {
        circling: dir === runDir ? circling : undefined,
        p0Count: dir === runDir ? p0Count : undefined,
        lessons: dir === runDir ? lessons.length : undefined,
        labelSource,
        pairAgreement,
        pairAgreementFloor: PAIR_AGREEMENT_FLOOR,
        trainingOk: labelSource === 'paired' ? trainingOkFromAgreement(pairAgreement) : false,
        ...extra,
        turns: turns.map(({ prose, ...o }) => o),
      },
      null,
      1
    )
  );
  fs.writeFileSync(path.join(dir, 'report.md'), dir === runDir ? md : md.replace(path.basename(runDir), path.basename(dir)));
}

writeThumbsBundle(runDir, out);
fs.writeFileSync(path.join(runDir, 'writer-lessons.jsonl'), lessons.map((l) => JSON.stringify(l)).join('\n') + (lessons.length ? '\n' : ''));
if (pairDir && pairOut) {
  writeThumbsBundle(pairDir, pairOut);
  fs.writeFileSync(path.join(pairDir, 'writer-lessons.jsonl'), '');
}
console.log(md);
