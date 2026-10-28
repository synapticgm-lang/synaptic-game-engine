#!/usr/bin/env node
/** Lint for the Saltglass book (skeleton.json or book.json): node x flag-state reachability, dead ends, flag set/read, exit counts, text checks.
 *   node scripts/pyoa/lint-salt.mjs [path]   exit 1 on errors */
import { readFileSync } from 'node:fs';
import { pyoaCondHolds, pyoaCondReads } from '../../src/game/pyoaCond.ts';
const path = process.argv[2] || 'content/pyoa/saltglass/book.json';
const book = JSON.parse(readFileSync(path, 'utf8'));
const N = new Map(book.nodes.map((n) => [n.id, n]));
const errs = [], warns = [];
const isEnd = (n) => !!n.endingId;
for (const n of book.nodes) {
  if (n.exits.length > 4) errs.push(`${n.id}: ${n.exits.length} exits`);
  if (!n.exits.length && !isEnd(n)) errs.push(`${n.id}: no exits and not an ending`);
  for (const e of n.exits) if (!N.has(e.to)) errs.push(`${n.id}: exit to missing ${e.to}`);
}
const setFlags = new Map(), readFlags = new Map();
for (const n of book.nodes) for (const e of n.exits) {
  for (const [f, v] of Object.entries(e.setFlags || {})) { if (!setFlags.has(f)) setFlags.set(f, new Set()); setFlags.get(f).add(v); }
  for (const [f, v] of pyoaCondReads(e.when)) { if (!readFlags.has(f)) readFlags.set(f, new Set()); readFlags.get(f).add(v); }
}
for (const f of setFlags.keys()) if (!readFlags.has(f)) errs.push(`flag ${f} set but never read`);
for (const f of readFlags.keys()) if (!setFlags.has(f)) errs.push(`flag ${f} read but never set`);
for (const [f, vs] of setFlags) for (const v of vs) { const r = readFlags.get(f); if (r && ![...r].some((x) => x === v || x === true || x === '_') && !(r.size)) warns.push(`value ${f}=${v} set but no read matches`); }
// reachability over node x flags
const key = (id, fl) => id + '|' + Object.keys(fl).sort().map((k) => k + '=' + fl[k]).join(',');
const seen = new Set(); const reached = new Set(); const q = [[book.start, {}]]; seen.add(key(book.start, {}));
const deadStates = []; const CAP = 4_000_000; let states = 0;
while (q.length) {
  const [id, fl] = q.pop(); states++; if (states > CAP) { errs.push('state cap hit'); break; }
  reached.add(id); const n = N.get(id);
  if (isEnd(n)) continue;
  let open = 0;
  for (const e of n.exits) {
    if (e.when && !pyoaCondHolds(e.when, fl)) continue;
    open++;
    const nf = e.setFlags ? { ...fl, ...e.setFlags } : fl; const k = key(e.to, nf);
    if (!seen.has(k)) { seen.add(k); q.push([e.to, nf]); }
  }
  if (!open) deadStates.push(`${id} {${Object.entries(fl).map(([a, b]) => a + '=' + b).join(',')}}`);
}
for (const n of book.nodes) if (!reached.has(n.id)) errs.push(`${n.id}: unreachable (${n.kind})`);
for (const d of deadStates.slice(0, 10)) errs.push('dead end in state: ' + d);
if (deadStates.length > 10) errs.push(`... ${deadStates.length} dead-end states in total`);
const ends = book.nodes.filter(isEnd), endsReached = ends.filter((n) => reached.has(n.id));
// text checks (only for nodes with prose)
let withProse = 0;
for (const n of book.nodes) {
  if (!n.page) continue; withProse++;
  const w = n.page.trim().split(/\s+/).length;
  if (w < 50 || w > 300) warns.push(`${n.id}: ${w} words`);
  if (/@@|\bsection\b|\bpage \d+|as an ai|dice|roll(ed)? a/i.test(n.page)) warns.push(`${n.id}: meta wording`);
  for (const e of n.exits) if (!e.label || e.label.length < 4) warns.push(`${n.id}: weak label on ${e.to}`);
}
const titles = new Map(); for (const n of book.nodes) if (n.title) titles.set(n.title, (titles.get(n.title) || 0) + 1);
const dupT = [...titles].filter(([, c]) => c > 3); for (const [t, c] of dupT.slice(0, 8)) warns.push(`title "${t}" x${c}`);
console.log(`sections ${book.nodes.length}, with prose ${withProse}, states ${states}, endings ${endsReached.length}/${ends.length} reachable`);
console.log(`flags set: ${[...setFlags].map(([f, v]) => f + '=' + [...v]).join('; ')}`);
console.log(`flags read: ${[...readFlags].map(([f, v]) => f + '=' + [...v].map(String)).join('; ')}`);
console.log(`ERRORS ${errs.length}`); errs.slice(0, 30).forEach((e) => console.log('  E ' + e));
console.log(`WARNINGS ${warns.length}`); warns.slice(0, 15).forEach((e) => console.log('  W ' + e));
process.exit(errs.length ? 1 : 0);