#!/usr/bin/env node
// Supervisor for Gemini book writing (John-approved exception: "if it comes up with error give it a couple of minutes then carry on").
//   node scripts/pyoa/supervise-book.mjs <pick|dice> <slug>
// Loop: run run-book.mjs; when it stops on a transient Gemini error (something went wrong, no reply, timeout, no valid sections) wait ~150s,
// open a fresh Gemini chat on the laptop Chrome (:9222) via gemini-reset.mjs, and resume (run-book is resumable). Flash-Lite only (gem.mjs verifies per call).
// HARD STOPS (reported, no more retries): signed out, Chrome :9222 gone / no Gemini tab, quota or usage-limit text, wrong model,
// the same batch failing 5 times in a row with no progress, or a non-Gemini failure (bad exit code with no STOP line).
// When run-book finishes (lint exit) the book is committed with its lint error count.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
const [kind, slug] = process.argv.slice(2);
if (!kind || !slug) { console.error('usage: supervise-book.mjs <pick|dice> <slug>'); process.exit(2); }
const DIR = `content/pyoa/${slug}`;
const Q = 'content/pyoa/queue-log.txt';
const log = (m) => { const l = `${new Date().toISOString()} [supervisor ${slug}] ${m}`; console.log(l); appendFileSync(Q, l + '\n'); appendFileSync(`${DIR}/supervisor-log.txt`, l + '\n'); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tailLines = (f, n) => (existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n').slice(-n) : []);
const sections = () => { let n = 0; const d = `${DIR}/prose`; if (!existsSync(d)) return 0; for (const f of readdirSync(d)) { try { n += Object.keys(JSON.parse(readFileSync(`${d}/${f}`, 'utf8')).sections || {}).length; } catch { /* ignore */ } } return n; };
const lastAsk = () => { const l = tailLines(`${DIR}/gen-log.txt`, 40).reverse().find((x) => /ask (prose|fill)/.test(x)); return l ? l.replace(/^\S+\s+/, '').replace(/ attempt=\d+/, '') : 'unknown'; };
const lintErrs = () => { const t = existsSync(`${DIR}/driver-log.txt`) ? readFileSync(`${DIR}/driver-log.txt`, 'utf8') : ''; const m = [...t.matchAll(/ERRORS (\d+)/g)].at(-1); return m ? m[1] : '?'; };
const git = (a) => spawnSync('git', a, { encoding: 'utf8' });
let fails = 0, lastBatch = '', lastCount = sections(), rounds = 0;
log(`supervisor start (${kind}), sections with prose: ${lastCount}`);
for (;;) {
  rounds++;
  spawnSync(process.execPath, ['scripts/pyoa/run-book.mjs', kind, slug], { stdio: 'inherit' });
  const dl = tailLines(`${DIR}/driver-log.txt`, 1)[0] || '';
  if (/lint exit/.test(dl)) break;
  const gl = tailLines(`${DIR}/gen-log.txt`, 12);
  const stop = [...gl].reverse().find((x) => /\bSTOP\b/.test(x)) || '';
  const now = sections(); const batch = lastAsk();
  if (now > lastCount) fails = 0;
  if (batch === lastBatch && now <= lastCount) fails++; else if (now <= lastCount) fails = 1;
  lastBatch = batch; lastCount = now;
  log(`run-book stopped (round ${rounds}): ${stop.replace(/^\S+\s+/, '') || dl} | sections ${now} | batch "${batch}" | consecutive fails ${fails}`);
  const hardKinds = /STOP (signedout|nopage|model)\b/;
  if (hardKinds.test(stop)) { log(`HARD STOP: ${stop}`); process.exit(10); }
  const transient = /STOP (refusal\/error|limit|noreply|timeout|no valid sections)/.test(stop) || /STOPPED at (prose|fill|outline)/.test(dl);
  if (!transient) { log(`HARD STOP: unrecognised failure (${stop || dl})`); process.exit(11); }
  if (fails >= 5) { log(`HARD STOP: same batch failed ${fails} times in a row with no progress (${batch})`); process.exit(12); }
  log('transient Gemini error: waiting 150s, then a fresh Flash-Lite chat and resume');
  await sleep(150000);
  const rs = spawnSync(process.execPath, ['scripts/pyoa/gemini-reset.mjs'], { encoding: 'utf8' });
  let st = {}; try { st = JSON.parse((rs.stdout || '').trim().split('\n').at(-1)); } catch { st = { state: 'unknown', detail: (rs.stdout + rs.stderr).slice(0, 150) }; }
  log(`fresh chat: ${JSON.stringify(st)}`);
  if (['signedout', 'quota', 'nochrome', 'nopage'].includes(st.state)) { log(`HARD STOP: ${st.state} (${st.detail})`); process.exit(13); }
  if (st.state !== 'ok') { log('fresh chat not ok, waiting another 150s once'); await sleep(150000); }
}
log(`book finished: sections with prose ${sections()}, lint errors ${lintErrs()}`);
git(['add', DIR, 'content/pyoa/flashlite-sections.json', 'scripts/pyoa']);
const c = git(['commit', '-q', '-m', `PYOA: ${slug} finished, ${sections()} sections with prose, Flash-Lite, lint errors ${lintErrs()}`]);
log('commit: ' + ((c.stdout + c.stderr).trim() || 'ok'));
log('supervisor complete');
