/**
 * 29z4 — the judge pass of autoThumbs --notes: key lookup, reply parsing and applying verdicts.
 * Kept apart from autoThumbs.mjs (which runs on import) so it can be tested with no API call.
 */
import fs from 'node:fs';

const KEY_NAMES = ['OPENROUTER_API_KEY', 'VITE_OPENROUTER_API_KEY'];

/** The OpenRouter key from the environment, else from .env files (the Vite name counts). */
export function readOpenRouterKey(env = process.env, files = ['.env.local', '.env', 'scripts/.env']) {
  for (const k of KEY_NAMES) if (env[k]?.trim()) return env[k].trim();
  for (const f of files) {
    let body = '';
    try {
      body = fs.readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    for (const k of KEY_NAMES) {
      const m = body.match(new RegExp(`^\\s*${k}\\s*=\\s*["']?([^"'\\r\\n]+)["']?`, 'm'));
      if (m?.[1]?.trim()) return m[1].trim();
    }
  }
  return '';
}

/** Reply text wherever the model put it: string content, content parts, or reasoning only. */
export function replyText(json) {
  const msg = json?.choices?.[0]?.message ?? {};
  const content = Array.isArray(msg.content)
    ? msg.content.map((p) => (typeof p === 'string' ? p : p?.text ?? '')).join('')
    : String(msg.content ?? '');
  if (content.trim()) return content;
  return String(msg.reasoning ?? msg.reasoning_content ?? '');
}

/** "T5", "5" or 5 → 5. */
export function verdictTurn(v) {
  const m = String(v?.turn ?? '').match(/\d+/);
  return m ? Number(m[0]) : NaN;
}

/**
 * Verdict objects from a judge reply: a JSON array (fenced or not), else every complete
 * {"turn":…} object when the array was cut off. [] when nothing parses.
 */
export function parseJudge(body) {
  const text = String(body ?? '');
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start >= 0 && end > start) {
    try {
      const arr = JSON.parse(text.slice(start, end + 1));
      if (Array.isArray(arr)) return arr.filter((v) => v && typeof v === 'object');
    } catch {
      /* fall through to per-object read */
    }
  }
  const out = [];
  let depth = 0;
  let from = -1;
  let inStr = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (ch === '\\') i++;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') {
      if (depth === 0) from = i;
      depth++;
    } else if (ch === '}' && depth > 0) {
      depth--;
      if (depth === 0 && from >= 0) {
        try {
          const v = JSON.parse(text.slice(from, i + 1));
          if (v && typeof v === 'object' && 'turn' in v) out.push(v);
        } catch {
          /* skip */
        }
        from = -1;
      }
    }
  }
  return out;
}

/**
 * Apply judge verdicts to the batch rows (each row: { turn, prose, down, up, p0?, verdict, input }).
 * Returns how many rows were judged; lessons get the stiff lines.
 */
export function applyVerdicts(batch, verdicts, lessons = []) {
  let judged = 0;
  for (const v of verdicts) {
    const o = batch.find((x) => x.turn === verdictTurn(v));
    if (!o) continue;
    judged++;
    o.note = String(v.why ?? '').trim();
    if (v.followed === false) {
      const flag = `P0 ignored-action (judge): ${o.note || 'prose does not do the player action'}`;
      o.p0 = [...(o.p0 ?? []), flag];
      o.down.push(flag);
    }
    for (const s of Array.isArray(v.stiff) ? v.stiff.slice(0, 3) : []) {
      const line = String(s?.line ?? '').trim();
      if (!line || !o.prose.includes(line)) continue;
      const better = String(s?.better ?? '').trim();
      const flag = `P0 stiff-line (judge, ${s?.why || 'stiff'}): "${line.slice(0, 90)}"${better ? ` → "${better.slice(0, 90)}"` : ''}`;
      o.p0 = [...(o.p0 ?? []), flag];
      o.down.push(flag);
      lessons.push({ turn: o.turn, action: o.input, line, better, why: s?.why || 'stiff' });
    }
    if (v.verdict === 'up' && !o.down.length) o.up.push(`judge: ${o.note}`);
    else if (v.verdict === 'down' && o.note && !o.down.some((d) => d.includes(o.note))) o.down.push(`judge: ${o.note}`);
    o.verdict = o.down.length ? 'down' : o.up.length ? 'up' : o.verdict;
  }
  return judged;
}

/** Status line: a run where no batch was judged is a failure, not "ok". */
export function notesStatus(model, judged, total, failed, batches) {
  const tail = `${judged}/${total} turns judged${failed ? `, ${failed} of ${batches} batch(es) failed` : ''}`;
  if (total > 0 && judged === 0) return `failed (${model}, ${tail})`;
  return `ok (${model}, ${tail})`;
}
