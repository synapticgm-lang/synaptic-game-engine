/**
 * Compile harvested Umbra pages + map into src/data/pyoa/umbraBook.json
 * Research harvest → live PYOA book. Does not rewrite Thornferry.
 *
 *   node scripts/compile-umbra-book.mjs
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BOOK = join(ROOT, 'docs', 'research', 'pyoa-maps', 'umbra-protocol');
const PAGES = join(BOOK, 'pages');
const OUT_DIR = join(ROOT, 'src', 'data', 'pyoa');
const OUT = join(OUT_DIR, 'umbraBook.json');
const START = 'up-bell-tower';

function pageProse(id) {
  const file = join(PAGES, `${id}.md`);
  if (!existsSync(file)) return '';
  const raw = readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/);
  const body = [];
  for (const line of lines) {
    if (/^##\s+/.test(line)) continue;
    if (/^\*\s+/.test(line.trim())) continue;
    body.push(line);
  }
  return body.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function main() {
  const map = JSON.parse(readFileSync(join(BOOK, 'map.json'), 'utf8'));
  const nodes = [];
  for (const n of map.nodes ?? []) {
    if (!n?.id) continue;
    const page = pageProse(n.id) || String(n.stake ?? '').trim();
    nodes.push({
      id: n.id,
      stake: String(n.stake ?? '').trim() || page.split(/(?<=[.!?])\s/)[0] || n.id,
      endingId: n.endingId || null,
      majorFork: !!n.majorFork,
      page,
      exits: (n.exits ?? []).map((e) => ({
        id: e.id,
        label: e.label,
        to: e.to,
        setFlags: e.setFlags && Object.keys(e.setFlags).length ? e.setFlags : undefined,
      })),
    });
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const payload = {
    bibleId: 'umbra-protocol',
    startId: START,
    compiledAt: new Date().toISOString(),
    nodeCount: nodes.length,
    nodes,
  };
  writeFileSync(OUT, JSON.stringify(payload));
  const ids = new Set(nodes.map((n) => n.id));
  let missing = 0;
  for (const n of nodes) {
    for (const e of n.exits) {
      if (!ids.has(e.to)) missing += 1;
    }
  }
  const pageFiles = existsSync(PAGES)
    ? readdirSync(PAGES).filter((f) => f.startsWith('up-') && f.endsWith('.md')).length
    : 0;
  console.log(JSON.stringify({
    out: OUT,
    nodes: nodes.length,
    pagesOnDisk: pageFiles,
    start: ids.has(START),
    missingTargets: missing,
    bytes: Buffer.byteLength(JSON.stringify(payload)),
  }, null, 2));
}

main();
