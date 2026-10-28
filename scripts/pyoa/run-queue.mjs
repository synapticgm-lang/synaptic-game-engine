#!/usr/bin/env node
// Runs the remaining books one at a time after the current pick-book driver ends: node scripts/pyoa/run-queue.mjs
// Waits for content/pyoa/vesperhold/driver-log.txt to show "lint exit" (finished) - if it shows STOPPED, the queue does not start (a human decides).
// Then: dice cinderfall, then dice underlibrary. Each stops at its first Gemini problem; the queue stops with it.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
const Q = 'content/pyoa/queue-log.txt';
const log = (m) => { const l = `${new Date().toISOString()} ${m}`; console.log(l); appendFileSync(Q, l + '\n'); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const doneOf = (slug) => { const f = `content/pyoa/${slug}/driver-log.txt`; if (!existsSync(f)) return ''; const t = readFileSync(f, 'utf8'); const lines = t.trim().split('\n'); const last = lines.at(-1) || ''; return /lint exit/.test(t) && /lint exit/.test(last) ? 'done' : /STOPPED/.test(last) ? 'stopped' : ''; };
log('queue start: waiting for vesperhold');
for (;;) { const d = doneOf('vesperhold'); if (d === 'done') break; if (d === 'stopped') { log('vesperhold STOPPED; queue not continuing'); process.exit(3); } await sleep(60000); }
for (const [kind, slug] of [['dice', 'cinderfall'], ['dice', 'underlibrary']]) {
  log(`starting ${kind} ${slug}`);
  const r = spawnSync(process.execPath, ['scripts/pyoa/run-book.mjs', kind, slug], { stdio: 'inherit' });
  const d = doneOf(slug);
  if (r.status !== 0 || d !== 'done') { log(`${slug} did not finish (exit ${r.status}, state ${d || 'unknown'}); queue stops here`); process.exit(3); }
  log(`${slug} finished`);
}
log('queue complete');
