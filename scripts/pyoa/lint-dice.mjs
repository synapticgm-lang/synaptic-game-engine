#!/usr/bin/env node
/** Dice-book linter: node scripts/pyoa/lint-dice.mjs [content/pyoa/dice/book.json] */
import { readFileSync } from 'node:fs';
const b = JSON.parse(readFileSync(process.argv[2] || 'content/pyoa/dice/book.json', 'utf8'));
const N = new Map(b.nodes.map((n) => [n.id, n]));
const err = [], warn = [];
const words = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;
const seen = new Set([b.start]); const q = [b.start];
while (q.length) { const n = N.get(q.pop()); for (const e of n.exits || []) if (!seen.has(e.to)) { seen.add(e.to); q.push(e.to); } }
for (const n of b.nodes) {
  if (!seen.has(n.id)) err.push(`unreachable ${n.id}`);
  if (!n.page) { err.push(`no prose ${n.id} (${n.kind})`); continue; }
  const w = words(n.page); if (w < 55 || w > 280) warn.push(`words ${w} ${n.id}`);
  if (!n.ending && !(n.exits || []).length) err.push(`dead end ${n.id}`);
  if (n.kind === 'check') {
    if (!n.check?.label) err.push(`check without label ${n.id}`);
    const miss = n.exits.find((e) => e.result === 'miss'); const t = miss && N.get(miss.to);
    if (!t || t.kind !== 'recovery' || !(t.exits || []).length) err.push(`miss without recovery ${n.id}`);
  } else for (const e of n.exits || []) {
    if (!e.label || /^(branch|go on|onward|move on|return|recover|read on|check-)/.test(e.label)) err.push(`generic exit label ${n.id}->${e.to}`);
    if (e.label && /\btd-\d/.test(e.label)) err.push(`id in label ${n.id}`);
  }
  if (n.kind === 'reward' && !n.grant) warn.push(`reward without grant ${n.id}`);
  if (/\b(dice|rolled?|2d6|d20|target number)\b/i.test(n.page)) warn.push(`meta word in ${n.id}`);
}
const endKeys = new Set(b.nodes.filter((n) => n.ending).map((n) => n.endingKey));
const gates = b.nodes.flatMap((n) => (n.exits || []).filter((e) => e.when).map((e) => e.when.mark));
const setters = b.nodes.filter((n) => n.grants || n.setsMark).length;
if (gates.length && !setters) warn.push(`ENGINE GAP: ${gates.length} ending exits gated on marks (${gates.slice(0, 3).join(', ')}...) but no section sets any mark yet; only 'grant' item names exist`);
const dup = new Map(); for (const n of b.nodes) dup.set(n.title, (dup.get(n.title) || 0) + 1);
const dups = [...dup].filter(([t, c]) => t && c > 2); if (dups.length) warn.push(`repeated titles: ${dups.slice(0, 6).map(([t, c]) => t + 'x' + c).join('; ')}`);
const total = b.nodes.reduce((s, n) => s + words(n.page), 0);
console.log(`dice book: ${b.nodes.length} sections, with prose ${b.nodes.filter((n) => n.page).length}, words ${total}, reachable ${seen.size}, endings ${endKeys.size}, checks ${b.nodes.filter((n) => n.kind === 'check').length}`);
console.log(`ERRORS ${err.length}`); err.slice(0, 40).forEach((e) => console.log('  E ' + e));
console.log(`warnings ${warn.length}`); warn.slice(0, 25).forEach((e) => console.log('  w ' + e));
process.exit(err.length ? 1 : 0);