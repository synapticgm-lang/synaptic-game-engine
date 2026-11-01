#!/usr/bin/env node
/**
 * Dice-book skeleton: deterministic graph of ~1,000 sections, no prose.
 *   node scripts/pyoa/dice-skeleton.mjs            -> writes content/pyoa/dice/skeleton.json and lints it
 * Structure per region: bottleneck -> hub -> 3-5 branch chains (scene, check, recovery, reward) -> next bottleneck.
 * Rules enforced by the lint: reachable, no dead ends, every miss goes to a recovery that continues, 12 endings, exactly 1000.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SLUGARG = process.argv[2];
if (!SLUGARG) { console.error('usage: dice-skeleton2.mjs <slug>'); process.exit(2); }
const CFG = await import('./books/' + SLUGARG + '.mjs');
const OUT = join(ROOT, 'content', 'pyoa', SLUGARG);
mkdirSync(OUT, { recursive: true });

let seed = Number(process.env.PYOA_SEED) || CFG.SEED;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));

const REGIONS = CFG.REGIONS;
const ENDINGS = CFG.ENDINGS.map((e) => [e.key, e.title, e.len]);
const ENDING_BUDGET = 39; // plus the selector = 40

const nodes = [];
const byId = new Map();
const idc = {};
function mk(region, kind, extra = {}) {
  idc[region] = (idc[region] || 0) + 1;
  const id = `${CFG.PFX}-${region}-${String(idc[region]).padStart(3, '0')}`;
  const node = { id, region, kind, title: '', brief: '', page: '', exits: [], ...extra };
  nodes.push(node); byId.set(id, node);
  return node;
}
const link = (a, b, label = '', extra = {}) => { a.exits.push({ label, to: b.id, ...extra }); };

const regionInfo = [];
let prevTail = null; // last bottleneck of previous region
let startNode = null;

for (const R of REGIONS) {
  const first = nodes.length;
  const bns = [];
  const chains = []; // {hub, scenes:[...], check, rec, reward}
  const segs = [];
  let b = mk(R.n, 'bottleneck', { role: 'region-gate' });
  bns.push(b);
  if (!startNode) startNode = b;
  if (prevTail) link(prevTail, b, 'onward');
  let tail = b;
  while (nodes.length - first + 22 <= R.budget) {
    const hub = mk(R.n, 'hub');
    link(tail, hub, 'onward');
    const k = ri(3, 5);
    const seg = { hub, chains: [] };
    for (let c = 0; c < k; c++) {
      const e = mk(R.n, 'scene', { chain: `${hub.id}/${c}` });
      const m = rnd() < 0.5 ? mk(R.n, 'scene', { chain: e.chain }) : null;
      const ck = mk(R.n, 'check', { chain: e.chain });
      const rc = mk(R.n, 'recovery', { chain: e.chain });
      const rw = mk(R.n, 'reward', { chain: e.chain });
      link(hub, e, 'branch');
      link(e, m || ck, 'go on');
      if (m) link(m, ck, 'go on');
      const stat = R.stat[ri(0, R.stat.length - 1)];
      const target = ri(7, 9);
      ck.check = { stat, target };
      link(ck, rw, 'check-full', { result: 'full', stat, target });
      link(ck, rw, 'check-mixed', { result: 'mixed', stat, target, cost: true });
      link(ck, rc, 'check-miss', { result: 'miss', stat, target });
      link(rc, rw, 'recover', { cost: true });
      seg.chains.push({ e, m, ck, rc, rw });
    }
    const nb = mk(R.n, 'bottleneck', { role: 'gate' });
    bns.push(nb);
    link(hub, nb, 'move on');
    for (const ch of seg.chains) link(ch.rw, rnd() < 0.7 ? hub : nb, 'return');
    segs.push(seg);
    tail = nb;
  }
  // pad to budget by lengthening chains (insert extra scene before check)
  let guard = 0;
  while (nodes.length - first < R.budget && guard++ < 500) {
    const seg = segs[ri(0, segs.length - 1)];
    const ch = seg.chains[ri(0, seg.chains.length - 1)];
    const ex = mk(R.n, 'scene', { chain: ch.e.chain });
    // redirect whoever pointed at ck from e or m
    const pred = ch.m || ch.e;
    const ex2 = pred.exits.find((x) => x.to === ch.ck.id);
    ex2.to = ex.id;
    link(ex, ch.ck, 'go on');
    if (ch.m) ch.m = ex; else ch.m = ex; // chain now e -> (m) -> ex -> ck; fine for padding purposes
  }
  regionInfo.push({ region: R.n, name: R.name, sections: nodes.length - first, bottlenecks: bns.length, hubs: segs.length });
  prevTail = tail;
}

// Endings: finale gate -> selector -> 12 ending chains
const sel = mk(5, 'bottleneck', { role: 'ending-selector' });
link(prevTail, sel, 'the water turns');
const endFirst = nodes.length;
const endHeads = [];
for (const [key, title, len] of ENDINGS) {
  let prev = null;
  let head = null;
  for (let i = 0; i < len; i++) {
    const n = mk(6, i === len - 1 ? 'ending' : 'ending-part', { endingKey: key, endingTitle: title });
    if (prev) link(prev, n, 'read on');
    else head = n;
    prev = n;
  }
  prev.ending = true;
  endHeads.push([key, head]);
}
for (const [key, head] of endHeads) if (key !== CFG.FALLBACK) link(sel, head, `ending:${key}`, { when: { ['end-' + key]: true } });
// pad endings to budget with extra coda sections on longest-run endings
let eg = 0;
while (nodes.length - endFirst < ENDING_BUDGET && eg++ < 50) {
  for (const [key, head] of endHeads) {
    if (nodes.length - endFirst >= ENDING_BUDGET) break;
    const tailN = nodes.filter((n) => n.endingKey === key).at(-1);
    const prevN = nodes.find((n) => n.exits.some((e) => e.to === tailN.id) && n.endingKey === key);
    const coda = mk(6, 'ending', { endingKey: key, endingTitle: head.endingTitle, ending: true });
    tailN.ending = false; tailN.kind = 'ending-part'; link(tailN, coda, 'read on');
  }
}
// ungated fallback ending
link(sel, endHeads.find(([k]) => k === CFG.FALLBACK)[1], 'fallback:' + CFG.FALLBACK);
// each ending's flag is set on the exits leaving one reward section of its region (distinct rewards)
const usedRw = new Set();
for (const E of CFG.ENDINGS) if (E.key !== CFG.FALLBACK) {
  const cands = nodes.filter((n) => n.kind === 'reward' && n.region === E.region && !usedRw.has(n.id));
  const rw = cands[ri(0, cands.length - 1)]; usedRw.add(rw.id); rw.earns = E.key;
  for (const x of rw.exits) x.setFlags = { ...(x.setFlags || {}), ['end-' + E.key]: true };
}
const END_SECTIONS = nodes.length - endFirst;

// ---- lint
const N = new Map(nodes.map((n) => [n.id, n]));
const errors = [];
const seen = new Set([startNode.id]);
const q = [startNode.id];
while (q.length) { const n = N.get(q.pop()); for (const e of n.exits) if (!seen.has(e.to)) { seen.add(e.to); q.push(e.to); } }
for (const n of nodes) {
  if (!seen.has(n.id)) errors.push(`unreachable ${n.id}`);
  if (!n.ending && n.exits.length === 0) errors.push(`dead end ${n.id}`);
  if (n.kind === 'check') {
    const miss = n.exits.find((e) => e.result === 'miss');
    const t = miss && N.get(miss.to);
    if (!t || t.kind !== 'recovery' || t.exits.length === 0) errors.push(`miss without recovery ${n.id}`);
  }
}
const endings = nodes.filter((n) => n.ending);
const sum = { total: nodes.length, regions: regionInfo, endingSections: END_SECTIONS, endingNodes: endings.length, distinctEndings: new Set(endings.map((e) => e.endingKey)).size, checks: nodes.filter((n) => n.kind === 'check').length, recoveries: nodes.filter((n) => n.kind === 'recovery').length, hubs: nodes.filter((n) => n.kind === 'hub').length, bottlenecks: nodes.filter((n) => n.kind === 'bottleneck').length };
if (nodes.length !== 1000) errors.push(`count ${nodes.length} != 1000`);
writeFileSync(join(OUT, 'skeleton.json'), JSON.stringify({ title: CFG.TITLE, dice: '2d6', rules: { system: '2d6', version: 1, stats: CFG.STATS, statSpread: [2, 1, 1, 0], stamina: 10, luck: 3, luckMax: 5, targets: [7, 10] }, start: startNode.id, nodes }, null, 1));
console.log(JSON.stringify(sum, null, 1));
console.log(errors.length ? 'ERRORS ' + errors.length + '\n' + errors.slice(0, 15).join('\n') : 'LINT OK');
process.exit(errors.length ? 1 : 0);

