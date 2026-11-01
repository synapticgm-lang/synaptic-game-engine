// Derives scripts/pyoa/pick-skeleton.mjs and gen-pick.mjs from the saltglass originals (config-driven by slug).
import { readFileSync, writeFileSync } from 'node:fs';
const rep = (s, from, to, label) => { const i = typeof from === 'string' ? s.indexOf(from) : s.search(from); if (i < 0) throw new Error('missing ' + label); return typeof from === 'string' ? s.replace(from, () => to) : s.replace(from, () => to); };
// ---- skeleton
let k = readFileSync('scripts/pyoa/salt-skeleton.mjs', 'utf8');
const a = k.indexOf('export const SLUG'), z = k.indexOf('// ---------- rng');
k = k.slice(0, a) + `const SLUGARG = process.argv[2] || process.env.PYOA_BOOK;
if (!SLUGARG) { console.error('usage: pick-skeleton.mjs <slug>'); process.exit(2); }
const CFG = await import('./books/' + SLUGARG + '.mjs');
export const { SLUG, TITLE, FLAGS, GATE_POOL, REGIONS, CHOKES, ENDINGS } = CFG;
const PFX = CFG.PFX; const TARGET = 1000;

` + k.slice(z);
k = rep(k, 'mulberry32(20261028)', 'mulberry32(CFG.SEED)', 'seed');
const p0 = k.indexOf("  add({ id: `${PFX}-p1`"), p1 = k.indexOf('  const flagsSetBefore');
k = k.slice(0, p0) + `  { const P = CFG.PROLOGUE;
    add({ id: \`\${PFX}-p1\`, kind: 'prologue', region: 0, brief: P.p1.brief, exits: [ex(\`\${PFX}-p2a\`, P.p1.exits[0]), ex(\`\${PFX}-p2b\`, P.p1.exits[1])] });
    add({ id: \`\${PFX}-p2a\`, kind: 'prologue', region: 0, brief: P.p2a.brief, exits: [ex(\`\${PFX}-p3\`, P.p2a.exit)] });
    add({ id: \`\${PFX}-p2b\`, kind: 'prologue', region: 0, brief: P.p2b.brief, exits: [ex(\`\${PFX}-p3\`, P.p2b.exit)] });
    add({ id: \`\${PFX}-p3\`, kind: 'prologue', region: 0, brief: P.p3.brief, exits: [ex(\`\${PFX}-1-in\`, P.p3.exit)] }); }

` + k.slice(p1);
k = rep(k, /\['Follow the lamp-lit road'[^\]]*\]\.forEach/, 'CFG.OPENERS.forEach', 'openers');
k = rep(k, /'The final reckoning in the Rain Vault:[^']*'/, 'CFG.FINALE.brief', 'finale brief');
k = rep(k, /const stances = \{[^\n]*\};/, 'const stances = CFG.FINALE.stances;', 'stances');
k = rep(k, 'what changes for the people of the Basin and Candlemere, weeks later.', '${CFG.AFTERMATH}.', 'aftermath');
k = rep(k, /writeFileSync\(`content\/pyoa\/\$\{SLUG\}\/skeleton.json`/, 'writeFileSync(`content/pyoa/${SLUG}/skeleton.json`', 'noop');
writeFileSync('scripts/pyoa/pick-skeleton.mjs', k);
// ---- generator
let g = readFileSync('scripts/pyoa/gen-salt.mjs', 'utf8');
g = rep(g, /import \{ FLAGS, REGIONS \} from '\.\/salt-skeleton\.mjs';/, "const SLUGARG = process.argv[2];\nconst CFG = await import('./books/' + SLUGARG + '.mjs');\nconst { FLAGS, REGIONS, WORLD, SLUG, TITLE, PFX } = CFG;", 'import');
g = rep(g, /const DIR = join\(ROOT, 'content', 'pyoa', 'saltglass'\);/, "const DIR = join(ROOT, 'content', 'pyoa', SLUGARG);", 'dir');
g = rep(g, 'const args = process.argv.slice(2);', 'const args = process.argv.slice(3);', 'args');
const w0 = g.indexOf('const WORLD = `'), w1 = g.indexOf('const KIND_RULE');
g = g.slice(0, w0) + g.slice(w1);
g = g.replace(/j\.books\.saltglass/g, 'j.books[SLUGARG]').replace(/b\.sections\b/g, 'b.sections');
g = rep(g, "const b = j.books[SLUGARG] || { model: 'flash-lite (verified per call on the mode picker)', kind: 'new book, all prose, titles and exit labels', slug: 'saltglass', path: 'content/pyoa/saltglass', sections: [], batches: [] };", "const b = j.books[SLUGARG] || { model: 'flash-lite (verified per call on the mode picker)', kind: 'new book, all prose, titles and exit labels', slug: SLUGARG, path: 'content/pyoa/' + SLUGARG, sections: [], batches: [] };", 'markFlash');
g = rep(g, /const s = `# Saltglass book status[\s\S]*?`;\n/, "const s = `# ${TITLE} (${SLUGARG}) status\\n\\nUpdated: ${new Date().toISOString()} (UTC; London = UTC+0 on this date)\\nLast event: ${reason}\\nSections with prose: ${have}/${skel.nodes.length}\\nOutline parts done: ${outl}/18\\nNext section to write (story order): ${missing[0]?.id || 'none'}\\nModel: Flash-Lite only (verified on the mode picker before every call; Pro is never used)\\nResume: `node scripts/pyoa/gen-pick.mjs ${SLUGARG} outline` then `... prose`, then `... merge` and `node scripts/pyoa/lint-salt.mjs content/pyoa/${SLUGARG}/book.json`.\\n`;\n", 'status');
g = g.replace(/sg-/g, '${PFX}-'); // none expected in code; verified below
g = g.replace("usage: gen-salt.mjs outline|prose|merge [--max N]", "usage: gen-pick.mjs <slug> outline|prose|merge [--max N]");
g = g.replace(/Saltglass book prose/, 'Pick book prose').replace(/gen-salt\.mjs/g, 'gen-pick.mjs');
writeFileSync('scripts/pyoa/gen-pick.mjs', g);
console.log('ok');
