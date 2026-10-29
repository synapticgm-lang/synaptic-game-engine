#!/usr/bin/env node
// Queue 2: the first queue (run-queue.mjs) runs cinderfall then underlibrary. This one commits each finished dice book, then finishes vesperhold (resume: fill, merge, lint).
// One Gemini tab, so one book at a time. A Gemini stop, limit or no reply stops the queue and nothing is retried. A book that ends with lint errors is committed and reported; it does not stall the queue.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
const Q = 'content/pyoa/queue-log.txt';
const log = (m) => { const l = `${new Date().toISOString()} ${m}`; console.log(l); appendFileSync(Q, l + '\n'); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lastLine = (slug) => { const f = `content/pyoa/${slug}/driver-log.txt`; if (!existsSync(f)) return ''; return readFileSync(f, 'utf8').trim().split('\n').at(-1) || ''; };
const lintSummary = (slug) => { const f = `content/pyoa/${slug}/driver-log.txt`; const t = existsSync(f) ? readFileSync(f, 'utf8') : ''; const m = [...t.matchAll(/ERRORS (\d+)/g)].at(-1); return m ? `lint errors ${m[1]}` : 'lint unknown'; };
const commit = (slug, title) => {
  const run = (a) => spawnSync('git', a, { encoding: 'utf8' });
  run(['add', `content/pyoa/${slug}`, 'content/pyoa/flashlite-sections.json', 'scripts/pyoa']);
  const r = run(['commit', '-q', '-m', `PYOA: ${title} (${slug}) finished, Flash-Lite prose, ${lintSummary(slug)}`]);
  log(`commit ${slug}: ${(r.stdout + r.stderr).trim() || 'ok'}`);
};
const waitFor = async (slug) => { await sleep(150000); for (;;) { const l = lastLine(slug); if (/lint exit/.test(l)) return; if (/STOPPED/.test(l)) { log(`${slug} STOPPED: ${l} ; queue2 not continuing`); process.exit(3); } await sleep(60000); } };
log('queue2 start');
await waitFor('cinderfall');
log('cinderfall finished (' + lintSummary('cinderfall') + ')');
commit('cinderfall', 'The Cinderfall dice book');
await waitFor('underlibrary');
commit('underlibrary', 'The underlibrary dice book');
log('queue2 complete: dice books committed');
