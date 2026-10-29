// Parser fix: Gemini sometimes omits the @@END markers. A block now ends at @@END, the next @@SECTION, or the end of the reply.
// Also: prose reuses an already-saved raw reply for a batch before asking Gemini again (no wasted calls after a stop).
import { readFileSync, writeFileSync } from 'node:fs';
for (const f of ['scripts/pyoa/gen-dice2.mjs', 'scripts/pyoa/gen-pick.mjs']) {
  let s = readFileSync(f, 'utf8');
  const old = "const re = /@@SECTION\\s+(\\S+)\\s*\\n([\\s\\S]*?)@@END/g; let m;";
  if (!s.includes(old)) throw new Error('parser not found in ' + f);
  s = s.replace(old, () => "const re = /@@SECTION\\s+(\\S+)\\s*\\n([\\s\\S]*?)(?=@@END|@@SECTION|$(?![\\s\\S]))/g; let m;");
  const ask = "    let missing = batch.slice(); const got = {};\n";
  if (!s.includes(ask)) throw new Error('batch start not found in ' + f);
  s = s.replace(ask, () => ask + "    for (const a of ['a0', 'a1']) { const rf = join(DIR, 'raw', `${batch[0].id}.${a}.txt`); if (!existsSync(rf)) continue; const p0 = parseProse(readFileSync(rf, 'utf8')); for (const n of missing) if (!got[n.id] && !problems(n, p0.get(n.id)).length) got[n.id] = p0.get(n.id); }\n    if (Object.keys(got).length) { log(`reused saved replies for ${batch[0].id}: ${Object.keys(got).length}/${batch.length}`); missing = missing.filter((n) => !got[n.id]); }\n    if (!missing.length) { const ordered = {}; for (const n of batch) ordered[n.id] = got[n.id]; writeFileSync(f, JSON.stringify({ batch: batch[0].id, sections: ordered, missing: [] }, null, 1)); markFlash(Object.keys(ordered), batch[0].id); done++; continue; }\n");
  writeFileSync(f, s);
  console.log('patched', f);
}
