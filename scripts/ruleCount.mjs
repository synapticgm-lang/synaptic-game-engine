// Rule-count scanner used by tt-consolidate: regex literals, new RegExp, all-string lists (3+), functions, lines.
// TOTAL covers every source file under the scanned roots (tests and .d.ts excluded).
// OLD14 is the original 14-file set, kept so the trend line from before q31-scanner continues.
// Flags: --files prints one line per scanned file.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const roots = ['src/game', 'supabase/functions/_shared/gm'];
const old14 = [
  'src/game/tokenProse.ts',
  'src/game/engineFactPatterns.ts',
  'src/game/engineFactGate.ts',
  'src/game/writerTurn.ts',
  'src/game/turnCheck.ts',
  'src/game/chipLegality.ts',
  'src/game/chipRules.ts',
  'src/game/fullProseGate.ts',
  'src/game/beatCommitGate.ts',
  'src/game/tabletopQuestProgress.ts',
  'scripts/factCheck.mjs',
  'supabase/functions/_shared/gm/completedEventPacket.ts',
  'supabase/functions/_shared/gm/writerInfoLayer.ts',
  'supabase/functions/_shared/gm/outdoorHubs.ts',
];
const SOURCE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const NOT_SOURCE = /(\.d\.ts|\.(test|spec)\.[cm]?[jt]sx?)$/;

function walk(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.posix.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') walk(p, acc);
    } else if (SOURCE.test(e.name) && !NOT_SOURCE.test(e.name)) acc.push(p);
  }
  return acc;
}

const zero = () => ({ files: 0, lines: 0, regex: 0, newRegExp: 0, lists: 0, listEntries: 0, fns: 0 });
const cache = new Map();
function count(f) {
  if (cache.has(f)) return cache.get(f);
  const text = fs.readFileSync(f, 'utf8');
  const kind = /\.(m|c)?jsx?$/.test(f) ? ts.ScriptKind.JS : f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, kind);
  const c = { files: 1, lines: text.split('\n').length, regex: 0, newRegExp: 0, lists: 0, listEntries: 0, fns: 0 };
  const visit = (n) => {
    if (n.kind === ts.SyntaxKind.RegularExpressionLiteral) c.regex++;
    if (ts.isNewExpression(n) && n.expression.getText(sf) === 'RegExp') c.newRegExp++;
    if (ts.isArrayLiteralExpression(n)) {
      const s = n.elements.filter((e) => ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)).length;
      if (s >= 3 && s === n.elements.length) { c.lists++; c.listEntries += s; }
    }
    if (ts.isFunctionDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isMethodDeclaration(n)) c.fns++;
    ts.forEachChild(n, visit);
  };
  visit(sf);
  cache.set(f, c);
  return c;
}
function sum(files) {
  const t = zero();
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const c = count(f);
    for (const k of Object.keys(t)) t[k] += c[k];
  }
  return t;
}
const fmt = (c) => `files ${c.files}\tlines ${c.lines}\tregex ${c.regex}\tnewRegExp ${c.newRegExp}\tlists ${c.lists} (${c.listEntries})\tfns ${c.fns}`;

const perRoot = roots.map((r) => [r, walk(r, []).sort()]);
const all = perRoot.flatMap(([, fs_]) => fs_);
if (process.argv.includes('--files')) for (const f of all) console.log(`${f}\t${fmt(count(f))}`);
for (const [r, fs_] of perRoot) console.log(`${r}\t${fmt(sum(fs_))}`);
console.log(`OLD14\t${fmt(sum(old14))}`);
console.log(`TOTAL\t${fmt(sum(all))}`);
