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
const steps = kind === 'dice' ? ['outline', 'prose', 'fill', 'merge'] : ['outline', 'prose', 'merge'];
log(`driver start ${kind} ${slug}`);
for (const s of steps) {
  log(`step ${s}`);
  const r = spawnSync(process.execPath, [gen, slug, s], { stdio: 'inherit' });
  if (r.status !== 0) { log(`STOPPED at ${s}: exit ${r.status} (see gen-log.txt and STATUS.md). Not retrying.`); process.exit(r.status || 1); }
  if (s === 'prose' && kind === 'pick') { // one refill round: batches that ended with sections missing are set aside and re-asked once
    const pd = `content/pyoa/${slug}/prose`; const aside = `content/pyoa/${slug}/prose-partial`; mkdirSync(aside, { recursive: true });
    const partial = readdirSync(pd).filter((f) => (JSON.parse(readFileSync(`${pd}/${f}`, 'utf8')).missing || []).length);
    if (partial.length) {
      log(`refill round: ${partial.length} batches had missing sections`);
      for (const f of partial) renameSync(`${pd}/${f}`, `${aside}/${f}`);
      const r2 = spawnSync(process.execPath, [gen, slug, 'prose'], { stdio: 'inherit' });
      if (r2.status !== 0) { log(`STOPPED at refill: exit ${r2.status}. Not retrying.`); process.exit(r2.status || 1); }
    }
  }
}
const r = spawnSync(process.execPath, lint, { encoding: 'utf8' });
appendFileSync(L, r.stdout || '');
log(`lint exit ${r.status}`);
console.log(r.stdout);
process.exit(0);
