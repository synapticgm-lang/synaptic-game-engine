#!/usr/bin/env node
/**
 * 28j — model-free thumbs review for a fate-autoplay run.
 * Usage: node scripts/fate-autoplay/autoThumbs.mjs <runDir> [--notes] [--out <file>]
 * Reads <runDir>/turns.jsonl, writes <runDir>/thumbs.json and <runDir>/report.md.
 * --notes: sends up to 15 unclear turns (short excerpts) in ONE batch call to a cheap
 * OpenRouter model for a one-line note each. Skipped when no OPENROUTER_API_KEY is found.
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
  const progress = xp > 0 || moved || loot || quest || won;
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
    down,
    up,
    unclear,
    excerpt: t.replace(/\s+/g, ' ').slice(0, 220),
  });
}

async function addNotes() {
  const key = process.env.OPENROUTER_API_KEY || readKeyFromEnvFiles();
  const targets = out.filter((o) => o.verdict === 'unclear').slice(0, 15);
  if (!key) return 'skipped (no OPENROUTER_API_KEY found)';
  if (!targets.length) return 'skipped (no unclear turns)';
  const model = process.env.SGM_THUMBS_MODEL || 'google/gemini-2.5-flash';
  const prompt =
    'You review turns of a text RPG. For each turn give ONE line: "T<n>: up|down — <short reason>". ' +
    'Down if the prose is vague, contradicts the action, or is filler; up if it is concrete and moves the story.\n\n' +
    targets.map((o) => `T${o.turn} [action: ${o.input}] ${o.excerpt}`).join('\n');
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 900, temperature: 0 }),
    });
    if (!res.ok) return `failed (HTTP ${res.status})`;
    const j = await res.json();
    const body = String(j.choices?.[0]?.message?.content ?? '');
    for (const line of body.split(/\r?\n/)) {
      const m = line.match(/T(\d+)\s*:\s*(up|down)\s*[—-]+\s*(.+)$/i);
      if (!m) continue;
      const o = out.find((x) => x.turn === Number(m[1]));
      if (!o) continue;
      o.verdict = m[2].toLowerCase();
      o.note = m[3].trim();
      (o.verdict === 'up' ? o.up : o.down).push(`model note: ${o.note}`);
    }
    return `ok (${model}, ${targets.length} turns)`;
  } catch (e) {
    return `failed (${e.message})`;
  }
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

fs.writeFileSync(path.join(runDir, 'thumbs.json'), JSON.stringify({ circling, turns: out }, null, 1));
fs.writeFileSync(path.join(runDir, 'report.md'), md);
console.log(md);
