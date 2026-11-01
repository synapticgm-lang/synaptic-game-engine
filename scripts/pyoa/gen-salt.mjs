#!/usr/bin/env node
/**
 * Saltglass book prose via Gemini Flash-Lite (resumable, one call at a time, model verified per call).
 *   node scripts/pyoa/gen-salt.mjs outline [--max N]   one call per region segment -> content/pyoa/saltglass/outline/r<R>s<S>.json
 *   node scripts/pyoa/gen-salt.mjs prose   [--max N]   batches of ~10 in story order -> content/pyoa/saltglass/prose/<firstId>.json
 *   node scripts/pyoa/gen-salt.mjs merge               skeleton + outline + prose -> book.json, STATUS.md
 * Exit 3 on Gemini sign-out / limit / timeout / wrong model; exit 5 on bad or refused reply. STATUS.md records where it stopped.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ask, GeminiStop, proPassGate, lastModel } from '../../tools/pyoa-gemini/gem.mjs';
import { FLAGS, REGIONS } from './salt-skeleton.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'content', 'pyoa', 'saltglass');
const MARK = join(ROOT, 'content', 'pyoa', 'flashlite-sections.json');
for (const d of ['outline', 'prose', 'raw']) mkdirSync(join(DIR, d), { recursive: true });
const skel = JSON.parse(readFileSync(join(DIR, 'skeleton.json'), 'utf8'));
const N = new Map(skel.nodes.map((n) => [n.id, n]));
const args = process.argv.slice(2);
const cmd = args[0];
const maxCalls = args.includes('--max') ? Number(args[args.indexOf('--max') + 1]) : 9999;
const MODEL = 'Flash-Lite';
const log = (m) => { const l = `${new Date().toISOString()} ${m}`; console.log(l); appendFileSync(join(DIR, 'gen-log.txt'), l + '\n'); };
const clean = (t) => t.replace(/\*+/g, '').replace(/[\u2018\u2019\uFFFD]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s*[\u2013\u2014]\s*/g, ' - ').replace(/'\?T/g, "'").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const words = (t) => t.trim().split(/\s+/).filter(Boolean).length;

// ---------- story order
const ORDER = (() => {
  const out = []; const used = new Set();
  const push = (n) => { if (n && !used.has(n.id)) { used.add(n.id); out.push(n); } };
  ['p1', 'p2a', 'p2b', 'p3'].forEach((k) => push(N.get(`sg-${k}`)));
  for (let r = 1; r <= 6; r++) {
    push(N.get(`sg-${r}-in`));
    for (let s = 0; s < 3; s++) {
      if (s === 1) push(N.get(`sg-${r}-c1`));
      if (s === 2) push(N.get(`sg-${r}-c2`));
      skel.nodes.filter((n) => n.region === r && n.seg === s).sort((a, b) => a.layer - b.layer || a.idx - b.idx).forEach(push);
      if (s >= 1) push(N.get(`sg-d-${r}-${s}`));
    }
    push(N.get(`sg-${r}-out`));
  }
  skel.nodes.forEach(push);
  return out;
})();

const WORLD = `BOOK: "The Last Lamp Across the Saltglass", an original pick-your-own-path adventure (second person, present tense, British spelling, no dice or stats of any kind).
SETTING: The Saltglass Basin is a dried inland sea: a crust of salt and fused glass with the shattered glass cities of the Old Lensfolk standing in it. The reader is a young runner of the Ember-Lamp Post of Candlemere, a lamp-town on the western rim whose harvests have failed. They carry the Seedkey (a cold ceramic key as long as a hand) to open the Rain Vault under Prism, the observatory-city at the Basin's heart, the last drought-proof seed hall. The monsoon (the Return) floods the Basin in twenty days. They also carry an ember-lamp (a banked coal-lantern).
FACTIONS: the Salt Court (toll-lords who buy wells, want the vault, lend at cruel terms); the Dune Sisters (well-keepers who trade water for a binding oath); the Glasswrights (mirror-signal sentries and lens-makers of Prism, who talk in flashes of light); Pell (a wry glass-diver who can guide the reader if hired).
TONE: bright, hard, mirage and salt, odd beauty and dry humour in the people. Low magic only (old lenses, singing glass, oaths that hold). No guns, no modern slang. Never mention sections, pages, choices as game terms, flags, stats, dice, or "you chose".`;

const KIND_RULE = {
  prologue: '90 to 150 words. Opening material of the book.',
  in: '90 to 150 words. The reader arrives in a new region with several ways forward; describe it vividly.',
  choke: '110 to 170 words. A mandatory scene where a real decision is about to be made. Make the stakes of each option concrete.',
  out: '90 to 150 words. Close this stage of the journey and look ahead to the next.',
  wide: '80 to 140 words. Self-contained: the reader may arrive from several different earlier scenes, so open with the situation, not "after ...". Ends with the reader facing a clear choice.',
  doom: '80 to 140 words. The reader\'s gamble fails and the journey ends here: vivid, a little poignant, not gruesome. No exits.',
  // C1: do not cue "must decide" — that phrase leaked into page closers
  final: '110 to 170 words. The final reckoning: the seed is within reach and its fate hangs on the stance the reader takes; each exit is one stance.',
  finalstance: '90 to 150 words. The reader carries out the stance they chose; consequences are about to fall.',
  endingpart: '100 to 170 words. Part of an ending; evocative and final in tone.',
  ending: '110 to 190 words. The last page of the book; a closing image; no exits.',
};
const flagLine = (set) => Object.entries(set).map(([f, v]) => `${FLAGS[f].desc} = ${v}`).join('; ');
const condLine = (c) => JSON.stringify(c).replace(/[{}"]/g, '').replace(/,/g, ', ').replace(/:/g, '=');

async function call(prompt, tag) {
  try {
    await proPassGate(log);
    const reply = await ask(prompt, { fresh: true, model: MODEL });
    writeFileSync(join(DIR, 'raw', `${tag}.txt`), reply);
    if (/something went wrong|having a hard time fulfilling/i.test(reply) && !/@@/.test(reply)) { log('STOP refusal/error: ' + reply.slice(0, 100).replace(/\s+/g, ' ')); status('refusal/error'); process.exit(5); }
    return reply;
  } catch (e) { log(`STOP ${e.kind || 'error'}: ${e.message}`); status(`${e.kind || 'error'}: ${e.message}`); process.exit(e instanceof GeminiStop ? 3 : 4); }
}

// ---------- outline (scene seeds)
const groups = [];
for (let r = 1; r <= 6; r++) for (let s = 0; s < 3; s++) {
  const wide = skel.nodes.filter((n) => n.region === r && n.seg === s);
  const dooms = s >= 1 ? [N.get(`sg-d-${r}-${s}`)] : [];
  groups.push({ r, s, key: `r${r}s${s}`, wide, dooms });
}
function outlinePrompt(g) {
  const reg = REGIONS[g.r];
  const anchorIn = g.s === 0 ? N.get(`sg-${g.r}-in`) : N.get(`sg-${g.r}-c${g.s}`);
  const anchorOut = g.s === 0 ? N.get(`sg-${g.r}-c1`) : g.s === 1 ? N.get(`sg-${g.r}-c2`) : N.get(`sg-${g.r}-out`);
  const L = [WORLD, '', `REGION ${g.r}: ${reg.name}. ${reg.theme}.`, `PART ${g.s + 1} of 3 of this region. The reader comes from: ${anchorIn.brief}`, `This part ends at: ${anchorOut.brief}`, '',
    `TASK: invent ${g.wide.length + g.dooms.length} DISTINCT scenes for this part, one per id below. Layers run in story order (layer 0 first); a scene in one layer can be reached from several scenes in the previous one, so each scene must stand alone. Layers widen then narrow like a river delta: early layers should feel like different ways of starting the stretch; late layers should feel like routes converging toward the next mandatory scene. Every scene must differ in place, person or problem from all the others: no repeated ideas, no repeated names. Use few named characters; give each new name once only. Each is ONE sentence of 15 to 30 words: place + situation + what is at stake. Keep the region's theme throughout.`, ''];
  const layers = new Map(); for (const n of g.wide) { if (!layers.has(n.layer)) layers.set(n.layer, []); layers.get(n.layer).push(n); }
  for (const [l, ns] of [...layers].sort((a, b) => a[0] - b[0])) {
    L.push(`LAYER ${l}:`);
    for (const n of ns) L.push(`- ${n.id}${n.priv ? ` (a BOON scene, reachable only because ${n.priv.why}; make it a lucky chance, shortcut or insight)` : ''}`);
  }
  for (const d of g.dooms) L.push('', `DOOM scene: - ${d.id} (a reckless gamble in this part that ends the journey badly)`);
  L.push('', 'OUTPUT FORMAT, exactly, no preamble, no markdown, one line each, ids exactly as given:', '@@SEED <id> | <the scene in one sentence>', '@@DONE');
  return L.join('\n');
}
async function runOutline() {
  let calls = 0;
  for (const g of groups) {
    const f = join(DIR, 'outline', `${g.key}.json`);
    if (existsSync(f)) continue;
    if (calls >= maxCalls) break;
    const need = g.wide.length + g.dooms.length;
    log(`ask outline ${g.key} (${need} seeds)`);
    const reply = await call(outlinePrompt(g), `outline-${g.key}`); calls++;
    const seeds = {};
    for (const line of reply.split(/\n/).map((s) => clean(s))) { const m = line.match(/^@@SEED\s+(\S+)\s*\|\s*(.+)$/); if (m && N.has(m[1])) seeds[m[1]] = m[2]; }
    const got = Object.keys(seeds).length;
    if (got < need * 0.7) { log(`STOP outline ${g.key}: only ${got}/${need} seeds parsed`); status(`outline ${g.key} short ${got}/${need}`); process.exit(5); }
    writeFileSync(f, JSON.stringify({ seeds, model: lastModel }, null, 1));
    log(`done outline ${g.key}: ${got}/${need} model=${lastModel}`);
    await sleep(6000);
  }
  log(`finished outline run: calls ${calls}`);
}
function loadSeeds() { const o = {}; for (const f of readdirSync(join(DIR, 'outline'))) Object.assign(o, JSON.parse(readFileSync(join(DIR, 'outline', f), 'utf8')).seeds); return o; }
const briefOf = (n, S) => (n.kind === 'wide' || n.kind === 'doom') ? (S[n.id] || `a scene in ${REGIONS[n.region].name}: ${REGIONS[n.region].theme}`) : n.brief;

// ---------- prose
function makeBatches() {
  const out = []; let cur = [];
  for (let i = 0; i < ORDER.length; i++) {
    const n = ORDER[i]; cur.push(n);
    const nx = ORDER[i + 1];
    const sameEnd = nx && n.endingKey && nx.endingKey === n.endingKey;
    if ((cur.length >= 10 && !sameEnd) || cur.length >= 13 || !nx) { out.push(cur); cur = []; }
  }
  return out;
}
function prosePrompt(batch, S, prevDigest) {
  const inB = new Set(batch.map((n) => n.id));
  const r0 = batch[0].region;
  const L = [WORLD, '', r0 >= 1 ? `CURRENT REGION ${r0}: ${REGIONS[r0].name}. ${REGIONS[r0].theme}.` : 'PROLOGUE.'];
  if (prevDigest) L.push('', 'FOR CONTINUITY ONLY (the previous scenes written, do not repeat):', prevDigest);
  // C1: ban label "// id" leaks, Will-you/Or stubs, decide-closers, truncated endings
  L.push('', 'Write the scenes below. They are linked pages; the exits list where each leads, so the prose must set up those moves. Rules:',
    '- Second person, present tense, concrete and sensory; vary openings and rhythm; no two scenes in this batch may start with the same word.',
    '- Obey each scene\'s word range. One or two paragraphs. No lists. Never mention game mechanics, flags, sections, pages or dice.',
    '- Follow each brief; do not contradict it. Scenes stand alone: do not assume which earlier scene the reader came from, and do not decide anything big for the reader.',
    '- Keep invented names simple and consistent; a name introduced in one scene may only be reused in that scene.',
    '- Never write "you must decide/choose", "decide whether", "will you ... or ...", or a lone "Or ..." line; the EXIT labels are the choices. End on a concrete action or image, with a full stop (no trailing spaces, no cut-off sentence).',
    '- Each EXIT line gets a short imperative label (3 to 9 words), in the order listed; labels in one scene must differ; never put "//", a section id, or destination id in a label. If an exit has a "must express" note, the label must clearly express it. Gated exits ("only offered if") should read naturally as an option the reader has earned.', '');
  for (const n of batch) {
    L.push(`SECTION ${n.id} | kind: ${n.kind} | ${KIND_RULE[n.kind]}`);
    const b = briefOf(n, S); if (b) L.push(`  brief: ${b}`);
    if (n.priv) L.push(`  this scene is only reachable by a reader for whom: ${n.priv.why}. Make that clear in the prose without naming it as a rule.`);
    if (n.endingTitle) L.push(`  ending title: "${n.endingTitle}"`);
    n.exits.forEach((e, i) => {
      const t = N.get(e.to);
      const tin = inB.has(e.to) ? '(in this batch)' : `(elsewhere: ${t.kind === 'wide' || t.kind === 'doom' ? (S[t.id] || '').slice(0, 110) : (t.brief || '').slice(0, 110)})`;
      const bits = [];
      if (e.intent) bits.push(`must express: "${e.intent}"`);
      if (e.when) bits.push(`only offered if: ${e.privWhy || condLine(e.when)}`);
      if (e.setFlags) bits.push(`this choice commits the reader: ${flagLine(e.setFlags)}`);
      if (e.doomOf) bits.push('this is a reckless gamble that will end badly');
      if (e.back) bits.push('leads back to an earlier scene');
      L.push(`  EXIT ${i + 1} -> ${e.to} ${tin}${bits.length ? ' [' + bits.join('; ') + ']' : ''}`);
    });
    if (!n.exits.length) L.push('  (no exits: this ends the book.)');
    L.push('');
  }
  // C1: " // " is TEXT-only paragraph glue; models were copying it into EXIT labels and Will-you stubs
  L.push('OUTPUT FORMAT, exactly, no preamble, no markdown, one block per scene in the order given:', '@@SECTION <id>', 'TITLE: <2 to 5 words>', 'TEXT: <the prose; if two paragraphs, join them with the three characters space-slash-slash-space, and nowhere else>', 'EXIT 1: <label>', 'EXIT 2: <label>   (as many as the scene has exits)', '@@END');
  return L.join('\n');
}
function parseProse(raw) {
  const out = new Map();
  const re = /@@SECTION\s+(\S+)\s*\n([\s\S]*?)@@END/g; let m;
  while ((m = re.exec(raw))) {
    const body = m[2];
    const g = (k) => { const mm = body.match(new RegExp(`^${k}:\\s*([\\s\\S]*?)(?=\\n(?:TITLE|TEXT|EXIT \\d+):|$)`, 'm')); return mm ? clean(mm[1].replace(/\s+/g, ' ')) : ''; };
    const exits = []; const er = /^EXIT (\d+):\s*(.+)$/gm; let em;
    while ((em = er.exec(body))) exits[Number(em[1]) - 1] = clean(em[2]);
    out.set(m[1], { title: g('TITLE'), text: g('TEXT').replace(/\s*\/\/\s*/g, '\n\n'), exits });
  }
  return out;
}
function problems(n, p) {
  const e = [];
  if (!p) return ['missing'];
  const w = words(p.text);
  if (w < 55 || w > 280) e.push(`words ${w}`);
  if (!p.title || p.title.length > 48) e.push('title');
  if (/@@|\b(dice|you rolled|stat check|target number|flag)\b|as an ai|\bsection\b/i.test(p.text)) e.push('meta words');
  // C1: reject leaked "// id" labels, Will-you/Or stubs, decide-closers, truncated endings
  if (/\byou must (?:now )?(?:decide|choose)\b|decide whether|\bwill you\b|\n\nOr /i.test(p.text)) e.push('signpost stub');
  if (p.text !== p.text.trimEnd() || !/[.!?]"?$/.test(p.text.trimEnd())) e.push('trailing ws/nopunct');
  for (let i = 0; i < n.exits.length; i++) {
    const lab = p.exits[i] || '';
    if (!lab || lab.length < 4 || lab.length > 76) e.push(`exit ${i + 1} label`);
    else if (/\/\//.test(lab) || /\b[a-z]{2}-\d/.test(lab)) e.push(`exit ${i + 1} id-leak`);
  }
  return e;
}
function markFlash(ids, batchId) {
  const j = existsSync(MARK) ? JSON.parse(readFileSync(MARK, 'utf8')) : { books: {} };
  j.books = j.books || {};
  const b = j.books.saltglass || { model: 'flash-lite (verified per call on the mode picker)', kind: 'new book, all prose, titles and exit labels', slug: 'saltglass', path: 'content/pyoa/saltglass', sections: [], batches: [] };
  const set = new Set(b.sections); ids.forEach((id) => set.add(id)); b.sections = [...set];
  b.batches.push({ batch: batchId, model: lastModel, at: new Date().toISOString(), n: ids.length });
  j.books.saltglass = b; j.updated = new Date().toISOString();
  writeFileSync(MARK, JSON.stringify(j, null, 1));
}
async function runProse() {
  const S = loadSeeds();
  if (Object.keys(S).length < 300) { log('STOP outline missing: run "outline" first'); status('outline missing'); process.exit(5); }
  const batches = makeBatches();
  let calls = 0, done = 0;
  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    const f = join(DIR, 'prose', `${batch[0].id}.json`);
    if (existsSync(f)) { done++; continue; }
    if (calls >= maxCalls) break;
    // outline coverage guard: only write batches whose seeds exist (else fall back to region theme)
    let prevDigest = '';
    if (bi > 0) { const pf = join(DIR, 'prose', `${batches[bi - 1][0].id}.json`); if (existsSync(pf)) { const pj = JSON.parse(readFileSync(pf, 'utf8')); prevDigest = Object.entries(pj.sections).slice(-2).map(([id, s]) => `${id} "${s.title}": ${s.text.split(/(?<=[.!?])\s/)[0]}`).join('\n'); } }
    let missing = batch.slice(); const got = {};
    for (let a = 0; a < 2 && missing.length; a++) {
      log(`ask prose ${batch[0].id}..${batch.at(-1).id} items=${missing.length} attempt=${a}`);
      const reply = await call(prosePrompt(missing, S, prevDigest), `${batch[0].id}.a${a}`); calls++;
      const p = parseProse(reply);
      for (const n of missing) { const pr = problems(n, p.get(n.id)); if (!pr.length) got[n.id] = p.get(n.id); else log(`  reject ${n.id}: ${pr.join(',')}`); }
      missing = missing.filter((n) => !got[n.id]);
      await sleep(6000);
    }
    if (!Object.keys(got).length) { log('STOP no valid sections for ' + batch[0].id); status('no valid sections for ' + batch[0].id); process.exit(5); }
    const ordered = {}; for (const n of batch) if (got[n.id]) ordered[n.id] = got[n.id];
    writeFileSync(f, JSON.stringify({ batch: batch[0].id, model: lastModel, sections: ordered, missing: missing.map((n) => n.id) }, null, 1));
    markFlash(Object.keys(ordered), batch[0].id);
    log(`done ${batch[0].id}: ${Object.keys(ordered).length}/${batch.length} model=${lastModel}${missing.length ? ' MISSING ' + missing.map((n) => n.id).join(',') : ''}`);
    done++;
  }
  log(`finished prose run: calls ${calls}, batches done ${done}/${batches.length}`);
  status(done === batches.length ? 'complete' : 'run ended (call cap)');
}
function loadProse() { const prose = {}; for (const f of readdirSync(join(DIR, 'prose'))) Object.assign(prose, JSON.parse(readFileSync(join(DIR, 'prose', f), 'utf8')).sections); return prose; }
function runMerge() {
  const S = loadSeeds(); const prose = loadProse(); let filled = 0; const missingIds = [];
  const nodes = skel.nodes.map((n) => {
    const p = prose[n.id];
    const o = { ...n, brief: briefOf(n, S) };
    if (!p) { missingIds.push(n.id); o.exits = n.exits.map((e) => ({ ...e, label: e.intent || 'Go on' })); return o; }
    filled++; o.title = p.title; o.page = p.text;
    o.exits = n.exits.map((e, i) => ({ ...e, label: p.exits[i] || e.intent || 'Go on' }));
    return o;
  });
  writeFileSync(join(DIR, 'book.json'), JSON.stringify({ title: skel.title, slug: skel.slug, start: skel.start, nodes }, null, 1));
  const totalWords = nodes.reduce((s, n) => s + words(n.page || ''), 0);
  log(`merge: sections ${nodes.length}, with prose ${filled}, missing ${missingIds.length}, words ${totalWords}`);
  status('merge');
}
function status(reason) {
  try {
    const prose = loadProse(); const have = Object.keys(prose).length; const missing = ORDER.filter((n) => !prose[n.id]);
    const outl = readdirSync(join(DIR, 'outline')).length;
    const s = `# Saltglass book status\n\nUpdated: ${new Date().toISOString()} (UTC; London = UTC+0 on this date)\nLast event: ${reason}\nSections with prose: ${have}/${skel.nodes.length}\nOutline parts done: ${outl}/18\nNext section to write (story order): ${missing[0]?.id || 'none'}\nModel: Flash-Lite only (verified on the mode picker before every call)\nResume: \`node scripts/pyoa/gen-salt.mjs outline\` then \`node scripts/pyoa/gen-salt.mjs prose\`, then \`merge\` and \`node scripts/pyoa/lint-salt.mjs\`. The driver pauses from 11:55 on 28 Oct 2026 until content/pyoa/PRO-PASS-DONE or PRO-PASS-RELEASE exists.\n`;
    writeFileSync(join(DIR, 'STATUS.md'), s);
  } catch (e) { /* ignore */ }
}

if (cmd === 'outline') { await runOutline(); status('outline run ended'); }
else if (cmd === 'prose') await runProse();
else if (cmd === 'merge') runMerge();
else { console.log('usage: gen-salt.mjs outline|prose|merge [--max N]'); process.exit(2); }