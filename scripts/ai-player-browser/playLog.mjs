/**
 * Story-style play-log.md (wanted / did / happened per turn + thumb/reason).
 * Random-pick mode uses formatRandomPlayLogEntry (options + picked + full GM).
 */
import fs from 'fs';

/**
 * One turn line for play-log.md.
 * 2–3 short sentences (wanted / did / happened) plus thumb and reason.
 * Format is stable for acceptance tests.
 */
export function formatPlayLogLine({
  turn,
  wanted,
  did,
  happened,
  thumb,
  reason,
} = {}) {
  const t = Number(turn) || 0;
  const want = String(wanted || '').replace(/\s+/g, ' ').trim() || '(none)';
  const act = String(did || '').replace(/\s+/g, ' ').trim() || '(none)';
  const result = String(happened || '').replace(/\s+/g, ' ').trim() || '(none)';
  const th = String(thumb || '').trim() || '(none)';
  const why = String(reason || '').replace(/\s+/g, ' ').trim() || '(none)';
  const story = `You wanted ${want}. You did ${act}. Then ${result}.`;
  return `T${t}: ${story} Thumb: ${th} — ${why}`;
}

/**
 * Random-pick play-log entry: turn/setup label, full option list + count,
 * which option was picked, and full GM prose verbatim (no trim).
 * Origin/setup uses step 'setup' and is logged before T1.
 */
export function formatRandomPlayLogEntry({
  step,
  options,
  picked,
  gmProse,
} = {}) {
  const opts = Array.isArray(options) ? options.map((c) => String(c ?? '')) : [];
  const label = step === 'setup' || step === 'origin' ? 'Setup' : `T${Number(step) || 0}`;
  const list = opts.length ? opts.join(' | ') : '(none)';
  const pick = picked == null || picked === '' ? '(none)' : String(picked);
  const gm = gmProse == null ? '' : String(gmProse);
  return `${label}: options (${opts.length}): ${list} → picked: ${pick}\nGM: ${gm}`;
}

export function ensurePlayLog(filePath, headerLines = [], { randomPick = false } = {}) {
  if (fs.existsSync(filePath)) return;
  const formatLine = randomPick
    ? 'Format: Setup|T{n}: options (N): … → picked: … / GM: <full prose verbatim>'
    : 'Format: T{n}: You wanted …. You did …. Then …. Thumb: up|down — reason';
  const head = [
    '# Play log',
    '',
    ...headerLines.filter(Boolean),
    headerLines.length ? '' : null,
    formatLine,
    '',
  ].filter((x) => x != null).join('\n');
  fs.writeFileSync(filePath, `${head}\n`, 'utf8');
}

export function appendPlayLog(filePath, entry) {
  const line = typeof entry === 'string' ? entry : formatPlayLogLine(entry);
  fs.appendFileSync(filePath, `${line}\n`, 'utf8');
  return line;
}
