#!/usr/bin/env node
/**
 * PYOA book linter + path simulator.
 *   node scripts/pyoa/lint-book.mjs [path/to/book.json] [--json out.json] [--cap 3000000]
 * Proves (by exhaustive search over node x flag-state): no dead ends, every ending reachable,
 * no trap loops with no way to an ending, every gate can open and close, every variant can fire,
 * and every flag is read (pays off) somewhere.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pyoaCondHolds, pyoaCondReads, pyoaCondFlags } from '../../src/game/pyoaCond.ts';

export function lintBook(book, { cap = 3_000_000, maxExits = 4 } = {}) {
  const errors = [];
  const warns = [];
  const E = (code, msg) => errors.push({ code, msg });
  const W = (code, msg) => warns.push({ code, msg });
  const nodes = book.nodes ?? [];
  const N = new Map();
  for (const n of nodes) {
    if (N.has(n.id)) E('dup-node', n.id);
    N.set(n.id, n);
  }
  if (!N.has(book.startId)) E('no-start', String(book.startId));

  // ---- static checks
  const leak = /<\/?[a-z][^>]*>|\{\{|\}\}|\bTODO\b|\bTBD\b|\bLorem\b|^\s*Label\s*$|\[(?:PAGE|INSERT|NODE)[^\]]*\]/i;
  const setters = new Map(); // flag -> Set(values)
  const readers = new Map(); // "flag=value" -> Set(node ids)
  const readerFlags = new Map(); // flag -> Set(node ids)
  const noteRead = (cond, id) => {
    for (const [f, v] of pyoaCondReads(cond)) {
      const k = `${f}=${v}`;
      if (!readers.has(k)) readers.set(k, new Set());
      readers.get(k).add(id);
    }
    for (const f of pyoaCondFlags(cond)) {
      if (!readerFlags.has(f)) readerFlags.set(f, new Set());
      readerFlags.get(f).add(id);
    }
  };
  for (const n of nodes) {
    const text = [n.page ?? '', ...(n.variants ?? []).flatMap((v) => [v.before, v.after, v.replace])].filter(Boolean).join('\n');
    if (leak.test(text)) E('markup-leak', `${n.id}: ${(text.match(leak) || [''])[0]}`);
    if (!n.endingId && !(n.exits?.length)) E('dead-end-static', n.id);
    if (n.endingId && n.exits?.length) W('ending-with-exits', n.id);
    if (!n.page || n.page.trim().length < 40) W('thin-page', n.id);
    if ((n.exits?.length ?? 0) > maxExits) W('too-many-exits', `${n.id} has ${n.exits.length}`);
    const labels = new Set();
    const ids = new Set();
    for (const e of n.exits ?? []) {
      if (!N.has(e.to)) E('missing-target', `${n.id} -> ${e.to}`);
      if (!e.label || leak.test(e.label)) E('bad-label', `${n.id}/${e.id}: ${e.label}`);
      if (labels.has(e.label)) W('dup-label', `${n.id}: ${e.label}`);
      if (ids.has(e.id)) E('dup-exit-id', `${n.id}/${e.id}`);
      labels.add(e.label);
      ids.add(e.id);
      for (const [f, v] of Object.entries(e.setFlags ?? {})) {
        if (!setters.has(f)) setters.set(f, new Set());
        setters.get(f).add(String(v));
      }
      if (e.when) noteRead(e.when, `${n.id}>${e.id}`);
    }
    for (const v of n.variants ?? []) {
      noteRead(v.when, n.id);
      if (!(v.before || v.after || v.replace)) E('empty-variant', n.id);
    }
  }
  // static reachability (ignores gates)
  const seenS = new Set([book.startId]);
  const qs = [book.startId];
  while (qs.length) {
    const n = N.get(qs.pop());
    for (const e of n?.exits ?? []) if (N.has(e.to) && !seenS.has(e.to)) { seenS.add(e.to); qs.push(e.to); }
  }
  for (const n of nodes) if (!seenS.has(n.id)) E('orphan', n.id);

  // flag coverage
  for (const [f] of setters) if (!readerFlags.has(f)) E('flag-never-read', f);
  for (const [f] of readerFlags) if (!setters.has(f)) E('flag-never-set', f);
  for (const [k] of readers) {
    const [f, v] = [k.slice(0, k.indexOf('=')), k.slice(k.indexOf('=') + 1)];
    if (v === '_' || v === 'true') continue;
    if (setters.has(f) && !setters.get(f).has(v)) E('value-never-set', k);
  }
  const unpaidValues = [];
  for (const [f, vals] of setters) for (const v of vals) if (!readers.has(`${f}=${v}`)) unpaidValues.push(`${f}=${v}`);

  // ---- dynamic: exhaustive search over (node, flags)
  const tracked = [...new Set([...setters.keys(), ...readerFlags.keys()])].sort();
  const keyOf = (id, fl) => id + '|' + tracked.map((f) => (fl[f] === undefined ? '' : String(fl[f]))).join(',');
  const states = new Map(); // key -> {id, fl, succ:number[]}
  const list = [];
  const add = (id, fl) => {
    const k = keyOf(id, fl);
    let idx = states.get(k);
    if (idx === undefined) {
      idx = list.length;
      states.set(k, idx);
      list.push({ id, fl, succ: [] });
      return { idx, isNew: true };
    }
    return { idx, isNew: false };
  };
  const queue = [add(book.startId, {}).idx];
  let capped = false;
  const gateOpen = new Map(); // node>exit -> [open, closed]
  const varHit = new Map(); // node#i -> count
  const fallbackNodes = new Set();
  const deadStates = [];
  const reachedNodes = new Set();
  const nodeStates = new Map();
  const endingStates = [];
  for (let qi = 0; qi < queue.length; qi++) {
    if (list.length > cap) { capped = true; break; }
    const s = list[queue[qi]];
    const n = N.get(s.id);
    if (!n) continue;
    reachedNodes.add(s.id);
    nodeStates.set(s.id, (nodeStates.get(s.id) ?? 0) + 1);
    (n.variants ?? []).forEach((v, i) => {
      if (pyoaCondHolds(v.when, s.fl)) varHit.set(`${n.id}#${i}`, (varHit.get(`${n.id}#${i}`) ?? 0) + 1);
    });
    if (n.endingId) { endingStates.push(queue[qi]); continue; }
    let vis = [];
    for (const e of n.exits ?? []) {
      const open = !e.when || pyoaCondHolds(e.when, s.fl);
      if (e.when) {
        const k = `${n.id}>${e.id}`;
        const g = gateOpen.get(k) ?? [0, 0];
        g[open ? 0 : 1]++;
        gateOpen.set(k, g);
      }
      if (open) vis.push(e);
    }
    if (!vis.length && n.exits?.length) {
      fallbackNodes.add(n.id);
      const ungated = n.exits.filter((e) => !e.when);
      vis = ungated.length ? ungated : n.exits; // mirrors the engine safety net
    }
    if (!vis.length) { deadStates.push(s.id); continue; }
    for (const e of vis) {
      const nf = e.setFlags ? { ...s.fl, ...e.setFlags } : s.fl;
      const r = add(e.to, nf);
      s.succ.push(r.idx);
      if (r.isNew) queue.push(r.idx);
    }
  }
  // traps: states that cannot reach an ending
  let trapCount = 0;
  const trapNodes = new Set();
  if (!capped) {
    const rev = Array.from({ length: list.length }, () => []);
    list.forEach((s, i) => s.succ.forEach((t) => rev[t].push(i)));
    const good = new Uint8Array(list.length);
    const st = [...endingStates];
    st.forEach((i) => (good[i] = 1));
    while (st.length) {
      const i = st.pop();
      for (const p of rev[i]) if (!good[p]) { good[p] = 1; st.push(p); }
    }
    list.forEach((s, i) => { if (!good[i]) { trapCount++; trapNodes.add(s.id); } });
  }
  if (capped) W('state-cap', `search stopped at ${list.length} states`);
  for (const id of deadStates) E('dead-end-dynamic', id);
  if (trapCount) E('trap-states', `${trapCount} states (${trapNodes.size} nodes) cannot reach any ending, e.g. ${[...trapNodes].slice(0, 5).join(', ')}`);
  if (!capped) for (const id of seenS) if (!reachedNodes.has(id)) E('gated-off', id);
  for (const id of fallbackNodes) W('gate-fallback', `${id}: some flag states hide every exit (engine falls back to ungated exits)`);
  const gateReport = [];
  for (const [k, [o, c]] of gateOpen) {
    gateReport.push({ gate: k, open: o, closed: c });
    if (o === 0) E('gate-never-opens', k);
    else if (c === 0) W('gate-always-open', k);
  }
  const variantReport = [];
  for (const n of nodes) (n.variants ?? []).forEach((v, i) => {
    const hits = varHit.get(`${n.id}#${i}`) ?? 0;
    const total = nodeStates.get(n.id) ?? 0;
    variantReport.push({ node: n.id, i, hits, total });
    if (!capped && total && !hits) E('variant-never-fires', `${n.id}#${i} ${JSON.stringify(v.when)}`);
    else if (total && hits === total) W('variant-always-fires', `${n.id}#${i} (move into base page)`);
  });
  const endingsAll = nodes.filter((n) => n.endingId).map((n) => n.endingId);
  const endingsReached = [...new Set(endingStates.map((i) => N.get(list[i].id).endingId))];
  for (const e of endingsAll) if (!capped && !endingsReached.includes(e)) E('ending-unreachable', e);

  const flagPay = {};
  for (const [f, vals] of setters) {
    flagPay[f] = {};
    for (const v of vals) flagPay[f][v] = readers.get(`${f}=${v}`)?.size ?? 0;
  }
  return {
    summary: {
      nodes: nodes.length,
      exits: nodes.reduce((a, n) => a + (n.exits?.length ?? 0), 0),
      endings: endingsAll.length,
      endingsReached: endingsReached.length,
      statesExplored: list.length,
      capped,
      gatedExits: gateOpen.size,
      variants: variantReport.length,
      newErrors: errors.length,
      warnings: warns.length,
      trackedFlags: tracked,
      unpaidFlagValues: unpaidValues,
      flagPayoffNodes: flagPay,
    },
    errors,
    warns,
    gateReport,
    variantReport,
  };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a) && args[args.indexOf(a) - 1] !== '--json' && args[args.indexOf(a) - 1] !== '--cap') ?? 'src/data/pyoa/umbraBook.json';
  const ji = args.indexOf('--json');
  const ci = args.indexOf('--cap');
  const res = lintBook(JSON.parse(readFileSync(file, 'utf8')), ci >= 0 ? { cap: Number(args[ci + 1]) } : {});
  if (ji >= 0) writeFileSync(args[ji + 1], JSON.stringify(res, null, 1));
  const s = res.summary;
  console.log(`PYOA lint ${file}`);
  console.log(`  nodes ${s.nodes}, exits ${s.exits}, endings reached ${s.endingsReached}/${s.endings}, states ${s.statesExplored}${s.capped ? ' (CAPPED)' : ''}`);
  console.log(`  gated exits ${s.gatedExits}, variants ${s.variants}`);
  console.log(`  flags ${JSON.stringify(s.flagPayoffNodes)}`);
  if (s.unpaidFlagValues.length) console.log(`  unpaid flag values: ${s.unpaidFlagValues.join(', ')}`);
  const by = (arr) => arr.reduce((m, x) => ((m[x.code] = (m[x.code] || 0) + 1), m), {});
  console.log(`  ERRORS ${res.errors.length} ${JSON.stringify(by(res.errors))}`);
  res.errors.slice(0, 25).forEach((e) => console.log(`    E ${e.code}: ${e.msg}`));
  console.log(`  warnings ${res.warns.length} ${JSON.stringify(by(res.warns))}`);
  res.warns.slice(0, 10).forEach((e) => console.log(`    w ${e.code}: ${e.msg}`));
  process.exit(res.errors.length ? 1 : 0);
}
