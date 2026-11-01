#!/usr/bin/env node
/** Draft gated detour pages for Umbra through Gemini web (resumable). node scripts/pyoa/gen-detours.mjs [--max N] */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ask, GeminiStop } from '../../tools/pyoa-gemini/gem.mjs';
import { TRACKS, FLAG_MEANING } from './umbra-plan.mjs';
import { DETOURS } from './umbra-detours.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'content', 'pyoa', 'umbra');
const base = JSON.parse(readFileSync(join(DIR, 'base.json'), 'utf8'));
const N = new Map(base.nodes.map((n) => [n.id, n]));
const args = process.argv.slice(2);
const maxCalls = args.includes('--max') ? Number(args[args.indexOf('--max') + 1]) : 999;
const log = (m) => { const l = `${new Date().toISOString()} ${m}`; console.log(l); appendFileSync(join(DIR, 'gen-log.txt'), l + '\n'); };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
const clean = (t) => t.replace(/\*+/g, '').replace(/[\u2018\u2019\uFFFD]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s*[\u2013\u2014]\s*/g, ' - ').replace(/'\?T/g, "'").trim();

const WORLD = `WORLD: "The Umbra Protocol" is a gaslamp political-intrigue gamebook set in the city of Veridia during a solar eclipse. The reader plays a night-crow, a rooftop climber and fixer who, in a bell tower, collected the Architect's Ledger (a brass-bound book of secret names and debts) from the Archbishop's desk after the old man's sudden death. The city watch is searching for the night-crow. Two great houses bid for the book: Lord Valerius (silk, wine, polite menace) and Matron Rigg (iron foundry, warrants, the gaol books). Places: Exchange roofs, the painter's studio with tunnels, a blind hurdy-gurdy player, clockwork pigeons, a press house, a watchman's brazier, the brass colossus in the harbour.
STYLE: second person, present tense, concrete and sensory, dry and tense, a little ornate but never purple. British spelling. No modern slang, nothing technological after about 1890. Never mention game mechanics, flags, choices, menus, pages or "you chose".`;

function prompt(track, batch) {
  const L = [WORLD, '', `TRACK: ${TRACKS[track].label}`, '', 'WHAT EARLIER CHOICES MEANT:'];
  const fl = new Set(batch.flatMap((d) => Object.keys(d.when)));
  for (const f of fl) L.push(FLAG_MEANING[f](track));
  L.push('');
  const shown = new Set();
  for (const d of batch) for (const id of [d.anchor, d.rejoin]) if (!shown.has(id)) { shown.add(id); const n = N.get(id); L.push(`PAGE ${id}${id === d.rejoin ? ' (where the detour rejoins)' : ''}:`, n.page, ''); }
  L.push('TASK: write the NEW detour pages below. Each is an optional page the player can only reach from its anchor page while the stated condition is true. Each must:',
    '- be one self-contained page of 70 to 110 words (a single paragraph), second person present tense, with a small concrete event that pays off the earlier choice, then ends so the player is plainly heading on to the rejoin page;',
    '- not decide anything big, not mention the choice menus, and not contradict the anchor or rejoin pages;',
    '- not introduce new named characters; do not assume any other earlier choice.',
    'For each page also give: STAKE (one sentence, 12 to 20 words, the tension of the moment), LABEL (3 to 8 words, an imperative action the player picks at the anchor page, matching the hint), CONTINUE (3 to 8 words, the single action that carries the player on to the rejoin page).', '');
  batch.forEach((d, i) => L.push(`${i + 1}. id=${d.id} | anchor=${d.anchor} | rejoin=${d.rejoin} | condition: ${JSON.stringify(d.when)} | label hint: "${d.labelHint}" | idea: ${d.idea}`));
  L.push('', 'OUTPUT FORMAT, exactly, no preamble, no markdown, one block per numbered item, same order:', '@@PAGE <id>', 'LABEL: ...', 'STAKE: ...', 'TEXT: ...', 'CONTINUE: ...', '@@END');
  return L.join('\n');
}
function parse(raw) {
  const out = new Map();
  const re = /@@PAGE\s+(\S+)\s*\n\s*LABEL:\s*([^\n]+)\n\s*STAKE:\s*([^\n]+)\n\s*TEXT:\s*([\s\S]*?)\n\s*CONTINUE:\s*([^\n]+)\n\s*@@END/g;
  let m;
  while ((m = re.exec(raw))) out.set(m[1], { label: clean(m[2]), stake: clean(m[3]), text: clean(m[4].replace(/\s+/g, ' ')), cont: clean(m[5]) });
  return out;
}
const ok = (p) => p && p.text.length >= 280 && p.text.length <= 800 && p.label.length >= 8 && p.label.length <= 70 && p.cont.length >= 6 && p.cont.length <= 70 && p.stake.length >= 30 && !/@@|\bflag\b|as an ai/i.test(p.text);

mkdirSync(join(DIR, 'raw'), { recursive: true });
const batches = [];
for (const t of ['w', 'l', 'r']) { const ds = DETOURS.filter((d) => d.track === t); for (let i = 0; i < ds.length; i += 4) batches.push({ id: `d-${t}-${i / 4}`, track: t, items: ds.slice(i, i + 4) }); }
let calls = 0;
for (const b of batches) {
  const of = join(DIR, 'overlay', `${b.id}.json`);
  if (existsSync(of)) continue;
  if (calls >= maxCalls) break;
  let missing = b.items.slice(); const got = new Map();
  for (let a = 0; a < 2 && missing.length; a++) {
    log(`ask ${b.id} items=${missing.length} attempt=${a}`);
    let reply;
    try { reply = await ask(prompt(b.track, missing), { fresh: true }); } catch (e) { log(`STOP ${e.kind || 'error'}: ${e.message}`); process.exit(e instanceof GeminiStop ? 3 : 4); }
    calls++;
    writeFileSync(join(DIR, 'raw', `${b.id}.a${a}.txt`), reply);
    if (/something went wrong|having a hard time fulfilling/i.test(reply) && !/@@PAGE/.test(reply)) { log('STOP refusal/error: ' + reply.slice(0, 100).replace(/\s+/g, ' ')); process.exit(5); }
    const p = parse(reply);
    for (const d of missing) if (ok(p.get(d.id))) got.set(d.id, p.get(d.id));
    missing = missing.filter((d) => !got.has(d.id));
    await new Promise((r) => setTimeout(r, 8000));
  }
  const ov = { batch: b.id, newNodes: [], addExits: [] };
  for (const d of b.items) {
    const p = got.get(d.id); if (!p) continue;
    ov.newNodes.push({ id: d.id, stake: p.stake, page: p.text, exits: [{ id: slug(p.cont), label: p.cont, to: d.rejoin }] });
    ov.addExits.push({ node: d.anchor, exit: { id: slug(p.label), label: p.label, to: d.id, when: d.when } });
  }
  writeFileSync(of, JSON.stringify(ov, null, 1));
  log(`done ${b.id}: ${ov.newNodes.length}/${b.items.length}${missing.length ? ' MISSING ' + missing.map((d) => d.id).join(',') : ''}`);
}
log(`finished detours run: calls ${calls}`);

