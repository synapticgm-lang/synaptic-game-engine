#!/usr/bin/env node
/**
 * Build src/data/pyoa/umbraBook.json = content/pyoa/umbra/base.json + every overlay/*.json (sorted by name).
 * Idempotent: always rebuilds from base. Fails loudly on any unknown node/exit or duplicate id.
 *   node scripts/pyoa/apply-overlay.mjs [--out path] [--no-write]
 * Overlay file shape (all keys optional):
 *  { "batch": "name",
 *    "variants": [{ "node", "when", "before"?, "after"?, "replace"? }],
 *    "gates":    [{ "node", "exit", "when" }],
 *    "addExits": [{ "node", "exit": { "id","label","to","when"?,"setFlags"? }, "index"? }],
 *    "rewire":   [{ "node", "exit", "to" }],
 *    "newNodes": [{ "id","stake","page","exits":[...],"variants"?,"majorFork"?,"endingId"? }] }
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'content', 'pyoa', 'umbra');

export function buildBook(dir = DIR) {
  const book = JSON.parse(readFileSync(join(dir, 'base.json'), 'utf8'));
  const N = new Map(book.nodes.map((n) => [n.id, n]));
  const files = readdirSync(join(dir, 'overlay')).filter((f) => f.endsWith('.json')).sort();
  const stats = { files: files.length, variants: 0, gates: 0, addExits: 0, rewire: 0, newNodes: 0 };
  const need = (id, ctx) => {
    const n = N.get(id);
    if (!n) throw new Error(`${ctx}: unknown node ${id}`);
    return n;
  };
  for (const f of files) {
    const o = JSON.parse(readFileSync(join(dir, 'overlay', f), 'utf8'));
    const ctx = f;
    for (const nn of o.newNodes ?? []) {
      if (N.has(nn.id)) throw new Error(`${ctx}: duplicate new node ${nn.id}`);
      const node = { id: nn.id, stake: nn.stake, endingId: nn.endingId ?? null, majorFork: !!nn.majorFork, page: nn.page, exits: nn.exits ?? [] };
      if (nn.variants?.length) node.variants = nn.variants;
      book.nodes.push(node);
      N.set(node.id, node);
      stats.newNodes++;
    }
    for (const v of o.variants ?? []) {
      const n = need(v.node, ctx);
      const { node, ...rest } = v;
      const key = JSON.stringify(rest);
      n.variants ??= [];
      if (n.variants.some((x) => JSON.stringify(x) === key)) continue;
      n.variants.push(rest);
      stats.variants++;
    }
    for (const g of o.gates ?? []) {
      const n = need(g.node, ctx);
      const e = n.exits.find((x) => x.id === g.exit);
      if (!e) throw new Error(`${ctx}: ${g.node} has no exit ${g.exit}`);
      e.when = g.when;
      stats.gates++;
    }
    for (const a of o.addExits ?? []) {
      const n = need(a.node, ctx);
      if (n.exits.some((x) => x.id === a.exit.id)) continue;
      if (!N.has(a.exit.to)) throw new Error(`${ctx}: ${a.node}/${a.exit.id} -> unknown ${a.exit.to}`);
      const i = a.index ?? n.exits.length;
      n.exits.splice(i, 0, a.exit);
      stats.addExits++;
    }
    for (const r of o.rewire ?? []) {
      const n = need(r.node, ctx);
      const e = n.exits.find((x) => x.id === r.exit);
      if (!e) throw new Error(`${ctx}: ${r.node} has no exit ${r.exit}`);
      if (!N.has(r.to)) throw new Error(`${ctx}: rewire to unknown ${r.to}`);
      e.to = r.to;
      stats.rewire++;
    }
  }
  book.nodeCount = book.nodes.length;
  book.improvedAt = new Date().toISOString();
  return { book, stats };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('apply-overlay.mjs')) {
  const oi = process.argv.indexOf('--out');
  const out = oi >= 0 ? process.argv[oi + 1] : join(ROOT, 'src', 'data', 'pyoa', 'umbraBook.json');
  const { book, stats } = buildBook();
  if (!process.argv.includes('--no-write')) writeFileSync(out, JSON.stringify(book));
  console.log(JSON.stringify({ out: process.argv.includes('--no-write') ? null : out, nodes: book.nodes.length, ...stats }));
}
