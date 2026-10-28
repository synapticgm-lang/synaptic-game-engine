/**
 * T10AJ — STATUS / dungeon / check ledger lines → book narration (or drop).
 * Shared by writerEngineResult and convertWriterCueFact so cue-heavy facts never
 * paste "Dungeon room:" / "A lead waits here" / dice chrome into the story body.
 */

/** STATUS / dice / quest-label lines that must never become book sentences. */
export function isBookForbiddenLedgerLine(s: string): boolean {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return true;
  return /^(?:Encounter budget:|Combat status:|Exhaustion:|Initiative —|Rounds? \d+|Death save:|XP Gained:|Gold Gained:|Coins\b|Moved within\b|Look-out:|Check (?:failure|success)\.?$|SUCCESS\s*\(|FAIL(?:URE)?\s*\(|A lead waits here:|Quest stage:|Travel:)/i.test(
    t,
  );
}

/** Rest: receipt → one past-tense rest sentence. */
export function restReceiptToProse(s: string): string {
  const low = s.toLowerCase();
  const kind = low.includes('long rest') ? 'long rest' : low.includes('short rest') ? 'short rest' : 'rest';
  const hpAt = s.search(/\bHP\b/i);
  if (hpAt >= 0) {
    const tail = s.slice(hpAt).replace(/^HP\s+/i, '').trim();
    const arrow = tail.match(/^(\d+)\s*(?:→|->|to)\s*(\d+)/i);
    if (arrow) return `You took a ${kind} and your hurts eased (${arrow[1]} to ${arrow[2]}).`;
    if (/^stays\b/i.test(tail)) return `You took a ${kind}.`;
  }
  return `You took a ${kind}.`;
}

function pcSubject(subject?: string): string {
  const who = (subject ?? '').replace(/\s+/g, ' ').trim();
  return who && who !== 'They' ? who : 'You';
}

/**
 * One engine-fact sentence → book prose, or '' when it belongs only on STATUS.
 * `subject` is the PC display name when known (third-person past).
 */
export function ledgerLineToBookProse(raw: string, subject?: string): string {
  let s = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  if (isBookForbiddenLedgerLine(s)) return '';
  const who = pcSubject(subject);
  const you = who === 'You';

  if (/^Rest:/i.test(s)) return restReceiptToProse(s);

  // Dungeon: you moved into X.
  const moved = s.match(/^Dungeon:\s*you moved into\s+(.+?)\.?$/i);
  if (moved?.[1]) {
    const room = moved[1].trim().replace(/\.+$/, '');
    return you ? `You moved into ${room}.` : `${who} moved into ${room}.`;
  }
  // Dungeon: you fell back into X.
  const fell = s.match(/^Dungeon:\s*you fell back into\s+(.+?)\.?$/i);
  if (fell?.[1]) {
    const room = fell[1].trim().replace(/\.+$/, '');
    return you ? `You fell back into ${room}.` : `${who} fell back into ${room}.`;
  }
  // Dungeon: trap — you spotted… / a trap went off…
  const trap = s.match(/^Dungeon:\s*trap\s*[—–-]\s*(.+?)\.?$/i);
  if (trap?.[1]) {
    const body = trap[1].trim().replace(/\.+$/, '');
    if (/you spotted a trap/i.test(body)) {
      return you
        ? 'You spotted a trap and stepped around it.'
        : `${who} spotted a trap and stepped around it.`;
    }
    if (/trap went off/i.test(body)) {
      const dmg = body.match(/took\s+(\d+)\s+damage/i)?.[1];
      return dmg
        ? (you ? `A trap went off; you took ${dmg} damage.` : `A trap went off; ${who} took ${dmg} damage.`)
        : 'A trap went off.';
    }
    return you ? `A trap — ${body}.` : `A trap — ${body.replace(/\byou\b/gi, who)}.`;
  }
  // Dungeon: search of X — you found nothing.
  const search = s.match(/^Dungeon:\s*search of\s+(.+?)\s*[—–-]\s*(.+?)\.?$/i);
  if (search?.[1]) {
    const room = search[1].trim();
    const outcome = (search[2] ?? '').trim();
    if (/found nothing/i.test(outcome)) {
      return you
        ? `You searched ${room} and found nothing.`
        : `${who} searched ${room} and found nothing.`;
    }
    return you
      ? `You searched ${room}. ${outcome}.`
      : `${who} searched ${room}. ${outcome.replace(/\byou\b/gi, who)}.`;
  }
  // Bare "Dungeon: …" leftover — never paste the label.
  if (/^Dungeon:/i.test(s)) {
    const body = s.replace(/^Dungeon:\s*/i, '').replace(/\.+$/, '').trim();
    if (!body) return '';
    return you ? `${body.charAt(0).toUpperCase()}${body.slice(1)}.` : `${body.replace(/\byou\b/gi, who)}.`;
  }

  const roomHead = 'Dungeon room: ';
  if (s.startsWith(roomHead) && !s.startsWith('Dungeon room: none')) {
    const body = s.endsWith('.') ? s.slice(0, -1) : s;
    const mark = ', inside ';
    const cut = body.indexOf(mark);
    if (cut > roomHead.length) {
      const room = body.slice(roomHead.length, cut);
      const inside = body.slice(cut + mark.length);
      // Strip trailing feature clauses glued after the place ("; A Silver chest…").
      const insidePlace = inside.split(/[.;]/)[0]?.trim() ?? inside;
      if (room && insidePlace) {
        return you
          ? `You stood in ${room} inside ${insidePlace}.`
          : `${who} stood in ${room} inside ${insidePlace}.`;
      }
    }
  }

  const waysHead = 'Ways on: ';
  if (s.startsWith(waysHead)) {
    const body = (s.endsWith('.') ? s.slice(0, -1) : s).slice(waysHead.length);
    const names: string[] = [];
    for (const raw of body.split(',')) {
      let n = raw.trim();
      const paren = n.indexOf(' (');
      if (paren >= 0) n = n.slice(0, paren).trim();
      if (n) names.push(n);
    }
    if (names.length === 1) return `A way led on to ${names[0]}.`;
    if (names.length > 1) {
      return `Ways led on to ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}.`;
    }
    return '';
  }

  if (/^A trap here is (spotted|sprung)\.?$/i.test(s)) {
    const state = /sprung/i.test(s) ? 'sprung' : 'spotted';
    return `A trap here was ${state}.`;
  }

  // Locked chest feature line glued as its own sentence — plain sight, no "Dungeon" label.
  if (/^A .+ chest,/i.test(s) && /\blocked\b/i.test(s)) {
    const name = s.match(/^A\s+(.+?)\s+chest,/i)?.[1]?.trim();
    if (name) return `A ${name} chest stood closed and locked.`;
  }

  return s.endsWith('.') || s.endsWith('?') || s.endsWith('!') ? s : `${s}.`;
}
