#!/usr/bin/env node
/** Dice-book linter (2d6 spec, content/pyoa/DICE-RULES.md): node scripts/pyoa/lint-dice.mjs [content/pyoa/<slug>/book.json] */
import { readFileSync } from 'node:fs';
import { pyoaCondReads } from '../../src/game/pyoaCond.ts';
const b = JSON.parse(readFileSync(process.argv[2] || 'content/pyoa/dice/book.json', 'utf8'));
const N = new Map(b.nodes.map((n) => [n.id, n]));
const err = [], warn = [];
const words = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;
// metadata
const R = b.rules;
if (b.dice !== '2d6') err.push('book.dice must be "2d6"');
if (!R || R.system !== '2d6' || !Array.isArray(R.stats) || R.stats.length !== 4 || R.stamina !== 10 || R.luck !== 3) err.push('rules block missing or wrong');
const stats = new Set(R?.stats || []);
// graph
const seen = new Set([b.start]); const q = [b.start];
while (q.length) { const n = N.get(q.pop()); for (const e of n.exits || []) { if (!N.has(e.to)) { err.push(`exit to missing ${e.to} from ${n.id}`); continue; } if (!seen.has(e.to)) { seen.add(e.to); q.push(e.to); } } }
let setF = new Set(), readF = new Set();
for (const n of b.nodes) for (const e of n.exits || []) { for (const f of Object.keys(e.setFlags || {})) setF.add(f); for (const [f] of pyoaCondReads(e.when)) readF.add(f); }
for (const n of b.nodes) {
  if (!seen.has(n.id)) err.push(`unreachable ${n.id}`);
  if (!n.page) { err.push(`no prose ${n.id} (${n.kind})`); continue; }
  const w = words(n.page); if (w < 55 || w > 280) warn.push(`words ${w} ${n.id}`);
  if (!n.ending && !(n.exits || []).length) err.push(`dead end ${n.id}`);
  const checks = (n.exits || []).filter((e) => e.result);
  if (n.kind === 'check') {
    if (!n.check?.label || n.check.label.length < 6) err.push(`check without label ${n.id}`);
    if (!stats.has(n.check?.stat)) err.push(`check stat not in rules ${n.id}`);
    if (!(n.check?.target >= 7 && n.check.target <= 10)) err.push(`target out of 7-10 ${n.id}`);
    const rs = n.exits.map((e) => e.result).join('/');
    if (rs !== 'full/mixed/miss') err.push(`check exits ${rs} ${n.id}`);
    for (const e of n.exits) if (e.stat !== n.check.stat || e.target !== n.check.target) err.push(`exit stat/target differ ${n.id}`);
    const mixed = n.exits.find((e) => e.result === 'mixed'); if (mixed && !mixed.cost) err.push(`mixed without cost ${n.id}`);
    const miss = n.exits.find((e) => e.result === 'miss'); const t = miss && N.get(miss.to);
    if (!t || t.kind !== 'recovery' || !(t.exits || []).length) err.push(`miss without recovery ${n.id}`);
    if (t && t.exits.some((e) => !e.cost)) err.push(`recovery exit without cost ${t.id}`);
    for (const e of n.exits) if (e.result !== 'miss' && N.get(e.to)?.kind === 'check' && N.get(N.get(e.to).exits[0].to)?.kind === 'check') warn.push(`three checks in a row near ${n.id}`);
  } else {
    if (checks.length) err.push(`result on non-check ${n.id}`);
    for (const e of n.exits || []) {
      if (n.kind === 'recovery') continue;
      if (!e.label || /^(branch|go on|onward|move on|return|recover|read on|check-|ending:|fallback:)/.test(e.label)) err.push(`generic exit label ${n.id}->${e.to}`);
      if (e.label && /\btd-\d|\b[a-z]{2,4}-\d+-/.test(e.label)) err.push(`id in label ${n.id}`);
    }
  }
  if (n.kind === 'reward' && !n.grant) warn.push(`reward without grant ${n.id}`);
  if (n.kind !== 'reward' && n.kind !== 'check' && n.grant) warn.push(`grant on ${n.kind} ${n.id}`);
  if (/\b(dice|2d6|d20|target number|stamina|luck roll)\b/i.test(n.page)) warn.push(`meta word in ${n.id}`);
}
// ending selector and flags
const sel = b.nodes.filter((n) => n.role === 'ending-selector');
if (sel.length !== 1) err.push(`ending selectors ${sel.length}`);
else {
  const gated = sel[0].exits.filter((e) => e.when), free = sel[0].exits.filter((e) => !e.when);
  if (free.length < 1) err.push('selector has no ungated fallback');
  for (const e of gated) { const fl = [...pyoaCondReads(e.when)].map((x) => x[0]); for (const f of fl) if (!setF.has(f)) err.push(`ending flag ${f} never set`); if (!e.label || /^ending:/.test(e.label)) err.push(`selector label ${e.to}`); }
}
for (const f of setF) if (!readF.has(f)) err.push(`flag ${f} set but never read`);
for (const f of readF) if (!setF.has(f)) err.push(`flag ${f} read but never set`);
const endKeys = new Set(b.nodes.filter((n) => n.ending).map((n) => n.endingKey));
const dup = new Map(); for (const n of b.nodes) dup.set(n.title, (dup.get(n.title) || 0) + 1);
const dups = [...dup].filter(([t, c]) => t && c > 3); if (dups.length) warn.push(`repeated titles: ${dups.slice(0, 6).map(([t, c]) => t + 'x' + c).join('; ')}`);
const total = b.nodes.reduce((s, n) => s + words(n.page), 0);
console.log(`dice book: ${b.nodes.length} sections, with prose ${b.nodes.filter((n) => n.page).length}, words ${total}, reachable ${seen.size}, endings ${endKeys.size}, checks ${b.nodes.filter((n) => n.kind === 'check').length}, flags set ${setF.size}`);
console.log(`ERRORS ${err.length}`); err.slice(0, 40).forEach((e) => console.log('  E ' + e));
console.log(`warnings ${warn.length}`); warn.slice(0, 25).forEach((e) => console.log('  w ' + e));
process.exit(err.length ? 1 : 0);
