// Rule-count scanner used by tt-consolidate: regex literals, new RegExp, all-string lists (3+), functions, lines.
import ts from 'typescript';
import fs from 'node:fs';

const files = [
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
const out = [];
const tot = { lines: 0, regex: 0, newRegExp: 0, lists: 0, listEntries: 0, fns: 0 };
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const text = fs.readFileSync(f, 'utf8');
  const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith('.mjs') ? ts.ScriptKind.JS : ts.ScriptKind.TS);
  const c = { lines: text.split('\n').length, regex: 0, newRegExp: 0, lists: 0, listEntries: 0, fns: 0 };
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
  out.push([f, c]);
  for (const k of Object.keys(tot)) tot[k] += c[k];
}
for (const [f, c] of out) console.log(`${f}\tlines ${c.lines}\tregex ${c.regex}\tnewRegExp ${c.newRegExp}\tlists ${c.lists} (${c.listEntries})\tfns ${c.fns}`);
console.log(`TOTAL\tlines ${tot.lines}\tregex ${tot.regex}\tnewRegExp ${tot.newRegExp}\tlists ${tot.lists} (${tot.listEntries})\tfns ${tot.fns}`);
