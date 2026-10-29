#!/usr/bin/env node
// Background driver: node scripts/pyoa/run-book.mjs <pick|dice> <slug>
// Runs outline -> prose -> (fill, dice only) -> merge -> lint in order via the parameterised generator. Stops at the first non-zero exit (Gemini limit/no reply/bad reply) and records it in driver-log.txt. Resumable: just start it again.
import { spawnSync } from 'node:child_process';
import { appendFileSync, readdirSync, readFileSync, renameSync, mkdirSync } from 'node:fs';
const [kind, slug] = process.argv.slice(2);
const gen = kind === 'dice' ? 'scripts/pyoa/gen-dice2.mjs' : 'scripts/pyoa/gen-pick.mjs';
const lint = kind === 'dice' ? ['scripts/pyoa/lint-dice.mjs', `content/pyoa/${slug}/book.json`] : ['scripts/pyoa/lint-salt.mjs', `content/pyoa/${slug}/book.json`];
const L = `content/pyoa/${slug}/driver-log.txt`;
const log = (m) => { const l = `${new Date().toISOString()} ${m}`; console.log(l); appendFileSync(L, l + '\n'); };
const steps = ['outline', 'prose', 'fill', 'merge']; // prose runs to the end of the book (no call cap); fill re-asks leftovers in up to 3 rounds
log(`driver start ${kind} ${slug}`);
for (const s of steps) {
  log(`step ${s}`);
  const r = spawnSync(process.execPath, [gen, slug, s], { stdio: 'inherit' });
  if (r.status !== 0) { log(`STOPPED at ${s}: exit ${r.status} (see gen-log.txt and STATUS.md). Not retrying.`); process.exit(r.status || 1); }
}
const r = spawnSync(process.execPath, lint, { encoding: 'utf8' });
appendFileSync(L, r.stdout || '');
log(`lint exit ${r.status}`);
console.log(r.stdout);
process.exit(0);
