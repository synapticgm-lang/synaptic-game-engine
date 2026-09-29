#!/usr/bin/env node
/**
 * 28j — model-free thumbs review for a fate-autoplay run.
 * Usage: node scripts/fate-autoplay/autoThumbs.mjs <runDir> [--notes] [--out <file>]
 * Reads <runDir>/turns.jsonl, writes <runDir>/thumbs.json and <runDir>/report.md.
 * 29z2 — each row's turnCheck (who is here, the chips, the last action) adds P0 fails and thumbs-down.
 * --notes: a judge model reads every turn (batches of 20) for stiff / abstract / broken lines and for
 * prose that ignores the player's action. Stiff lines come back with a plainer rewrite and are
 * written to <runDir>/writer-lessons.jsonl. Skipped when no OPENROUTER_API_KEY is found.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const runDir = args.find((a) => !a.startsWith('--'));
if (!runDir) {
  console.error('usage: autoThumbs.mjs <runDir> [--notes]');
  process.exit(1);
}
const wantNotes = args.includes('--notes');
const file = path.join(runDir, 'turns.jsonl');
const rows = fs
  .readFileSync(file, 'utf8')
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
const out = [];

for (const r of rows) {
  const t = text(r);
  const rec = receipts(r);
  const recJoin = rec.join(' | ');
  const loc = String(r.location ?? r.snapshotGist?.location ?? '');
  const down = [];
  const up = [];
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

  if (won) up.push('fight won');
  if (levelUp) up.push(`level up to L${r.level}`);
  if (newPlace && r.turn > 1) up.push(`new place: ${loc}`);
  if (loot) up.push('loot');
  if (quest) up.push('quest step');
  if (xp > 0 && !won) up.push(`+${xp} XP`);

  const p0 = (r.turnCheck?.p0 ?? []).map((f) => `P0 ${f.kind}: ${f.detail}`);
  down.push(...p0);
  for (const f of r.turnCheck?.down ?? []) down.push(`${f.kind}: ${f.detail}`);
  if (isFallback(r)) down.push('fallback / stitch');
  for (const [re, why] of JUNK) if (re.test(t)) down.push(why);
  const sents = sentences(t);
  const rep = sents.find((s) => recentSent.some((p) => p === s));
  if (rep) down.push(`repeated line: "${rep.slice(0, 60)}"`);
  recentSent.push(...sents);
  while (recentSent.length > 60) recentSent.shift();
  if (sameLocRun >= 5 && !progress && sameLocRun % 5 === 0) down.push(`same place ${sameLocRun} turns, no progress`);
  const stall = r.turn - lastXpTurn;
  if (stall >= 15 && stall % 15 === 0) down.push(`XP stall ${stall} turns`);
  if (won && /\b(attack|strike|swing|lunge)\w*\b[^.]{0,60}\b(corpse|body|remains)\b/i.test(t))
    down.push('prose continues a fight the engine already won');
  if (won && /\b(?:fight|battle) (?:rages|continues|goes on)\b/i.test(t)) down.push('prose continues a finished fight');
  if (lost && /\byou (?:win|won|defeat(?:ed)?)\b/i.test(t)) down.push('prose contradicts a defeat');
  if (/Flee check:.*success/i.test(recJoin) && /\b(?:cornered|trapped|cannot escape)\b/i.test(t))
    down.push('prose contradicts a successful flee');

  if (!down.length && !up.length) {
    if (r.writerOutcome === 'retry') unclear.push('writer retry');
    if (t.length < 140) unclear.push('short beat');
    if (t && !/[.!?"”']\s*$/.test(t)) unclear.push('cut off');
    if (/\b(?:saw|see)\.\s*$/.test(t)) unclear.push('ends on an empty verb');
  }
  const verdict = down.length ? 'down' : up.length ? 'up' : unclear.length ? 'unclear' : 'neutral';
  out.push({
    turn: r.turn,
    input: r.playerInput,
    location: loc,
    verdict,
    ...(p0.length ? { p0 } : {}),
    down,
    up,
    unclear,
    excerpt: t.replace(/\s+/g, ' ').slice(0, 220),
    prose: t,
    present: r.turnCheck?.presentNames ?? [],
    chips: r.offeredChoices ?? [],
    // 28l — raw writer issues (empty / reasoning-only / cut-off / recycled / unresolved) for training.
    ...(r.writerIssues?.length ? { writerIssues: r.writerIssues } : {}),
    // 28w — token use of the turn, next to the issues (same row as the live feedback record).
    ...(r.writerUsage ? { writerUsage: r.writerUsage } : {}),
  });
}

const lessons = [];

const JUDGE_RUBRIC = [
  'You judge turns of a text RPG. The player directs the main character; the prose must do THAT action.',
  'For each turn you get the player action, who is here, the chips that were offered, and the prose.',
  'Return ONLY a JSON array, one object per turn:',
  '{"turn":<n>,"verdict":"up"|"down","followed":true|false,"why":"<short reason>","stiff":[{"line":"<exact words from the prose>","better":"<how a person telling the story would say it>","why":"stiff"|"abstract"|"broken"}]}',
  'followed=false when the prose ignores the action, answers a different action, or restates the arrival instead of acting.',
  'stiff: lines a storyteller would never say aloud: abstract, report-like, over-formal, or broken grammar.',
  'Example: "The horizon is empty of people." is stiff; better: "Not a soul in sight."',
  'Quote at most 3 stiff lines per turn, exact words only. Empty array when the prose sounds natural.',
  'verdict=down when followed is false or a stiff line is found; up when the prose is concrete, natural and moves the story.',
].join('\n');

function parseJudge(body) {
  const start = body.indexOf('[');
  const end = body.lastIndexOf(']');
  if (start < 0 || end <= start) return [];
  try {
    const arr = JSON.parse(body.slice(start, end + 1));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function addNotes() {
  const key = process.env.OPENROUTER_API_KEY || readKeyFromEnvFiles();
  if (!key) return 'skipped (no OPENROUTER_API_KEY found)';
  const targets = out.filter((o) => o.prose && o.prose.trim().length > 0).slice(0, 300);
  if (!targets.length) return 'skipped (no prose turns)';
  const model = process.env.SGM_THUMBS_MODEL || 'google/gemini-2.5-pro';
  let judged = 0;
  let failed = 0;
  for (let i = 0; i < targets.length; i += 20) {
    const batch = targets.slice(i, i + 20);
    const prompt =
      JUDGE_RUBRIC +
      '\n\n' +
      batch
        .map(
          (o) =>
            `T${o.turn}\nACTION: ${o.input}\nHERE: ${o.present.join(', ') || 'nobody named'}\nCHIPS: ${o.chips.join(' | ') || 'none'}\nPROSE: ${o.prose.replace(/\s+/g, ' ').slice(0, 1400)}`
        )
        .join('\n\n');
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 6000, temperature: 0 }),
      });
      if (!res.ok) {
        failed++;
        continue;
      }
      const j = await res.json();
      for (const v of parseJudge(String(j.choices?.[0]?.message?.content ?? ''))) {
        const o = batch.find((x) => x.turn === Number(v?.turn));
        if (!o) continue;
        judged++;
        o.note = String(v.why ?? '').trim();
        if (v.followed === false) {
          const flag = `P0 ignored-action (judge): ${o.note || 'prose does not do the player action'}`;
          o.p0 = [...(o.p0 ?? []), flag];
          o.down.push(flag);
        }
        for (const s of Array.isArray(v.stiff) ? v.stiff.slice(0, 3) : []) {
          const line = String(s?.line ?? '').trim();
          if (!line || !o.prose.includes(line)) continue;
          const better = String(s?.better ?? '').trim();
          // 29z3 — stiff / abstract / broken language fails the turn, not only a thumbs-down.
          const flag = `P0 stiff-line (judge, ${s?.why || 'stiff'}): "${line.slice(0, 90)}"${better ? ` → "${better.slice(0, 90)}"` : ''}`;
          o.p0 = [...(o.p0 ?? []), flag];
          o.down.push(flag);
          lessons.push({ turn: o.turn, action: o.input, line, better, why: s?.why || 'stiff' });
        }
        if (v.verdict === 'up' && !o.down.length) o.up.push(`judge: ${o.note}`);
        else if (v.verdict === 'down' && o.note && !o.down.some((d) => d.includes(o.note))) o.down.push(`judge: ${o.note}`);
        o.verdict = o.down.length ? 'down' : o.up.length ? 'up' : o.verdict;
      }
    } catch {
      failed++;
    }
  }
  return `ok (${model}, ${judged}/${targets.length} turns judged${failed ? `, ${failed} batch(es) failed` : ''})`;
}

function readKeyFromEnvFiles() {
  for (const f of ['.env.local', '.env', 'scripts/.env']) {
    try {
      const m = fs.readFileSync(f, 'utf8').match(/^\s*OPENROUTER_API_KEY\s*=\s*"?([^"\r\n]+)"?/m);
      if (m) return m[1].trim();
    } catch {
      /* none */
    }
  }
  return '';
}

const notesStatus = wantNotes ? await addNotes() : 'not requested';

for (const r of rows) {
  for (const f of [...(r.turnCheck?.down ?? []), ...(r.turnCheck?.p0 ?? [])]) {
    if (f.kind === 'broken-line' || f.kind === 'broken-prose') {
      lessons.push({ turn: r.turn, action: r.playerInput, line: f.detail, better: '', why: 'broken' });
    }
  }
}
const p0Turns = out.filter((o) => o.p0?.length);
const p0Count = p0Turns.reduce((n, o) => n + o.p0.length, 0);

const cnt = (k) => out.filter((o) => o.verdict === k).length;
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
  '',
  '## Thumbs',
  `- 👍 ${cnt('up')} · 👎 ${cnt('down')} · unclear ${cnt('unclear')} · neutral ${cnt('neutral')} · model notes: ${notesStatus}`,
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
  '',
  '## Writer',
  `- Outcomes ${JSON.stringify(writer)}; token path ${JSON.stringify(tokenPath)}; fallback/stitch turns ${fallbacks.length}${fallbacks.length ? ` (${fallbacks.join(', ')})` : ''}.`,
  '',
].join('\n');

fs.writeFileSync(
  path.join(runDir, 'thumbs.json'),
  JSON.stringify({ circling, p0Count, lessons: lessons.length, turns: out.map(({ prose, ...o }) => o) }, null, 1)
);
fs.writeFileSync(path.join(runDir, 'writer-lessons.jsonl'), lessons.map((l) => JSON.stringify(l)).join('\n') + (lessons.length ? '\n' : ''));
fs.writeFileSync(path.join(runDir, 'report.md'), md);
console.log(md);
