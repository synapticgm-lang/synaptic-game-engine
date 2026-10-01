// Draft-vs-final check: does a clean writer line reach the player whole?
// A line is clean when the gate passed it (verdict ends ":ok"). A clean line is CUT when the final
// text no longer holds its words in order; the first step that lost them is the owner.
// Gate drops are listed separately (GATE) to be read by hand — dropping an invented name is correct.
const fs = require('fs');
const path = require('path');
const root = process.argv[2] || 'docs/orders/t10-29z9c';
const only = process.argv[3]; // optional run-folder filter
const words = (s) => (s.toLowerCase().match(/[a-z0-9']+/g) ?? []);
const holds = (text, line) => {
  const fw = words(text).join(' ');
  const parts = line.split(/@t\d+/).map((p) => words(p).join(' ')).filter(Boolean);
  let at = 0;
  for (const p of parts) {
    const k = fw.indexOf(p, at);
    if (k < 0) return false;
    at = k + p.length;
  }
  return true;
};
const overlap = (a, b) => {
  const A = new Set(words(a)), B = new Set(words(b));
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const w of A) if (B.has(w)) n += 1;
  return n / Math.min(A.size, B.size);
};
const sentences = (s) => s.match(/[^.!?]+[.!?]+["\u201d]?/g) ?? [s];
let cutsTotal = 0;
let recycleTotal = 0;
for (const dir of fs.readdirSync(root).filter((d) => fs.existsSync(path.join(root, d, 'turns.jsonl')))) {
  if (only && !dir.includes(only)) continue;
  console.log(`\n=== ${dir}`);
  let lines = 0, whole = 0;
  const prior = [];
  for (const row of fs.readFileSync(path.join(root, dir, 'turns.jsonl'), 'utf8').split('\n')) {
    if (!row.trim()) continue;
    const t = JSON.parse(row);
    const raw = String(t.writerRaw ?? t.writerRawHead ?? '');
    const final = String(t.gmText ?? '');
    const texts = [...raw.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => {
      try { return JSON.parse(`"${m[1]}"`); } catch { return m[1]; }
    });
    const verdicts = (t.tokenVerdicts ?? []).filter((v) => !/^ref\b/.test(v));
    const trace = t.stageTrace ?? [];
    texts.forEach((text, i) => {
      const verdict = verdicts[i] ?? '';
      if (verdict && !/:ok$/.test(verdict)) {
        console.log(`T${t.turn} GATE [${verdict}] ${text}`);
        return;
      }
      lines += 1;
      if (holds(final, text)) { whole += 1; return; }
      const k = trace.findIndex((s) => !holds(s.text, text));
      const lost = trace[k];
      if (lost && lost.stage === 'finishCommittedProse+spoken' && k > 0) {
        const painted = sentences(trace[k - 1].text).find((x) => holds(x, text));
        const gone = painted && !sentences(lost.text).some((x) => overlap(x, painted) >= 0.8);
        const told = painted && prior.slice(-3).some((g) => sentences(g).some((x) => overlap(x, painted) >= 0.6));
        if (gone && told) {
          recycleTotal += 1;
          console.log(`T${t.turn} RECYCLE (already told; dropped as a repeat): ${painted.trim()}`);
          return;
        }
      }
      cutsTotal += 1;
      console.log(`T${t.turn} CUT [${verdict || 'prose'}] at ${lost ? lost.stage : '(no trace)'}\n   draft: ${text}`);
      if (lost && k > 0) {
        const anchor = words(text.split(/@t\d+/).find((p) => words(p).length >= 3) ?? '').slice(0, 3).join(' ');
        const sentOf = (s) => (s.match(/[^.!?]+[.!?]+["\u201d]?/g) ?? [s]).find((x) => words(x).join(' ').includes(anchor))?.trim();
        console.log(`   before: ${sentOf(trace[k - 1].text) ?? '?'}\n   after : ${sentOf(lost.text) ?? '(gone)'}`);
      }
    });
    const straight = (final.match(/"/g) ?? []).length;
    const open = (final.match(/\u201c/g) ?? []).length, close = (final.match(/\u201d/g) ?? []).length;
    if (straight % 2 || open !== close) { cutsTotal += 1; console.log(`T${t.turn} HALF-QUOTE: ${final}`); }
    for (const m of final.matchAll(/\S{0,30}[.!?,] ["\u201d](?=\s|$)\S{0,10}/g)) {
      if (!/[.!?,] ["\u201c]\s*[A-Z]/.test(m[0])) console.log(`T${t.turn} QUOTE-SPACE: ...${m[0]}...`);
    }
    if (/\bno one\b/i.test(final) && !/\bno one\b/i.test(raw)) console.log(`T${t.turn} NEW "no one": ${final.match(/[^.]*\bno one\b[^.]*/i)?.[0]}`);
    if (t.error) console.log(`T${t.turn} ERROR ${t.error}`);
    prior.push(final);
  }
  console.log(`clean draft lines kept whole: ${whole}/${lines}`);
}
console.log(`\nTOTAL CUTS: ${cutsTotal}   (repeats dropped as already told: ${recycleTotal})`);
