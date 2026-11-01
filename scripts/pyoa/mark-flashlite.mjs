// Builds content/pyoa/flashlite-sections.json: every passage drafted through Gemini in the laptop Chrome.
// node scripts/pyoa/mark-flashlite.mjs   (idempotent; rebuilds the 'earlier' groups, keeps new-book entries)
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
const OUT = 'content/pyoa/flashlite-sections.json';
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const out = {
  note: 'Passages drafted by Gemini web in John\'s laptop Chrome. model "unverified" = drafted before the model was logged per call (the Gemini tab showed Pro early on, Flash-Lite after Pro hit its limit); the Pro pass should treat these as possibly Flash-Lite and read them first. model "flash-lite" = verified on the mode picker before the call.',
  updated: new Date().toISOString(),
  books: prev.books || {},
};
const umbra = { model: 'unverified', kind: 'umbra payoff inserts and detour pages', variants: [], detourPages: [] };
for (const f of readdirSync('content/pyoa/umbra/overlay')) {
  const j = JSON.parse(readFileSync('content/pyoa/umbra/overlay/' + f, 'utf8'));
  for (const v of j.variants || []) umbra.variants.push({ file: f, node: v.node, when: v.when });
  for (const n of j.newNodes || []) umbra.detourPages.push({ file: f, id: n.id });
}
out.books['umbra'] = umbra;
const dice = JSON.parse(readFileSync('content/pyoa/dice/book.json', 'utf8'));
out.books['dice-tide'] = { model: 'unverified', kind: 'all section prose, titles, exit labels, outlines', sections: dice.nodes.map((n) => n.id) };
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('umbra variants', umbra.variants.length, 'detours', umbra.detourPages.length, 'dice sections', dice.nodes.length);