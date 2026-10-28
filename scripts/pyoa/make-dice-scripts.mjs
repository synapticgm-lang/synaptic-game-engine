// Derives scripts/pyoa/dice-skeleton2.mjs and gen-dice2.mjs from the book-1 originals (config-driven by slug, 2d6 spec).
import { readFileSync, writeFileSync } from 'node:fs';
const rep = (s, from, to, label) => { if (typeof from === 'string' ? !s.includes(from) : !from.test(s)) throw new Error('missing ' + label); return s.replace(from, () => to); };
// ---------------- skeleton
let k = readFileSync('scripts/pyoa/dice-skeleton.mjs', 'utf8');
k = rep(k, "const OUT = join(ROOT, 'content', 'pyoa', 'dice');", "const SLUGARG = process.argv[2];\nif (!SLUGARG) { console.error('usage: dice-skeleton2.mjs <slug>'); process.exit(2); }\nconst CFG = await import('./books/' + SLUGARG + '.mjs');\nconst OUT = join(ROOT, 'content', 'pyoa', SLUGARG);", 'out');
k = rep(k, 'let seed = 20261028;', 'let seed = Number(process.env.PYOA_SEED) || CFG.SEED;', 'seed');
const a = k.indexOf('const REGIONS = ['), z = k.indexOf('const ENDING_BUDGET = 39;');
k = k.slice(0, a) + "const REGIONS = CFG.REGIONS;\nconst ENDINGS = CFG.ENDINGS.map((e) => [e.key, e.title, e.len]);\n" + k.slice(z);
k = rep(k, 'const id = `td-${region}-${String(idc[region]).padStart(3, \'0\')}`;', 'const id = `${CFG.PFX}-${region}-${String(idc[region]).padStart(3, \'0\')}`;', 'id');
k = rep(k, "for (const [key, head] of endHeads) link(sel, head, `ending:${key}`, { when: { mark: `end-${key}` } });", "for (const [key, head] of endHeads) if (key !== CFG.FALLBACK) link(sel, head, `ending:${key}`, { when: { ['end-' + key]: true } });", 'selector');
k = rep(k, "link(sel, endHeads.find(([k]) => k === 'spent')[1], 'fallback:spent');", "link(sel, endHeads.find(([k]) => k === CFG.FALLBACK)[1], 'fallback:' + CFG.FALLBACK);\n// each ending's flag is set on the exits leaving one reward section of its region (distinct rewards)\nconst usedRw = new Set();\nfor (const E of CFG.ENDINGS) if (E.key !== CFG.FALLBACK) {\n  const cands = nodes.filter((n) => n.kind === 'reward' && n.region === E.region && !usedRw.has(n.id));\n  const rw = cands[ri(0, cands.length - 1)]; usedRw.add(rw.id); rw.earns = E.key;\n  for (const x of rw.exits) x.setFlags = { ...(x.setFlags || {}), ['end-' + E.key]: true };\n}", 'fallback');
k = rep(k, "JSON.stringify({ title: 'The Tide That Did Not Return', dice: '2d6', start: startNode.id, nodes }", "JSON.stringify({ title: CFG.TITLE, dice: '2d6', rules: { system: '2d6', version: 1, stats: CFG.STATS, statSpread: [2, 1, 1, 0], stamina: 10, luck: 3, luckMax: 5, targets: [7, 10] }, start: startNode.id, nodes }", 'write');
writeFileSync('scripts/pyoa/dice-skeleton2.mjs', k);
// ---------------- generator
let g = readFileSync('scripts/pyoa/gen-dice.mjs', 'utf8');
g = rep(g, "import { ask, GeminiStop } from '../../tools/pyoa-gemini/gem.mjs';", "import { ask, GeminiStop, proPassGate, lastModel } from '../../tools/pyoa-gemini/gem.mjs';\nconst SLUGARG = process.argv[2];\nconst CFG = await import('./books/' + SLUGARG + '.mjs');\nconst { WORLD, REGION_NOTE } = CFG;\nconst MARK = join(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..'), 'content', 'pyoa', 'flashlite-sections.json');", 'import');
g = rep(g, "const DIR = join(ROOT, 'content', 'pyoa', 'dice');", "const DIR = join(ROOT, 'content', 'pyoa', SLUGARG);", 'dir');
g = rep(g, 'const args = process.argv.slice(2);', 'const args = process.argv.slice(3);', 'args');
const w0 = g.indexOf('const WORLD = `'), w1 = g.indexOf('async function call');
g = g.slice(0, w0) + g.slice(w1);
g = rep(g, "const reply = await ask(prompt, { fresh: true });", "await proPassGate(log);\n    const reply = await ask(prompt, { fresh: true, model: 'Flash-Lite' });", 'ask');
g = rep(g, /r === 5 \? 'The ending selector section[^\n]*\n/, "r === 5 ? `The ending selector section at the very end of region 5 routes to ${CFG.ENDINGS.length} endings: ${CFG.ENDINGS.map((e) => e.title).join(', ')}.` : '',\n", 'endings line');
g = rep(g, "    if (n.role === 'ending-selector')", "    if (n.earns) { const E = CFG.ENDINGS.find((x) => x.key === n.earns); L.push(`  this reward quietly plants a seed that can matter at the very end (do not name any ending): ${E.hook}`); }\n    if (n.role === 'ending-selector')", 'earns');
g = rep(g, "return `Ending \"${n.endingTitle}\"`;", "return `Ending \"${n.endingTitle}\"`;", 'noop');
// merge: labels from prose, no hint, rules kept
g = rep(g, /else o\.exits = n\.exits\.map\(\(e, i\) => \(\{ \.\.\.e, label: e\.label\.startsWith\('ending:'\)[^\n]*\n/, "else o.exits = n.exits.map((e, i) => ({ ...e, label: p.exits[i] || (e.label.startsWith('ending:') || e.label.startsWith('fallback:') ? 'Let it all come to an end' : e.label) }));\n", 'merge exits');
g = rep(g, "JSON.stringify({ title: skel.title, dice: skel.dice, start: skel.start, nodes }", "JSON.stringify({ title: skel.title, dice: skel.dice, rules: skel.rules, start: skel.start, nodes }", 'merge book');
g = rep(g, "writeFileSync(join(DIR, 'PROGRESS.md'), `# Dice book progress\\n\\n${rep}\\n\\nOutline regions done:", "writeFileSync(join(DIR, 'STATUS.md'), `# ${skel.title} (${SLUGARG}) status\\n\\nUpdated: ${new Date().toISOString()} (UTC)\\nModel: Flash-Lite only (verified on the mode picker before every call)\\nResume: node scripts/pyoa/run-book.mjs dice ${SLUGARG}\\n\\n${rep}\\n\\nOutline regions done:", 'status');
// mark flash-lite sections as they are written
g = rep(g, "    log(`done ${batch[0].id}:", "    markFlash(Object.keys(ordered), batch[0].id);\n    log(`done ${batch[0].id}:", 'markcall');
g = rep(g, "async function runFill()", "function markFlash(ids, batchId) {\n  const j = existsSync(MARK) ? JSON.parse(readFileSync(MARK, 'utf8')) : { books: {} };\n  j.books = j.books || {};\n  const b = j.books[SLUGARG] || { model: 'flash-lite (verified per call on the mode picker)', kind: 'new book, all prose, titles and exit labels', slug: SLUGARG, path: 'content/pyoa/' + SLUGARG, sections: [], batches: [] };\n  const set = new Set(b.sections); ids.forEach((id) => set.add(id)); b.sections = [...set];\n  b.batches.push({ batch: batchId, model: lastModel, at: new Date().toISOString(), n: ids.length });\n  j.books[SLUGARG] = b; j.updated = new Date().toISOString();\n  writeFileSync(MARK, JSON.stringify(j, null, 1));\n}\nasync function runFill()", 'markfn');
g = g.replace('usage: gen-dice.mjs outline|prose|merge [--max N]', 'usage: gen-dice2.mjs <slug> outline|prose|fill|merge [--max N]').replace(/gen-dice\.mjs/g, 'gen-dice2.mjs');
writeFileSync('scripts/pyoa/gen-dice2.mjs', g);
console.log('ok');
