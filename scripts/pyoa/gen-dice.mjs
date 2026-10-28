#!/usr/bin/env node
/**
 * Dice book prose via Gemini web (resumable, one call at a time).
 *   node scripts/pyoa/gen-dice.mjs outline [--max N]     one call per region -> content/pyoa/dice/outline/region-N.json
 *   node scripts/pyoa/gen-dice.mjs prose   [--max N]     batches of <=13 sections -> content/pyoa/dice/prose/<firstId>.json
 *   node scripts/pyoa/gen-dice.mjs merge                 skeleton + outline + prose -> content/pyoa/dice/book.json + report
 * Stops (exit 3) on Gemini sign-out / limit / timeout; exit 5 on a bad or refused reply. No retries beyond one re-ask of missing items.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ask, GeminiStop } from '../../tools/pyoa-gemini/gem.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'content', 'pyoa', 'dice');
for (const d of ['outline', 'prose', 'raw']) mkdirSync(join(DIR, d), { recursive: true });
const skel = JSON.parse(readFileSync(join(DIR, 'skeleton.json'), 'utf8'));
const NODES = skel.nodes;
const N = new Map(NODES.map((n) => [n.id, n]));
const args = process.argv.slice(2);
const cmd = args[0];
const maxCalls = args.includes('--max') ? Number(args[args.indexOf('--max') + 1]) : 999;
const log = (m) => { const l = `${new Date().toISOString()} ${m}`; console.log(l); appendFileSync(join(DIR, 'gen-log.txt'), l + '\n'); };
const clean = (t) => t.replace(/\*+/g, '').replace(/[\u2018\u2019\uFFFD]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s*[\u2013\u2014]\s*/g, ' - ').replace(/'\?T/g, "'").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WORLD = `BOOK: "The Tide That Did Not Return", an original dark-fantasy gamebook (second person, present tense, British spelling). Three days ago the sea left the Wrack Coast and did not come back; the open seabed ("the Low") lies bare to the horizon with wrecks, drowned streets, whale bones and things never meant to see the sun. The reader is a wrecker of the cliff-town Gullmouth, a licensed scavenger. Their mentor, the lighthouse keeper Orsolya Venn, is missing. A sealed note says the Meridian Gear, the great mechanism the old Tidewardens built to command the sea, has jammed at the foot of the Sunken Stair; whoever turns it decides where the sea goes first. There is a tide clock. Everyone wants the Gear.
TONE: salt-and-bone, wet, strange, melancholy, with some dry humour in the people. Low magic (bargains, relics, omens). No guns, no modern slang. Never mention dice, rolls, stats, targets, marks, sections, pages or "you chose".
PLACES: Gullmouth (cliff-town of wreckers and net-menders; harbour dry, boats stranded; rival crews, the Customs-Priest, the pawn-widow, the ferryman with no river). The Low (wreck-fields, a stranded leviathan carcass used as a market, salt-flats crusting over sinkholes, tide-pool shrines, the Singing Dunes). Saltspire (a city on stilts far out on the seabed, built by the wealthy Brineholders who sell water; rooftops and ladders). The Sunken Stair (spiral shaft to the Gear, home of the Hollow Choir and the last Tidewarden).
FACTIONS: the Brineholders (money, order); the Gullmouth Wreckers' Guild (your own people); the Drift Pilgrims (the sea is a god in sulk); the Hollow Choir (drowned who never left); the Last Tidewarden (an automaton-archivist bound by oaths).
STATS the engine rolls: MIGHT, WIT, NERVE, CRAFT. Resources: Vigor (health), Tide (clock), Supplies, Coin.`;

const REGION_NOTE = [
  'Region 0, THE EBB (prologue): the lamp room, the note, learning the first check with a gentle, low-stakes roll.',
  'Region 1, GULLMOUTH AND THE WRACK COAST (Act I hub): rival crews, the guild, the pawn-widow, the Customs-Priest, clues to Orsolya; the player picks an ally.',
  'Region 2, THE LOW (the seabed trek): wreck-fields, the leviathan market, the Singing Dunes, the Drift Pilgrims; resource pressure from Tide and Supplies.',
  'Region 3, SALTSPIRE (stilt-city intrigue): Brineholders, a heist or a bargain, a route to the Stair.',
  'Region 4, THE SUNKEN STAIR: the descent, the Hollow Choir, the last Tidewarden, a moral trial.',
  'Region 5, THE TURN OF THE TIDE (finale): the Gear itself, the final choices, the water coming; when the Tide clock hits 12 the finale is forced.',
];

async function call(prompt, tag) {
  try {
    const reply = await ask(prompt, { fresh: true });
    writeFileSync(join(DIR, 'raw', `${tag}.txt`), reply);
    if (/something went wrong|having a hard time fulfilling/i.test(reply) && !/@@/.test(reply)) { log('STOP refusal/error: ' + reply.slice(0, 100).replace(/\s+/g, ' ')); process.exit(5); }
    return reply;
  } catch (e) { log(`STOP ${e.kind || 'error'}: ${e.message}`); process.exit(e instanceof GeminiStop ? 3 : 4); }
}

// ---------- structure helpers
const hubsOf = (r) => NODES.filter((n) => n.region === r && n.kind === 'hub');
const chainsOf = (hubId) => [...new Set(NODES.filter((n) => n.chain && n.chain.startsWith(hubId + '/')).map((n) => n.chain))];

function outlinePrompt(r) {
  const regionNodes = NODES.filter((n) => n.region === r);
  const bns = regionNodes.filter((n) => n.kind === 'bottleneck');
  const hubs = regionNodes.filter((n) => n.kind === 'hub');
  const prev = r > 0 ? `The previous region ended with: see region ${r - 1}.` : '';
  const L = [WORLD, '', REGION_NOTE[r], prev, '',
    r === 5 ? 'The ending selector section at the very end of region 5 routes to 12 endings: Return the Sea Gently, Drown Saltspire, Drown Gullmouth, Keep the Gear, Sell the Sea, The Choir\'s Choir, The Long Dry, Orsolya\'s Way, The Wreckers\' Tide, Pilgrim King, Spent, The Quiet Sand.' : '',
    `TASK: plan this region's story as an outline. The region has ${bns.length} MANDATORY scenes (bottlenecks: every reader passes through them, in order), ${hubs.length} HUBS (the reader chooses among 3-5 branches, in any order, and may come back), and the branches (chains) listed below. A chain is: a scene or two, then a risky moment (a stat check), then a reward page (an item, ally, secret, favour or debt the reader keeps), with a recovery page if the risk goes badly (it costs something but the story goes on).`,
    'Make the region a coherent journey: the bottlenecks advance the plot in order; each hub is one location or situation (give it a short place name); each chain is one memorable thing to do there with a concrete reward that could matter later. Avoid repeating ideas. Keep every line to one sentence of 15 to 35 words. No new names beyond the ones given unless needed, and give any new name once only.',
    '', 'BOTTLENECKS in story order:', ...bns.map((b) => `- ${b.id}${b.role === 'ending-selector' ? ' (ending selector: the final reckoning)' : ''}`),
    '', 'HUBS (each follows the bottleneck before it), with chain ids:'];
  for (const h of hubs) { L.push(`- ${h.id}: chains ${chainsOf(h.id).map((c) => `${c} (${NODES.filter((n) => n.chain === c).length} sections, check ${N.get(NODES.find((n) => n.chain === c && n.kind === 'check').id).check.stat})`).join(', ')}`); }
  L.push('', 'OUTPUT FORMAT, exactly, no preamble, no markdown, one line each, ids exactly as given:',
    '@@BEAT <bottleneck id> | <the mandatory story beat>', '@@HUB <hub id> | <place name> | <the situation>', '@@CHAIN <chain id> | <what the reader does, what the risk is, what the reward is>', '@@DONE');
  return L.join('\n');
}

async function runOutline() {
  let calls = 0;
  for (let r = 0; r <= 5; r++) {
    const f = join(DIR, 'outline', `region-${r}.json`);
    if (existsSync(f)) continue;
    if (calls >= maxCalls) break;
    const regionNodes = NODES.filter((n) => n.region === r);
    const need = regionNodes.filter((n) => n.kind === 'bottleneck').length + regionNodes.filter((n) => n.kind === 'hub').length + new Set(regionNodes.filter((n) => n.chain).map((n) => n.chain)).size;
    log(`ask outline region ${r} (${need} lines)`);
    const reply = await call(outlinePrompt(r), `outline-${r}`); calls++;
    const out = { beats: {}, hubs: {}, chains: {} };
    for (const line of reply.split(/\n/).map((s) => clean(s))) {
      let m;
      if ((m = line.match(/^@@BEAT\s+(\S+)\s*\|\s*(.+)$/))) out.beats[m[1]] = m[2];
      else if ((m = line.match(/^@@HUB\s+(\S+)\s*\|\s*([^|]+)\|\s*(.+)$/))) out.hubs[m[1]] = { place: m[2].trim(), situation: m[3] };
      else if ((m = line.match(/^@@CHAIN\s+(\S+)\s*\|\s*(.+)$/))) out.chains[m[1]] = m[2];
    }
    const got = Object.keys(out.beats).length + Object.keys(out.hubs).length + Object.keys(out.chains).length;
    if (got < need * 0.9) { log(`STOP outline region ${r}: only ${got}/${need} lines parsed`); process.exit(5); }
    writeFileSync(f, JSON.stringify(out, null, 1));
    log(`done outline region ${r}: ${got}/${need}`);
    await sleep(8000);
  }
  log(`finished outline run: calls ${calls}`);
}

function loadOutline() {
  const o = { beats: {}, hubs: {}, chains: {} };
  for (let r = 0; r <= 5; r++) {
    const f = join(DIR, 'outline', `region-${r}.json`);
    if (!existsSync(f)) continue;
    const j = JSON.parse(readFileSync(f, 'utf8'));
    Object.assign(o.beats, j.beats); Object.assign(o.hubs, j.hubs); Object.assign(o.chains, j.chains);
  }
  return o;
}

function briefOf(n, O) {
  if (n.kind === 'bottleneck') return O.beats[n.id] || '';
  if (n.kind === 'hub') { const h = O.hubs[n.id]; return h ? `${h.place}: ${h.situation}` : ''; }
  if (n.chain) return O.chains[n.chain] || '';
  if (n.endingKey) return `Ending "${n.endingTitle}"`;
  return '';
}

function makeBatches() {
  const out = []; let cur = [];
  for (let i = 0; i < NODES.length; i++) {
    const n = NODES[i];
    cur.push(n);
    const nx = NODES[i + 1];
    const sameChain = nx && n.chain && nx.chain === n.chain;
    if ((cur.length >= 10 && !sameChain) || cur.length >= 13 || !nx || (nx.endingKey && n.endingKey !== nx.endingKey && cur.length >= 6)) { out.push(cur); cur = []; }
  }
  return out;
}

const KIND_RULE = {
  bottleneck: 'A mandatory story scene. 110 to 190 words. It moves the main plot on.',
  hub: 'A place where the reader chooses where to go next. 90 to 160 words, describing the place and tempting each way on (the exit labels do the choosing).',
  scene: 'An ordinary scene on a branch. 80 to 150 words. Ends with a clear single move on.',
  check: 'A risky moment: the reader must attempt something using the named stat. 80 to 140 words describing the danger and what they try, ending at the instant before the outcome. Give CHECK label (3 to 8 words, the attempt). Do NOT say how it turns out.',
  recovery: 'The reader FAILED the risk. 80 to 140 words: what goes wrong and what it costs them (a wound, lost time, lost supplies, a debt, a scar). They survive and the story goes on. Never a dead end, never a death.',
  reward: 'The reader got through (cleanly, or at a small cost). 80 to 140 words, written so it reads right either way ("however narrowly"), and gives them one concrete keepsake: an item, ally, secret, favour or debt. Give GRANT: a short noun phrase (2 to 5 words) naming it.',
  'ending-part': 'A part of an ending sequence (verdict, aftermath). 100 to 170 words, evocative and final in tone, continuing from the previous part.',
  ending: 'The final section of an ending. 110 to 190 words, a coda that closes the book; no exits.',
};

function prosePrompt(batch, O, prevDigest) {
  const inB = new Set(batch.map((n) => n.id));
  const L = [WORLD, '', REGION_NOTE[batch[0].region] || ''];
  if (prevDigest) L.push('', 'THE STORY JUST BEFORE THIS BATCH (for continuity, do not repeat):', prevDigest);
  L.push('', 'Write the sections below. They are linked pages of the gamebook; exits list where each leads, so the prose must set up those moves. Rules:',
    '- Second person, present tense, concrete and sensory; vary openings and sentence rhythm; no section may start with the same word as another in this batch.',
    '- Obey each section\'s word range. One or two paragraphs. No lists. Do not mention game mechanics, stats, numbers, dice or "sections".',
    '- Follow the brief given for each section; do not contradict neighbouring sections. Do not decide anything big for the reader.',
    '- Characters and places may be referred to only as given in the briefs or the world notes; if you invent a name, keep it simple and use it consistently.',
    '- Each EXIT line gives a short imperative label (3 to 8 words) for that exit, in the order listed; labels in one section must differ and must not name the destination id.', '');
  for (const n of batch) {
    L.push(`SECTION ${n.id} | kind: ${n.kind} | ${KIND_RULE[n.kind]}`);
    const b = briefOf(n, O); if (b) L.push(`  brief: ${b}`);
    if (n.chain && n.kind !== 'scene') { const ck = NODES.find((x) => x.chain === n.chain && x.kind === 'check'); if (ck && n.kind === 'check') L.push(`  stat tested: ${ck.check.stat}`); }
    if (n.role === 'ending-selector') L.push('  This is the final reckoning: describe the moment the Gear is within reach and the sea about to choose; each exit is one way to end the book.');
    const ex = n.kind === 'check' ? [] : n.exits;
    ex.forEach((e, i) => {
      const t = N.get(e.to);
      const tin = inB.has(e.to) ? '(in this batch)' : `(elsewhere: ${t.kind}${briefOf(t, O) ? ' - ' + briefOf(t, O).slice(0, 140) : ''})`;
      const extra = e.label.startsWith('ending:') ? ` ending "${t.endingTitle}"` : '';
      L.push(`  EXIT ${i + 1} -> ${e.to} ${tin}${extra}`);
    });
    if (n.kind === 'check') L.push('  (no exits: the engine rolls and routes. Give CHECK instead.)');
    if (n.ending) L.push('  (no exits: this ends the book.)');
    L.push('');
  }
  L.push('OUTPUT FORMAT, exactly, no preamble, no markdown, one block per section in the order given:',
    '@@SECTION <id>', 'TITLE: <2 to 5 words>', 'TEXT: <the prose, one paragraph or two separated by " // ">', 'CHECK: <label>   (check sections only)', 'GRANT: <noun phrase>   (reward sections only)', 'EXIT 1: <label>', 'EXIT 2: <label>   (as many as the section has exits)', '@@END');
  return L.join('\n');
}

function parseProse(raw) {
  const out = new Map();
  const re = /@@SECTION\s+(\S+)\s*\n([\s\S]*?)@@END/g; let m;
  while ((m = re.exec(raw))) {
    const body = m[2];
    const g = (k) => { const mm = body.match(new RegExp(`^${k}:\\s*([\\s\\S]*?)(?=\\n(?:TITLE|TEXT|CHECK|GRANT|EXIT \\d+):|$)`, 'm')); return mm ? clean(mm[1].replace(/\s+/g, ' ')) : ''; };
    const exits = []; const er = /^EXIT (\d+):\s*(.+)$/gm; let em;
    while ((em = er.exec(body))) exits[Number(em[1]) - 1] = clean(em[2]);
    out.set(m[1], { title: g('TITLE'), text: g('TEXT').replace(/\s*\/\/\s*/g, '\n\n'), check: g('CHECK'), grant: g('GRANT'), exits });
  }
  return out;
}
const words = (t) => t.trim().split(/\s+/).filter(Boolean).length;
function problems(n, p) {
  const e = [];
  if (!p) return ['missing'];
  const w = words(p.text);
  if (w < 55 || w > 280) e.push(`words ${w}`);
  if (!p.title || p.title.length > 48) e.push('title');
  if (/@@|\b(dice|you rolled|2d6|d20|stat check|target number)\b|as an ai|\bsection\b/i.test(p.text)) e.push('meta words');
  if (n.kind === 'check' && (!p.check || p.check.length < 8 || p.check.length > 70)) e.push('check label');
  if (n.kind === 'reward' && (!p.grant || p.grant.length > 48)) e.push('grant');
  if (n.kind !== 'check' && !n.ending) for (let i = 0; i < n.exits.length; i++) if (!p.exits[i] || p.exits[i].length < 6 || p.exits[i].length > 72) e.push(`exit ${i + 1} label`);
  return e;
}

async function runProse() {
  const O = loadOutline();
  if (Object.keys(O.chains).length < 100) { log('STOP outline missing: run "outline" first'); process.exit(5); }
  const batches = makeBatches();
  let calls = 0, done = 0;
  for (const batch of batches) {
    const f = join(DIR, 'prose', `${batch[0].id}.json`);
    if (existsSync(f)) { done++; continue; }
    if (calls >= maxCalls) break;
    const idx = batches.indexOf(batch);
    let prevDigest = '';
    for (let j = idx - 1; j >= 0 && !prevDigest; j--) {
      const pf = join(DIR, 'prose', `${batches[j][0].id}.json`);
      if (existsSync(pf)) { const pj = JSON.parse(readFileSync(pf, 'utf8')); prevDigest = Object.entries(pj.sections).slice(-3).map(([id, s]) => `${id} "${s.title}": ${s.text.split(/(?<=[.!?])\s/)[0]}`).join('\n'); }
      break;
    }
    let missing = batch.slice(); const got = {};
    for (let a = 0; a < 2 && missing.length; a++) {
      log(`ask prose ${batch[0].id}..${batch.at(-1).id} items=${missing.length} attempt=${a}`);
      const reply = await call(prosePrompt(missing, O, prevDigest), `${batch[0].id}.a${a}`); calls++;
      const p = parseProse(reply);
      for (const n of missing) { const pr = problems(n, p.get(n.id)); if (!pr.length) got[n.id] = p.get(n.id); else log(`  reject ${n.id}: ${pr.join(',')}`); }
      missing = missing.filter((n) => !got[n.id]);
      await sleep(8000);
    }
    if (!Object.keys(got).length) { log('STOP no valid sections for ' + batch[0].id); process.exit(5); }
    const ordered = {}; for (const n of batch) if (got[n.id]) ordered[n.id] = got[n.id];
    writeFileSync(f, JSON.stringify({ batch: batch[0].id, sections: ordered, missing: missing.map((n) => n.id) }, null, 1));
    log(`done ${batch[0].id}: ${Object.keys(ordered).length}/${batch.length}${missing.length ? ' MISSING ' + missing.map((n) => n.id).join(',') : ''}`);
    done++;
  }
  log(`finished prose run: calls ${calls}, batches done ${done}/${batches.length}`);
}

async function runFill() {
  const O = loadOutline();
  let calls = 0;
  for (const f of readdirSync(join(DIR, 'prose'))) {
    const fp = join(DIR, 'prose', f);
    const j = JSON.parse(readFileSync(fp, 'utf8'));
    if (!j.missing?.length) continue;
    if (calls >= maxCalls) break;
    const need = j.missing.map((id) => N.get(id));
    const ids = need.map((n) => n.id);
    const ctx = Object.entries(j.sections).slice(-3).map(([id, s]) => `${id} "${s.title}": ${s.text.split(/(?<=[.!?])\s/)[0]}`).join('\n');
    log(`ask fill ${f} items=${need.length}`);
    const reply = await call(prosePrompt(need, O, ctx), `fill-${f.replace('.json', '')}`); calls++;
    const p = parseProse(reply);
    for (const n of need) { const pr = problems(n, p.get(n.id)); if (!pr.length) j.sections[n.id] = p.get(n.id); else log(`  reject ${n.id}: ${pr.join(',')}`); }
    const ord = {}; for (const n of NODES) if (j.sections[n.id]) ord[n.id] = j.sections[n.id];
    j.sections = ord; j.missing = ids.filter((id) => !ord[id]);
    writeFileSync(fp, JSON.stringify(j, null, 1));
    log(`filled ${f}: still missing ${j.missing.length}`);
    await sleep(8000);
  }
  log(`finished fill run: calls ${calls}`);
}
function runMerge() {
  const O = loadOutline();
  const prose = {};
  for (const f of readdirSync(join(DIR, 'prose'))) Object.assign(prose, JSON.parse(readFileSync(join(DIR, 'prose', f), 'utf8')).sections);
  let filled = 0, missingIds = [];
  const nodes = NODES.map((n) => {
    const p = prose[n.id];
    const o = { ...n, brief: briefOf(n, O) };
    if (!p) { missingIds.push(n.id); return o; }
    filled++;
    o.title = p.title; o.page = p.text;
    if (p.grant) o.grant = p.grant;
    if (n.kind === 'check') o.check = { ...n.check, label: p.check };
    else o.exits = n.exits.map((e, i) => ({ ...e, label: e.label.startsWith('ending:') ? e.label : (p.exits[i] || e.label), ...(e.label.startsWith('ending:') ? { hint: p.exits[i] } : {}) }));
    return o;
  });
  writeFileSync(join(DIR, 'book.json'), JSON.stringify({ title: skel.title, dice: skel.dice, start: skel.start, nodes }, null, 1));
  const totalWords = nodes.reduce((s, n) => s + words(n.page || ''), 0);
  const rep = `sections ${nodes.length}, with prose ${filled}, missing ${missingIds.length}, words ${totalWords}`;
  log('merge: ' + rep);
  writeFileSync(join(DIR, 'PROGRESS.md'), `# Dice book progress\n\n${rep}\n\nOutline regions done: ${[0, 1, 2, 3, 4, 5].filter((r) => existsSync(join(DIR, 'outline', `region-${r}.json`))).join(', ') || 'none'}\n\nFirst missing: ${missingIds.slice(0, 5).join(', ')}\n`);
}

if (cmd === 'outline') await runOutline();
else if (cmd === 'prose') await runProse();
else if (cmd === 'fill') await runFill();
else if (cmd === 'merge') runMerge();
else { console.log('usage: gen-dice.mjs outline|prose|merge [--max N]'); process.exit(2); }
