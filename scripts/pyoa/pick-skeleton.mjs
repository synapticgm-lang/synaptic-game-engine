#!/usr/bin/env node
/**
 * "The Last Lamp Across the Saltglass" - deterministic skeleton (pure choice, no dice, ~1000 sections).
 *   node scripts/pyoa/salt-skeleton.mjs      -> content/pyoa/saltglass/skeleton.json
 * Shape: prologue(4) -> 6 regions. Each region: in, [seg0], choke1, [seg1], choke2, [seg2], out.
 * A segment is a 5-layer diamond-ish lattice (every node reachable, exits <= 4). Chokes are mandatory scenes where the
 * reader decides (sets a flag) or the road splits by an earlier flag. "Privileged" lattice nodes are only reachable
 * with an earlier flag state (payoffs). Dooms are soft-fail endings. Region 6 ends in the finale selector -> 8 endings.
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const SLUGARG = process.argv[2] || process.env.PYOA_BOOK;
if (!SLUGARG) { console.error('usage: pick-skeleton.mjs <slug>'); process.exit(2); }
const CFG = await import('./books/' + SLUGARG + '.mjs');
export const { SLUG, TITLE, FLAGS, GATE_POOL, REGIONS, CHOKES, ENDINGS } = CFG;
const PFX = CFG.PFX; const TARGET = 1000;

// ---------- rng
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(Number(process.env.PYOA_SEED) || CFG.SEED);
const ri = (n) => Math.floor(rnd() * n);

export function build() {
  const nodes = []; const byId = new Map();
  const add = (n) => { n.exits = n.exits || []; nodes.push(n); byId.set(n.id, n); return n; };
  const ex = (to, intent, extra = {}) => ({ to, intent, ...extra });
  const wide = (r, s, l, k) => `${PFX}-${r}-${s}-${l}-${k}`;

  // prologue
  { const P = CFG.PROLOGUE;
    add({ id: `${PFX}-p1`, kind: 'prologue', region: 0, brief: P.p1.brief, exits: [ex(`${PFX}-p2a`, P.p1.exits[0]), ex(`${PFX}-p2b`, P.p1.exits[1])] });
    add({ id: `${PFX}-p2a`, kind: 'prologue', region: 0, brief: P.p2a.brief, exits: [ex(`${PFX}-p3`, P.p2a.exit)] });
    add({ id: `${PFX}-p2b`, kind: 'prologue', region: 0, brief: P.p2b.brief, exits: [ex(`${PFX}-p3`, P.p2b.exit)] });
    add({ id: `${PFX}-p3`, kind: 'prologue', region: 0, brief: P.p3.brief, exits: [ex(`${PFX}-1-in`, P.p3.exit)] }); }

  const flagsSetBefore = (r) => GATE_POOL.filter((g) => g.region <= r);
  const doomPlan = [];

  for (let r = 1; r <= 6; r++) {
    const cfg = REGIONS[r];
    const inId = `${PFX}-${r}-in`, c1 = `${PFX}-${r}-c1`, c2 = `${PFX}-${r}-c2`, outId = `${PFX}-${r}-out`;
    const nextOfOut = r < 6 ? `${PFX}-${r + 1}-in` : null;
    add({ id: inId, kind: 'in', region: r, brief: `Arrival in ${cfg.name}: ${cfg.theme}. The reader enters with several ways forward.` });
    add({ id: c1, kind: 'choke', region: r, brief: `Mandatory scene at ${CHOKES[r][0].title}: ${CHOKES[r][0].brief}` });
    add({ id: c2, kind: 'choke', region: r, brief: `Mandatory scene at ${CHOKES[r][1].title}: ${CHOKES[r][1].brief}` });
    add({ id: outId, kind: r < 6 ? 'out' : 'final', region: r, brief: r < 6 ? `Leaving ${cfg.name} for ${REGIONS[r + 1].name}: close this part of the journey.` : CFG.FINALE.brief });

    const singles = [[inId, null], [c1, CHOKES[r][0]], [c2, CHOKES[r][1]]];
    const segTotal = r === 6 ? 51 : 52;
    const segEntry = [4, 2, 2];
    const prevExitsSetup = (single, s) => {};
    const lastLayerOf = [];
    for (let s = 0; s < 3; s++) {
      const E = segEntry[s];
      const w1 = Math.min(3 * E, 10);
      const a0 = Math.floor((segTotal - E - w1 - 12) / 2); const widths = [E, w1, a0, a0 + ((segTotal - E - w1 - 12) % 2), 8, 4];
      const layers = widths.map((w, l) => Array.from({ length: w }, (_, k) => wide(r, s, l, k)));
      layers.forEach((L, l) => L.forEach((id, k) => add({ id, kind: 'wide', region: r, seg: s, layer: l, idx: k, brief: '' })));
      // single before segment -> layer 0
      const src = singles[s];
      const srcNode = byId.get(src[0]);
      if (s === 0) {
        CFG.OPENERS.forEach((it, k) => srcNode.exits.push(ex(layers[0][k], it)));
      } else {
        src[1].exits.forEach((o, k) => srcNode.exits.push(ex(layers[0][k], o.intent, { ...(o.when ? { when: o.when } : {}), ...(o.setFlags ? { setFlags: o.setFlags } : {}) })));
      }
      // privileged picks (regions >= 2): layers 1..3, one each
      const priv = new Map();
      if (r >= 2) {
        const pool = flagsSetBefore(r);
        for (const l of [1, 2, 3]) {
          const k = 1 + ri(layers[l].length - 2);
          const g = (r >= 5 && s === 0 && l === 1) ? pool.find((x) => x.cond.scar) : pool[(r * 7 + s * 3 + l * 5 + ri(3)) % pool.length];
          priv.set(layers[l][k], g);
        }
      }
      // layer to layer edges
      for (let l = 0; l < widths.length - 1; l++) {
        const S = layers[l], T = layers[l + 1];
        const edges = new Map(S.map((id) => [id, new Set()]));
        if (S.length >= T.length) S.forEach((id, j) => edges.get(id).add(T[Math.floor((j * T.length) / S.length)]));
        else T.forEach((t, k) => edges.get(S[Math.floor((k * S.length) / T.length)]).add(t));
        for (const id of S) { // random extra neighbour
          const set = edges.get(id);
          for (const pr of [0.9, 0.5]) if (set.size < 3 && rnd() < pr) { const cur = [...set][ri(set.size)]; const ci = T.indexOf(cur); const nb = T[Math.max(0, Math.min(T.length - 1, ci + (rnd() < 0.5 ? -1 : 1) * (1 + ri(2))))]; set.add(nb); }
        }
        // each target needs a non-priv-or-gated route: ensure targets that are priv are only entered through gated edges
        const incoming = new Map(T.map((t) => [t, []]));
        for (const [id, set] of edges) for (const t of set) incoming.get(t).push(id);
        // targets with only priv sources: add an extra edge from a non-priv source
        for (const t of T) {
          if (incoming.get(t).length && incoming.get(t).every((id) => priv.has(id))) {
            const cand = S.find((id) => !priv.has(id) && edges.get(id).size < 4 && Math.abs(T.indexOf(t) - (S.indexOf(id) * T.length) / S.length) <= 3);
            if (cand) { edges.get(cand).add(t); incoming.get(t).push(cand); }
          }
        }
        for (const id of S) {
          const n = byId.get(id);
          const ts = [...edges.get(id)].sort((a, b) => T.indexOf(a) - T.indexOf(b));
          // a source must keep at least one non-priv target
          if (ts.every((t) => priv.has(t))) { const nt = T.find((t) => !priv.has(t) && Math.abs(T.indexOf(t) - (S.indexOf(id) * T.length) / S.length) <= 3) || T.find((t) => !priv.has(t)); ts.push(nt); }
          for (const t of ts) {
            const g = priv.get(t);
            n.exits.push(ex(t, '', g ? { when: g.cond, privWhy: g.why } : {}));
          }
        }
      }
      // last layer -> next single
      const nextSingle = s === 0 ? c1 : s === 1 ? c2 : outId;
      layers[widths.length - 1].forEach((id) => byId.get(id).exits.push(ex(nextSingle, 'Press on')));
      // back-edges
      for (const l of [2, 3, 4, 5]) layers[l].forEach((id) => { const n = byId.get(id); if (n.exits.length < 4 && rnd() < 0.07) n.exits.push(ex(layers[l - 2][ri(layers[l - 2].length)], 'Turn back', { back: true })); });
      // priv metadata + node briefs
      for (const [id, g] of priv) { const n = byId.get(id); n.priv = { cond: g.cond, why: g.why }; }
      lastLayerOf.push(layers);
    }
    // dooms: one in segment 1 layer 2..3, one in segment 2 layer 2..3
    for (let d = 1; d <= 2; d++) {
      const layers = lastLayerOf[d + (lastLayerOf.length - 3)];
      const pick = layers[2 + ri(2)].filter((id) => byId.get(id).exits.length < 4 && !byId.get(id).priv);
      const host = pick[ri(pick.length)];
      const did = `${PFX}-d-${r}-${d}`;
      add({ id: did, kind: 'doom', region: r, brief: `A bad end in ${cfg.name}: the reader's gamble fails and the journey ends here (a death or ruin that is vivid but not gruesome).`, endingId: `doom-${r}-${d}` });
      byId.get(host).exits.push(ex(did, 'Take the reckless way', { doomOf: host }));
    }
    // out wiring
    if (r < 6) byId.get(outId).exits.push(ex(nextOfOut, 'Go on'));
  }

  // finale: out of region 6 -> 3 stances -> endings
  const fin = byId.get(`${PFX}-6-out`);
  const stances = CFG.FINALE.stances;
  for (const [k, [intent, id]] of Object.entries(stances)) {
    fin.exits.push(ex(id, intent));
    const n = add({ id, kind: 'finalstance', region: 6, stance: k, brief: `The reader has chosen to ${intent.toLowerCase()}: the moment of carrying it out, with the consequences about to fall (do not decide which of the endings it is; the exits do that).` });
    for (const e of ENDINGS.filter((x) => x.stance === k)) n.exits.push(ex(`${PFX}-e-${e.key}-1`, e.title, { when: e.when, endingKey: e.key }));
  }
  for (const e of ENDINGS) {
    for (let p = 1; p <= 3; p++) {
      const id = `${PFX}-e-${e.key}-${p}`;
      const n = add({ id, kind: p === 3 ? 'ending' : 'endingpart', region: 6, endingKey: e.key, endingTitle: e.title, part: p, brief: p === 1 ? `Ending "${e.title}": ${e.brief}` : p === 2 ? `Aftermath of "${e.title}": ${CFG.AFTERMATH}.` : `Final page of "${e.title}": a closing image and a last line for the book.` });
      if (p < 3) n.exits.push(ex(`${PFX}-e-${e.key}-${p + 1}`, p === 1 ? 'Read on' : 'The last page'));
      else n.endingId = `end-${e.key}`;
    }
  }
  return { nodes, byId };
}

export function main() {
  const { nodes } = build();
  nodes.forEach((n) => n.exits.forEach((e, i) => { e.id = `x${i}`; }));
  const out = { title: TITLE, slug: SLUG, start: `${PFX}-p1`, count: nodes.length, nodes };
  mkdirSync(`content/pyoa/${SLUG}`, { recursive: true });
  writeFileSync(`content/pyoa/${SLUG}/skeleton.json`, JSON.stringify(out, null, 1));
  const kinds = {}; nodes.forEach((n) => { kinds[n.kind] = (kinds[n.kind] || 0) + 1; });
  console.log('sections', nodes.length, 'target', TARGET, JSON.stringify(kinds));
}
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) main();