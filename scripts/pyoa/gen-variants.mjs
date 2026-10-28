#!/usr/bin/env node
/**
 * Draft Umbra "payoff" text inserts through the Gemini web app (resumable).
 *   node scripts/pyoa/gen-variants.mjs [--max N] [--only substr]
 * Writes content/pyoa/umbra/raw/<group>.txt and overlay/v-<group>.json. Skips groups already done.
 * Stops (exit 3) on Gemini sign-out / limit / timeout. No hammering: one call at a time, pause between calls.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ask, GeminiStop } from '../../tools/pyoa-gemini/gem.mjs';
import { TRACKS, FLAG_MEANING, allItems } from './umbra-plan.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'content', 'pyoa', 'umbra');
const base = JSON.parse(readFileSync(join(DIR, 'base.json'), 'utf8'));
const N = new Map(base.nodes.map((n) => [n.id, n]));
const args = process.argv.slice(2);
const maxCalls = args.includes('--max') ? Number(args[args.indexOf('--max') + 1]) : 999;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : '';
for (const d of ['raw', 'overlay']) mkdirSync(join(DIR, d), { recursive: true });
const log = (m) => { const line = `${new Date().toISOString()} ${m}`; console.log(line); appendFileSync(join(DIR, 'gen-log.txt'), line + '\n'); };

const WORLD = `WORLD: "The Umbra Protocol" is a gaslamp political-intrigue gamebook set in the city of Veridia during a solar eclipse. The reader plays a night-crow, a rooftop climber and fixer who, in a bell tower, collected the Architect's Ledger (a brass-bound book of secret names and debts) from the Archbishop's desk after the old man's sudden death. The city watch is searching for the night-crow. Two great houses bid for the book: Lord Valerius (silk, wine, polite menace) and Matron Rigg (iron foundry, warrants, the gaol books). Recurring places: the Exchange roofs, the painter's studio with tunnels in the backgrounds, a blind hurdy-gurdy player who sells patrol rhythms, clockwork pigeons carrying orders, a press house, a watchman's brazier, the brass colossus statue in the harbour.
STYLE: second person, present tense, concrete and sensory, dry and tense, a little ornate but never purple. British spelling. No jokes, no modern slang, no technology after about 1890 (brass, gas, telegraph, powder, rifles are fine). Never mention game mechanics, flags, choices, menus, pages, or "you chose".`;

function sectionOf(items) {
  return items.map((it) => `${it.node} | ${it.flag}=${it.value}`).join('\n');
}

function buildPrompt(group, items) {
  const tracks = [...new Set(group.track.split(''))];
  const lines = [WORLD, ''];
  lines.push(group.ending
    ? 'These are ENDING pages. Each insert becomes one extra paragraph at the END of the closing epilogue, so it must feel like the final beat that this earlier choice earned (a consequence, a visitor, a cost, a quiet reward). Do not undo or contradict the ending page.'
    : 'Each insert is appended as an extra paragraph directly after the page text.');
  for (const t of tracks) lines.push(`TRACK ${t}: ${TRACKS[t].label} The recognising witness on this track is ${TRACKS[t].witness}.`);
  lines.push('', 'WHAT EACH EARLIER CHOICE MEANT:');
  const flags = [...new Set(items.map((i) => i.flag))];
  for (const f of flags) for (const t of tracks) {
    if (tracks.length > 1 && (f === 'witness' || f === 'cover')) lines.push(`[track ${t}] ${FLAG_MEANING[f](t)}`);
    else if (t === tracks[0]) lines.push(FLAG_MEANING[f](t));
  }
  lines.push('');
  const nodes = [...new Set(items.map((i) => i.node))];
  for (const id of nodes) {
    const n = N.get(id);
    lines.push(`PAGE ${id}:`, n.page, `(Choices that follow: ${n.exits.map((e) => '"' + e.label + '"').join(' / ') || 'none, this is an ending'})`, '');
  }
  lines.push(
    'TASK: write ONE insert for each line in the list below. Rules:',
    '- 1 or 2 sentences, 25 to 60 words, one paragraph, no line breaks.',
    '- Make the earlier choice visibly matter: a concrete cause and effect (a person who reappears, an object, a closed or open door, a wary look, a debt, a lie that has travelled). Name the specific disguise, house, witness or vault when relevant.',
    '- Each insert is shown ONLY when that single condition is true, and it must make sense whatever else happened. Never assume any other earlier choice, and never assume the player is at a particular spot beyond what the page already says.',
    '- Do not describe the player making a new decision and do not list options. Do not contradict the page. Do not invent new named characters.',
    '- Vary the openings and rhythm. No two inserts may start with the same word. Avoid repeating "you remember".',
    '', 'LIST (page | condition):', sectionOf(items), '',
    'OUTPUT FORMAT, exactly, no preamble, no markdown, no commentary, one block per line of the list in the same order:',
    '@@INSERT <page id> | <flag>=<value>', '<the insert text>', '@@END');
  return lines.join('\n');
}

function parse(raw) {
  const out = new Map();
  const re = /@@INSERT\s+(\S+)\s*\|\s*([A-Za-z]+)=([\w-]+)\s*\n([\s\S]*?)\n\s*@@END/g;
  let m;
  while ((m = re.exec(raw))) {
    const text = m[4].replace(/\s+/g, ' ').replace(/\*+/g, '').replace(/[\u2018\u2019\uFFFD]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s*[\u2013\u2014]\s*/g, ' - ').replace(/'\?T/g, "'").trim();
    out.set(`${m[1]}|${m[2]}=${m[3]}`, text);
  }
  return out;
}
const bad = (t) => !t || t.length < 70 || t.length > 520 || /@@|\bflag\b|\bcondition\b|\binsert\b|as an ai/i.test(t);

// build groups
const items = allItems();
const groups = [];
let cur = null;
for (const it of items) {
  const key = it.ending ? `end-${it.node}` : null;
  if (it.ending) {
    if (!cur || cur.key !== key) { cur = { key, track: it.track, ending: true, items: [] }; groups.push(cur); }
    cur.items.push(it);
    continue;
  }
  if (!cur || cur.ending || cur.track !== it.track || (cur.items.length >= 6 && cur.lastNode !== it.node)) {
    cur = { key: null, track: it.track, items: [] };
    groups.push(cur);
  }
  cur.lastNode = it.node;
  cur.items.push(it);
}
groups.forEach((g, i) => { g.id = g.key ? g.key.replace(/^end-up-end-/, 'e-') : `${g.track}-${String(i).padStart(2, '0')}-${g.items[0].node.replace(/^up-[a-z]-/, '')}`; });

let calls = 0;
let done = 0;
for (const g of groups) {
  if (only && !g.id.includes(only)) continue;
  const ovf = join(DIR, 'overlay', `v-${g.id}.json`);
  if (existsSync(ovf)) { done++; continue; }
  if (calls >= maxCalls) break;
  let missing = g.items.slice();
  const got = new Map();
  for (let attempt = 0; attempt < 2 && missing.length; attempt++) {
    const prompt = buildPrompt(g, missing);
    log(`ask ${g.id} items=${missing.length} attempt=${attempt}`);
    let reply;
    try {
      reply = await ask(prompt, { fresh: calls % 6 === 0 });
    } catch (e) {
      log(`STOP ${e.kind || 'error'}: ${e.message}`);
      process.exit(e instanceof GeminiStop ? 3 : 4);
    }
    calls++;
    writeFileSync(join(DIR, 'raw', `${g.id}.a${attempt}.txt`), reply);
    if (/something went wrong|having a hard time fulfilling|can't help with|cannot help with/i.test(reply) && !/@@INSERT/.test(reply)) { log('STOP refusal: ' + reply.slice(0, 120).replace(/\s+/g, ' ')); process.exit(5); }
    const p = parse(reply);
    for (const it of missing) {
      const t = p.get(`${it.node}|${it.flag}=${it.value}`);
      if (t && !bad(t)) got.set(`${it.node}|${it.flag}=${it.value}`, t);
    }
    missing = missing.filter((it) => !got.has(`${it.node}|${it.flag}=${it.value}`));
    await new Promise((r) => setTimeout(r, 8000));
  }
  const overlay = {
    batch: `v-${g.id}`,
    variants: g.items.filter((it) => got.has(`${it.node}|${it.flag}=${it.value}`)).map((it) => ({
      node: it.node,
      when: { [it.flag]: it.value },
      after: got.get(`${it.node}|${it.flag}=${it.value}`),
    })),
  };
  writeFileSync(ovf, JSON.stringify(overlay, null, 1));
  log(`done ${g.id}: ${overlay.variants.length}/${g.items.length} inserts${missing.length ? ' MISSING ' + missing.map((m) => m.node + ':' + m.flag + '=' + m.value).join(',') : ''}`);
  done++;
}
log(`finished run: calls ${calls}, groups done ${done}/${groups.length}`);





