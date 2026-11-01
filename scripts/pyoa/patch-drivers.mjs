import { readFileSync, writeFileSync } from 'node:fs';
const rep = (s, from, to, label) => { if (typeof from === 'string' ? !s.includes(from) : !from.test(s)) throw new Error('missing ' + label); return s.replace(from, () => to); };
// ================= gen-pick.mjs
let p = readFileSync('scripts/pyoa/gen-pick.mjs', 'utf8');
p = rep(p, "const maxCalls = args.includes('--max') ? Number(args[args.indexOf('--max') + 1]) : 9999;", "const maxCalls = args.includes('--max') ? Number(args[args.indexOf('--max') + 1]) : Infinity; // no built-in cap; --max is only for manual test runs", 'cap');
p = rep(p, "function problems(n, p) {", "function problems(n, p, minW = 55) {", 'problems sig');
p = rep(p, "if (w < 55 || w > 280)", "if (w < minW || w > 280)", 'problems w');
// loadProse: prose-partial as lowest-priority fallback
p = rep(p, /function loadProse\(\) \{[^\n]*\n/, "function loadProse() {\n  const prose = {};\n  const pdir = join(DIR, 'prose-partial');\n  if (existsSync(pdir)) for (const f of readdirSync(pdir)) Object.assign(prose, JSON.parse(readFileSync(join(pdir, f), 'utf8')).sections); // set-aside partial batches count as a fallback\n  for (const f of readdirSync(join(DIR, 'prose'))) Object.assign(prose, JSON.parse(readFileSync(join(DIR, 'prose', f), 'utf8')).sections);\n  return prose;\n}\n", 'loadProse');
// status after every batch
p = rep(p, "    done++;\n  }\n  log(`finished prose run", "    done++;\n    status('prose batch ' + batch[0].id + ' (' + calls + ' calls this run)');\n  }\n  log(`finished prose run", 'status per batch');
p = rep(p, "status(done === batches.length ? 'complete' : 'run ended (call cap)');", "status(done === batches.length ? 'prose pass finished (run fill for any missing sections)' : 'prose run ended early (--max)');", 'status end');
// fill
p = rep(p, "function loadProse()", `async function runFill() {
  // Re-ask for any section still without valid prose: groups of 5, up to 3 rounds (later rounds accept 40+ words). Never loops forever; leftovers are reported, not retried.
  const S = loadSeeds();
  for (let round = 0; round < 3; round++) {
    const have = loadProse(); const miss = ORDER.filter((n) => !have[n.id]);
    if (!miss.length) break;
    log(\`fill round \${round}: \${miss.length} sections missing\`);
    for (let i = 0; i < miss.length; i += 5) {
      const grp = miss.slice(i, i + 5);
      log(\`ask fill r\${round} \${grp[0].id} items=\${grp.length}\`);
      const reply = await call(prosePrompt(grp, S, ''), \`fill\${round}-\${grp[0].id}\`);
      const pr = parseProse(reply); const got = {};
      for (const n of grp) { const pb = problems(n, pr.get(n.id), round >= 1 ? 40 : 55); if (!pb.length) got[n.id] = pr.get(n.id); else log(\`  reject \${n.id}: \${pb.join(',')}\`); }
      if (Object.keys(got).length) { writeFileSync(join(DIR, 'prose', \`fill-r\${round}-\${grp[0].id}.json\`), JSON.stringify({ batch: grp[0].id, model: lastModel, sections: got, missing: [] }, null, 1)); markFlash(Object.keys(got), 'fill-' + grp[0].id); }
      status('fill round ' + round + ' ' + grp[0].id);
      await sleep(6000);
    }
  }
  const left = ORDER.filter((n) => !loadProse()[n.id]);
  log(\`fill finished: \${left.length} sections still without prose\${left.length ? ': ' + left.map((n) => n.id).join(',') : ''}\`);
  status(left.length ? \`fill finished, \${left.length} sections still missing\` : 'complete');
}
function loadProse()`, 'fill fn');
p = rep(p, "else if (cmd === 'prose') await runProse();", "else if (cmd === 'prose') await runProse();\nelse if (cmd === 'fill') await runFill();", 'dispatch');
p = rep(p, 'usage: gen-pick.mjs <slug> outline|prose|merge [--max N]', 'usage: gen-pick.mjs <slug> outline|prose|fill|merge [--max N]', 'usage');
writeFileSync('scripts/pyoa/gen-pick.mjs', p);

// ================= gen-dice2.mjs
let d = readFileSync('scripts/pyoa/gen-dice2.mjs', 'utf8');
d = rep(d, "Number(args[args.indexOf('--max') + 1]) : 999;", "Number(args[args.indexOf('--max') + 1]) : Infinity; // no built-in cap; --max is only for manual test runs", 'dcap');
d = rep(d, "function problems(n, p) {", "function problems(n, p, minW = 55) {", 'dproblems');
d = rep(d, "if (w < 55 || w > 280)", "if (w < minW || w > 280)", 'dw');
// status helper, called after every batch
d = rep(d, "async function runProse() {", `function statusLive(reason) {
  try {
    const prose = {};
    for (const f of readdirSync(join(DIR, 'prose'))) Object.assign(prose, JSON.parse(readFileSync(join(DIR, 'prose', f), 'utf8')).sections);
    const miss = NODES.filter((n) => !prose[n.id]);
    const regions = [0, 1, 2, 3, 4, 5].filter((r) => existsSync(join(DIR, 'outline', \`region-\${r}.json\`)));
    writeFileSync(join(DIR, 'STATUS.md'), \`# \${skel.title} (\${SLUGARG}) status\\n\\nUpdated: \${new Date().toISOString()} (UTC; London = UTC+0 on this date)\\nLast event: \${reason}\\nSections with prose: \${NODES.length - miss.length}/\${NODES.length}\\nOutline regions done: \${regions.join(', ') || 'none'}\\nNext section to write (story order): \${miss[0]?.id || 'none'}\\nModel: Flash-Lite only (verified on the mode picker before every call; Pro is never used)\\nResume: node scripts/pyoa/run-book.mjs dice \${SLUGARG} (outline, prose, fill, merge, lint; resumable).\\n\`);
  } catch (e) { /* ignore */ }
}
async function runProse() {`, 'statuslive');
d = rep(d, "    done++;\n  }\n  log(`finished prose run", "    done++;\n    statusLive('prose batch ' + batch[0].id);\n  }\n  log(`finished prose run", 'dbatch');
d = rep(d, "  log(`finished prose run: calls ${calls}, batches done ${done}/${batches.length}`);\n}", "  log(`finished prose run: calls ${calls}, batches done ${done}/${batches.length}`);\n  statusLive(done === batches.length ? 'prose pass finished (fill next)' : 'prose run ended early (--max)');\n}", 'dend');
// fill: 3 rounds, later rounds relaxed
d = rep(d, "  let calls = 0;\n  for (const f of readdirSync(join(DIR, 'prose'))) {\n    const fp", "  let calls = 0;\n  for (let round = 0; round < 3; round++) {\n  let any = false;\n  for (const f of readdirSync(join(DIR, 'prose'))) {\n    const fp", 'fill open');
d = rep(d, "    if (!j.missing?.length) continue;\n", "    if (!j.missing?.length) continue;\n    any = true;\n", 'fill any');
d = rep(d, "const pr = problems(n, p.get(n.id)); if (!pr.length) j.sections[n.id] = p.get(n.id); else log(`  reject ${n.id}: ${pr.join(',')}`); }\n    const ord", "const pr = problems(n, p.get(n.id), round >= 1 ? 40 : 55); if (!pr.length) j.sections[n.id] = p.get(n.id); else log(`  reject ${n.id}: ${pr.join(',')}`); }\n    const ord", 'fill problems');
d = rep(d, "    await sleep(8000);\n  }\n  log(`finished fill run: calls ${calls}`);", "    statusLive('fill round ' + round + ' ' + f);\n    await sleep(8000);\n  }\n  if (!any) break;\n  }\n  log(`finished fill run: calls ${calls}`);\n  statusLive('fill finished');", 'fill close');
writeFileSync('scripts/pyoa/gen-dice2.mjs', d);

// ================= run-book.mjs: generic fill step for pick and dice, no one-off refill round; commit per finished book
let r = readFileSync('scripts/pyoa/run-book.mjs', 'utf8');
r = rep(r, "const steps = kind === 'dice' ? ['outline', 'prose', 'fill', 'merge'] : ['outline', 'prose', 'merge'];", "const steps = ['outline', 'prose', 'fill', 'merge']; // prose runs to the end of the book (no call cap); fill re-asks leftovers in up to 3 rounds", 'steps');
const a = r.indexOf("  if (s === 'prose' && kind === 'pick') {"); const b = r.indexOf("}\nconst r = spawnSync(process.execPath, lint");
r = r.slice(0, a) + r.slice(b);
writeFileSync('scripts/pyoa/run-book.mjs', r);
console.log('patched');
