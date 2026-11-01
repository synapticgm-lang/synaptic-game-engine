#!/usr/bin/env node
// Patch-level alignment of dice book 1 to content/pyoa/DICE-RULES.md (idempotent). Prose is not rewritten.
import { readFileSync, writeFileSync } from 'node:fs';
const P = 'content/pyoa/dice/book.json';
const b = JSON.parse(readFileSync(P, 'utf8'));
const N = new Map(b.nodes.map((n) => [n.id, n]));
const out = { title: b.title, dice: '2d6', rules: { system: '2d6', version: 1, stats: ['MIGHT', 'WIT', 'NERVE', 'CRAFT'], statSpread: [2, 1, 1, 0], stamina: 10, luck: 3, luckMax: 5, targets: [7, 10] }, start: b.start };
let changes = { targets: 0, labels: 0, flags: 0 };
for (const n of b.nodes) if (n.kind === 'check') {
  const t = Math.max(7, Math.min(10, n.check.target)); if (t !== n.check.target) { n.check.target = t; changes.targets++; }
  for (const e of n.exits) { e.stat = n.check.stat; e.target = t; }
}
// ending flags
const sel = b.nodes.find((n) => n.role === 'ending-selector');
const theme = { 'return-gently': ['gentle', 'oath', 'tidewarden', 'balance'], 'drown-saltspire': ['saltspire', 'brineholder', 'water', 'flood'], 'drown-gullmouth': ['gullmouth', 'harbour', 'cliff', 'home'], 'keep-the-gear': ['gear', 'brass', 'mechanism', 'tidewarden'], 'sell-the-sea': ['coin', 'brineholder', 'bargain', 'bid'], 'choirs-choir': ['choir', 'drowned', 'hollow', 'song'], 'long-dry': ['dry', 'break', 'dust', 'salt'], 'orsolyas-way': ['orsolya', 'keeper', 'lamp', 'note'], 'wreckers-tide': ['guild', 'wrecker', 'crew', 'rival'], 'pilgrim-king': ['pilgrim', 'god', 'crown', 'shrine'], 'quiet-sand': ['sand', 'quiet', 'dune', 'silence'] };
const regionFor = { 'return-gently': 4, 'drown-saltspire': 3, 'drown-gullmouth': 1, 'keep-the-gear': 4, 'sell-the-sea': 3, 'choirs-choir': 4, 'long-dry': 2, 'orsolyas-way': 4, 'wreckers-tide': 1, 'pilgrim-king': 2, 'quiet-sand': 2 };
const used = new Set();
for (const e of sel.exits) {
  const m = (e.label || '').match(/^ending:(.+)$/) || (e.when?.mark || '').match(/^end-(.+)$/);
  const key = m ? m[1] : null;
  if (!key) continue; // fallback exit
  const flag = 'end-' + key;
  if (e.hint) { e.label = e.hint; delete e.hint; changes.labels++; }
  e.when = { [flag]: true };
  if (!theme[key]) continue;
  if (b.nodes.some((n) => (n.exits || []).some((x) => x.setFlags && x.setFlags[flag]))) continue;
  const cands = b.nodes.filter((n) => n.kind === 'reward' && n.region === regionFor[key] && !used.has(n.id));
  const score = (n) => theme[key].reduce((s, w) => s + ((`${n.page} ${n.brief} ${n.grant} ${n.title}`.toLowerCase().match(new RegExp(w, 'g')) || []).length), 0);
  cands.sort((a, c) => score(c) - score(a));
  const r = cands[0]; used.add(r.id);
  for (const x of r.exits) x.setFlags = { ...(x.setFlags || {}), [flag]: true };
  changes.flags++;
}
sel.exits = sel.exits.filter((e) => !(e.when && e.when['end-spent']));
// Spent is the ungated fallback; non-reward grants are noise
for (const n of b.nodes) if (n.grant && n.kind !== 'reward') { delete n.grant; changes.grants = (changes.grants || 0) + 1; }
out.nodes = b.nodes;
writeFileSync(P, JSON.stringify(out, null, 1));
console.log('aligned', JSON.stringify(changes), 'ending flags', [...used].join(','));
