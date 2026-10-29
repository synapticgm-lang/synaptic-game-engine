#!/usr/bin/env node
// Queue 4: cinderfall's driver is already running. When it finishes, commit it, then run underlibrary and commit that.
// A Gemini stop ends the queue and nothing is retried.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
const Q = 'content/pyoa/queue-log.txt';
const log = (m) => { const l = `${new Date().toISOString()} ${m}`; console.log(l); appendFileSync(Q, l + '\n'); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const logOf = (s) => { const f = `content/pyoa/${s}/driver-log.txt`; return existsSync(f) ? readFileSync(f, 'utf8') : ''; };
const lastLine = (s) => logOf(s).trim().split('\n').at(-1) || '';
const lintErrs = (s) => { const m = [...logOf(s).matchAll(/ERRORS (\d+)/g)].at(-1); return m ? m[1] : '?'; };
const git = (a) => spawnSync('git', a, { encoding: 'utf8' });
const commit = (s, t) => { git(['add', `content/pyoa/${s}`, 'content/pyoa/flashlite-sections.json', 'scripts/pyoa']); const r = git(['commit', '-q', '-m', `PYOA: ${t} (${s}) finished, 1000 sections, Flash-Lite prose, lint errors ${lintErrs(s)}`]); log(`commit ${s}: ${(r.stdout + r.stderr).trim() || 'ok'}`); };
log('queue4 start: waiting for the cinderfall driver');
for (;;) { const l = lastLine('cinderfall'); if (/lint exit/.test(l)) break; if (/STOPPED/.test(l)) { log('cinderfall STOPPED: ' + l); process.exit(3); } await sleep(60000); }
log('cinderfall finished, lint errors ' + lintErrs('cinderfall'));
commit('cinderfall', 'The Last Train to Cinderfall');
const r = spawnSync(process.execPath, ['scripts/pyoa/run-book.mjs', 'dice', 'underlibrary'], { stdio: 'inherit' });
if (r.status !== 0 || !/lint exit/.test(lastLine('underlibrary'))) { log('underlibrary stopped: ' + lastLine('underlibrary')); process.exit(3); }
log('underlibrary finished, lint errors ' + lintErrs('underlibrary'));
commit('underlibrary', 'The Hundredth Door of the Underlibrary');
log('queue4 complete: all books done');
