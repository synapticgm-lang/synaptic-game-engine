/**
 * 29z4 — the judge pass of autoThumbs --notes: key lookup, reply parsing and applying verdicts.
 * Kept apart from autoThumbs.mjs (which runs on import) so it can be tested with no API call.
 * 29z5 — the prose-thumb rubric and the whole notes prompt live here, so the model can change and the standard cannot.
 * 29z6 — the rubric also asks "is this turn good to play?" (five more downs, fair-fail exception restated).
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

/**
 * 29z5 — the prose-thumb standard. Every notes batch sends it, whatever SGM_THUMBS_MODEL is.
 * Progress (new place, XP, fights, loot) is never a prose thumb; it stays in the report's progress section.
 */
export const PROSE_THUMB_RUBRIC = [
  'PROSE THUMB STANDARD (this is the standard, not a checklist every beat must tick):',
  'The vote is "would I teach the next turn from this beat?", not "did I enjoy the plot."',
  'Up: no prose crime, plus one thing worth copying (a sharp physical detail, a real cost, an NPC with a spine, or a short honest empty). Pretty-and-empty is not an up.',
  'Down: one prose crime is enough. Crimes: welcome or destiny or "here is the narrative"; an invented name, "someone here", or leftover smash; the same smell or light essay as last turn; a look/speak/move checklist; raw markup or an instruction leak; the wrong mode voice; talking as a slot label or a dead last kill.',
  'Do not down a fair fail, a short honest empty, or a dice result you dislike. Code owns those.',
  'The vote is also "is this turn good to play?", not only "did the turn break?". These are downs too:',
  '- The prose plays the player: it writes their dialogue, feelings, or next decision instead of stopping after the world\'s reaction.',
  '- The same habit, smell, light, or sentence shape comes back in new words.',
  '- A fact appears that the scene and the info sheet never established (an invented person, place, or past event).',
  '- The voice is wrong for the mode: a system ledger in tabletop or story RPG, or novel interiority where the mode wants a shared table.',
  '- The turn ends by lecturing, listing options, or asking "what do you do?"',
  'Still do not down a fair dice fail, a short honest empty, or a rules result. A failed roll is not bad writing.',
  'Not every check applies every turn. A physical first line matters on openings and scene changes; a reply can start with speech. One new concrete thing applies every turn, and "searched and found nothing" counts when it is short and honest. Only-named-people matters only when someone is in the scene. Mode voice is easiest on a hit, a refusal, or a locked door; a plain walk can be unmarked. Ending pressure matters when the player needs a next move; a combat result or a short honest empty can just stop.',
  'Unmarked: fine but not a teacher. Most turns should be unmarked. Do not force a thumb.',
  'A comment names one concrete thing: the crime, or the thing worth copying.',
  'A new place, XP, a fight or loot is progress, not prose. Never thumb a turn up for progress.',
].join('\n');

const JUDGE_FORMAT = [
  'You judge turns of a text RPG. The player directs the main character; the prose must do THAT action.',
  'For each turn you get the player action, who is here, the chips that were offered, and the prose.',
  'Return ONLY a JSON array with one object for EVERY turn you were given:',
  '{"turn":<n>,"verdict":"up"|"down"|"unmarked","followed":true|false,"why":"<one concrete thing>","stiff":[{"line":"<exact words from the prose>","better":"<how a person telling the story would say it>","why":"stiff"|"abstract"|"broken"}]}',
  'verdict follows the PROSE THUMB STANDARD above; "unmarked" is a real answer and the usual one.',
  'followed=false when the prose ignores the action, answers a different action, or restates the arrival instead of acting.',
  'stiff: lines a storyteller would never say aloud: abstract, report-like, over-formal, or broken grammar.',
  'Example: "The horizon is empty of people." is stiff; better: "Not a soul in sight."',
  'Quote at most 3 stiff lines per turn, exact words only. Empty array when the prose sounds natural.',
].join('\n');

/** The whole notes prompt for one batch of rows ({ turn, input, present, chips, prose }). */
export function buildJudgePrompt(batch) {
  return (
    PROSE_THUMB_RUBRIC +
    '\n\n' +
    JUDGE_FORMAT +
    '\n\n' +
    batch
      .map(
        (o) =>
          `T${o.turn}\nACTION: ${o.input}\nHERE: ${(o.present ?? []).join(', ') || 'nobody named'}\nCHIPS: ${(o.chips ?? []).join(' | ') || 'none'}\nPROSE: ${String(o.prose ?? '').replace(/\s+/g, ' ').slice(0, 1400)}`
      )
      .join('\n\n')
  );
}

/**
 * RC-J1 — floor for using paired-judge labels as training. Below this rate, every turn stays
 * diagnostic-only even when a single turn's two asks agreed.
 */
export const PAIR_AGREEMENT_FLOOR = 0.7;

const PAIRED_JUDGE_FORMAT = [
  'You judge TWO blind drafts of the same turn side by side. Seats and model names are hidden.',
  'Draft X and Draft Y are interchangeable labels — do not prefer one for being first.',
  'For each turn return ONLY a JSON array object:',
  '{"turn":<n>,"x":"up"|"down"|"unmarked","y":"up"|"down"|"unmarked","why_x":"<one concrete thing>","why_y":"<one concrete thing>","followed_x":true|false,"followed_y":true|false}',
  'verdict follows the PROSE THUMB STANDARD above; "unmarked" is a real answer and the usual one.',
  'followed=false when that draft ignores the action, answers a different action, or restates the arrival instead of acting.',
  'Do not invent seat names. Score each draft on its own prose only.',
].join('\n');

/**
 * Blind paired prompt: each row has turn/input/present/chips plus proseX and proseY (no seat names).
 * Pass swapped=true to put the other seat's prose in the X slot (second ask).
 */
export function buildPairedJudgePrompt(batch, { swapped = false } = {}) {
  return (
    PROSE_THUMB_RUBRIC +
    '\n\n' +
    PAIRED_JUDGE_FORMAT +
    '\n\n' +
    batch
      .map((o) => {
        const x = swapped ? o.proseY : o.proseX;
        const y = swapped ? o.proseX : o.proseY;
        return (
          `T${o.turn}\nACTION: ${o.input}\nHERE: ${(o.present ?? []).join(', ') || 'nobody named'}\n` +
          `CHIPS: ${(o.chips ?? []).join(' | ') || 'none'}\n` +
          `DRAFT X: ${String(x ?? '').replace(/\s+/g, ' ').slice(0, 1200)}\n` +
          `DRAFT Y: ${String(y ?? '').replace(/\s+/g, ' ').slice(0, 1200)}`
        );
      })
      .join('\n\n')
  );
}

/**
 * One ask's marks for a turn: { turn, x, y, why_x?, why_y?, followed_x?, followed_y? }.
 * Maps a swapped ask back onto seat0 (left) / seat1 (right): when swapped, X was seat1.
 */
export function mapPairedAskToSeats(v, swapped) {
  const x = normalizeMark(v?.x ?? v?.a);
  const y = normalizeMark(v?.y ?? v?.b);
  if (!swapped) {
    return {
      turn: verdictTurn(v),
      seat0: x,
      seat1: y,
      why0: String(v?.why_x ?? v?.why_a ?? '').trim(),
      why1: String(v?.why_y ?? v?.why_b ?? '').trim(),
      followed0: v?.followed_x ?? v?.followed_a,
      followed1: v?.followed_y ?? v?.followed_b,
    };
  }
  return {
    turn: verdictTurn(v),
    seat0: y,
    seat1: x,
    why0: String(v?.why_y ?? v?.why_b ?? '').trim(),
    why1: String(v?.why_x ?? v?.why_a ?? '').trim(),
    followed0: v?.followed_y ?? v?.followed_b,
    followed1: v?.followed_x ?? v?.followed_a,
  };
}

/**
 * Keep a training thumb only when both order-swapped asks agree on that seat; else unmarked.
 * Returns { seat0, seat1, agreed0, agreed1, why0, why1 } for one turn.
 */
export function agreePairedMarks(ask1, ask2) {
  const a = mapPairedAskToSeats(ask1, false);
  const b = mapPairedAskToSeats(ask2, true);
  const agreed0 = a.seat0 === b.seat0;
  const agreed1 = a.seat1 === b.seat1;
  return {
    turn: a.turn,
    seat0: agreed0 ? a.seat0 : 'unmarked',
    seat1: agreed1 ? a.seat1 : 'unmarked',
    agreed0,
    agreed1,
    why0: agreed0 ? a.why0 || b.why0 : 'pair asks disagreed',
    why1: agreed1 ? a.why1 || b.why1 : 'pair asks disagreed',
    followed0: agreed0 ? a.followed0 : undefined,
    followed1: agreed1 ? a.followed1 : undefined,
  };
}

/** Fraction of (turn, seat) labels where the two asks agreed. */
export function pairAgreementRate(results) {
  let ok = 0;
  let n = 0;
  for (const r of results) {
    n += 2;
    if (r.agreed0) ok++;
    if (r.agreed1) ok++;
  }
  return n ? ok / n : 0;
}

/** True when the pair's agreement rate clears the training floor. */
export function trainingOkFromAgreement(rate, floor = PAIR_AGREEMENT_FLOOR) {
  return typeof rate === 'number' && rate >= floor;
}

/** Model verdict → 'up' | 'down' | 'unmarked'. Anything that is not up/down is unmarked. */
export function normalizeMark(verdict) {
  const v = String(verdict ?? '').trim().toLowerCase();
  if (v === 'up') return 'up';
  if (v === 'down') return 'down';
  return 'unmarked';
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
 * Flag kinds that describe the writer's prose (judge, turnCheck prose checks, autoThumbs prose checks).
 * Chip, map, quest and engine kinds are not here: they never make a writer turn bad.
 */
export const WRITER_FLAG_KINDS = new Set([
  'judge',
  'stiff-line',
  'ignored-action',
  'action-object-missing',
  'verb-swapped',
  'broken-line',
  'broken-prose',
  'plays-player',
  'absent-speaker',
  'wrong-voice',
  'lecture-ending',
  'repeated-habit',
  'sheet-forgotten',
  'ghost-talk',
  'window-touched',
  'fallback',
  'junk',
  'repeated line',
  'prose',
]);

/** Kind of a thumbs `down` entry ("P0 kind (judge): detail" / "kind: detail" / "kind / detail"). */
export function flagKind(entry) {
  return String(entry ?? '')
    .replace(/^P0 /, '')
    .split(/:|\s\(|\s\//)[0]
    .trim();
}

export const isWriterFlag = (entry) => WRITER_FLAG_KINDS.has(flagKind(entry));

/**
 * Apply judge verdicts to the batch rows (each row: { turn, prose, down, up, p0?, verdict, input }).
 * Sets row.thumb to the model's mark ('up' | 'down' | 'unmarked'); rows the model skipped keep theirs
 * (null = never marked). Returns how many rows the model marked; lessons get the stiff lines.
 */
export function applyVerdicts(batch, verdicts, lessons = []) {
  const marked = new Set();
  for (const v of verdicts) {
    const o = batch.find((x) => x.turn === verdictTurn(v));
    if (!o || marked.has(o.turn)) continue;
    marked.add(o.turn);
    o.note = String(v.why ?? '').trim();
    o.thumb = normalizeMark(v.verdict);
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
    if (o.thumb === 'up' && !o.down.length) o.up.push(`judge: ${o.note}`);
    else if (o.thumb === 'down' && o.note && !o.down.some((d) => d.includes(o.note))) o.down.push(`judge: ${o.note}`);
    o.verdict = o.down.length ? 'down' : o.up.length ? 'up' : o.verdict;
  }
  return marked.size;
}

/**
 * Status line with how many turns the model actually marked (up, down or a chosen "unmarked").
 * ok only when every turn came back; partial when at least half did; failed when most were never marked.
 */
export function notesStatus(model, marked, total, failed, batches, tally) {
  const counts = tally ? `: ${tally.up ?? 0} up, ${tally.down ?? 0} down, ${tally.unmarked ?? 0} unmarked` : '';
  const never = total - marked;
  const tail =
    `${marked}/${total} turns marked by the model${counts}` +
    (never > 0 ? `, ${never} never marked` : '') +
    (failed ? `, ${failed} of ${batches} batch(es) failed` : '');
  if (total > 0 && marked * 2 < total) return `failed (${model}, ${tail})`;
  if (marked < total) return `partial (${model}, ${tail})`;
  return `ok (${model}, ${tail})`;
}
