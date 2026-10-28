#!/usr/bin/env node
/**
 * PRO-PASS: Gemini Pro targeted tweaks on Flash-Lite (or unverified) PYOA prose.
 *   node tools/pyoa-gemini/pro-pass.mjs saltglass [--max N] [--batch-size N]
 *   node tools/pyoa-gemini/pro-pass.mjs dice      [--max N] [--batch-size N]
 *
 * One Gemini Pro call at a time via gem.mjs ask(..., { model: 'Pro' }).
 * Resumable via content/pyoa/pro-pass/<book>-progress.json.
 * Logs every suggestion to content/pyoa/pro-pass/<book>-log.jsonl.
 * Applies SMALL patches only; reverts the batch if lint fails.
 * Exit 0 = finished book; 3 = Gemini stop (limit/signout/timeout/model); 2 = usage.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { ask, GeminiStop, lastModel } from './gem.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'content', 'pyoa', 'pro-pass');
mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const bookArg = args[0];
if (!bookArg || !['saltglass', 'dice'].includes(bookArg)) {
  console.log('usage: pro-pass.mjs saltglass|dice [--max N] [--batch-size N]');
  process.exit(2);
}
const maxCalls = args.includes('--max') ? Number(args[args.indexOf('--max') + 1]) : 9999;
const batchSize = args.includes('--batch-size') ? Number(args[args.indexOf('--batch-size') + 1]) : 4;

const CFG = {
  saltglass: {
    bookPath: join(ROOT, 'content', 'pyoa', 'saltglass', 'book.json'),
    proseDir: join(ROOT, 'content', 'pyoa', 'saltglass', 'prose'),
    lint: ['node', 'scripts/pyoa/lint-salt.mjs'],
    kind: 'pure-choice PYOA (no dice)',
    modelNote: 'Flash-Lite verified per call',
  },
  dice: {
    bookPath: join(ROOT, 'content', 'pyoa', 'dice', 'book.json'),
    proseDir: join(ROOT, 'content', 'pyoa', 'dice', 'prose'),
    lint: ['node', 'scripts/pyoa/lint-dice.mjs'],
    kind: 'dice book (checks, recovery, rewards)',
    modelNote: 'model-unverified in flashlite-sections.json (dice-tide) — may be partly Pro already',
  },
}[bookArg];

const progressPath = join(OUT, `${bookArg}-progress.json`);
const logPath = join(OUT, `${bookArg}-log.jsonl`);
const rawDir = join(OUT, 'raw', bookArg);
mkdirSync(rawDir, { recursive: true });

const logLine = (obj) => appendFileSync(logPath, JSON.stringify({ ts: new Date().toISOString(), ...obj }) + '\n');
const say = (m) => { const l = `${new Date().toISOString()} [${bookArg}] ${m}`; console.log(l); appendFileSync(join(OUT, 'run-log.txt'), l + '\n'); };

function loadProgress() {
  if (existsSync(progressPath)) {
    const p = JSON.parse(readFileSync(progressPath, 'utf8'));
    if (!Array.isArray(p.reviewedIds)) p.reviewedIds = [];
    return p;
  }
  return { book: bookArg, nextBatch: 0, reviewedIds: [], calls: 0, suggested: 0, accepted: 0, rejected: 0, batchesDone: 0, limited: false, done: false };
}
function saveProgress(p) { writeFileSync(progressPath, JSON.stringify(p, null, 2)); }

function loadBook() { return JSON.parse(readFileSync(CFG.bookPath, 'utf8')); }
function saveBook(book) { writeFileSync(CFG.bookPath, JSON.stringify(book, null, 1)); }

/** Story-order sections that already have prose. */
function proseSections(book) {
  return book.nodes.filter((n) => n.page && String(n.page).trim().length > 40);
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function exitCtx(book, n) {
  const byId = new Map(book.nodes.map((x) => [x.id, x]));
  return (n.exits || []).map((e, i) => {
    const dest = byId.get(e.to);
    const bits = [`[${i}] "${e.label || ''}" -> ${e.to}`];
    if (e.result) bits.push(`result=${e.result}`);
    if (e.stat) bits.push(`stat=${e.stat} TN=${e.target}`);
    if (e.when) bits.push(`when=${JSON.stringify(e.when)}`);
    if (e.setFlags) bits.push(`setFlags=${JSON.stringify(e.setFlags)}`);
    if (dest?.kind) bits.push(`destKind=${dest.kind}`);
    if (dest?.ending || dest?.endingId) bits.push('DEST_ENDING');
    return bits.join(' ');
  });
}

function sectionBlock(book, n) {
  const L = [];
  L.push(`--- ${n.id} (${n.kind || '?'}) ---`);
  if (n.title) L.push(`title: ${n.title}`);
  if (n.check?.label) L.push(`check.label: ${n.check.label}`);
  else if (typeof n.check === 'string' && n.check) L.push(`check: ${n.check}`);
  if (n.grant) L.push(`grant: ${n.grant}`);
  L.push('page: ' + String(n.page).trim());
  L.push('exits:');
  for (const line of exitCtx(book, n)) L.push('  ' + line);
  return L.join('\n');
}

function buildPrompt(book, batch) {
  const L = [];
  L.push(`Proofread these linked scenes from an original ${CFG.kind} adventure (second person, present tense, British spelling).`);
  L.push('Suggest only SMALL phrase-level edits: unclear stakes, mismatched exit labels, weak reward wording, US spelling, filler repeats.');
  L.push('Do not rewrite whole scenes. Do not add or remove exits. Do not invent ids.');
  L.push('Reply with ONLY a JSON array (first char [, last char ]). No markdown. Empty [] if fine.');
  L.push('Item shape: {"section":"id","field":"page"|"title"|"exit:0"|"check.label"|"grant","old":"exact text","new":"replacement","kind":"prose"|"choice"|"payoff"|"title","reason":"short"}');
  L.push('At most 3 items. "old" must occur exactly in that field.');
  L.push('');
  for (const n of batch) L.push(sectionBlock(book, n));
  return L.join('\n');
}

function extractJsonArray(text) {
  let t = String(text || '').replace(/^Gemini said\s*/i, '').trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  // Prefer the last balanced [...] block (Pro often prepends thoughts).
  let start = -1; let end = -1; let depth = 0; let inStr = false; let esc = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '[') { if (depth === 0) start = i; depth++; }
    else if (c === ']') { depth--; if (depth === 0 && start >= 0) end = i; }
  }
  if (start < 0 || end < start) {
    if (/^\s*\[\s*\]\s*$/.test(t) || /\bno (fixes|changes|patches)\b/i.test(t)) return [];
    return null;
  }
  let raw = t.slice(start, end + 1)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/,\s*([}\]])/g, '$1');
  try { return JSON.parse(raw); }
  catch { return null; }
}

/** Fraction of characters changed (rough). Reject if "most" of the field is replaced. */
function isRewrite(oldVal, newVal) {
  const a = String(oldVal || '');
  const b = String(newVal || '');
  if (!a) return true;
  if (b.length > a.length * 1.35 && b.length - a.length > 80) return true;
  // shared prefix/suffix heuristic
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  let j = 0;
  while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  const kept = i + j;
  const keptRatio = kept / a.length;
  if (keptRatio < 0.45 && a.length > 80) return true;
  // token overlap
  const ta = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  const tb = b.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  if (!ta.size) return false;
  const hit = tb.filter((w) => ta.has(w)).length;
  if (tb.length > 20 && hit / tb.length < 0.4) return true;
  return false;
}

function getField(node, field) {
  if (field === 'page') return node.page || '';
  if (field === 'title') return node.title || '';
  if (field === 'grant') return node.grant || '';
  if (field === 'check.label') return node.check?.label || (typeof node.check === 'string' ? node.check : '') || '';
  const m = /^exit:(\d+)$/.exec(field);
  if (m) return node.exits?.[Number(m[1])]?.label || '';
  return null;
}

function setField(node, field, value) {
  if (field === 'page') { node.page = value; return true; }
  if (field === 'title') { node.title = value; return true; }
  if (field === 'grant') { node.grant = value; return true; }
  if (field === 'check.label') {
    if (node.check && typeof node.check === 'object') node.check.label = value;
    else node.check = value;
    return true;
  }
  const m = /^exit:(\d+)$/.exec(field);
  if (m && node.exits?.[Number(m[1])]) { node.exits[Number(m[1])].label = value; return true; }
  return false;
}

function applyOne(node, patch) {
  const field = patch.field;
  const cur = getField(node, field);
  if (cur === null) return { ok: false, reason: 'unknown-field' };
  const old = String(patch.old ?? '');
  const neu = String(patch.new ?? '');
  if (!old || neu === old) return { ok: false, reason: 'noop-or-empty-old' };
  if (!cur.includes(old)) return { ok: false, reason: 'old-not-found' };
  let next;
  if (field === 'page' && old !== cur) {
    // replace first occurrence of substring
    next = cur.replace(old, neu);
    if (isRewrite(cur, next)) return { ok: false, reason: 'rewrite-rejected' };
  } else {
    next = neu;
    if ((field === 'page' || field === 'title') && isRewrite(cur, next)) return { ok: false, reason: 'rewrite-rejected' };
  }
  setField(node, field, next);
  return { ok: true, reason: 'applied' };
}

/** Mirror page/title/exit labels into prose/*.json so a later merge keeps Pro edits. */
function syncProseFiles(book, touchedIds) {
  if (!CFG.proseDir || !existsSync(CFG.proseDir)) return;
  const byId = new Map(book.nodes.map((n) => [n.id, n]));
  for (const f of readdirSync(CFG.proseDir).filter((x) => x.endsWith('.json'))) {
    const fp = join(CFG.proseDir, f);
    let j;
    try { j = JSON.parse(readFileSync(fp, 'utf8')); } catch { continue; }
    if (!j.sections) continue;
    let changed = false;
    for (const id of Object.keys(j.sections)) {
      if (!touchedIds.has(id)) continue;
      const n = byId.get(id);
      if (!n) continue;
      const s = j.sections[id];
      if (n.title) s.title = n.title;
      if (n.page) s.text = n.page;
      if (Array.isArray(s.exits) && n.exits) {
        s.exits = n.exits.map((e, i) => e.label || s.exits[i] || '');
      }
      if (n.grant != null) s.grant = n.grant;
      if (n.check?.label) s.check = n.check.label;
      changed = true;
    }
    if (changed) writeFileSync(fp, JSON.stringify(j, null, 1));
  }
}

function runLint() {
  // CFG.lint is ['node', 'scripts/pyoa/lint-….mjs']
  const script = CFG.lint[1];
  const r = spawnSync(process.execPath, [script], { cwd: ROOT, encoding: 'utf8', shell: false });
  return { ok: r.status === 0, status: r.status, out: `${r.stdout || ''}\n${r.stderr || ''}`.trim() };
}

async function main() {
  const progress = loadProgress();
  if (progress.done) { say('already done'); return; }
  if (progress.limited) { say('previously LIMITED — not calling Gemini'); process.exit(3); }

  const book = loadBook();
  const reviewed = new Set(progress.reviewedIds || []);
  // Mark early nextBatch-era reviews as done if present (legacy resume).
  const allProse = proseSections(book);
  const pending = allProse.filter((n) => !reviewed.has(n.id));
  const batches = chunk(pending, batchSize);
  say(`sections with prose ${allProse.length}, pending ${pending.length}, batches left ${batches.length}, reviewed ${reviewed.size}, maxCalls ${maxCalls}`);

  let callsThisRun = 0;
  let bi = 0;
  while (bi < batches.length && callsThisRun < maxCalls) {
    const batch = batches[bi];
    const ids = batch.map((n) => n.id);
    say(`batch ${bi + 1}/${batches.length} ${ids[0]}..${ids.at(-1)} (${ids.length})`);

    let reply = '';
    let patches = null;
    for (let attempt = 0; attempt < 2 && !patches; attempt++) {
      try {
        const prompt = buildPrompt(book, batch) + (attempt ? '\n\nIMPORTANT: Reply with ONLY the JSON array. No thoughts, no markdown fences, no prose.' : '');
        reply = await ask(prompt, { model: 'Pro', timeoutMs: 420000 });
      } catch (e) {
        if (e instanceof GeminiStop) {
          say(`STOP ${e.kind}: ${e.message} (attempt ${attempt})`);
          logLine({ event: 'gemini-stop', kind: e.kind, message: e.message, batch: bi, ids, attempt });
          if (e.kind === 'limit' || e.kind === 'signedout' || e.kind === 'model') {
            progress.limited = true;
            saveProgress(progress);
            process.exit(3);
          }
          if ((e.kind === 'timeout' || e.kind === 'noreply') && attempt === 0) {
            say('retrying once after empty/timeout');
            continue;
          }
          if (e.kind === 'timeout' || e.kind === 'noreply') {
            logLine({ event: 'batch-skip', reason: e.kind, batch: bi, ids });
            for (const id of ids) reviewed.add(id);
            progress.reviewedIds = [...reviewed];
            progress.nextBatch = (progress.nextBatch || 0) + 1;
            saveProgress(progress);
            callsThisRun++;
            bi++;
            reply = '';
            break;
          }
          process.exit(3);
        }
        // Puppeteer nav/context loss mid-call — treat like noreply and retry once.
        const msg = String(e?.message || e);
        say(`STOP nav: ${msg.slice(0, 120)} (attempt ${attempt})`);
        logLine({ event: 'gemini-stop', kind: 'nav', message: msg.slice(0, 300), batch: bi, ids, attempt });
        if (attempt === 0) { say('retrying once after navigation error'); continue; }
        for (const id of ids) reviewed.add(id);
        progress.reviewedIds = [...reviewed];
        progress.nextBatch = (progress.nextBatch || 0) + 1;
        saveProgress(progress);
        callsThisRun++;
        bi++;
        reply = '';
        break;
      }
      callsThisRun++;
      progress.calls++;
      writeFileSync(join(rawDir, `batch-${String(bi).padStart(4, '0')}${attempt ? '.r1' : ''}.txt`), `MODEL ${lastModel}\n\n${reply}`);
      const softRefuse = /hard time fulfilling|can'?t help with that|something else instead|unable to (help|fulfill)|something went wrong/i.test(reply);
      if (softRefuse) {
        say(`soft-refuse (attempt ${attempt})`);
        logLine({ event: 'soft-refuse', batch: bi, ids, model: lastModel, attempt, preview: String(reply).slice(0, 200) });
        patches = null;
        if (attempt === 1) progress.rejected++;
        continue;
      }
      patches = extractJsonArray(reply);
      if (!patches) {
        say(`unparseable reply (attempt ${attempt}) — ${attempt === 0 ? 'retrying' : 'reject all'}`);
        logLine({ event: 'unparseable', batch: bi, ids, model: lastModel, attempt, preview: String(reply).slice(0, 400) });
        if (attempt === 1) progress.rejected++;
      }
    }
    if (!patches) {
      for (const id of ids) reviewed.add(id);
      progress.reviewedIds = [...reviewed];
      progress.nextBatch = (progress.nextBatch || 0) + 1;
      progress.batchesDone++;
      saveProgress(progress);
      bi++;
      continue;
    }
    if (!Array.isArray(patches)) {
      logLine({ event: 'bad-shape', batch: bi, ids });
      for (const id of ids) reviewed.add(id);
      progress.reviewedIds = [...reviewed];
      progress.nextBatch = (progress.nextBatch || 0) + 1;
      progress.batchesDone++;
      saveProgress(progress);
      bi++;
      continue;
    }

    // Snapshot for lint revert
    const bak = join(OUT, `${bookArg}-book.bak.json`);
    copyFileSync(CFG.bookPath, bak);
    const live = loadBook();
    const byId = new Map(live.nodes.map((n) => [n.id, n]));
    const touched = new Set();
    let accepted = 0;
    let rejected = 0;

    for (const p of patches) {
      progress.suggested++;
      const rec = { event: 'suggestion', batch: bi, section: p.section, field: p.field, kind: p.kind, reason: p.reason, old: p.old, new: p.new, model: lastModel };
      if (!p || !p.section || !p.field) {
        rejected++; progress.rejected++;
        logLine({ ...rec, status: 'rejected', rejectReason: 'malformed' });
        continue;
      }
      const node = byId.get(p.section);
      if (!node) {
        rejected++; progress.rejected++;
        logLine({ ...rec, status: 'rejected', rejectReason: 'unknown-section' });
        continue;
      }
      if (!ids.includes(p.section)) {
        rejected++; progress.rejected++;
        logLine({ ...rec, status: 'rejected', rejectReason: 'outside-batch' });
        continue;
      }
      const r = applyOne(node, p);
      if (!r.ok) {
        rejected++; progress.rejected++;
        logLine({ ...rec, status: 'rejected', rejectReason: r.reason });
        continue;
      }
      accepted++; progress.accepted++;
      touched.add(p.section);
      logLine({ ...rec, status: 'accepted' });
    }

    if (accepted > 0) {
      saveBook(live);
      syncProseFiles(live, touched);
      const lint = runLint();
      if (!lint.ok) {
        say(`lint FAIL after batch ${bi} — reverting ${accepted} patches`);
        copyFileSync(bak, CFG.bookPath);
        // re-sync prose from restored book
        syncProseFiles(loadBook(), touched);
        for (const p of patches) {
          if (p?.section && touched.has(p.section)) {
            logLine({ event: 'lint-revert', batch: bi, section: p.section, field: p.field, lintTail: lint.out.slice(-500) });
          }
        }
        progress.accepted -= accepted;
        progress.rejected += accepted;
        accepted = 0;
      } else {
        say(`applied ${accepted}, rejected ${rejected}; lint OK`);
      }
    } else {
      say(`no applies (rejected ${rejected})`);
    }

    for (const id of ids) reviewed.add(id);
    progress.reviewedIds = [...reviewed];
    progress.nextBatch = (progress.nextBatch || 0) + 1;
    progress.batchesDone++;
    saveProgress(progress);
    bi++;
  }

  if (pending.length && reviewed.size >= allProse.length) {
    progress.done = true;
    saveProgress(progress);
    say(`DONE suggested=${progress.suggested} accepted=${progress.accepted} rejected=${progress.rejected} calls=${progress.calls}`);
  } else if (!pending.length) {
    progress.done = true;
    saveProgress(progress);
    say(`DONE (nothing pending) suggested=${progress.suggested} accepted=${progress.accepted} rejected=${progress.rejected} calls=${progress.calls}`);
  } else {
    say(`paused mid-book reviewed=${reviewed.size}/${allProse.length} callsThisRun=${callsThisRun}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
