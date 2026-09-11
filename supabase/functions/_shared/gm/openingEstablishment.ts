/** Edge stub — hall-talk owners live on the client. Lets completedEventPacket boot. */

export function hallTalkAsksWhere(raw: string): boolean {
  return (
    /\bwhere am(?: i)?\b|\bwhere are we\b|\bwhere is this\b/i.test(raw ?? '')
    || /\bdon'?t know (?:of )?this\b|\bnever heard of (?:this|the)\b|\bwhat is this (?:place|circle|hall|room)\b/i.test(
      raw ?? ''
    )
  );
}

export function hallTalkAsksWho(raw: string): boolean {
  return /\bwho (?:is|are) (?:it|that|you)\b|\bwhat'?s yours\b/i.test(raw ?? '');
}

export function hallTalkAsksWant(raw: string): boolean {
  const t = raw ?? '';
  if (/\bask\b.+\bwhat they want\b/i.test(t) && !/\bask what they want\b/i.test(t)) return false;
  return /\bwhat (?:do you|do they|d'?you) want\b|\bask what they want\b|\bwhat they want\b|\bwhat'?s going on\b|\bwhy should i(?: help)?\b/i.test(t);
}

export function hallTalkAsksRefuse(raw: string): boolean {
  const t = raw ?? '';
  if (!t.trim()) return false;
  if (/\brefuse to (?:give|say)\b/i.test(t)) return false;
  return /\bwhat happens if i refuse\b|\bif i refuse\b/i.test(t);
}

export function hallTalkAsksPanel(raw: string): boolean {
  const t = raw ?? '';
  if (!t.trim()) return false;
  return (
    /\bblue\s+(?:screen|panel|window)\b/i.test(t)
    || /\bsystem\s+(?:panel|screen|window|interface|display)\b/i.test(t)
    || /\b(?:inspect|examine|read|check|look at|study)\b.{0,48}\b(?:panel|screen|interface|system)\b/i.test(t)
    || /\bwhat(?:'s| is) (?:the |this )?(?:blue )?(?:screen|panel)\b/i.test(t)
  );
}

export function playerAskedWhyPulled(raw: string): boolean {
  const p = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!p) return false;
  return (
    /\bwhy .{0,48}(?:summon|pull|want|here|bought|mark|rite)\b|\bwhat(?:'s| is) going on\b|\bwhat they want\b|\bask what they want\b/i.test(
      p
    )
  );
}

export function isHallTalkPlayerLine(raw: string): boolean {
  const p = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!p) return false;
  if (/\b(travel|attack|flee|leave|exit)\b/i.test(p)) return false;
  return (
    hallTalkAsksWhere(p)
    || hallTalkAsksWho(p)
    ||     hallTalkAsksWant(p)
    || hallTalkAsksRefuse(p)
    || hallTalkAsksPanel(p)
    || playerAskedWhyPulled(p)
  );
}

export function openingCastLabel(_state?: unknown): string {
  return 'the people who pulled you';
}

export function shortCardWant(_state?: unknown): string {
  return '';
}

export function openingWantLine(_state?: unknown): string {
  return '';
}

export function openingSpokenIdentityQuote(
  who: string,
  ctx?: { location?: string; engineMode?: string; hay?: string }
): string {
  const blob = `${who} ${ctx?.location ?? ''} ${ctx?.hay ?? ''} ${ctx?.engineMode ?? ''}`;
  if (/\bpanel\b/i.test(who)) return '';
  if (/\bWren\b/i.test(who)) {
    return '"Wren Holt. I brought the charter. Walk with me or don\'t — I need an answer."';
  }
  if (/\bVessa\b/i.test(who)) {
    return '"Vessa. I hire on the Salt Road. Give me a name I can say when the watch walks this aisle."';
  }
  if (/\binnkeep|Father Aldous|Greyhollow\b/i.test(blob) || ctx?.engineMode === 'dnd') {
    return '"I keep this book. I asked your name because strangers who skip it start fights."';
  }
  if (/\bmilitia\b/i.test(who)) return '"Watch. We got here late. The circle is already dead."';
  if (/\bhandler\b/i.test(who)) return '"Handler. You came through. Stay where we can see you."';
  const litrpgMark =
    ctx?.engineMode === 'litrpg'
    && /\b(pactborn|calamity mark|sevenfold|summoning circle|cathedral)\b/i.test(blob);
  if (/\bpriest|chanter|robed\b/i.test(who)) {
    return litrpgMark
      ? '"Pactborn. The Mark looks wrong. I am the one who has to write what you are."'
      : '"I asked your name. I am still in this room."';
  }
  return '"I am still in this room. That is the name I will give you."';
}

export function openingWhoAskLineFromLabel(
  who: string,
  opts?: { nameLocked?: boolean; quote?: string; location?: string; engineMode?: string; hay?: string }
): string {
  const head = who ? who.charAt(0).toUpperCase() + who.slice(1) : 'They';
  const verb = /\b(people|envoys|priests|handlers|sides|militia|figures)\b/i.test(who) || /^both /i.test(who)
    ? 'answer'
    : 'answers';
  const quote =
    opts?.quote
    ?? openingSpokenIdentityQuote(who, {
      location: opts?.location,
      engineMode: opts?.engineMode,
      hay: opts?.hay,
    });
  if (quote) return `${head} ${verb} you. ${quote}`;
  if (opts?.nameLocked) return `${head} ${verb} you. They already have your name.`;
  return `${head} ${verb} you. They have not given you a name back.`;
}
