#!/usr/bin/env node
// Regex-based code map of src/ and supabase/functions/. No dependencies, no network.
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const ROOTS = ['src', 'supabase/functions'];
const SKIP_DIRS = new Set(['node_modules', 'dist']);
const EXTS = new Set(['.ts', '.tsx', '.js', '.mjs']);

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(full, out);
    } else if (e.isFile()) {
      if (e.name.endsWith('.d.ts')) continue;
      if (EXTS.has(extname(e.name))) out.push(full);
    }
  }
}

function lineOf(text, index) {
  let n = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

function uniq(arr) {
  return [...new Set(arr)];
}

function parseFile(text) {
  const exports = [];
  const imports = [];
  const functions = [];

  // export function/class/const/let/var/type/interface/enum NAME
  const declRe = /^\s*export\s+(?:default\s+)?(?:declare\s+)?(?:async\s+)?(?:function\*?|class|const|let|var|type|interface|enum|abstract\s+class)\s+([A-Za-z_$][\w$]*)/gm;
  for (const m of text.matchAll(declRe)) exports.push(m[1]);

  // export default <expr>
  if (/^\s*export\s+default\s+(?!function|class|async|abstract)/m.test(text)) exports.push('default');
  else if (/^\s*export\s+default\s+(?:async\s+)?(?:function|class)\s*[({]/m.test(text)) exports.push('default');

  // export { a, b as c } [from '...']
  const listRe = /^\s*export\s+(?:type\s+)?\{([^}]*)\}/gm;
  for (const m of text.matchAll(listRe)) {
    for (const part of m[1].split(',')) {
      const p = part.trim().replace(/^type\s+/, '');
      if (!p) continue;
      const asMatch = p.match(/\bas\s+([\w$]+)$/);
      exports.push(asMatch ? asMatch[1] : p.split(/\s+/)[0]);
    }
  }

  // export * [as ns] from '...'
  const starRe = /^\s*export\s+\*\s*(?:as\s+([\w$]+)\s*)?from\s*['"]([^'"]+)['"]/gm;
  for (const m of text.matchAll(starRe)) exports.push(m[1] ? m[1] : `* from ${m[2]}`);

  // imports: import ... from 'x'; import 'x'; export ... from 'x'; dynamic import('x')
  const importRe = /(?:^|[\s;])(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]/gm;
  for (const m of text.matchAll(importRe)) imports.push(m[1]);
  const bareImportRe = /^\s*import\s*['"]([^'"]+)['"]/gm;
  for (const m of text.matchAll(bareImportRe)) imports.push(m[1]);
  const dynRe = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const m of text.matchAll(dynRe)) imports.push(m[1]);

  // top-level function declarations (no leading indentation)
  const fnRe = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\*?\s+([A-Za-z_$][\w$]*)/gm;
  for (const m of text.matchAll(fnRe)) functions.push({ name: m[1], line: lineOf(text, m.index) });

  // top-level const arrow functions
  const arrowRe = /^(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*(?::[^=\n]+)?=\s*(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::\s*[^=\n]+)?=>/gm;
  for (const m of text.matchAll(arrowRe)) functions.push({ name: m[1], line: lineOf(text, m.index) });

  functions.sort((a, b) => a.line - b.line);
  return { exports: uniq(exports), imports: uniq(imports), functions };
}

function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

function stamp() {
  try {
    const v = JSON.parse(readFileSync(join(ROOT, 'public', 'version.json'), 'utf8'));
    return v.build || v.hud || '';
  } catch {
    return '';
  }
}

const files = [];
for (const r of ROOTS) walk(join(ROOT, r), files);
files.sort();

const records = files.map((full) => {
  const text = readFileSync(full, 'utf8');
  const size = statSync(full).size;
  const lines = text.length === 0 ? 0 : text.split('\n').length;
  return { path: relative(ROOT, full).replace(/\\/g, '/'), size, lines, ...parseFile(text) };
});

const counts = {};
for (const r of ROOTS) counts[r] = records.filter((f) => f.path.startsWith(`${r}/`)).length;

const header = {
  generatedAt: new Date().toISOString(),
  commit: gitCommit(),
  stamp: stamp(),
  roots: ROOTS,
  fileCount: records.length,
  counts,
  totalLines: records.reduce((s, f) => s + f.lines, 0),
  totalBytes: records.reduce((s, f) => s + f.size, 0),
};

const docsDir = join(ROOT, 'docs');
if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });

writeFileSync(join(docsDir, 'codemap.json'), JSON.stringify({ ...header, files: records }, null, 2) + '\n');

const md = [];
md.push('# Code map');
md.push('');
md.push(`Generated ${header.generatedAt} · commit \`${header.commit || '?'}\` · stamp \`${header.stamp || '?'}\``);
md.push(`${header.fileCount} files · ${header.totalLines} lines · ${header.totalBytes} bytes. Regenerate: \`npm run codemap\`.`);
md.push('');
for (const f of records) {
  md.push(`## ${f.path}`);
  md.push(`${f.size} B · ${f.lines} lines`);
  if (f.exports.length) md.push(`- exports: ${f.exports.join(', ')}`);
  if (f.functions.length) md.push(`- functions: ${f.functions.map((fn) => `${fn.name}:${fn.line}`).join(', ')}`);
  md.push('');
}
writeFileSync(join(docsDir, 'CODEMAP.md'), md.join('\n'));

console.log(`codemap: ${header.fileCount} files (${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}) · commit ${header.commit || '?'} · stamp ${header.stamp || '?'}`);
