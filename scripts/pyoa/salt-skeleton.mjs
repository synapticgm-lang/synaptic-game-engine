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

export const SLUG = 'saltglass';
export const TITLE = 'The Last Lamp Across the Saltglass';
const PFX = 'sg';
const TARGET = 1000;

// ---------- flags
export const FLAGS = {
  guide: { values: ['pell', 'alone'], desc: 'whether Pell the glass-diver travels with the reader (pell) or the reader went alone (alone)' },
  lamp: { values: ['lit', 'dark'], desc: 'whether the reader\'s ember-lamp burns (lit) or is banked dark (dark)' },
  oath: { values: ['sworn', 'free'], desc: 'whether the reader swore the Dune Sisters\' well-oath (sworn) or stayed unbound (free)' },
  debt: { values: ['owed', 'clear'], desc: 'whether the reader owes the Salt Court a toll-debt (owed) or travels clear (clear)' },
  rumor: { values: ['true', 'false'], desc: 'whether the reader believes the rumour that the Rain Vault is still full (true) or has been looted (false)' },
  tongue: { values: ['y', 'n'], desc: 'whether the reader learned the Glasswrights\' mirror-signal speech (y) or not (n)' },
  key: { values: ['whole', 'cracked'], desc: 'whether the Seedkey is whole (whole) or hairline-cracked (cracked)' },
  scar: { values: ['y'], desc: 'whether the reader carries a glass-burn scar from shielding the lamp (y)' },
};
// conditions used to gate privileged nodes, by flags settled before region r
const GATE_POOL = [
  { region: 2, cond: { guide: 'pell' }, why: 'Pell the glass-diver is with the reader and knows this place' },
  { region: 2, cond: { guide: 'alone' }, why: 'the reader travels alone and so notices what a guide would talk over' },
  { region: 2, cond: { lamp: 'lit' }, why: 'the reader\'s ember-lamp is burning and draws or reveals something' },
  { region: 2, cond: { lamp: 'dark' }, why: 'the reader walks with a banked, dark lamp and slips through unseen' },
  { region: 3, cond: { oath: 'sworn' }, why: 'the reader is bound by the Dune Sisters\' well-oath, and is known for it' },
  { region: 3, cond: { debt: 'owed' }, why: 'the reader owes the Salt Court a toll-debt and is recognised' },
  { region: 3, cond: { debt: 'clear' }, why: 'the reader owes nobody and can bargain freely' },
  { region: 4, cond: { rumor: 'true' }, why: 'the reader believes the vault is still full and acts on it' },
  { region: 4, cond: { rumor: 'false' }, why: 'the reader believes the vault was looted and looks for the looters\' trail' },
  { region: 4, cond: { tongue: 'y' }, why: 'the reader can read the Glasswrights\' mirror-signals' },
  { region: 5, cond: { key: 'cracked' }, why: 'the Seedkey is cracked and sings or fails near glass' },
  { region: 5, cond: { key: 'whole' }, why: 'the Seedkey is whole and answers the old locks' },
  { region: 5, cond: { scar: 'y' }, why: 'the reader carries the glass-burn scar that marks them as one who crossed the Storm' },
];

// ---------- region plan
export const REGIONS = [
  null,
  { name: 'Candlemere and the Rim Road', theme: 'the lamp-town on the western rim, outfitting, rivals and kin, the first miles of the Rim Road; the reader hires help and takes the ember-lamp' },
  { name: 'The Bitterflats', theme: 'white salt flats, mirages, the Dune Sisters\' wells and their oath, the Salt Court\'s toll-hut, rumours of the vault' },
  { name: 'The Shard Cities', theme: 'broken glass cities of the Old Lensfolk, Glasswright signal-towers, glass bridges, the toll-fort, scavengers' },
  { name: 'The Mirror Storm', theme: 'a wall of glass-dust storm and the dune-sea beyond it; the lamp, the Seedkey and the body are all tested' },
  { name: 'Prism', theme: 'the observatory-city at the basin\'s heart: lens-halls, sentries of the Glasswrights, rivals arriving for the vault, the approach to the Rain Vault' },
  { name: 'The Rain Vault', theme: 'beneath Prism: the seed halls, the lock, every old promise coming due, and the final choice about the seed' },
];
const A = (intent, extra = {}) => ({ intent, ...extra });
const CHOKES = {
  1: [
    { title: 'the Lamp-Post Gate', exits: [A('Hire Pell the glass-diver as guide', { setFlags: { guide: 'pell' } }), A('Go alone, trusting your own feet', { setFlags: { guide: 'alone' } })], brief: 'the reader decides whether to hire the glass-diver Pell, a wry guide who knows the Saltglass, or go alone' },
    { title: 'the Last Lamp-Stall', exits: [A('Light the ember-lamp and carry it', { setFlags: { lamp: 'lit' } }), A('Bank the lamp dark in its case to save oil', { setFlags: { lamp: 'dark' } })], brief: 'the reader decides whether to light the ember-lamp (it draws attention and warms the night) or carry it banked dark' },
  ],
  2: [
    { title: 'the Dune Sisters\' Well', exits: [A('Swear the well-oath for water and shelter', { setFlags: { oath: 'sworn' } }), A('Refuse the oath and pay dear for water', { setFlags: { oath: 'free' } })], brief: 'the Dune Sisters offer water in exchange for a binding oath (to answer one request later); the reader accepts or refuses' },
    { title: 'the Toll-Hut', exits: [A('Take the Salt Court\'s loan of passage', { setFlags: { debt: 'owed' } }), A('Pay the toll from your own purse', { setFlags: { debt: 'clear' } })], brief: 'a Salt Court toll-hut: take their loan (a debt, with a creditor who will collect) or pay out of the reader\'s purse' },
  ],
  3: [
    { title: 'the Rumour Market', exits: [A('Believe the vault is still full', { setFlags: { rumor: 'true' } }), A('Believe the vault was looted long ago', { setFlags: { rumor: 'false' } })], brief: 'two rival rumours about the Rain Vault; the reader decides which to believe, and it will colour how they act' },
    { title: 'the Glasswright Signal-Tower', exits: [A('Stay a night and learn the mirror-signals', { setFlags: { tongue: 'y' } }), A('Press on without the lessons', { setFlags: { tongue: 'n' } })], brief: 'a Glasswright offers to teach their mirror-signal speech in a night, at the cost of a day' },
  ],
  4: [
    { title: 'the Glass-Dust Wall', exits: [A('Wrap the Seedkey in cloth against the dust', { setFlags: { key: 'whole' } }), A('Trust the pouch and run for it', { setFlags: { key: 'cracked' } })], brief: 'the storm wall rises; the reader decides how to protect the Seedkey (wrapped and slow, or quick and risky)' },
    { title: 'the Heart of the Storm', exits: [A('Shield the lamp with your own body', { setFlags: { scar: 'y' } }), A('Let the storm take the lamp', { setFlags: { lamp: 'dark' } })], brief: 'the storm threatens to smash the ember-lamp; the reader shields it (and is burned by glass) or lets it go dark' },
  ],
  5: [
    { title: 'the Lens-Hall Door', exits: [A('Pell knows the way through the lens-hall', { when: { guide: 'pell' } }), A('Find your own way through the lens-hall', { when: { not: { guide: 'pell' } } })], brief: 'the lens-hall maze; those with Pell have a guide who knows the Glasswright maintenance ways, those without must improvise' },
    { title: 'the Sentry Terrace', exits: [A('Answer the sentries in mirror-signal', { when: { tongue: 'y' } }), A('Slip past the sentries unseen', { when: { not: { tongue: 'y' } } })], brief: 'Glasswright sentries on a terrace; those who learned the signals can talk their way past, the rest must sneak or bluff' },
  ],
  6: [
    { title: 'the Seed Halls', exits: [A('Walk the full halls you believed in', { when: { rumor: 'true' } }), A('Search the looted halls for what was missed', { when: { not: { rumor: 'true' } } })], brief: 'the seed halls; what the reader finds depends on whether they came believing the vault was full or looted' },
    { title: 'the Lock Chamber', exits: [A('Sing the Sisters\' well-song to the lock', { when: { oath: 'sworn' } }), A('Work the lock by hand', { when: { not: { oath: 'sworn' } } })], brief: 'the vault lock: sworn Dune Sisters know a well-song the lock remembers; others must work it by hand' },
  ],
};
const ENDINGS = [
  { key: 'A1', stance: 'A', title: 'The Seed Wakes', when: { key: 'whole', oath: 'sworn' }, brief: 'You open the Rain Vault to everyone: the key turns clean and the Sisters\' well-song carries; the seed goes out along every road and Candlemere is fed.' },
  { key: 'A2', stance: 'A', title: 'Opened, Unthanked', when: { key: 'whole', not: { oath: 'sworn' } }, brief: 'You open the vault to everyone and it works, but nobody sang for you and the Sisters and the Salt Court both claim the seed; you walk home with a clean key and a hard peace.' },
  { key: 'A3', stance: 'A', title: 'The Door That Stuck', when: { not: { key: 'whole' } }, brief: 'You open the vault, but the cracked key fails halfway; the door opens a hand\'s width and then freezes, and the seed spills out in a crush of hands.' },
  { key: 'B1', stance: 'B', title: 'Pell Keeps the Door', when: { guide: 'pell' }, brief: 'You seal the Rain Vault to keep the seed safe; Pell stays as its keeper and you walk home lighter, with a friend\'s promise to wait.' },
  { key: 'B2', stance: 'B', title: 'The Vault Remembers', when: { not: { guide: 'pell' } }, brief: 'You seal the vault alone and leave it to the glass; the seed is safe, but nobody remembers where the door is and the years go by.' },
  { key: 'C1', stance: 'C', title: 'Clean Hands, Heavy Pack', when: { debt: 'clear' }, brief: 'You take only the seed and run for Candlemere, owing nobody; the road is long but yours, and the fields green at the rim.' },
  { key: 'C2', stance: 'C', title: 'Light on the Road', when: { not: { debt: 'clear' }, lamp: 'lit' }, brief: 'You take the seed and run with the Salt Court\'s debt on your back; the ember-lamp still burns, and its light makes you a target and a beacon both.' },
  { key: 'C3', stance: 'C', title: 'The Dark Walk Home', when: { not: { any: [{ debt: 'clear' }, { lamp: 'lit' }] } }, brief: 'You take the seed and walk home in the dark with the Salt Court\'s debt behind you and no lamp; a long, quiet, uncertain return.' },
];

// ---------- rng
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(20261028);
const ri = (n) => Math.floor(rnd() * n);

export function build() {
  const nodes = []; const byId = new Map();
  const add = (n) => { n.exits = n.exits || []; nodes.push(n); byId.set(n.id, n); return n; };
  const ex = (to, intent, extra = {}) => ({ to, intent, ...extra });
  const wide = (r, s, l, k) => `${PFX}-${r}-${s}-${l}-${k}`;

  // prologue
  add({ id: `${PFX}-p1`, kind: 'prologue', region: 0, brief: 'Opening: the reader is a runner of the Ember-Lamp Post at Candlemere on the western rim of the dried Saltglass Basin; the town\'s harvest has failed and the elders hand over the Seedkey. The monsoon (the Return) will flood the basin in twenty days.', exits: [ex(`${PFX}-p2a`, 'Take the key at once'), ex(`${PFX}-p2b`, 'Ask the elders what they are not saying')] });
  add({ id: `${PFX}-p2a`, kind: 'prologue', region: 0, brief: 'The reader takes the Seedkey straight from the elder\'s hand; describe the key (a cold ceramic key as long as a hand) and what it opens (the Rain Vault of Prism, the last drought-proof seed hall).', exits: [ex(`${PFX}-p3`, 'Go to pack for the road')] });
  add({ id: `${PFX}-p2b`, kind: 'prologue', region: 0, brief: 'The reader questions the elders; they admit nobody has come back from Prism in twelve years and the Salt Court has been buying every well. Include the description of the Seedkey and the Rain Vault.', exits: [ex(`${PFX}-p3`, 'Go to pack for the road')] });
  add({ id: `${PFX}-p3`, kind: 'prologue', region: 0, brief: 'Packing at dawn at the Lamp-Post; the reader\'s family or friends see them off; the ember-lamp, a water skin and the Rim Road ahead.', exits: [ex(`${PFX}-1-in`, 'Step out onto the Rim Road')] });

  const flagsSetBefore = (r) => GATE_POOL.filter((g) => g.region <= r);
  const doomPlan = [];

  for (let r = 1; r <= 6; r++) {
    const cfg = REGIONS[r];
    const inId = `${PFX}-${r}-in`, c1 = `${PFX}-${r}-c1`, c2 = `${PFX}-${r}-c2`, outId = `${PFX}-${r}-out`;
    const nextOfOut = r < 6 ? `${PFX}-${r + 1}-in` : null;
    add({ id: inId, kind: 'in', region: r, brief: `Arrival in ${cfg.name}: ${cfg.theme}. The reader enters with several ways forward.` });
    add({ id: c1, kind: 'choke', region: r, brief: `Mandatory scene at ${CHOKES[r][0].title}: ${CHOKES[r][0].brief}` });
    add({ id: c2, kind: 'choke', region: r, brief: `Mandatory scene at ${CHOKES[r][1].title}: ${CHOKES[r][1].brief}` });
    add({ id: outId, kind: r < 6 ? 'out' : 'final', region: r, brief: r < 6 ? `Leaving ${cfg.name} for ${REGIONS[r + 1].name}: close this part of the journey.` : 'The final reckoning in the Rain Vault: the seed is within reach, the door open or sealed, and the reader must choose what becomes of it. Each exit is one stance.' });

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
        ['Follow the lamp-lit road', 'Cut across the common ground', 'Ask the way of a stranger', 'Take the old drovers\' track'].forEach((it, k) => srcNode.exits.push(ex(layers[0][k], it)));
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
  const stances = { A: ['Open the Rain Vault to everyone', 'sg-f-A'], B: ['Seal the vault and guard its secret', 'sg-f-B'], C: ['Take only the seed and run for Candlemere', 'sg-f-C'] };
  for (const [k, [intent, id]] of Object.entries(stances)) {
    fin.exits.push(ex(id, intent));
    const n = add({ id, kind: 'finalstance', region: 6, stance: k, brief: `The reader has chosen to ${intent.toLowerCase()}: the moment of carrying it out, with the consequences about to fall (do not decide which of the endings it is; the exits do that).` });
    for (const e of ENDINGS.filter((x) => x.stance === k)) n.exits.push(ex(`${PFX}-e-${e.key}-1`, e.title, { when: e.when, endingKey: e.key }));
  }
  for (const e of ENDINGS) {
    for (let p = 1; p <= 3; p++) {
      const id = `${PFX}-e-${e.key}-${p}`;
      const n = add({ id, kind: p === 3 ? 'ending' : 'endingpart', region: 6, endingKey: e.key, endingTitle: e.title, part: p, brief: p === 1 ? `Ending "${e.title}": ${e.brief}` : p === 2 ? `Aftermath of "${e.title}": what changes for the people of the Basin and Candlemere, weeks later.` : `Final page of "${e.title}": a closing image and a last line for the book.` });
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