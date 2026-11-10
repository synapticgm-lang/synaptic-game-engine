/**
 * Option audit for any fate-autoplay run folder.
 *
 *   npm run option-audit -- <run dir> [--prose]
 *
 * Counts declared options (not the free-input Say/Do chips). Tabletop should offer 3.
 * LitRPG and story RPG should offer 4.
 *
 * Without --prose, grounding is judged from the engine facts the prose would be built
 * from (systemLog, the GM location line, the previous turn's facts). A dry-run GM line
 * is a stub, so this mode does not require the option's words to appear in that stub.
 * With --prose, each option must share a content word with a sentence of the previous
 * turn's GM prose, and that sentence is cited.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const FREE = /^(?:say something|do something else)\b/i;
const PLACE_ID = /place_[a-z0-9-]+|\b[a-z]+-hub-[a-z0-9-]+\b/i;
const EXPLORE = /^(?:look around|wait and listen|search the area|wait)$/i;
const ORIGIN = /^(?:origin:|quick start$)/i;
const STOP = new Set(['with', 'from', 'that', 'this', 'your', 'into', 'around', 'ahead', 'toward', 'something', 'their', 'them', 'about']);

function words(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
}

function sentences(text) {
  return String(text ?? '')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function loadTurns(dir) {
  const path = join(dir, 'turns.jsonl');
  if (!existsSync(path)) throw new Error(`No turns.jsonl in ${dir}`);
  return readFileSync(path, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function factsOf(turn) {
  return [...(turn?.systemLog ?? []), turn?.gmText ?? ''].join(' ');
}

function dying(turn) {
  const facts = factsOf(turn);
  return /unconscious|death save|making death saves|0 HP/i.test(facts);
}

function groundedInFacts(label, turn, prev) {
  const raw = String(label);
  const facts = `${factsOf(turn)} ${factsOf(prev)}`;
  const factWords = new Set(words(facts));
  if (ORIGIN.test(raw) && (turn.turn ?? 0) <= 1) return true;
  if (EXPLORE.test(raw)) return !dying(turn) && / at /i.test(turn.gmText ?? '');
  if (/^face the threat$/i.test(raw)) return /threat|foe|fight|encounter|creature|bandit|beast|attack/i.test(facts);
  if (/^(?:walk on|skip ahead|travel toward|head toward|leave the scene|turn back)\b/i.test(raw)) {
    return /road|travel|journey|still ahead|walk|leave|toward|between/i.test(facts) || words(raw).some((w) => factWords.has(w));
  }
  if (/fight for breath|stabilise|drink the /i.test(raw)) return dying(turn) || /death save|0 HP|unconscious/i.test(facts);
  return words(raw).some((w) => factWords.has(w));
}

function auditTurn(turn, prev, proseMode) {
  const mode = turn.engineMode ?? turn.mode ?? 'litrpg';
  const expected = mode === 'dnd' ? 3 : 4;
  const offered = turn.offeredChoices ?? [];
  const declared = offered.filter((c) => !FREE.test(String(c ?? '')));
  const priorSentences = sentences(prev?.gmText ?? '');
  const seen = new Set();
  const sessionZero = declared.length > 0 && declared.every((c) => ORIGIN.test(String(c)));
  const options = declared.map((label) => {
    const raw = String(label);
    const low = raw.toLowerCase();
    const deadLabels = new Set();
    for (const flag of [...(turn.turnCheck?.p0 ?? []), ...(turn.turnCheck?.down ?? [])]) {
      const quoted = String(flag.detail ?? '').match(/"([^"]+)" has no resolver/i);
      if (quoted) deadLabels.add(quoted[1].toLowerCase());
    }
    const duplicate = seen.has(low);
    seen.add(low);
    const dead = PLACE_ID.test(raw) || deadLabels.has(low) || (/^fight the writhing roots$/i.test(raw) && !/root/i.test(factsOf(turn)));
    const legal = !dead && !duplicate;
    let grounded = groundedInFacts(raw, turn, prev);
    let cited = '';
    let stale = false;
    if (proseMode) {
      const optWords = words(raw);
      const hit = priorSentences.find((s) => optWords.some((w) => words(s).includes(w)));
      grounded = !!hit || (ORIGIN.test(raw) && (turn.turn ?? 0) <= 1);
      cited = hit ?? '';
    } else if (prev && (prev.gmText ?? '') !== (turn.gmText ?? '')) {
      const prevFacts = factsOf(prev);
      const here = factsOf(turn);
      const carried = words(raw).filter((w) => words(prevFacts).includes(w) && !words(here).includes(w));
      const locationMoved = !String(turn.gmText ?? '').includes(String((prev.gmText ?? '').match(/ at ([^,]+),/)?.[1] ?? '___'));
      if (carried.length && locationMoved && !EXPLORE.test(raw) && !/^face the threat$/i.test(raw)) stale = true;
    }
    if (stale) grounded = false;
    return { label: raw, legal, grounded, stale, cited };
  });
  return {
    turn: turn.turn,
    mode,
    expected,
    count: declared.length,
    countOk: declared.length === expected,
    sessionZero,
    options,
  };
}

function pct(n, d) {
  if (!d) return 0;
  return Math.round((1000 * n) / d) / 10;
}

function main() {
  const args = process.argv.slice(2).filter((a) => a !== '--');
  const prose = args.includes('--prose');
  const dir = args.find((a) => a !== '--prose');
  if (!dir) {
    console.error('Usage: npm run option-audit -- <run dir> [--prose]');
    process.exit(2);
  }
  const turns = loadTurns(dir);
  const rows = turns.map((t, i) => auditTurn(t, turns[i - 1], prose));
  const options = rows.flatMap((r) => r.options);
  const grounded = options.filter((o) => o.grounded).length;
  const legal = options.filter((o) => o.legal).length;
  const countViolations = rows.filter((r) => !r.countOk);
  const worst = [...rows]
    .map((r) => ({
      ...r,
      bad: r.options.filter((o) => !o.legal || !o.grounded).length + (r.countOk ? 0 : 2),
    }))
    .sort((a, b) => b.bad - a.bad)
    .slice(0, 8);
  const summary = {
    dir,
    grounding: prose
      ? 'prior GM sentence (--prose)'
      : 'engine facts (systemLog and scene line). Dry-run GM prose is a stub and is not the ground.',
    turns: rows.length,
    declaredOptions: options.length,
    groundedPct: pct(grounded, options.length),
    legalPct: pct(legal, options.length),
    countViolations: countViolations.length,
    countViolationTurns: countViolations.map((r) => ({
      turn: r.turn,
      count: r.count,
      expected: r.expected,
      ...(r.sessionZero ? { reason: 'session-zero origin pad' } : {}),
      options: r.options.map((o) => o.label),
    })),
    worst: worst.map((r) => ({
      turn: r.turn,
      count: r.count,
      expected: r.expected,
      options: r.options.filter((o) => !o.legal || !o.grounded || !r.countOk).map((o) => ({
        label: o.label,
        legal: o.legal,
        grounded: o.grounded,
        ...(o.stale ? { stale: true } : {}),
        ...(o.cited ? { cited: o.cited } : {}),
      })),
    })),
  };
  console.log(JSON.stringify(summary, null, 2));
}

main();
