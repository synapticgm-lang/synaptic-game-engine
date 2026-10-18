/**
 * Story-style play-log.md (wanted / did / happened per turn).
 */
import fs from 'fs';

/**
 * One turn line for play-log.md.
 * Format is stable for acceptance tests.
 */
export function formatPlayLogLine({ turn, wanted, did, happened } = {}) {
  const t = Number(turn) || 0;
  const want = String(wanted || '').replace(/\s+/g, ' ').trim() || '(none)';
  const act = String(did || '').replace(/\s+/g, ' ').trim() || '(none)';
  const result = String(happened || '').replace(/\s+/g, ' ').trim() || '(none)';
  return `T${t} | wanted: ${want} | did: ${act} | happened: ${result}`;
}

export function ensurePlayLog(filePath, headerLines = []) {
  if (fs.existsSync(filePath)) return;
  const head = [
    '# Play log',
    '',
    ...headerLines.filter(Boolean),
    headerLines.length ? '' : null,
    'Format: T{n} | wanted: … | did: … | happened: …',
    '',
  ].filter((x) => x != null).join('\n');
  fs.writeFileSync(filePath, `${head}\n`, 'utf8');
}

export function appendPlayLog(filePath, entry) {
  const line = typeof entry === 'string' ? entry : formatPlayLogLine(entry);
  fs.appendFileSync(filePath, `${line}\n`, 'utf8');
  return line;
}
