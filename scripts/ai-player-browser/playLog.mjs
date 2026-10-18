/**
 * Story-style play-log.md (wanted / did / happened per turn + thumb/reason).
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

export function ensurePlayLog(filePath, headerLines = []) {
  if (fs.existsSync(filePath)) return;
  const head = [
    '# Play log',
    '',
    ...headerLines.filter(Boolean),
    headerLines.length ? '' : null,
    'Format: T{n}: You wanted …. You did …. Then …. Thumb: up|down — reason',
    '',
  ].filter((x) => x != null).join('\n');
  fs.writeFileSync(filePath, `${head}\n`, 'utf8');
}

export function appendPlayLog(filePath, entry) {
  const line = typeof entry === 'string' ? entry : formatPlayLogLine(entry);
  fs.appendFileSync(filePath, `${line}\n`, 'utf8');
  return line;
}
